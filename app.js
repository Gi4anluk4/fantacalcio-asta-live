const managers=["IO","Team 2","Team 3","Team 4","Team 5","Team 6","Team 7","Team 8","Team 9","Team 10"];

const players=[
{id:1,r:"D",n:"Bastoni",c:"Inter",t:"F1",v:87,aff:7,ideal:"9–13",max:15,risk:"Basso",bonus:84,pres:94,tit:94,fis:91,fit:88,disc:90,pos:"Difensore centrale",note:"Centrale da bonus e costruzione."},
{id:2,r:"D",n:"Bremer",c:"Juventus",t:"F1",v:86,aff:8,ideal:"10–13",max:15,risk:"Medio",bonus:82,pres:91,tit:93,fis:78,fit:88,disc:86,pos:"Difensore centrale",note:"Molto pericoloso sui piazzati."},
{id:3,r:"D",n:"Dimarco",c:"Inter",t:"F1",v:94,aff:20,ideal:"22–27",max:30,risk:"Basso",bonus:96,pres:94,tit:91,fis:87,fit:96,disc:89,pos:"Esterno / quinto offensivo",note:"Altissimo potenziale bonus."},
{id:4,r:"D",n:"Mancini",c:"Roma",t:"F1",v:88,aff:9,ideal:"11–15",max:17,risk:"Basso",bonus:88,pres:94,tit:95,fis:91,fit:90,disc:72,pos:"Difensore centrale",note:"Bonus e presenza sui piazzati."},
{id:5,r:"D",n:"Wesley",c:"Roma",t:"F1",v:90,aff:14,ideal:"17–22",max:25,risk:"Basso",bonus:92,pres:90,tit:89,fis:90,fit:94,disc:88,pos:"Quinto offensivo",note:"Profilo molto offensivo."},
{id:6,r:"D",n:"Cambiaso",c:"Juventus",t:"F2",v:82,aff:5,ideal:"8–11",max:13,risk:"Medio",bonus:85,pres:84,tit:80,fis:83,fit:87,disc:86,pos:"Esterno avanzato",note:"Duttile e offensivo."},
{id:7,r:"D",n:"Valeri",c:"Parma",t:"F3",v:76,aff:2,ideal:"4–6",max:8,risk:"Medio",bonus:77,pres:88,tit:88,fis:84,fit:80,disc:87,pos:"Esterno",note:"Value interessante."},
{id:8,r:"D",n:"Gallo",c:"Lecce",t:"F4",v:69,aff:1,ideal:"2–4",max:6,risk:"Basso",bonus:65,pres:90,tit:88,fis:88,fit:72,disc:85,pos:"Terzino",note:"Low cost da voto."},
{id:9,r:"C",n:"Calhanoglu",c:"Inter",t:"F1",v:91,aff:17,ideal:"20–26",max:29,risk:"Medio",bonus:94,pres:84,tit:90,fis:75,fit:95,disc:83,pos:"Regista / piazzati",note:"Rigori e piazzati."},
{id:10,r:"C",n:"Pulisic",c:"Milan",t:"F1",v:93,aff:21,ideal:"24–30",max:34,risk:"Medio",bonus:97,pres:84,tit:91,fis:76,fit:96,disc:91,pos:"Esterno offensivo",note:"Quasi attaccante."},
{id:11,r:"A",n:"Lautaro Martinez",c:"Inter",t:"F1",v:96,aff:80,ideal:"90–110",max:120,risk:"Basso",bonus:98,pres:94,tit:95,fis:91,fit:97,disc:91,pos:"Punta",note:"Top assoluto."},
{id:12,r:"P",n:"Inter",c:"Inter",t:"F1",v:92,aff:20,ideal:"23–29",max:30,risk:"Basso",bonus:90,pres:98,tit:98,fis:95,fit:92,disc:95,pos:"Porta",note:"Porta premium."}
];

