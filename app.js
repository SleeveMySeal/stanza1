const STORAGE_KEY = 'rpgEditorState';

const defaultState = () => ({
  items: [],
  mobs: [],
  levels: [],
  resources: [],
  buildings: [],
  map: createEmptyMap(20, 15),
});

function createEmptyMap(width, height) {
  const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => 'floor'));
  return { width, height, tiles, spawns: [], placedBuildings: [] };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Impossibile caricare lo stato, uso default', err);
  }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ELEMENTS
const tabButtons = document.querySelectorAll('.tab-button');
const views = {
  editor: document.getElementById('view-editor'),
  game: document.getElementById('view-game'),
};

const sectionButtons = document.querySelectorAll('.section-button');
const sections = {
  items: document.getElementById('section-items'),
  mobs: document.getElementById('section-mobs'),
  levels: document.getElementById('section-levels'),
  resources: document.getElementById('section-resources'),
  map: document.getElementById('section-map'),
};

// Item elements
const itemForm = document.getElementById('itemForm');
const itemListEl = document.getElementById('itemList');
const itemResetBtn = document.getElementById('itemResetBtn');

// Mob elements
const mobForm = document.getElementById('mobForm');
const mobListEl = document.getElementById('mobList');
const mobDropListEl = document.getElementById('mobDropList');
const mobDropItemSelect = document.getElementById('mobDropItem');
const mobAddDropBtn = document.getElementById('mobAddDropBtn');
const mobResetBtn = document.getElementById('mobResetBtn');

// Level elements
const levelForm = document.getElementById('levelForm');
const levelListEl = document.getElementById('levelList');
const levelResetBtn = document.getElementById('levelResetBtn');

// Resources / building elements
const resourceForm = document.getElementById('resourceForm');
const resourceListEditor = document.getElementById('resourceListEditor');
const resourceResetBtn = document.getElementById('resourceResetBtn');
const buildingForm = document.getElementById('buildingForm');
const buildingListEl = document.getElementById('buildingList');
const buildingResetBtn = document.getElementById('buildingResetBtn');
const buildingResourceSelect = document.getElementById('buildingResourceSelect');
const buildingCostResourceSelect = document.getElementById('buildingCostResourceSelect');

// Map elements
const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');
const mapWidthInput = document.getElementById('mapWidth');
const mapHeightInput = document.getElementById('mapHeight');
const mapResizeBtn = document.getElementById('mapResizeBtn');
const mapSpawnMobSelect = document.getElementById('mapSpawnMobSelect');
const mapRespawnTimeInput = document.getElementById('mapRespawnTime');
const mapBuildingTypeSelect = document.getElementById('mapBuildingTypeSelect');
const clearSpawnsBtn = document.getElementById('clearSpawnsBtn');
const clearBuildingsBtn = document.getElementById('clearBuildingsBtn');

// Game elements
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const playerStatsEl = document.getElementById('playerStats');
const resetPlayerBtn = document.getElementById('resetPlayerBtn');
const battleMobSelect = document.getElementById('battleMobSelect');
const startBattleBtn = document.getElementById('startBattleBtn');
const battleLog = document.getElementById('battleLog');
const inventoryList = document.getElementById('inventoryList');
const resourceListGame = document.getElementById('resourceListGame');

// JSON import/export
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');

let currentMobDrops = [];

// Navigation handlers
function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name);
  });
  tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === name));
  if (name === 'game') {
    startGame();
  }
}

tabButtons.forEach((btn) =>
  btn.addEventListener('click', () => showView(btn.dataset.tab))
);

function showSection(name) {
  Object.entries(sections).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name);
  });
  sectionButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.section === name));
}

sectionButtons.forEach((btn) =>
  btn.addEventListener('click', () => showSection(btn.dataset.section))
);

