const managers=['IO','Team 2','Team 3','Team 4','Team 5','Team 6','Team 7','Team 8','Team 9','Team 10'];
const players=[
{id:1,role:'D',name:'Bastoni',club:'Inter',tier:'F1',score:87,target:'9-13',stop:15,risk:'Basso',note:'Centrale da bonus'},
{id:2,role:'D',name:'Bremer',club:'Juventus',tier:'F1',score:86,target:'10-13',stop:15,risk:'Medio',note:'Pericoloso sui piazzati'},
{id:3,role:'D',name:'Dimarco',club:'Inter',tier:'F1',score:94,target:'22-27',stop:30,risk:'Basso',note:'Esterno totale'},
{id:4,role:'D',name:'Mancini',club:'Roma',tier:'F1',score:88,target:'11-15',stop:17,risk:'Basso',note:'Bonus + piazzati'},
{id:5,role:'D',name:'Wesley',club:'Roma',tier:'F1',score:90,target:'17-22',stop:25,risk:'Basso',note:'Quinto offensivo'},
{id:6,role:'D',name:'Cambiaso',club:'Juventus',tier:'F2',score:82,target:'8-11',stop:13,risk:'Medio',note:'Esterno avanzato'},
{id:7,role:'D',name:'Valeri',club:'Parma',tier:'F3',score:76,target:'4-6',stop:8,risk:'Medio',note:'Value'},
{id:8,role:'D',name:'Gallo',club:'Lecce',tier:'F4',score:69,target:'2-4',stop:6,risk:'Basso',note:'Low cost'},
{id:9,role:'C',name:'Calhanoglu',club:'Inter',tier:'F1',score:91,target:'20-26',stop:29,risk:'Medio',note:'Piazzati e rigori'},
{id:10,role:'C',name:'Pulisic',club:'Milan',tier:'F1',score:93,target:'24-30',stop:34,risk:'Medio',note:'Quasi attaccante'},
{id:11,role:'A',name:'Lautaro Martinez',club:'Inter',tier:'F1',score:96,target:'90-110',stop:120,risk:'Basso',note:'Top assoluto'},
{id:12,role:'P',name:'Inter',club:'Inter',tier:'F1',score:92,target:'23-29',stop:30,risk:'Basso',note:'Porta premium'}];
const roleInfo={P:{label:'Portieri',slots:2},D:{label:'Difensori',slots:8},C:{label:'Centrocampisti',slots:8},A:{label:'Attaccanti',slots:6}};
let state=JSON.parse(localStorage.getItem('fantacalcioState')||'null')||{assignments:[],activeRole:'D'},selectedPlayer=null;
const byId=id=>players.find(p=>p.id===id), ass=id=>state.assignments.find(a=>a.playerId===id), save=()=>localStorage.setItem('fantacalcioState',JSON.stringify(state));
function render(){
document.querySelectorAll('[data-role]').forEach(b=>b.classList.toggle('active',b.dataset.role===state.activeRole));
roleLabel.textContent=roleInfo[state.activeRole].label;
const mine=state.assignments.filter(a=>a.manager==='IO'); myBudget.textContent=500-mine.reduce((s,a)=>s+a.price,0);
myCount.textContent=`${mine.filter(a=>byId(a.playerId).role===state.activeRole).length}/${roleInfo[state.activeRole].slots}`;
const q=searchInput.value.toLowerCase().trim(), filtered=players.filter(p=>p.role===state.activeRole&&p.name.toLowerCase().includes(q)).sort((a,b)=>a.tier.localeCompare(b.tier)||a.name.localeCompare(b.name,'it'));
playerList.innerHTML='';
['F1','F2','F3','F4'].forEach(t=>{const arr=filtered.filter(p=>p.tier===t);if(!arr.length)return;
const h=document.createElement('h3');h.className='tier-title';h.textContent=`${t} · ${arr.filter(p=>!ass(p.id)).length}/${arr.length} disponibili`;playerList.appendChild(h);
arr.forEach(p=>{const a=ass(p.id),r=document.createElement('div');r.className='player'+(a?' assigned':'');
r.innerHTML=`<div class="player-main"><strong>${p.name}<span class="badge">${p.club}</span></strong><small>${p.note}${a?` · ${a.manager} ${a.price} cr.`:''}</small></div><div class="player-meta"><div class="score">${p.score}</div><div class="pricehint">${p.target} · STOP ${p.stop}</div></div>`;
if(!a)r.onclick=()=>openPlayer(p);playerList.appendChild(r);});}); updatePressure();}
function openPlayer(p){selectedPlayer=p;const same=state.assignments.map(a=>({...a,p:byId(a.playerId)})).filter(x=>x.p.role===p.role&&x.p.club===p.club);
playerDetail.innerHTML=`<h2>${p.name}</h2><div>${p.club} · ${p.role} · ${p.tier}</div><div class="grid"><div class="kpi"><span>SCORE</span><strong>${p.score}</strong></div><div class="kpi"><span>RISCHIO</span><strong>${p.risk}</strong></div><div class="kpi"><span>TARGET</span><strong>${p.target}</strong></div><div class="kpi"><span>STOP</span><strong>${p.stop}</strong></div></div><div><strong>Nota:</strong> ${p.note}</div><div class="same-team"><strong>${p.role} ${p.club} già assegnati</strong><br>${same.length?same.map(x=>`${x.p.name} → ${x.manager}`).join('<br>'):'Nessuno'}</div>`;
priceInput.value='';playerDialog.showModal();}
function updatePressure(){const r=state.activeRole, avail=players.filter(p=>p.role===r&&p.tier==='F1'&&!ass(p.id)).length;
const noF1=managers.filter(m=>!state.assignments.some(a=>a.manager===m&&byId(a.playerId).role===r&&byId(a.playerId).tier==='F1')).length;
let level='BASSA';if(avail<=2&&noF1>=5)level='ALTA';else if(avail<=4&&noF1>=4)level='MEDIA';
marketPressure.innerHTML=`<strong>Pressione mercato: ${level}</strong><small>F1 disponibili: ${avail} · Manager senza F1: ${noF1}</small>`;}
managerSelect.innerHTML=managers.map(m=>`<option>${m}</option>`).join('');
assignBtn.onclick=()=>{const price=Number(priceInput.value),manager=managerSelect.value;if(!selectedPlayer||!price||price<1)return alert('Inserisci un prezzo valido.');
const spent=state.assignments.filter(a=>a.manager===manager).reduce((s,a)=>s+a.price,0);if(spent+price>500)return alert('Questa squadra supererebbe i 500 crediti.');
state.assignments.push({playerId:selectedPlayer.id,price,manager,ts:Date.now()});save();playerDialog.close();render();};
undoBtn.onclick=()=>{if(!state.assignments.length)return alert('Nessuna assegnazione da annullare.');const a=state.assignments.at(-1),p=byId(a.playerId);
if(confirm(`Annullare ${p.name} → ${a.manager} a ${a.price}?`)){state.assignments.pop();save();render();}};
searchInput.addEventListener('input',render);document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>{state.activeRole=b.dataset.role;save();render();});
render(); if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
