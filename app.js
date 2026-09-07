const DEFAULT_MANAGERS=["IO","Team 2","Team 3","Team 4","Team 5","Team 6","Team 7","Team 8","Team 9","Team 10"];
const slots={P:2,D:8,C:8,A:6};
let state=JSON.parse(localStorage.getItem("astaLiveV3"))||{assignments:[],role:"D",status:"free",view:"tier",managers:[...DEFAULT_MANAGERS],notes:{}};
if(!state.managers||state.managers.length!==10) state.managers=[...DEFAULT_MANAGERS];
if(!state.notes) state.notes={};
let selected=null;
const byId=id=>PLAYERS.find(p=>p.id===id), sold=id=>state.assignments.find(a=>a.id===id);
const save=()=>localStorage.setItem("astaLiveV3",JSON.stringify(state));
const esc=s=>(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function riskClass(v){
 if(["INTOCCABILE","TITOLARE","MINIMA","AFFIDABILE","BUONA","ALTO","ALTISSIMO"].includes(v)) return "🟢";
 if(["OCCASIONALE","MEDIO","DA MONITORARE","BALLOTTAGGIO"].includes(v)) return "🟡";
 if(["FREQUENTE","ALTA","RISCHIO CARTELLINI","PANCHINARO"].includes(v)) return "🟠";
 return "⚪";
}
function render(){
 document.querySelectorAll("[data-role]").forEach(b=>b.classList.toggle("on",b.dataset.role===state.role));
 document.querySelectorAll("[data-status]").forEach(b=>b.classList.toggle("on",b.dataset.status===state.status));
 document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("on",b.dataset.view===state.view));
 const me=state.managers[0], mine=state.assignments.filter(a=>a.manager===me), mr=mine.filter(a=>byId(a.id).r===state.role);
 budget.textContent=500-mine.reduce((s,a)=>s+a.price,0); roleCount.textContent=mr.length+"/"+slots[state.role]; f1Count.textContent=mr.filter(a=>byId(a.id).t==="F1").length;

 let arr=PLAYERS.filter(p=>p.r===state.role), term=search.value.trim().toLowerCase();
 if(state.status==="free") arr=arr.filter(p=>!sold(p.id));
 if(state.status==="sold") arr=arr.filter(p=>sold(p.id));
 if(state.status==="mine") arr=arr.filter(p=>sold(p.id)?.manager===me);
 if(term) arr=arr.filter(p=>p.n.toLowerCase().includes(term)||p.c.toLowerCase().includes(term));
 let groups={};
 if(state.view==="tier"){arr.sort((a,b)=>a.t.localeCompare(b.t)||a.n.localeCompare(b.n,"it"));arr.forEach(p=>(groups[p.t]??=[]).push(p));}
 else if(state.view==="club"){arr.sort((a,b)=>a.c.localeCompare(b.c,"it")||a.n.localeCompare(b.n,"it"));arr.forEach(p=>(groups[p.c]??=[]).push(p));}
 else {arr.sort(state.view==="score"?(a,b)=>b.v-a.v:(a,b)=>a.n.localeCompare(b.n,"it"));groups[state.view==="score"?"VALUTAZIONE ↓":"A–Z"]=arr;}
 playerList.innerHTML="";
 if(!arr.length){playerList.innerHTML='<div class="empty">Nessun giocatore</div>';return;}
 Object.entries(groups).forEach(([g,ps])=>{
   let label=g;
   if(state.view==="club"){const tot=PLAYERS.filter(p=>p.r===state.role&&p.c===g).length, free=PLAYERS.filter(p=>p.r===state.role&&p.c===g&&!sold(p.id)).length;label=`${g} · ${free} liberi / ${tot}`;}
   playerList.insertAdjacentHTML("beforeend",`<div class="group">${label}</div>`);
   ps.forEach(p=>{const a=sold(p.id),e=document.createElement("div");e.className="row"+(a?" sold":"");
     e.innerHTML=`<div class="bar ${p.t}"></div><div class="nm"><b>${esc(p.n)}<span class="tag">${p.t}</span></b><small>${p.c} · ${esc(p.pos)}${a?` · ${esc(a.manager)} ${a.price} cr.`:""}</small></div><div class="rt"><b>${p.v}%</b><small>IDEALE ${p.ideal} · MAX ${p.max}</small></div>`;
     e.onclick=()=>openPlayer(p);playerList.appendChild(e);
   });
 });
}
function openPlayer(p){
 selected=p; const same=state.assignments.map(a=>[a,byId(a.id)]).filter(([a,x])=>x.r===p.r&&x.c===p.c);
 detail.innerHTML=`<div class="hero"><div><h2>${esc(p.n)}</h2><small>${p.c} · ${p.r} · ${p.t}</small></div><div class="score">${p.v}%<span>VALUTAZIONE</span></div></div>
 <div class="priceGrid"><div class="metric"><span>AFFARE ≤</span><strong>${p.aff}</strong></div><div class="metric"><span>IDEALE</span><strong>${p.ideal}</strong></div><div class="metric"><span>MAX</span><strong>${p.max}</strong></div></div>
 <div class="indicators">
 <div class="indicator"><span>🔥 Potenziale bonus</span><b>${p.bonus}</b></div>
 <div class="indicator"><span>${riskClass(p.ger)} Gerarchia</span><b>${p.ger}</b></div>
 <div class="indicator"><span>${riskClass(p.rot)} Rotazione</span><b>${p.rot}</b></div>
 <div class="indicator"><span>🏆 Europa</span><b>${p.eu}</b></div>
 <div class="indicator"><span>${riskClass(p.fis)} Fisico</span><b>${p.fis}</b></div>
 <div class="indicator"><span>${riskClass(p.disc)} Disciplina</span><b>${p.disc}</b></div>
 <div class="indicator"><span>📍 Posizione</span><b>${esc(p.pos)}</b></div></div>
 <div class="analysis"><b>ANALISI</b>${esc(p.analysis)}</div>
 <div class="analysis"><b>${p.c} · ${p.r} GIÀ ASSEGNATI</b>${same.length?same.map(([a,x])=>`${esc(x.n)} → ${esc(a.manager)} · ${a.price} cr.`).join("<br>"):"Nessuno"}</div>`;
 personalNote.value=state.notes[p.id]||""; assignBtn.hidden=!!sold(p.id);assignBox.hidden=true;refreshManagers();playerDialog.showModal();
}
function refreshManagers(){manager.innerHTML=state.managers.map(m=>`<option>${esc(m)}</option>`).join("");}
saveNote.onclick=()=>{if(selected){state.notes[selected.id]=personalNote.value;save();saveNote.textContent="SALVATA ✓";setTimeout(()=>saveNote.textContent="SALVA NOTA",900);}};
assignBtn.onclick=()=>assignBox.hidden=false;
confirmAssign.onclick=()=>{const n=+price.value;if(!n)return alert("Inserisci il prezzo");state.assignments.push({id:selected.id,price:n,manager:manager.value});price.value="";save();playerDialog.close();render();};