// Item logic
itemForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = itemForm.itemId.value.trim();
  if (!id) return;
  const newItem = {
    id,
    name: itemForm.itemName.value.trim(),
    type: itemForm.itemType.value,
    slot: itemForm.itemSlot.value,
    atk: Number(itemForm.itemAtk.value) || 0,
    def: Number(itemForm.itemDef.value) || 0,
    hp: Number(itemForm.itemHp.value) || 0,
  };
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx >= 0) state.items[idx] = newItem;
  else state.items.push(newItem);
  saveState();
  renderItems();
  populateMobDropSelect();
  itemForm.reset();
});

itemResetBtn.addEventListener('click', () => itemForm.reset());

function renderItems() {
  itemListEl.innerHTML = '';
  state.items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>${item.name} <small>${item.id}</small></h4>
    <div class="stat-row"><span class="badge">${item.type}</span><span class="badge">Slot: ${item.slot}</span></div>
    <small>ATK ${item.atk} • DEF ${item.def} • HP ${item.hp}</small>`;
    li.addEventListener('click', () => {
      itemForm.itemId.value = item.id;
      itemForm.itemName.value = item.name;
      itemForm.itemType.value = item.type;
      itemForm.itemSlot.value = item.slot;
      itemForm.itemAtk.value = item.atk;
      itemForm.itemDef.value = item.def;
      itemForm.itemHp.value = item.hp;
    });
    itemListEl.appendChild(li);
  });
}

// Mob logic
mobForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = mobForm.mobId.value.trim();
  if (!id) return;
  const mob = {
    id,
    name: mobForm.mobName.value.trim(),
    level: Number(mobForm.mobLevel.value) || 1,
    hp: Number(mobForm.mobHp.value) || 1,
    atk: Number(mobForm.mobAtk.value) || 0,
    def: Number(mobForm.mobDef.value) || 0,
    xp: Number(mobForm.mobXp.value) || 0,
    drops: [...currentMobDrops],
  };
  const idx = state.mobs.findIndex((m) => m.id === id);
  if (idx >= 0) state.mobs[idx] = mob;
  else state.mobs.push(mob);
  saveState();
  renderMobs();
  populateMobOptions();
  mobForm.reset();
  currentMobDrops = [];
  renderMobDrops();
});

mobResetBtn.addEventListener('click', () => {
  mobForm.reset();
  currentMobDrops = [];
  renderMobDrops();
});

mobAddDropBtn.addEventListener('click', () => {
  const itemId = mobDropItemSelect.value;
  if (!itemId) return;
  currentMobDrops.push({
    itemId,
    chance: Number(document.getElementById('mobDropChance').value) || 0,
    minQty: Number(document.getElementById('mobDropMinQty').value) || 1,
    maxQty: Number(document.getElementById('mobDropMaxQty').value) || 1,
  });
  renderMobDrops();
});

function renderMobDrops() {
  mobDropListEl.innerHTML = '';
  currentMobDrops.forEach((drop, idx) => {
    const item = state.items.find((i) => i.id === drop.itemId);
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>${item ? item.name : drop.itemId}</h4><small>${drop.chance}% • ${drop.minQty}-${drop.maxQty}</small>`;
    li.addEventListener('click', () => {
      currentMobDrops.splice(idx, 1);
      renderMobDrops();
    });
    mobDropListEl.appendChild(li);
  });
}

