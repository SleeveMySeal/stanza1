const KEY="family-cfo-v2";
const seed={
  budget:105,
  expenses:[],
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
let shopFilter="all";
let editingPantry=null;
const $=function(s){return document.querySelector(s);};
const $$=function(s){return Array.from(document.querySelectorAll(s));};
function eur(n){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(Number(n)||0);}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}
function foodSpent(){return state.expenses.filter(function(x){return x.category==="Alimentari";}).reduce(function(a,b){return a+b.amount;},0);}
function planned(){return state.shopping.filter(function(x){return !x.done;}).reduce(function(a,b){return a+(Number(b.price)||0);},0);}
function toast(text){var t=$("#toast");t.textContent=text;t.style.display="block";clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(function(){t.style.display="none";},1800);}
function openModal(name){$("#"+name+"Modal").classList.add("open");}
function closeModal(el){el.closest(".modal").classList.remove("open");}
function switchScreen(id){
  $$(".screen").forEach(function(v){v.classList.toggle("active",v.id===id);});
  $$(".bottom-nav button").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-screen")===id);});
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-screen]").forEach(function(b){b.addEventListener("click",function(){switchScreen(b.getAttribute("data-screen"));});});
$$("[data-open]").forEach(function(b){b.addEventListener("click",function(){openModal(b.getAttribute("data-open"));});});
$$(".modal-close").forEach(function(b){b.addEventListener("click",function(){closeModal(b);});});
$$(".modal").forEach(function(m){m.addEventListener("click",function(e){if(e.target===m)m.classList.remove("open");});});
function levelMeta(pct){
  if(pct===0)return["Da comprare","danger"];
  if(pct<=10)return["Quasi finito","danger"];
  if(pct<=30)return["Poco","warn"];
  if(pct<=60)return["Metà",""];
  return["OK",""];
}
function tripHtml(code,title,arr){
  var total=arr.reduce(function(a,b){return a+(Number(b.price)||0);},0);
  var names=arr.slice(0,3).map(function(x){return x.name;}).join(" · ");
  if(arr.length>3)names+=" · …";
  if(!names)names="Nessun articolo";
  return '<div class="trip"><div class="trip-logo">'+code+'</div><div class="trip-main"><strong>'+title+'</strong><span>'+names+'</span></div><div class="trip-price"><b>'+eur(total)+'</b><span>'+arr.length+' prodotti</span></div></div>';
}
function renderHome(){
  var spent=foodSpent(),rem=state.budget-spent,pct=Math.max(0,Math.min(100,Math.round(spent/state.budget*100)));
  $("#remaining").textContent=eur(Math.max(0,rem));
  $("#spent").textContent=eur(spent);
  $("#planned").textContent=eur(planned());
  $("#ringPct").textContent=pct+"%";
  $("#ring").style.setProperty("--deg",(pct*3.6)+"deg");
  $("#budgetCopy").textContent=spent===0?"Tutto il budget è ancora disponibile":rem>=0?eur(rem)+" ancora disponibili":"Budget superato di "+eur(Math.abs(rem));
  var low=state.pantry.filter(function(x){return x.pct<=30;});
  $("#lowHero").textContent=low.length;
  $("#pantryMetric").textContent=state.pantry.length;
  $("#shoppingMetric").textContent=state.shopping.filter(function(x){return !x.done;}).length;
  $("#lowMetric").textContent=low.length;
  var d1=state.shopping.filter(function(x){return x.day===1&&!x.done;});
  var d2=state.shopping.filter(function(x){return x.day===2&&!x.done;});
  $("#tripCards").innerHTML=tripHtml("EU","Spesa 1 · Eurospin",d1)+tripHtml("FA","Spesa 2 · Famila",d2);
  var buy=state.pantry.filter(function(x){return x.pct===0;}).map(function(x){return x.name;});
  var lows=state.pantry.filter(function(x){return x.pct>0&&x.pct<=30;}).map(function(x){return x.name;});
  $("#insightText").textContent=buy.length?"Da comprare: "+buy.join(", ")+". Le scorte base entrano in lista solo quando le segni così.":lows.length?"Stanno finendo: "+lows.join(", ")+". Controlla prima il residuo e poi aggiungili alla prossima spesa.":"La dispensa è coperta: evita doppioni e compra solo ciò che manca davvero.";
}
function renderShopping(){
  var spent=foodSpent(),rem=state.budget-spent;
  $("#miniSpent").textContent=eur(spent)+" su "+eur(state.budget);
  $("#miniRemaining").textContent=eur(Math.max(0,rem));
  var arr=state.shopping.filter(function(x){return shopFilter==="all"||x.day===Number(shopFilter);});
  $("#shoppingList").innerHTML=arr.length?arr.map(function(x){
    return '<div class="list-item '+(x.done?"done":"")+'" data-shop="'+x.id+'"><button class="check">'+(x.done?"✓":"")+'</button><div class="list-main"><strong>'+x.name+'<span class="store">'+x.store+'</span></strong><small>Spesa '+x.day+'</small></div><div class="price">'+(x.price?eur(x.price):"—")+'</div></div>';
  }).join(""):'<div class="empty">Nessun prodotto in questa lista.</div>';
  $$("#shoppingList [data-shop]").forEach(function(el){
    el.querySelector(".check").addEventListener("click",function(){
      var item=state.shopping.find(function(x){return x.id===Number(el.getAttribute("data-shop"));});
      if(item){item.done=!item.done;save();}
    });
  });
  $("#expenseList").innerHTML=state.expenses.length?state.expenses.slice().reverse().map(function(x){
    return '<div class="list-item"><div class="food">€</div><div class="list-main"><strong>'+x.store+'</strong><small>'+x.category+(x.note?" · "+x.note:"")+'</small></div><div class="price">'+eur(x.amount)+'</div></div>';
  }).join(""):'<div class="empty">Nessuna spesa registrata.</div>';
}
$$("#shopTabs button").forEach(function(b){
  b.addEventListener("click",function(){
    shopFilter=b.getAttribute("data-filter");
    $$("#shopTabs button").forEach(function(x){x.classList.toggle("active",x===b);});
    renderShopping();
  });
});
function renderPantry(){
  $("#pantryGrid").innerHTML=state.pantry.map(function(x){
    var m=levelMeta(x.pct);
    return '<button class="pantry-card" data-pantry="'+x.id+'"><div class="pantry-top"><div class="food">'+x.icon+'</div><span class="badge '+m[1]+'">'+(x.type==="staple"?"scorta base":m[0])+'</span></div><h3>'+x.name+'</h3><small>'+(x.type==="staple"?"Solo quando serve · ":"")+m[0]+'</small><div class="bar" style="--pct:'+x.pct+'%"><span></span></div><div class="level-row"><span>'+x.pct+'% stimato</span><span>aggiorna ›</span></div></button>';
  }).join("");
  $$("#pantryGrid [data-pantry]").forEach(function(b){
    b.addEventListener("click",function(){
      editingPantry=Number(b.getAttribute("data-pantry"));
      var x=state.pantry.find(function(p){return p.id===editingPantry;});
      $("#levelTitle").textContent=x.name;
      $("#levelValue").value=String(x.pct);
      $("#levelModal").classList.add("open");
    });
  });
}
var days=[["Lun","21"],["Mar","22"],["Mer","23"],["Gio","24"],["Ven","25"],["Sab","26"],["Dom","27"]];
function renderMenu(){
  $("#days").innerHTML=days.map(function(d){return '<button class="day '+(state.selectedDay===d[0]?"active":"")+'" data-day="'+d[0]+'"><b>'+d[0]+'</b><span>'+d[1]+'</span></button>';}).join("");
  $$("#days [data-day]").forEach(function(b){b.addEventListener("click",function(){state.selectedDay=b.getAttribute("data-day");save();});});
  var m=state.menu[state.selectedDay];
  var tags=m.tags.map(function(t){return "<span>"+t+"</span>";}).join("");
  $("#mealCards").innerHTML='<article class="meal"><div class="meal-head"><span>Pranzo</span><span>12:30</span></div><h3>'+m.lunch+'</h3><p>Usa prima ciò che è già disponibile in casa.</p><div class="tags">'+tags+'</div></article><article class="meal"><div class="meal-head"><span>Cena</span><span>19:30</span></div><h3>'+m.dinner+'</h3><p>Preparazione semplice, con adattamento di consistenza e sale per i bambini.</p><div class="tags">'+tags+'</div></article>';
}
function makeReview(){
  var spent=foodSpent(),rem=state.budget-spent;
  var pantry=state.pantry.map(function(x){return "- "+x.name+": "+x.pct+"%"+(x.type==="staple"?" [SCORTA BASE]":"");}).join("\n");
  var buy=state.pantry.filter(function(x){return x.pct===0;}).map(function(x){return "- "+x.name;}).join("\n")||"- nessuna";
  var plannedList=state.shopping.filter(function(x){return !x.done;}).map(function(x){return "- Spesa "+x.day+" · "+x.store+": "+x.name+(x.price?" · "+eur(x.price):"");}).join("\n")||"- nessun articolo";
  return "FAMILY CFO — REVIEW SETTIMANALE\n\nFamiglia: 2 adulti + 2 bambini\nBudget alimentare: "+eur(state.budget)+"\nSpeso alimentari: "+eur(spent)+"\nResiduo budget: "+eur(rem)+"\n\nDISPENSA\n"+pantry+"\n\nDA COMPRARE\n"+buy+"\n\nLISTA PIANIFICATA\n"+plannedList+"\n\nOBIETTIVO PER CHATGPT\nAnalizza la settimana, evita doppioni, usa prima la dispensa, proponi un menu equilibrato e massimo due spese tra Famila ed Eurospin. Olio, sale, zucchero e altre scorte base vanno comprati solo quando segnati come Da comprare, mai a frequenza fissa.";
}
function renderReview(){
  var spent=foodSpent(),ratio=spent/state.budget;
  var score=Math.max(55,Math.round(96-Math.max(0,ratio-.75)*60-state.pantry.filter(function(x){return x.pct===0;}).length*2));
  $("#score").textContent=score;
  $("#scoreTitle").textContent=score>=90?"Settimana ben impostata":score>=75?"Buon controllo, qualche aggiustamento":"Rivediamo lista e budget";
  var notes=[];
  notes.push(spent<=state.budget?"Sei dentro il budget: "+eur(Math.max(0,state.budget-spent))+" ancora disponibili.":"Hai superato il budget di "+eur(spent-state.budget)+".");
  var low=state.pantry.filter(function(x){return x.pct<=30;}).map(function(x){return x.name;});
  if(low.length)notes.push("Da controllare prima della prossima spesa: "+low.join(", ")+".");
  var staples=state.pantry.filter(function(x){return x.type==="staple"&&x.pct===0;}).map(function(x){return x.name;});
  notes.push(staples.length?"Scorte base da aggiungere: "+staples.join(", ")+".":"Nessuna scorta base va ricomprata automaticamente.");
  $("#reviewNotes").innerHTML=notes.map(function(n){return '<div class="review-note">'+n+"</div>";}).join("");
  $("#reviewText").textContent=makeReview();
}
function render(){renderHome();renderShopping();renderPantry();renderMenu();renderReview();}
$("#expenseForm").addEventListener("submit",function(e){
  e.preventDefault();
  var amount=Number($("#expAmount").value);
  if(!amount)return;
  state.expenses.push({id:Date.now(),amount:amount,store:$("#expStore").value,category:$("#expCategory").value,note:$("#expNote").value.trim()});
  e.target.reset();$("#expenseModal").classList.remove("open");save();toast("Spesa registrata");
});
$("#shopForm").addEventListener("submit",function(e){
  e.preventDefault();
  var name=$("#shopName").value.trim();
  if(!name)return;
  state.shopping.push({id:Date.now(),name:name,store:$("#shopStore").value,day:Number($("#shopDay").value),price:Number($("#shopPrice").value)||0,done:false});
  e.target.reset();$("#shopModal").classList.remove("open");save();toast("Aggiunto alla lista");
});
$("#pantryForm").addEventListener("submit",function(e){
  e.preventDefault();
  var name=$("#pantryName").value.trim();
  if(!name)return;
  state.pantry.push({id:Date.now(),name:name,pct:Number($("#pantryLevel").value),type:$("#pantryType").value,icon:$("#pantryIcon").value});
  e.target.reset();$("#pantryModal").classList.remove("open");save();toast("Aggiunto in dispensa");
});
$("#saveLevel").addEventListener("click",function(){
  var x=state.pantry.find(function(p){return p.id===editingPantry;});
  if(x)x.pct=Number($("#levelValue").value);
  $("#levelModal").classList.remove("open");save();toast("Residuo aggiornato");
});
function openCamera(){ $("#cameraInput").click(); }
$("#cameraBtn").addEventListener("click",openCamera);
$("#homeCamera").addEventListener("click",function(){switchScreen("pantry");setTimeout(openCamera,180);});
$("#cameraInput").addEventListener("change",function(e){
  var f=e.target.files&&e.target.files[0];
  if(!f)return;
  var url=URL.createObjectURL(f);
  $("#photoBox").innerHTML='<img src="'+url+'" alt="Foto dispensa">';
  $("#photoBox").style.display="block";
  toast("Foto aggiunta");
});
$("#copyBtn").addEventListener("click",async function(){
  try{await navigator.clipboard.writeText(makeReview());toast("Review copiata");}catch(e){toast("Usa Scarica");}
});
$("#downloadBtn").addEventListener("click",function(){
  var a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([makeReview()],{type:"text/plain"}));
  a.download="family-cfo-review.txt";
  a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);},500);
});
$("#menuRefresh").addEventListener("click",function(){toast("Il menu verrà ottimizzato nella review ChatGPT");});
$("#profileBtn").addEventListener("click",function(){toast("Family CFO · prototipo condiviso");});
render();