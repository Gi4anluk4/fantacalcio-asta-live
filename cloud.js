import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyClMJsr-dz1d4QS5Hn2dea5poaTWBZJqCU",authDomain:"fantacalcio-asta-live-5ccfb.firebaseapp.com",databaseURL:"https://fantacalcio-asta-live-5ccfb-default-rtdb.europe-west1.firebasedatabase.app",projectId:"fantacalcio-asta-live-5ccfb",storageBucket:"fantacalcio-asta-live-5ccfb.firebasestorage.app",messagingSenderId:"954983410799",appId:"1:954983410799:web:a3df7f79696e91e355319a"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
let authReady=false, applying=false, stateRef=null, unsub=null, current=null;
const $=id=>document.getElementById(id);
const status=(txt,cls='')=>{const e=$('cloudStatus');if(e){e.textContent=txt;e.className='cloudPill '+cls}const i=$('syncInfo');if(i)i.textContent=txt};
const norm=s=>String(s||'').trim().toLocaleLowerCase('it-IT').replace(/\s+/g,' ');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function digest(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function roomIdFor(name){return (await digest('asta-live-room-v2|'+norm(name))).slice(0,40)}
async function adminProof(roomId,password){return digest('asta-live-admin-v2|'+roomId+'|'+password)}
function saved(){try{return JSON.parse(localStorage.getItem('astaLiveLeaguesV2')||'[]')}catch{return[]}}
function remember(name,roomId){let a=saved().filter(x=>x.roomId!==roomId);a.unshift({name,roomId,last:Date.now()});localStorage.setItem('astaLiveLeaguesV2',JSON.stringify(a.slice(0,8)));renderSaved()}
function renderSaved(){const box=$('savedLeagues');if(!box)return;const a=saved();box.innerHTML=a.length?'<b>Aste usate su questo dispositivo</b>'+a.map(x=>`<div class="savedLeague"><span>${escapeHtml(x.name)}</span><button data-room="${x.roomId}" data-name="${escapeHtml(x.name)}">APRI</button></div>`).join(''):'<span class="muted">Nessuna asta salvata su questo dispositivo.</span>';box.querySelectorAll('button').forEach(b=>b.onclick=()=>connectKnown(b.dataset.name,b.dataset.room))}
function showGate(msg=''){ $('leagueGate').hidden=false;$('leagueGateMsg').textContent=msg;$('leagueBadge').hidden=true;$('leaveLeagueBtn').hidden=true; }
function hideGate(name){$('leagueGate').hidden=true;$('leagueBadge').textContent='🏆 '+name;$('leagueBadge').hidden=false;$('leaveLeagueBtn').hidden=false}
async function grantEditor(roomId,proof){const u=auth.currentUser;if(!u)throw new Error('auth-not-ready');await set(ref(db,`roomAccess/${roomId}/${u.uid}`),{role:'editor',joinedAt:Date.now(),proof})}
async function connectKnown(name,roomId){if(!authReady)return showGate('Firebase si sta collegando… riprova tra un secondo.');if(unsub){unsub();unsub=null}current={name,roomId,role:'editor'};stateRef=ref(db,`rooms/${roomId}/state`);status('☁️ Collegamento…','warn');try{const snap=await get(stateRef);if(!snap.exists())return showGate('Asta non trovata oppure questo dispositivo non è più autorizzato. Inserisci nuovamente nome lega e password.');hideGate(name);remember(name,roomId);window.ASTA_CLOUD.ready=true;applying=true;window.dispatchEvent(new CustomEvent('asta-cloud-state',{detail:snap.val()}));applying=false;unsub=onValue(stateRef,s=>{if(!s.exists())return;applying=true;window.dispatchEvent(new CustomEvent('asta-cloud-state',{detail:s.val()}));setTimeout(()=>applying=false,0)});status('☁️ Sincronizzato','ok')}catch(e){console.error(e);showGate('Per entrare di nuovo inserisci nome lega e password.');status('🔐 Accesso richiesto','warn')}}
async function createLeague(name,password){const roomId=await roomIdFor(name),proof=await adminProof(roomId,password),u=auth.currentUser;if(!u)throw new Error('auth-not-ready');
  // Il segreto non è leggibile dai client. Può essere creato una sola volta.
  await set(ref(db,`roomSecrets/${roomId}`),{ownerUid:u.uid,adminHash:proof,createdAt:Date.now()});
  await grantEditor(roomId,proof);
  const initial=window.ASTA_CLOUD.getLocalState?.();if(!initial)throw new Error('app-not-ready');
  await set(ref(db,`rooms/${roomId}`),{meta:{name,createdAt:Date.now(),updatedAt:Date.now()},state:{...initial,_leagueName:name,_createdAt:Date.now(),_cloudUpdated:Date.now()}});
  return roomId;
}
async function joinLeague(name,password){const roomId=await roomIdFor(name),proof=await adminProof(roomId,password);await grantEditor(roomId,proof);return roomId}
async function enter(create){const name=$('leagueNameInput').value.trim(),pass=$('leaguePasswordInput').value;if(name.length<3||pass.length<8)return $('leagueGateMsg').textContent='Usa un nome lega di almeno 3 caratteri e una password di almeno 8 caratteri.';if(!authReady)return $('leagueGateMsg').textContent='Firebase si sta collegando…';$('leagueGateMsg').textContent=create?'Creazione asta…':'Verifica accesso…';try{let roomId;if(create){try{roomId=await createLeague(name,pass)}catch(e){console.error(e);if(String(e?.code||'').includes('permission-denied'))return $('leagueGateMsg').textContent='Questo nome lega è già utilizzato. Se è la tua asta usa ENTRA; altrimenti scegli un nome diverso.';throw e}}else{try{roomId=await joinLeague(name,pass)}catch(e){console.error(e);if(String(e?.code||'').includes('permission-denied'))return $('leagueGateMsg').textContent='Nome lega o password non corretti.';throw e}}
    $('leaguePasswordInput').value='';await connectKnown(name,roomId)
  }catch(e){console.error(e);$('leagueGateMsg').textContent='Firebase non consente ancora questa operazione. Verifica le regole del database.';status('🔒 Regole da aggiornare','warn')}}
window.ASTA_CLOUD={ready:false,getLocalState:null,push:async state=>{if(!stateRef||!window.ASTA_CLOUD.ready||applying)return;try{await set(stateRef,{...state,_leagueName:current?.name||'',_cloudUpdated:Date.now()});if(current?.roomId)await set(ref(db,`rooms/${current.roomId}/meta/updatedAt`),Date.now());status('☁️ Sincronizzato','ok')}catch(e){console.error(e);status('⚠️ Sync fallita','err')}},openGate:()=>showGate(),current:()=>current};
$('joinLeagueBtn').onclick=()=>enter(false);$('createLeagueBtn').onclick=()=>enter(true);$('leaveLeagueBtn').onclick=()=>{window.ASTA_CLOUD.ready=false;current=null;stateRef=null;if(unsub){unsub();unsub=null}showGate()};
renderSaved();status('☁️ Autenticazione…','warn');
signInAnonymously(auth).catch(e=>{console.error(e);status('⚠️ Auth: '+((e&&e.code)||'errore').replace('auth/',''),'err');showGate('Errore autenticazione Firebase.')});
onAuthStateChanged(auth,user=>{if(!user)return;authReady=true;status('☁️ Pronto · scegli asta','warn');showGate()});