function renderMobs() {
  mobListEl.innerHTML = '';
  state.mobs.forEach((mob) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>${mob.name} <small>${mob.id}</small></h4>
    <small>Lv ${mob.level} • HP ${mob.hp} • ATK ${mob.atk} • DEF ${mob.def} • XP ${mob.xp}</small><br>
    <small>Drop: ${mob.drops.length}</small>`;
    li.addEventListener('click', () => {
      mobForm.mobId.value = mob.id;
      mobForm.mobName.value = mob.name;
      mobForm.mobLevel.value = mob.level;
      mobForm.mobHp.value = mob.hp;
      mobForm.mobAtk.value = mob.atk;
      mobForm.mobDef.value = mob.def;
      mobForm.mobXp.value = mob.xp;
      currentMobDrops = [...mob.drops];
      renderMobDrops();
    });
    mobListEl.appendChild(li);
  });
}

// Level logic
levelForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const lvl = Number(levelForm.levelLevel.value);
  if (!lvl) return;
  const entry = {
    level: lvl,
    xp: Number(levelForm.levelXp.value) || 0,
    atk: Number(levelForm.levelAtk.value) || 0,
    def: Number(levelForm.levelDef.value) || 0,
    hp: Number(levelForm.levelHp.value) || 0,
  };
  const idx = state.levels.findIndex((l) => l.level === lvl);
  if (idx >= 0) state.levels[idx] = entry;
  else state.levels.push(entry);
  state.levels.sort((a, b) => a.level - b.level);
  saveState();
  renderLevels();
});

levelResetBtn.addEventListener('click', () => levelForm.reset());

function renderLevels() {
  levelListEl.innerHTML = '';
  state.levels.forEach((lvl) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>Livello ${lvl.level}</h4><small>XP: ${lvl.xp} • ATK ${lvl.atk} • DEF ${lvl.def} • HP ${lvl.hp}</small>`;
    li.addEventListener('click', () => {
      levelForm.levelLevel.value = lvl.level;
      levelForm.levelXp.value = lvl.xp;
      levelForm.levelAtk.value = lvl.atk;
      levelForm.levelDef.value = lvl.def;
      levelForm.levelHp.value = lvl.hp;
    });
    levelListEl.appendChild(li);
  });
}

// Resources
resourceForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = resourceForm.resourceId.value.trim();
  if (!id) return;
  const res = { id, name: resourceForm.resourceName.value.trim() || id };
  const idx = state.resources.findIndex((r) => r.id === id);
  if (idx >= 0) state.resources[idx] = res;
  else state.resources.push(res);
  saveState();
  renderResources();
  populateBuildingSelectors();
  resourceForm.reset();
});

resourceResetBtn.addEventListener('click', () => resourceForm.reset());