const slots={P:2,D:8,C:8,A:6};
let state=JSON.parse(localStorage.getItem("astaLiveV2")) || {assignments:[],role:"D",status:"free",view:"tier"};
let selected=null;

const sold=id=>state.assignments.find(a=>a.id===id);
const getPlayer=id=>players.find(p=>p.id===id);
const save=()=>localStorage.setItem("astaLiveV2",JSON.stringify(state));

function render(){
  document.querySelectorAll("[data-role]").forEach(b=>b.classList.toggle("active",b.dataset.role===state.role));
  document.querySelectorAll("[data-status]").forEach(b=>b.classList.toggle("active",b.dataset.status===state.status));
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));

  const mine=state.assignments.filter(a=>a.manager==="IO");
  const mineRole=mine.filter(a=>getPlayer(a.id).r===state.role);
  budget.textContent=500-mine.reduce((s,a)=>s+a.price,0);
  roleCount.textContent=`${mineRole.length}/${slots[state.role]}`;
  f1Count.textContent=mineRole.filter(a=>getPlayer(a.id).t==="F1").length;

  let arr=players.filter(p=>p.r===state.role);
  if(state.status==="free") arr=arr.filter(p=>!sold(p.id));
  if(state.status==="sold") arr=arr.filter(p=>sold(p.id));
  if(state.status==="mine") arr=arr.filter(p=>sold(p.id)?.manager==="IO");

  const term=search.value.trim().toLowerCase();
  if(term) arr=arr.filter(p=>p.n.toLowerCase().includes(term)||p.c.toLowerCase().includes(term));

  const groups={};
  if(state.view==="tier"){
    arr.sort((a,b)=>a.t.localeCompare(b.t)||a.n.localeCompare(b.n,"it"));
    arr.forEach(p=>(groups[p.t]??=[]).push(p));
  }else if(state.view==="club"){
    arr.sort((a,b)=>a.c.localeCompare(b.c,"it")||a.n.localeCompare(b.n,"it"));
    arr.forEach(p=>(groups[p.c]??=[]).push(p));
  }else{
    arr.sort(state.view==="score" ? (a,b)=>b.v-a.v : (a,b)=>a.n.localeCompare(b.n,"it"));
    groups[state.view==="score"?"VALUTAZIONE ↓":"A–Z"]=arr;
  }

  playerList.innerHTML="";
  if(!arr.length){playerList.innerHTML='<div class="empty">Nessun giocatore</div>';return;}

  Object.entries(groups).forEach(([g,ps])=>{
    playerList.insertAdjacentHTML("beforeend",`<div class="groupTitle">${g} · ${ps.length}</div>`);
    ps.forEach(p=>{
      const a=sold(p.id);
      const row=document.createElement("div");
      row.className="playerRow"+(a?" sold":"");
      row.innerHTML=`<div class="tierBar ${p.t}"></div>
        <div class="playerMain"><b>${p.n}<span class="tierTag">${p.t}</span></b>
        <small>${p.c} · ${p.pos}${a?` · ${a.manager} ${a.price} cr.`:""}</small></div>
        <div class="playerScore"><b>${p.v}%</b><small>IDEALE ${p.ideal} · MAX ${p.max}</small></div>`;
      row.onclick=()=>openPlayer(p);
      playerList.appendChild(row);
    });
  });
}

