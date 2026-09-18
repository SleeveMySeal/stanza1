const KEY="family-cfo-v2";
const seed={
  budget:105,
  expenses:[],
  receipts:[],
  lastStore:"Eurospin",
  shopping:[
    {id:1,name:"Latte",store:"Eurospin",day:1,price:4,done:false},
    {id:2,name:"Frutta di stagione",store:"Eurospin",day:1,price:10,done:false},
    {id:3,name:"Yogurt",store:"Eurospin",day:1,price:3,done:false},
    {id:4,name:"Pollo fresco",store:"Eurospin",day:1,price:9,done:false},
    {id:5,name:"Verdure",store:"Eurospin",day:1,price:10,done:false},
    {id:6,name:"Pesce",store:"Famila",day:2,price:12,done:false},
    {id:7,name:"Verdure fresche",store:"Famila",day:2,price:7,done:false},
    {id:8,name:"Pane",store:"Famila",day:2,price:3,done:false}
  ],
  pantry:[
    {id:11,name:"Pasta",pct:60,type:"normal",icon:"🍝"},
    {id:12,name:"Riso",pct:30,type:"normal",icon:"🍚"},
    {id:13,name:"Ceci",pct:55,type:"normal",icon:"🫘"},
    {id:14,name:"Uova",pct:45,type:"normal",icon:"🥚"},
    {id:15,name:"Patate",pct:35,type:"normal",icon:"🥔"},
    {id:16,name:"Olio EVO",pct:70,type:"staple",icon:"🫒"},
    {id:17,name:"Sale",pct:80,type:"staple",icon:"🧂"},
    {id:18,name:"Zucchero",pct:50,type:"staple",icon:"◻️"}
  ],
  selectedDay:"Lun",
  menu:{
    Lun:{lunch:"Pasta al pomodoro e verdure",dinner:"Branzino, patate e carote",tags:["pesce","verdure"]},
    Mar:{lunch:"Riso con zucchine",dinner:"Frittata, pane e insalata",tags:["uova","verdure"]},
    Mer:{lunch:"Pasta e ceci",dinner:"Pollo fresco con patate",tags:["legumi","carne bianca"]},
    Gio:{lunch:"Pasta con ricotta e zucchine",dinner:"Minestrone, ceci e pane",tags:["legumi","verdure"]},
    Ven:{lunch:"Riso con verdure",dinner:"Pesce con contorno",tags:["pesce","verdure"]},
    Sab:{lunch:"Pasta e ortaggi",dinner:"Carne bianca e verdure",tags:["carne bianca","verdure"]},
    Dom:{lunch:"Pranzo libero pianificato",dinner:"Legumi, pane e verdure",tags:["legumi","verdure"]}
  }
};
let state;
try{state=JSON.parse(localStorage.getItem(KEY))||JSON.parse(JSON.stringify(seed));}catch(e){state=JSON.parse(JSON.stringify(seed));}
if(!state.receipts)state.receipts=[];
if(!state.lastStore)state.lastStore="Eurospin";
let shopFilter="all";
let currentReceiptUrl="";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function eur(n){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(Number(n)||0);}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}
function foodSpent(){return state.expenses.filter(x=>x.category==="Alimentari").reduce((a,b)=>a+b.amount,0);}
function planned(){return state.shopping.filter(x=>!x.done).reduce((a,b)=>a+(Number(b.price)||0),0);}
function toast(text){const t=$("#toast");t.textContent=text;t.style.display="block";clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.style.display="none",1500);}
function openModal(name){$("#"+name+"Modal").classList.add("open");}
function closeModal(el){el.closest(".modal").classList.remove("open");}
function switchScreen(id){
  $$(".screen").forEach(v=>v.classList.toggle("active",v.id===id));
  $$(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-screen]").forEach(b=>b.addEventListener("click",()=>switchScreen(b.dataset.screen)));
$$("[data-open]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.open)));
$$(".modal-close").forEach(b=>b.addEventListener("click",()=>closeModal(b)));
$$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open");}));
function activateChoice(button){
  const target=button.dataset.target;
  const parent=button.closest(".choice-row");
  if(parent)parent.querySelectorAll(".choice").forEach(b=>b.classList.toggle("active",b===button));
  const input=$("#"+target); if(input)input.value=button.dataset.value;
}
$$(".choice").forEach(b=>b.addEventListener("click",()=>activateChoice(b)));
function selectChoice(target,value){
  const row=$('[data-target="'+target+'"]')?.closest(".choice-row");
  if(!row)return;
  row.querySelectorAll(".choice").forEach(b=>b.classList.toggle("active",b.dataset.value===String(value)));
  const input=$("#"+target);if(input)input.value=String(value);
}
function levelMeta(pct){
  if(pct===0)return["Da comprare","danger"];
  if(pct<=30)return["Poco","warn"];
  if(pct<=60)return["Metà",""];
  return["OK",""];
}
function quickLevel(pct){if(pct===0)return 0;if(pct<=30)return 25;if(pct<=70)return 50;return 100;}
function tripHtml(code,title,arr){
  const total=arr.reduce((a,b)=>a+(Number(b.price)||0),0);
  let names=arr.slice(0,3).map(x=>x.name).join(" · ");
  if(arr.length>3)names+=" · …";
  if(!names)names="Nessun articolo";
  return '<div class="trip"><div class="trip-logo">'+code+'</div><div class="trip-main"><strong>'+title+'</strong><span>'+names+'</span></div><div class="trip-price"><b>'+eur(total)+'</b><span>'+arr.length+' prodotti</span></div></div>';
}
function renderHome(){
  const spent=foodSpent(),rem=state.budget-spent,pct=Math.max(0,Math.min(100,Math.round(spent/state.budget*100)));
  $("#remaining").textContent=eur(Math.max(0,rem));
  $("#spent").textContent=eur(spent);
  $("#planned").textContent=eur(planned());
  $("#ringPct").textContent=pct+"%";
  $("#ring").style.setProperty("--deg",(pct*3.6)+"deg");
  $("#budgetCopy").textContent=spent===0?"Tutto il budget è ancora disponibile":rem>=0?eur(rem)+" ancora disponibili":"Budget superato di "+eur(Math.abs(rem));
  const low=state.pantry.filter(x=>x.pct<=30);
  $("#lowHero").textContent=low.length;
  $("#pantryMetric").textContent=state.pantry.length;
  $("#shoppingMetric").textContent=state.shopping.filter(x=>!x.done).length;
  $("#lowMetric").textContent=low.length;
  const d1=state.shopping.filter(x=>x.day===1&&!x.done);
  const d2=state.shopping.filter(x=>x.day===2&&!x.done);
  $("#tripCards").innerHTML=tripHtml("EU","Spesa 1 · Eurospin",d1)+tripHtml("FA","Spesa 2 · Famila",d2);
  const buy=state.pantry.filter(x=>x.pct===0).map(x=>x.name);
  const lows=state.pantry.filter(x=>x.pct>0&&x.pct<=30).map(x=>x.name);
  $("#insightText").textContent=buy.length?"Da comprare: "+buy.join(", ")+". Le scorte base entrano in lista solo quando finiscono.":lows.length?"Stanno finendo: "+lows.join(", ")+". Aggiorna il residuo con un tap.":"La dispensa è coperta: evita doppioni e compra solo ciò che manca.";
}
function renderShopping(){
  const spent=foodSpent(),rem=state.budget-spent;
  $("#miniSpent").textContent=eur(spent)+" su "+eur(state.budget);
  $("#miniRemaining").textContent=eur(Math.max(0,rem));
  const arr=state.shopping.filter(x=>shopFilter==="all"||x.day===Number(shopFilter));
  $("#shoppingList").innerHTML=arr.length?arr.map(x=>
    '<div class="list-item '+(x.done?"done":"")+'" data-shop="'+x.id+'"><button class="check">'+(x.done?"✓":"")+'</button><div class="list-main"><strong>'+x.name+'<span class="store">'+x.store+'</span></strong><small>Spesa '+x.day+'</small></div><div class="price">'+(x.price?eur(x.price):"—")+'</div></div>'
  ).join(""):'<div class="empty">Nessun prodotto in questa lista.</div>';
  $$("#shoppingList [data-shop]").forEach(el=>el.querySelector(".check").addEventListener("click",()=>{
    const item=state.shopping.find(x=>x.id===Number(el.dataset.shop));
    if(item){item.done=!item.done;save();}
  }));
  $("#expenseList").innerHTML=state.expenses.length?state.expenses.slice().reverse().map(x=>
    '<div class="list-item"><div class="food">'+(x.receipt?"🧾":"€")+'</div><div class="list-main"><strong>'+x.store+'</strong><small>'+x.category+(x.note?" · "+x.note:"")+'</small></div><div class="price">'+eur(x.amount)+'</div></div>'
  ).join(""):'<div class="empty">Nessuna spesa registrata.</div>';
}
$$("#shopTabs button").forEach(b=>b.addEventListener("click",()=>{
  shopFilter=b.dataset.filter;
  $$("#shopTabs button").forEach(x=>x.classList.toggle("active",x===b));
  renderShopping();
}));
function renderPantry(){
  $("#pantryGrid").innerHTML=state.pantry.map(x=>{
    const m=levelMeta(x.pct),active=quickLevel(x.pct);
    return '<article class="pantry-card"><div class="pantry-top"><div class="food">'+x.icon+'</div><span class="badge '+m[1]+'">'+(x.type==="staple"?"scorta base":m[0])+'</span></div><h3>'+x.name+'</h3><small>'+(x.type==="staple"?"Solo quando serve · ":"")+m[0]+'</small><div class="bar" style="--pct:'+x.pct+'%"><span></span></div><div class="level-row"><span>'+x.pct+'% stimato</span><span>1 tap</span></div><div class="pantry-levels" data-pan-id="'+x.id+'"><button class="pantry-level '+(active===100?"active":"")+'" data-pct="100">Pieno</button><button class="pantry-level '+(active===50?"active":"")+'" data-pct="50">Metà</button><button class="pantry-level '+(active===25?"active":"")+'" data-pct="25">Poco</button><button class="pantry-level '+(active===0?"active":"")+'" data-pct="0">Finito</button></div></article>';
  }).join("");
  $$(".pantry-levels").forEach(row=>row.querySelectorAll(".pantry-level").forEach(btn=>btn.addEventListener("click",()=>{
    const item=state.pantry.find(x=>x.id===Number(row.dataset.panId));
    if(item){item.pct=Number(btn.dataset.pct);save();toast(item.name+": "+btn.textContent);}
  })));
}
const days=[["Lun","21"],["Mar","22"],["Mer","23"],["Gio","24"],["Ven","25"],["Sab","26"],["Dom","27"]];
function renderMenu(){
  $("#days").innerHTML=days.map(d=>'<button class="day '+(state.selectedDay===d[0]?"active":"")+'" data-day="'+d[0]+'"><b>'+d[0]+'</b><span>'+d[1]+'</span></button>').join("");
  $$("#days [data-day]").forEach(b=>b.addEventListener("click",()=>{state.selectedDay=b.dataset.day;save();}));
  const m=state.menu[state.selectedDay];
  const tags=m.tags.map(t=>"<span>"+t+"</span>").join("");
  $("#mealCards").innerHTML='<article class="meal"><div class="meal-head"><span>Pranzo</span><span>12:30</span></div><h3>'+m.lunch+'</h3><p>Usa prima ciò che è già disponibile in casa.</p><div class="tags">'+tags+'</div></article><article class="meal"><div class="meal-head"><span>Cena</span><span>19:30</span></div><h3>'+m.dinner+'</h3><p>Preparazione semplice, con adattamento di consistenza e sale per i bambini.</p><div class="tags">'+tags+'</div></article>';
}
function makeReview(){
  const spent=foodSpent(),rem=state.budget-spent;
  const pantry=state.pantry.map(x=>"- "+x.name+": "+x.pct+"%"+(x.type==="staple"?" [SCORTA BASE]":"")).join("\n");
  const buy=state.pantry.filter(x=>x.pct===0).map(x=>"- "+x.name).join("\n")||"- nessuna";
  const plannedList=state.shopping.filter(x=>!x.done).map(x=>"- Spesa "+x.day+" · "+x.store+": "+x.name+(x.price?" · "+eur(x.price):"")).join("\n")||"- nessun articolo";
  const receipts=state.receipts.slice(-5).map(x=>"- "+x.store+": "+eur(x.total)).join("\n")||"- nessuno";
  return "FAMILY CFO — REVIEW SETTIMANALE\n\nFamiglia: 2 adulti + 2 bambini\nBudget alimentare: "+eur(state.budget)+"\nSpeso alimentari: "+eur(spent)+"\nResiduo budget: "+eur(rem)+"\n\nSCONTRINI\n"+receipts+"\n\nDISPENSA\n"+pantry+"\n\nDA COMPRARE\n"+buy+"\n\nLISTA PIANIFICATA\n"+plannedList+"\n\nOBIETTIVO PER CHATGPT\nAnalizza la settimana, evita doppioni, usa prima la dispensa, proponi un menu equilibrato e massimo due spese tra Famila ed Eurospin. Olio, sale, zucchero e altre scorte base vanno comprati solo quando segnati come Da comprare, mai a frequenza fissa.";
}
function renderReview(){
  const spent=foodSpent(),ratio=spent/state.budget;
  const score=Math.max(55,Math.round(96-Math.max(0,ratio-.75)*60-state.pantry.filter(x=>x.pct===0).length*2));
  $("#score").textContent=score;
  $("#scoreTitle").textContent=score>=90?"Settimana ben impostata":score>=75?"Buon controllo, qualche aggiustamento":"Rivediamo lista e budget";
  const notes=[];
  notes.push(spent<=state.budget?"Sei dentro il budget: "+eur(Math.max(0,state.budget-spent))+" ancora disponibili.":"Hai superato il budget di "+eur(spent-state.budget)+".");
  const low=state.pantry.filter(x=>x.pct<=30).map(x=>x.name);if(low.length)notes.push("Da controllare: "+low.join(", ")+".");
  notes.push(state.receipts.length?state.receipts.length+" scontrini registrati: la review usa già la spesa reale.":"Nessuno scontrino ancora registrato.");
  $("#reviewNotes").innerHTML=notes.map(n=>'<div class="review-note">'+n+"</div>").join("");
  $("#reviewText").textContent=makeReview();
}
function render(){renderHome();renderShopping();renderPantry();renderMenu();renderReview();}
$("#expenseForm").addEventListener("submit",e=>{
  e.preventDefault();const amount=Number($("#expAmount").value);if(!amount)return;
  state.expenses.push({id:Date.now(),amount,store:$("#expStoreValue").value,category:$("#expCategoryValue").value,note:$("#expNote").value.trim()});
  e.target.reset();selectChoice("expStoreValue","Eurospin");selectChoice("expCategoryValue","Alimentari");$("#expenseModal").classList.remove("open");save();toast("Spesa registrata");
});
$("#shopForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#shopName").value.trim();if(!name)return;
  state.shopping.push({id:Date.now(),name,store:$("#shopStoreValue").value,day:Number($("#shopDayValue").value),price:Number($("#shopPrice").value)||0,done:false});
  e.target.reset();selectChoice("shopStoreValue","Eurospin");selectChoice("shopDayValue","1");$("#shopModal").classList.remove("open");save();toast("Aggiunto alla lista");
});
$("#pantryForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#pantryName").value.trim();if(!name)return;
  state.pantry.push({id:Date.now(),name,pct:Number($("#pantryLevelValue").value),type:$("#pantryTypeValue").value,icon:$("#pantryIcon").value});
  e.target.reset();selectChoice("pantryLevelValue","100");selectChoice("pantryTypeValue","normal");$("#pantryModal").classList.remove("open");save();toast("Aggiunto in dispensa");
});
function openPantryCamera(){$("#cameraInput").click();}
$("#cameraBtn").addEventListener("click",openPantryCamera);
$("#homeCamera").addEventListener("click",()=>{switchScreen("pantry");setTimeout(openPantryCamera,160);});
$("#cameraInput").addEventListener("change",e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const url=URL.createObjectURL(f);$("#photoBox").innerHTML='<img src="'+url+'" alt="Foto dispensa">';$("#photoBox").style.display="block";toast("Foto dispensa aggiunta");
});
function openReceiptCamera(){$("#receiptInput").click();}
$("#receiptHomeBtn").addEventListener("click",openReceiptCamera);
$("#receiptShoppingBtn").addEventListener("click",openReceiptCamera);
$("#receiptInput").addEventListener("change",e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  if(currentReceiptUrl)URL.revokeObjectURL(currentReceiptUrl);
  currentReceiptUrl=URL.createObjectURL(f);
  $("#receiptThumb").innerHTML='<img src="'+currentReceiptUrl+'" alt="Foto scontrino">';$("#receiptThumb").style.display="block";
  selectChoice("receiptStoreValue",state.lastStore||"Eurospin");
  $("#receiptTotal").value="";
  $("#receiptModal").classList.add("open");
  setTimeout(()=>$("#receiptTotal").focus(),260);
});
$("#receiptForm").addEventListener("submit",e=>{
  e.preventDefault();const total=Number($("#receiptTotal").value);if(!total)return;
  const store=$("#receiptStoreValue").value;
  const now=Date.now();
  state.expenses.push({id:now,amount:total,store,category:"Alimentari",note:"Scontrino fotografato",receipt:true});
  state.receipts.push({id:now,store,total,date:new Date().toISOString()});
  state.lastStore=store;
  $("#receiptModal").classList.remove("open");
  $("#receiptInput").value="";
  save();switchScreen("shopping");toast("Scontrino salvato");
});
$("#copyBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(makeReview());toast("Review copiata");}catch(e){toast("Usa Scarica");}});
$("#downloadBtn").addEventListener("click",()=>{
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([makeReview()],{type:"text/plain"}));a.download="family-cfo-review.txt";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
});
$("#menuRefresh").addEventListener("click",()=>toast("Il menu verrà ottimizzato nella review ChatGPT"));
$("#profileBtn").addEventListener("click",()=>toast("Family CFO · prototipo condiviso"));
render();