function renderResources() {
  resourceListEditor.innerHTML = '';
  state.resources.forEach((res) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>${res.name}</h4><small>${res.id}</small>`;
    li.addEventListener('click', () => {
      resourceForm.resourceId.value = res.id;
      resourceForm.resourceName.value = res.name;
    });
    resourceListEditor.appendChild(li);
  });
}

// Buildings
buildingForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = buildingForm.buildingId.value.trim();
  if (!id) return;
  const building = {
    id,
    name: buildingForm.buildingName.value.trim(),
    resourceId: buildingResourceSelect.value,
    ratePerMinute: Number(buildingForm.buildingRate.value) || 0,
    costResourceId: buildingCostResourceSelect.value,
    maxLevel: Number(buildingForm.buildingMaxLevel.value) || 1,
    baseCost: Number(buildingForm.buildingBaseCost.value) || 0,
    costIncrement: Number(buildingForm.buildingCostIncrement.value) || 0,
  };
  const idx = state.buildings.findIndex((b) => b.id === id);
  if (idx >= 0) state.buildings[idx] = building;
  else state.buildings.push(building);
  saveState();
  renderBuildings();
  populateMapSelectors();
  buildingForm.reset();
});

buildingResetBtn.addEventListener('click', () => buildingForm.reset());

function renderBuildings() {
  buildingListEl.innerHTML = '';
  state.buildings.forEach((b) => {
    const li = document.createElement('li');
    li.className = 'card';
    const res = state.resources.find((r) => r.id === b.resourceId);
    li.innerHTML = `<h4>${b.name}</h4><small>Produce ${res ? res.name : b.resourceId} (${b.ratePerMinute}/min)</small>`;
    li.addEventListener('click', () => {
      buildingForm.buildingId.value = b.id;
      buildingForm.buildingName.value = b.name;
      buildingResourceSelect.value = b.resourceId;
      buildingForm.buildingRate.value = b.ratePerMinute;
      buildingCostResourceSelect.value = b.costResourceId;
      buildingForm.buildingMaxLevel.value = b.maxLevel;
      buildingForm.buildingBaseCost.value = b.baseCost;
      buildingForm.buildingCostIncrement.value = b.costIncrement;
    });
    buildingListEl.appendChild(li);
  });
}

// Map rendering helpers
function drawEditorMap() {
  const { width, height, tiles, spawns, placedBuildings } = state.map;
  const tileSize = Math.min(mapCanvas.width / width, mapCanvas.height / height);
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const type = tiles[y][x];
      mapCtx.fillStyle = tileColor(type);
      mapCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      mapCtx.strokeStyle = 'rgba(255,255,255,0.05)';
      mapCtx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
  spawns.forEach((s) => {
    mapCtx.fillStyle = '#ef4444';
    mapCtx.fillRect(s.x * tileSize + tileSize * 0.25, s.y * tileSize + tileSize * 0.25, tileSize * 0.5, tileSize * 0.5);
  });
  placedBuildings.forEach((b) => {
    mapCtx.fillStyle = '#38bdf8';
    mapCtx.fillRect(b.x * tileSize + tileSize * 0.2, b.y * tileSize + tileSize * 0.2, tileSize * 0.6, tileSize * 0.6);
  });
}

function tileColor(type) {
  switch (type) {
    case 'wall':
      return '#1f2937';
    case 'resource':
      return '#0f766e';
    default:
      return '#0b172e';
  }
}

mapResizeBtn.addEventListener('click', () => {
  const w = Math.min(Math.max(5, Number(mapWidthInput.value) || 10), 50);
  const h = Math.min(Math.max(5, Number(mapHeightInput.value) || 10), 50);
  state.map = createEmptyMap(w, h);
  saveState();
  drawEditorMap();
});

mapCanvas.addEventListener('click', (e) => {
  const rect = mapCanvas.getBoundingClientRect();
  const { width, height } = state.map;
  const tileSize = Math.min(mapCanvas.width / width, mapCanvas.height / height);
  const x = Math.floor((e.clientX - rect.left) / tileSize);
  const y = Math.floor((e.clientY - rect.top) / tileSize);
  const brush = document.querySelector('input[name="mapBrush"]:checked').value;
  if (brush === 'spawn') {
    const mobId = mapSpawnMobSelect.value;
    const respawn = Number(mapRespawnTimeInput.value) || 5;
    const existing = state.map.spawns.find((s) => s.x === x && s.y === y);
    if (existing) {
      existing.mobId = mobId;
      existing.respawn = respawn;
    } else {
      state.map.spawns.push({ x, y, mobId, respawn });
    }
  } else if (brush === 'build') {
    const buildingType = mapBuildingTypeSelect.value;
    if (!buildingType) return;
    const existing = state.map.placedBuildings.find((b) => b.x === x && b.y === y);
    if (existing) existing.typeId = buildingType;
    else state.map.placedBuildings.push({ x, y, typeId: buildingType, level: 1, stored: 0, lastUpdate: Date.now() });
  } else {
    state.map.tiles[y][x] = brush;
  }
  saveState();
  drawEditorMap();
});

clearSpawnsBtn.addEventListener('click', () => {
  state.map.spawns = [];
  saveState();
  drawEditorMap();
});

clearBuildingsBtn.addEventListener('click', () => {
  state.map.placedBuildings = [];
  saveState();
  drawEditorMap();
});

function populateMobDropSelect() {
  mobDropItemSelect.innerHTML = '<option value="">Seleziona</option>';
  state.items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.name} (${item.id})`;
    mobDropItemSelect.appendChild(opt);
  });
}

function populateMobOptions() {
  mapSpawnMobSelect.innerHTML = '';
  battleMobSelect.innerHTML = '';
  state.mobs.forEach((mob) => {
    const opt = document.createElement('option');
    opt.value = mob.id;
    opt.textContent = `${mob.name} (${mob.id})`;
    mapSpawnMobSelect.appendChild(opt.cloneNode(true));
    battleMobSelect.appendChild(opt);
  });
}

function populateBuildingSelectors() {
  [buildingResourceSelect, buildingCostResourceSelect].forEach((select) => {
    select.innerHTML = '';
    state.resources.forEach((res) => {
      const opt = document.createElement('option');
      opt.value = res.id;
      opt.textContent = `${res.name} (${res.id})`;
      select.appendChild(opt);
    });
  });
}