function openPlayer(p){
  selected=p;
  const sameRoleClub=state.assignments.map(a=>[a,getPlayer(a.id)]).filter(([a,x])=>x.r===p.r&&x.c===p.c);
  playerDetail.innerHTML=`<div class="hero">
    <div><h2>${p.n}</h2><small>${p.c} · ${p.t} · ${p.pos}</small></div>
    <div class="bigScore">${p.v}%<span>VALUTAZIONE</span></div>
  </div>
  <div class="grid3">
    <div class="metric"><span>AFFARE ≤</span><strong>${p.aff}</strong></div>
    <div class="metric"><span>IDEALE</span><strong>${p.ideal}</strong></div>
    <div class="metric"><span>MAX</span><strong>${p.max}</strong></div>
  </div>
  <div class="grid2">
    ${[["BONUS",p.bonus],["PRESENZA",p.pres],["TITOLARITÀ",p.tit],["FISICO",p.fis],["FIT TATTICO",p.fit],["DISCIPLINA",p.disc]].map(([k,v])=>`<div class="metric"><span>${k}</span><strong>${v}%</strong></div>`).join("")}
  </div>
  <div class="note"><b>RISCHIO:</b> ${p.risk}</div>
  <div class="note"><b>ANALISI</b><br>${p.note}</div>
  <div class="note"><b>${p.r} ${p.c} GIÀ ASSEGNATI</b><br>${sameRoleClub.length?sameRoleClub.map(([a,x])=>`${x.n} → ${a.manager} · ${a.price} cr.`).join("<br>"):"Nessuno"}</div>`;
  assignBtn.hidden=!!sold(p.id);
  assignPanel.hidden=true;
  playerDialog.showModal();
}

managerSelect.innerHTML=managers.map(m=>`<option>${m}</option>`).join("");

assignBtn.onclick=()=>assignPanel.hidden=false;
confirmAssign.onclick=()=>{
  const price=Number(priceInput.value);
  if(!price||price<1){alert("Inserisci il prezzo");return;}
  state.assignments.push({id:selected.id,price,manager:managerSelect.value});
  save(); priceInput.value=""; playerDialog.close(); search.value=""; render();
};

search.oninput=()=>{
  const t=search.value.trim().toLowerCase();
  suggestions.innerHTML="";
  if(t.length>=2){
    players.filter(p=>p.r===state.role&&!sold(p.id)&&(p.n.toLowerCase().includes(t)||p.c.toLowerCase().includes(t))).slice(0,6).forEach(p=>{
      const d=document.createElement("div");
      d.className="suggestion";
      d.innerHTML=`<b>${p.n}</b> · ${p.c} · ${p.t} · ${p.v}%`;
      d.onclick=()=>{search.value="";suggestions.innerHTML="";openPlayer(p);};
      suggestions.appendChild(d);
    });
  }
  render();
};

document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>{state.role=b.dataset.role;save();render();});
document.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>{state.status=b.dataset.status;save();render();});
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;save();render();});

resetFilters.onclick=()=>{state.status="free";state.view="tier";search.value="";suggestions.innerHTML="";save();render();};

legendBtn.onclick=()=>legendDialog.showModal();
auctionBtn.onclick=()=>{
  auctionHistory.innerHTML=state.assignments.length?state.assignments.map((a,i)=>`${i+1}. <b>${getPlayer(a.id).n}</b> → ${a.manager} · ${a.price} cr.`).join("<br>"):"Nessuna assegnazione";
  auctionDialog.showModal();
};
undoBtn.onclick=()=>{
  if(state.assignments.length && confirm("Annullare l'ultima assegnazione?")){
    state.assignments.pop();save();auctionDialog.close();render();
  }
};

legendContent.innerHTML=[
["VALUTAZIONE","Giudizio complessivo del nostro modello."],
["BONUS","Potenziale gol, assist e altri bonus."],
["PRESENZA","Probabilità concreta di ottenere voto."],
["TITOLARITÀ","Stabilità del posto da titolare e delle gerarchie."],
["FISICO","Affidabilità fisica e storico infortuni."],
["FIT TATTICO","Quanto ruolo, modulo e allenatore valorizzano il giocatore."],
["DISCIPLINA","Affidabilità rispetto a cartellini e malus disciplinari."],
["RISCHIO","Sintesi dei principali fattori d'incertezza."],
["AFFARE","Fino a questa cifra il prezzo è particolarmente favorevole."],
["IDEALE","Intervallo nel quale siamo soddisfatti dell'acquisto."],
["MAX","Limite massimo normalmente consigliato."]
].map(([k,v])=>`<div class="legendLine"><b>${k}</b><br>${v}</div>`).join("");

render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
