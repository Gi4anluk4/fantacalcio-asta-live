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
const SESSION_KEY='astaLiveCurrentLeagueV1';
function currentSaved(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
function saveCurrent(name,roomId){localStorage.setItem(SESSION_KEY,JSON.stringify({name,roomId,last:Date.now()}))}
function clearCurrent(){localStorage.removeItem(SESSION_KEY)}
function remember(name,roomId){let a=saved().filter(x=>x.roomId!==roomId);a.unshift({name,roomId,last:Date.now()});localStorage.setItem('astaLiveLeaguesV2',JSON.stringify(a.slice(0,8)));saveCurrent(name,roomId);renderSaved()}
function renderSaved(){const box=$('savedLeagues');if(!box)return;const a=saved();box.innerHTML=a.length?'<b>Aste usate su questo dispositivo</b><small class="savedHint">Le aste già autorizzate si aprono senza reinserire la password.</small>'+a.map(x=>`<div class="savedLeague"><span>${escapeHtml(x.name)}</span><button data-room="${x.roomId}" data-name="${escapeHtml(x.name)}">APRI</button></div>`).join(''):'<span class="muted">Nessuna asta salvata su questo dispositivo.</span>';box.querySelectorAll('button').forEach(b=>b.onclick=()=>connectKnown(b.dataset.name,b.dataset.room))}
function showGate(msg=''){ $('leagueGate').hidden=false;$('leagueGateMsg').textContent=msg;$('leagueBadge').hidden=true;$('leaveLeagueBtn').hidden=true; }
function hideGate(name){$('leagueGate').hidden=true;$('leagueBadge').textContent='🏆 '+name;$('leagueBadge').hidden=false;$('leaveLeagueBtn').hidden=false}
async function grantEditor(roomId,proof){const u=auth.currentUser;if(!u)throw new Error('auth-not-ready');await set(ref(db,`roomAccess/${roomId}/${u.uid}`),{role:'editor',joinedAt:Date.now(),proof})}
async function connectKnown(name,roomId,{silent=false}={}){if(!authReady)return showGate('Firebase si sta collegando… riprova tra un secondo.');if(unsub){unsub();unsub=null}current={name,roomId,role:'editor'};stateRef=ref(db,`rooms/${roomId}/state`);status('☁️ Collegamento…','warn');try{const snap=await get(stateRef);if(!snap.exists()){clearCurrent();return showGate('Asta non trovata oppure questo dispositivo non è più autorizzato. Inserisci nuovamente nome lega e password.')}hideGate(name);remember(name,roomId);
    // Lo stato Firebase della lega è sempre autorevole. Lo salviamo localmente PRIMA di abilitare qualsiasi push.
    const remote=snap.val();
    applying=true;
    window.dispatchEvent(new CustomEvent('asta-cloud-state',{detail:remote}));
    applying=false;
    window.ASTA_CLOUD.ready=true;
    unsub=onValue(stateRef,s=>{if(!s.exists())return;const next=s.val();applying=true;window.dispatchEvent(new CustomEvent('asta-cloud-state',{detail:next}));setTimeout(()=>applying=false,0)});
    status('☁️ Sincronizzato','ok')}catch(e){console.error(e);clearCurrent();showGate(silent?'Sessione scaduta. Apri l’asta oppure inserisci nuovamente la password.':'Per entrare di nuovo inserisci nome lega e password.');status('🔐 Accesso richiesto','warn')}}
function cleanAuctionState(){
  // Una NUOVA asta deve sempre partire pulita: mai ereditare rose, nomi o crediti dal localStorage del dispositivo.
  return {assignments:[],managers:['IO','Team 2','Team 3','Team 4','Team 5','Team 6','Team 7','Team 8','Team 9','Team 10'],notes:{}};
}
function errCode(e){return String(e?.code||e?.message||e||'errore').replace('PERMISSION_DENIED: ','').replace('auth/','')}
function gateDiag(step,msg,ok=false){
  const el=$('leagueGateMsg'); if(!el)return;
  el.innerHTML=`<b>${escapeHtml(step)}</b> — ${escapeHtml(msg)}`;
  el.className=ok?'gateMsg ok':'gateMsg';
}
async function createLeague(name,password){
  const roomId=await roomIdFor(name),proof=await adminProof(roomId,password),u=auth.currentUser;
  if(!u)throw {stage:'AUTH',code:'auth-not-ready'};
  const secretRef=ref(db,`roomSecrets/${roomId}`);
  gateDiag('STEP 1/4','Creo/verifico la lega…');
  try{
    await set(secretRef,{ownerUid:u.uid,adminHash:proof,createdAt:Date.now()});
    gateDiag('STEP 1/4','Segreto lega creato ✓',true);
  }catch(e){
    if(!String(e?.code||'').includes('permission-denied'))throw {stage:'STEP 1 roomSecrets',code:errCode(e),raw:e};
    // Può essere una lega già esistente oppure un tentativo precedente parziale.
    gateDiag('STEP 1/4','Lega già esistente o scrittura iniziale negata: provo l’accesso…');
  }
  gateDiag('STEP 2/4','Autorizzo questo dispositivo…');
  try{await grantEditor(roomId,proof)}catch(e){throw {stage:'STEP 2 roomAccess',code:errCode(e),raw:e}}
  gateDiag('STEP 2/4','Dispositivo autorizzato ✓',true);
  const roomRef=ref(db,`rooms/${roomId}`);
  gateDiag('STEP 3/4','Controllo lo stato dell’asta…');
  let existing;
  try{existing=await get(roomRef)}catch(e){throw {stage:'STEP 3 rooms/read',code:errCode(e),raw:e}}
  if(!existing.exists()){
    gateDiag('STEP 4/4','Creo lo stato iniziale dell’asta…');
    const initial=cleanAuctionState(),now=Date.now();
    try{await set(roomRef,{meta:{name,createdAt:now,updatedAt:now},state:{...initial,_leagueName:name,_createdAt:now,_cloudUpdated:now}})}catch(e){throw {stage:'STEP 4 rooms/write',code:errCode(e),raw:e}}
  }
  gateDiag('STEP 4/4','Asta pronta ✓',true);
  return roomId;
}
async function joinLeague(name,password){
  const roomId=await roomIdFor(name),proof=await adminProof(roomId,password);
  gateDiag('ACCESSO 1/2','Verifico password e autorizzo il dispositivo…');
  try{await grantEditor(roomId,proof)}catch(e){throw {stage:'ACCESSO roomAccess',code:errCode(e),raw:e}}
  gateDiag('ACCESSO 2/2','Accesso autorizzato ✓',true);
  return roomId;
}
async function enter(create){
  const name=$('leagueNameInput').value.trim(),pass=$('leaguePasswordInput').value;
  if(name.length<3||pass.length<8)return gateDiag('DATI','Usa un nome lega di almeno 3 caratteri e una password di almeno 8 caratteri.');
  if(!authReady)return gateDiag('FIREBASE','Firebase si sta collegando…');
  gateDiag(create?'CREAZIONE':'ACCESSO',create?'Avvio creazione asta…':'Verifico accesso…');
  try{
    const roomId=create?await createLeague(name,pass):await joinLeague(name,pass);
    $('leaguePasswordInput').value='';
    await connectKnown(name,roomId);
  }catch(e){
    console.error('ASTA CLOUD',e.stage,e.code,e.raw||e);
    const code=errCode(e.code||e);
    if(e.stage==='STEP 2 roomAccess' || e.stage==='ACCESSO roomAccess'){
      gateDiag(e.stage,`Firebase ha negato l’autorizzazione (${code}). Se la lega esiste, può indicare password errata oppure una regola roomAccess da correggere.`);
    }else{
      gateDiag(e.stage||'ERRORE',`Firebase ha rifiutato questo passaggio (${code}).`);
    }
    status('⚠️ Accesso non riuscito','warn');
  }
}
window.ASTA_CLOUD={ready:false,getLocalState:window.ASTA_GET_LOCAL_STATE||null,push:async state=>{if(!stateRef||!window.ASTA_CLOUD.ready||applying)return;try{const shared={assignments:Array.isArray(state?.assignments)?state.assignments:[],managers:Array.isArray(state?.managers)&&state.managers.length===10?state.managers:['IO','Team 2','Team 3','Team 4','Team 5','Team 6','Team 7','Team 8','Team 9','Team 10'],notes:state?.notes&&typeof state.notes==='object'?state.notes:{}};await set(stateRef,{...shared,_leagueName:current?.name||'',_cloudUpdated:Date.now()});if(current?.roomId)await set(ref(db,`rooms/${current.roomId}/meta/updatedAt`),Date.now());status('☁️ Sincronizzato','ok')}catch(e){console.error(e);status('⚠️ Sync fallita','err')}},openGate:()=>showGate(),current:()=>current,reconnect:async()=>{const c=current||currentSaved();if(c?.name&&c?.roomId)await connectKnown(c.name,c.roomId,{silent:true})}};
window.dispatchEvent(new Event('asta-cloud-ready'));
$('joinLeagueBtn').onclick=()=>enter(false);
$('createLeagueBtn').onclick=()=>enter(true);
$('leaveLeagueBtn').onclick=()=>{window.ASTA_CLOUD.ready=false;current=null;stateRef=null;clearCurrent();if(unsub){unsub();unsub=null}showGate('Scegli un’altra asta oppure accedi a una nuova lega.')};
renderSaved();status('☁️ Autenticazione…','warn');
signInAnonymously(auth).catch(e=>{console.error(e);status('⚠️ Auth: '+((e&&e.code)||'errore').replace('auth/',''),'err');showGate('Errore autenticazione Firebase.')});
onAuthStateChanged(auth,async user=>{if(!user)return;authReady=true;const c=currentSaved();if(c?.name&&c?.roomId){status('☁️ Riapro '+c.name+'…','warn');await connectKnown(c.name,c.roomId,{silent:true})}else{status('☁️ Pronto · scegli asta','warn');showGate()}});

// Se Android sospende Chrome/PWA e poi la riattiva, verifica subito la stanza corrente.
let lastResume=0;
async function resumeCurrent(){if(document.hidden||!authReady)return;const now=Date.now();if(now-lastResume<2500)return;lastResume=now;const c=current||currentSaved();if(c?.name&&c?.roomId){try{await connectKnown(c.name,c.roomId,{silent:true})}catch(e){console.error(e)}}}
document.addEventListener('visibilitychange',resumeCurrent);
window.addEventListener('pageshow',resumeCurrent);
window.addEventListener('online',resumeCurrent);