function populateMapSelectors() {
  mapBuildingTypeSelect.innerHTML = '<option value="">Nessuno</option>';
  state.buildings.forEach((b) => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name;
    mapBuildingTypeSelect.appendChild(opt);
  });
}

// JSON import / export
exportJsonBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rpg-editor.json';
  a.click();
  URL.revokeObjectURL(url);
});

importJsonInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = parsed;
      saveState();
      refreshAll();
    } catch (err) {
      alert('File JSON non valido');
    }
  };
  reader.readAsText(file);
});

// GAME RUNTIME
let gameRunning = false;
let pressedKeys = new Set();
let runtime = null;

function startGame() {
  runtime = createRuntime();
  gameRunning = true;
  window.requestAnimationFrame(loop);
  renderPlayerStats();
  renderInventory();
  renderResourceBag();
}

function createRuntime() {
  const mapCopy = JSON.parse(JSON.stringify(state.map));
  return {
    map: mapCopy,
    items: state.items,
    mobs: state.mobs,
    buildings: state.buildings,
    resources: state.resources,
    player: {
      x: 1.5,
      y: 1.5,
      speed: 4,
      level: 1,
      xp: 0,
      hp: 100,
      base: { atk: 5, def: 1, hp: 100 },
      inventory: {},
      bag: {},
    },
    activeMobs: [],
    spawnCooldowns: {},
  };
}

function loop(timestamp) {
  if (!gameRunning || !runtime) return;
  if (!runtime.lastTick) runtime.lastTick = timestamp;
  const dt = Math.min(0.05, (timestamp - runtime.lastTick) / 1000);
  runtime.lastTick = timestamp;
  updateGame(dt);
  drawGame();
  window.requestAnimationFrame(loop);
}