search.oninput=()=>{const t=search.value.trim().toLowerCase();suggestions.innerHTML="";if(t.length>=2)PLAYERS.filter(p=>p.r===state.role&&!sold(p.id)&&(p.n.toLowerCase().includes(t)||p.c.toLowerCase().includes(t))).slice(0,7).forEach(p=>{let d=document.createElement("div");d.className="suggestion";d.innerHTML=`<b>${esc(p.n)}</b> · ${p.c} · ${p.t} · ${p.v}%`;d.onclick=()=>{search.value="";suggestions.innerHTML="";openPlayer(p)};suggestions.appendChild(d)});render();};
document.querySelectorAll("[data-role]").forEach(b=>b.onclick=()=>{state.role=b.dataset.role;save();render()});
document.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>{state.status=b.dataset.status;save();render()});
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{state.view=b.dataset.view;save();render()});
resetBtn.onclick=()=>{state.status="free";state.view="tier";search.value="";suggestions.innerHTML="";save();render()};

legend.innerHTML=[
["VALUTAZIONE %","Unico indice numerico sintetico: combina il nostro giudizio complessivo sul giocatore."],
["POTENZIALE BONUS","ALTISSIMO / ALTO / MEDIO / BASSO: predisposizione a produrre gol, assist e altri bonus nel proprio ruolo."],
["GERARCHIA","INTOCCABILE / TITOLARE / BALLOTTAGGIO / ALTERNATIVA / PANCHINARO: posizione nelle gerarchie della squadra."],
["ROTAZIONE","MINIMA / OCCASIONALE / FREQUENTE / ALTA / IMPREVEDIBILE: quanto è soggetto a riposi e alternanza."],
["EUROPA","Indica gli impegni europei della squadra; è un fattore del turnover, non il turnover stesso."],
["FISICO","AFFIDABILE / DA MONITORARE / FRAGILE: sintesi dello storico e del rischio fisico."],
["DISCIPLINA","BUONA / DA MONITORARE / RISCHIO CARTELLINI: affidabilità rispetto ai malus disciplinari."],
["AFFARE","Prezzo sotto il quale l'acquisto è particolarmente favorevole."],["IDEALE","Intervallo che consideriamo corretto."],["MAX","Tetto oltre il quale normalmente lasciamo."]
].map(x=>`<div class="legendLine"><b>${x[0]}</b><br>${x[1]}</div>`).join("");
legendBtn.onclick=()=>legendDialog.showModal();