function updateGame(dt) {
  const p = runtime.player;
  const { map } = runtime;
  const tileSize = Math.min(gameCanvas.width / map.width, gameCanvas.height / map.height);
  const moveX = (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) - (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'));
  const moveY = (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) - (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp'));
  const len = Math.hypot(moveX, moveY) || 1;
  const dx = (moveX / len) * p.speed * dt;
  const dy = (moveY / len) * p.speed * dt;
  attemptMove(p, dx, dy);

  handleSpawns(dt);
  updateBuildings(dt);

  if (pressedKeys.has('Space') || pressedKeys.has('KeyJ')) {
    attackNearby();
  }

  // Collect resources
  if (justPressed('KeyE')) collectBuilding();
  if (justPressed('KeyF')) upgradeBuilding();

  renderPlayerStats();
}

let recentlyPressed = new Set();
function justPressed(code) {
  if (pressedKeys.has(code) && !recentlyPressed.has(code)) {
    recentlyPressed.add(code);
    return true;
  }
  return false;
}

function attemptMove(p, dx, dy) {
  const { map } = runtime;
  const newX = p.x + dx;
  const newY = p.y + dy;
  if (!collides(newX, p.y, map) && !collides(newX, newY, map)) p.x = newX;
  if (!collides(p.x, newY, map)) p.y = newY;
}

function collides(x, y, map) {
  if (x < 0 || y < 0 || x > map.width || y > map.height) return true;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  return map.tiles[ty]?.[tx] === 'wall';
}

function handleSpawns(dt) {
  runtime.map.spawns.forEach((spawn, idx) => {
    const key = `${spawn.x},${spawn.y}`;
    runtime.spawnCooldowns[key] = (runtime.spawnCooldowns[key] || 0) - dt;
    const active = runtime.activeMobs.find((m) => m.spawnIndex === idx);
    if (!active && runtime.spawnCooldowns[key] <= 0) {
      const mobTemplate = runtime.mobs.find((m) => m.id === spawn.mobId);
      if (mobTemplate) {
        runtime.activeMobs.push({
          spawnIndex: idx,
          id: mobTemplate.id,
          name: mobTemplate.name,
          maxHp: mobTemplate.hp,
          hp: mobTemplate.hp,
          atk: mobTemplate.atk,
          def: mobTemplate.def,
          xp: mobTemplate.xp,
          drops: mobTemplate.drops,
          x: spawn.x + 0.5,
          y: spawn.y + 0.5,
        });
      }
    }
  });
}

function attackNearby() {
  const p = runtime.player;
  const target = runtime.activeMobs.find((m) => distance(p, m) < 1.2);
  if (!target || target.cooldown) return;
  target.cooldown = 0.4;
  const damage = Math.max(1, getPlayerStats().atk - target.def);
  target.hp -= damage;
  if (target.hp <= 0) {
    gainRewards(target);
    const spawn = runtime.map.spawns[target.spawnIndex];
    runtime.spawnCooldowns[`${spawn.x},${spawn.y}`] = spawn.respawn;
    runtime.activeMobs = runtime.activeMobs.filter((m) => m !== target);
  }
}

function gainRewards(mob) {
  addXp(mob.xp);
  mob.drops.forEach((drop) => {
    if (Math.random() * 100 <= drop.chance) {
      const qty = randomInt(drop.minQty, drop.maxQty);
      runtime.player.inventory[drop.itemId] = (runtime.player.inventory[drop.itemId] || 0) + qty;
    }
  });
  renderInventory();
}

function addXp(amount) {
  const p = runtime.player;
  p.xp += amount;
  let next = nextLevelXp(p.level + 1);
  while (next !== null && p.xp >= next) {
    p.level += 1;
    p.hp = getPlayerStats().hp;
    next = nextLevelXp(p.level + 1);
  }
  renderPlayerStats();
}

function nextLevelXp(level) {
  const entry = state.levels.find((l) => l.level === level);
  return entry ? entry.xp : null;
}

function getPlayerStats() {
  const base = runtime.player.base;
  const bonuses = state.levels
    .filter((l) => l.level <= runtime.player.level)
    .reduce(
      (acc, l) => ({ hp: acc.hp + l.hp, atk: acc.atk + l.atk, def: acc.def + l.def }),
      { hp: base.hp, atk: base.atk, def: base.def }
    );
  return bonuses;
}

function updateBuildings(dt) {
  const now = Date.now();
  runtime.map.placedBuildings.forEach((b) => {
    const def = runtime.buildings.find((bd) => bd.id === b.typeId);
    if (!def) return;
    const elapsed = (now - (b.lastUpdate || now)) / 60000; // minutes
    const produced = (def.ratePerMinute || 0) * b.level * elapsed;
    b.stored = (b.stored || 0) + produced;
    b.lastUpdate = now;
  });
}

function collectBuilding() {
  const building = getNearestBuilding();
  if (!building) return;
  const def = runtime.buildings.find((b) => b.id === building.typeId);
  if (!def) return;
  const amount = Math.floor(building.stored || 0);
  if (amount <= 0) return;
  runtime.player.bag[def.resourceId] = (runtime.player.bag[def.resourceId] || 0) + amount;
  building.stored -= amount;
  renderResourceBag();
}

function upgradeBuilding() {
  const building = getNearestBuilding();
  if (!building) return;
  const def = runtime.buildings.find((b) => b.id === building.typeId);
  if (!def || building.level >= def.maxLevel) return;
  const cost = def.baseCost + def.costIncrement * (building.level - 1);
  if ((runtime.player.bag[def.costResourceId] || 0) < cost) return;
  runtime.player.bag[def.costResourceId] -= cost;
  building.level += 1;
  renderResourceBag();
}

function getNearestBuilding() {
  const p = runtime.player;
  return runtime.map.placedBuildings.find((b) => distance(p, { x: b.x + 0.5, y: b.y + 0.5 }) < 1.2);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawGame() {
  const { map, activeMobs } = runtime;
  const tileSize = Math.min(gameCanvas.width / map.width, gameCanvas.height / map.height);
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const type = map.tiles[y][x];
      gameCtx.fillStyle = tileColor(type);
      gameCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      gameCtx.strokeStyle = 'rgba(255,255,255,0.04)';
      gameCtx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }
  map.spawns.forEach((s) => {
    gameCtx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    gameCtx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize);
  });
  map.placedBuildings.forEach((b) => {
    gameCtx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    gameCtx.fillRect(b.x * tileSize, b.y * tileSize, tileSize, tileSize);
  });
  activeMobs.forEach((m) => {
    gameCtx.fillStyle = '#ef4444';
    gameCtx.beginPath();
    gameCtx.arc(m.x * tileSize, m.y * tileSize, tileSize * 0.25, 0, Math.PI * 2);
    gameCtx.fill();
  });
  const p = runtime.player;
  gameCtx.fillStyle = '#10b981';
  gameCtx.beginPath();
  gameCtx.arc(p.x * tileSize, p.y * tileSize, tileSize * 0.28, 0, Math.PI * 2);
  gameCtx.fill();
}

function renderPlayerStats() {
  const stats = getPlayerStats();
  playerStatsEl.innerHTML = `
    <div class="stat-row">
      <div>Livello: <strong>${runtime.player.level}</strong></div>
      <div>XP: <strong>${runtime.player.xp}</strong></div>
    </div>
    <div class="stat-row">
      <div>HP: <strong>${Math.round(runtime.player.hp)}/${stats.hp}</strong></div>
      <div>ATK/DEF: <strong>${stats.atk}/${stats.def}</strong></div>
    </div>
  `;
}

function renderInventory() {
  inventoryList.innerHTML = '';
  Object.entries(runtime.player.inventory).forEach(([itemId, qty]) => {
    const item = state.items.find((i) => i.id === itemId);
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>${item ? item.name : itemId}</h4><small>Quantità: ${qty}</small>`;
    inventoryList.appendChild(li);
  });
}

function renderResourceBag() {
  resourceListGame.innerHTML = '';
  Object.entries(runtime.player.bag).forEach(([id, qty]) => {
    const res = state.resources.find((r) => r.id === id);
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<h4>${res ? res.name : id}</h4><small>${qty.toFixed(0)}</small>`;
    resourceListGame.appendChild(li);
  });
}

// Battle simulator (debug)
startBattleBtn.addEventListener('click', () => {
  const mob = state.mobs.find((m) => m.id === battleMobSelect.value);
  if (!mob) return;
  const stats = getPlayerStats();
  let pHp = stats.hp;
  let mHp = mob.hp;
  let rounds = 0;
  battleLog.textContent = '';
  while (pHp > 0 && mHp > 0 && rounds < 30) {
    mHp -= Math.max(1, stats.atk - mob.def);
    if (mHp <= 0) break;
    pHp -= Math.max(1, mob.atk - stats.def);
    rounds++;
  }
  const result = pHp > 0 ? 'Vittoria' : 'Sconfitta';
  battleLog.textContent = `${result} in ${rounds + 1} turni. HP giocatore rimasti: ${Math.max(pHp, 0)}`;
});

resetPlayerBtn.addEventListener('click', () => {
  runtime.player = {
    x: 1.5,
    y: 1.5,
    speed: 4,
    level: 1,
    xp: 0,
    hp: 100,
    base: runtime.player.base,
    inventory: {},
    bag: {},
  };
  renderPlayerStats();
  renderInventory();
  renderResourceBag();
});

// Keyboard handling
window.addEventListener('keydown', (e) => {
  pressedKeys.add(e.code);
});

window.addEventListener('keyup', (e) => {
  pressedKeys.delete(e.code);
  recentlyPressed.delete(e.code);
});

// Refresh helpers
function refreshAll() {
  renderItems();
  renderMobs();
  renderMobDrops();
  renderLevels();
  renderResources();
  renderBuildings();
  populateMobDropSelect();
  populateMobOptions();
  populateBuildingSelectors();
  populateMapSelectors();
  drawEditorMap();
}

refreshAll();

// Mouse helpers for initial size
mapWidthInput.value = state.map.width;
mapHeightInput.value = state.map.height;