function openSettings(){
 managerInputs.innerHTML=state.managers.map((m,i)=>`<label class="muted">${i===0?"TU":`TEAM ${i+1}`}<input class="mgrInput" data-i="${i}" value="${esc(m)}"></label>`).join("");
 settingsDialog.showModal();
}
settingsBtn.onclick=openSettings;
saveManagers.onclick=()=>{const vals=[...document.querySelectorAll(".mgrInput")].map(x=>x.value.trim()).map((x,i)=>x||DEFAULT_MANAGERS[i]);
 const old=[...state.managers];state.assignments.forEach(a=>{const i=old.indexOf(a.manager);if(i>=0)a.manager=vals[i]});state.managers=vals;save();settingsDialog.close();render();};

function showTeams(){
 teamsContent.innerHTML=state.managers.map((m,i)=>{const a=state.assignments.filter(x=>x.manager===m),spent=a.reduce((s,x)=>s+x.price,0);
 const by=Object.fromEntries("PDCA".split("").map(r=>[r,a.filter(x=>byId(x.id).r===r).length]));
 return `<div class="teamCard"><b>${i===0?"⭐ ":""}${esc(m)}</b><small>Budget ${500-spent} · Spesi ${spent} · P ${by.P}/2 · D ${by.D}/8 · C ${by.C}/8 · A ${by.A}/6</small>${a.length?`<small>${a.map(x=>`${esc(byId(x.id).n)} ${x.price}`).join(" · ")}</small>`:""}</div>`;
 }).join("");teamsDialog.showModal();
}
teamsBtn.onclick=showTeams;
auctionBtn.onclick=()=>{history.innerHTML=state.assignments.length?state.assignments.map((a,i)=>`${i+1}. <b>${esc(byId(a.id).n)}</b> → ${esc(a.manager)} · ${a.price} cr.`).join("<br>"):"Nessuna assegnazione";auctionDialog.showModal();};
undoBtn.onclick=()=>{if(state.assignments.length&&confirm("Annullare l'ultima assegnazione?")){state.assignments.pop();save();auctionDialog.close();render()}};

exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="asta-live-backup.json";a.click();URL.revokeObjectURL(u);};
importInput.onchange=async e=>{try{const obj=JSON.parse(await e.target.files[0].text());if(!obj.assignments||!obj.managers)throw 0;state=obj;save();settingsDialog.close();render();alert("Backup importato");}catch{alert("Backup non valido")}};
resetAuction.onclick=()=>{if(confirm("Azzero assegnazioni e note? I nomi dei partecipanti restano.")){state.assignments=[];state.notes={};save();settingsDialog.close();render()}};

render();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
