import { Timer, buildPhases, formatTime, validSnapshot } from './engine.js';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = key => new Date(`${key}T12:00:00`);
const dayFormat = new Intl.DateTimeFormat('fr-CA', { weekday:'long',day:'numeric',month:'long' });
const statusNames = {confirmed:'Confirmé',provisional:'Provisoire',pending:''};
const STORE = 'remy.timer.v1';
const DONE_STORE = 'remy.completed.v1';
let completed = {};
try { const stored = JSON.parse(localStorage.getItem(DONE_STORE)); if(stored && typeof stored==='object' && !Array.isArray(stored)) completed=stored; } catch {}
let data, selected, timer, activeDay, locked = false, screenOpen = false, wake = null, wakePending = false;
let audio, hold = null, savedAt = 0, lastPhase = '', storageAvailable = true;
let wakeNote = 'Écran éveillé non garanti', restoreNotice = '';
let wakeEpoch = 0;
const APP_BUILD=document.querySelector('meta[name="remy-build"]')?.content;
let registration, pendingVersion='', reloading=false, updateCheck;
function applyPendingUpdate(){
  if(!pendingVersion||pendingVersion===APP_BUILD||!data||screenOpen||document.hidden||reloading)return;
  reloading=true;timer?.tick();save();location.reload();
}
function receiveVersion(event){
  if(event.data?.type!=='REMY_VERSION')return;
  event.ports?.[0]?.postMessage({handled:true});
  if(event.source&&event.source!==navigator.serviceWorker.controller)return;
  if(event.data.version===APP_BUILD){pendingVersion='';return;}
  if(event.data.version!==APP_BUILD){pendingVersion=event.data.version;if(screenOpen)message('Mise à jour prête. Elle s’appliquera au retour à la fiche.');else queueMicrotask(applyPendingUpdate);}
}
function askWorkerVersion(){navigator.serviceWorker.controller?.postMessage({type:'REMY_HELLO'});}
async function checkForUpdates(){
  if(!registration||document.hidden||!navigator.onLine)return;
  if(!updateCheck)updateCheck=registration.update().catch(()=>{}).finally(()=>{updateCheck=null;askWorkerVersion();});
  await updateCheck;
}
if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('message',receiveVersion);
  navigator.serviceWorker.addEventListener('controllerchange',askWorkerVersion);
}
window.addEventListener('online',checkForUpdates);
setInterval(checkForUpdates,60000);
function readSaved(key = selected?.date) { try { return JSON.parse(localStorage.getItem(`${STORE}.${key}`)); } catch { return null; } }
function save() {
  if (!timer) return;
  try { localStorage.setItem(`${STORE}.${activeDay.date}`, JSON.stringify({date:activeDay.date, signature:signature(activeDay), state:timer.snapshot(), locked})); }
  catch { storageAvailable = false; }
}
function message(text) { $('timer-message').textContent = text; }
function signature(day) { return '2:'+JSON.stringify(day.workout); }
function markDone(day) {
  if(!day?.workout) return;
  completed[day.date]=!completed[day.date];
  try { localStorage.setItem(DONE_STORE,JSON.stringify(completed)); } catch { storageAvailable=false; }
  renderDays(); renderDetail();
  if($('day-dialog').open) $('mark-done')?.focus();
  if(screenOpen) renderTimer();
}
function workoutGraph(day,detail=false) {
  const w=day.workout;if(!w||w.type==='race')return '';
  let bars=[];
  if(w.type==='repeats') {
    for(let b=0;b<w.blocks;b++) {
      if(b) bars.push({height:4,width:14,kind:'long-recovery'});
      for(let r=0;r<w.reps;r++) {bars.push({height:24,width:w.effortSeconds/20,kind:'effort'});if(r<w.reps-1)bars.push({height:6,width:w.recoverySeconds/20,kind:'recovery'});}
    }
  } else if(['jog','easy-strides'].includes(w.type)) bars=[{height:10,width:100}];
  else bars=buildPhases(w).filter(p=>p.kind!=='stride').map(p=>({height:p.kind==='effort'?24:7,width:Math.max(3,(p.seconds||0)/20),kind:p.kind}));
  let x=0;const shapes=bars.map(v=>{const rect=`<rect x="${x}" y="${28-v.height}" width="${v.width}" height="${v.height}" rx="1"${v.kind?` data-kind="${escape(v.kind)}"`:''}/>`;x+=v.width+2;return rect;}).join('');
  return `<svg class="workout-graph ${detail?'graph-detail':''}" viewBox="0 0 ${x} 30" preserveAspectRatio="none" aria-hidden="true">${shapes}</svg>`;
}
function renderDays() {
  const offset=(date(data.days[0].date).getDay()+6)%7;
  let html='<span class="calendar-blank" aria-hidden="true"></span>'.repeat(offset);
  const weekday=new Intl.DateTimeFormat('fr-CA',{weekday:'short'});
  for(const day of data.days) {
    const done=!!completed[day.date],w=day.workout,type=w?.type;
    const total=type==='steps'?buildPhases(w).reduce((n,p)=>n+(p.seconds||0),0):null;
    const label=type==='race'?'Oxford Cup':day.rest?'Repos':day.effortMinutes?`${day.effortMinutes} min d’effort`:w?.durationSeconds?`${w.durationSeconds/60} min`:total?`${total/60} min`:'';
    html+=`<button type="button" class="day-button ${day.status} ${type==='race'?'race':''} ${w?'has-workout':''} ${day.rest?'rest':''} ${done?'completed':''}" data-day="${day.date}" aria-haspopup="dialog" aria-label="${escape(dayFormat.format(date(day.date))+' : '+day.title+(w?done?', séance faite':', séance à faire':''))}"><span class="day-top"><span class="day-name">${escape(weekday.format(date(day.date)).replace('.',''))}</span><span class="day-number">${String(date(day.date).getDate()).padStart(2,'0')}</span></span>${workoutGraph(day)}<span class="day-short">${escape(label)}</span>${done?'<span class="day-marker" aria-hidden="true">✓</span>':''}${type==='race'?'<span class="race-flag" aria-hidden="true">⚑</span>':''}</button>`;
  }
  $('days').innerHTML=html;
  const count=data.days.filter(d=>d.workout&&completed[d.date]).length,total=data.days.filter(d=>d.workout).length;
  $('completion-count').textContent=`${count} / ${total} ✓`;
  $('completion-count').setAttribute('aria-label',`${count} séances faites sur ${total}`);
}
function outline(day) {
  const w = day.workout;
  if (!w) return '';
  if(w.type==='repeats' && day.warmupRecommendation) return `<div class="session-plan"><p class="recommendation">Échauffement <strong>${escape(day.warmupRecommendation)}</strong><small>recommandé · chrono libre</small></p><p class="summary">${escape(day.summary)}</p>${workoutGraph(day,true)}<p class="graph-caption">${w.blocks} blocs · ${w.reps} efforts par bloc · ${day.effortMinutes} min d’effort</p><p class="detail-note">Pause libre entre les blocs. Maintiens le bouton 3 s quand tu es prêt à repartir.</p><p class="recommendation">Retour au calme <strong>${escape(day.cooldownRecommendation)}</strong><small>recommandé · chrono libre</small></p></div>`;
  let rows;
  if (w.type === 'repeats') rows = [['Échauffement',w.warmupSeconds == null ? 'Manuel' : formatTime(w.warmupSeconds*1000)], [`${w.blocks > 1 ? w.blocks + ' blocs de ' : ''}${w.reps} × ${w.effortSeconds/60} min`,`${day.effortMinutes} min d’effort`], ['Entre les répétitions',`${w.recoverySeconds/60} min`], ...(w.blocks > 1 ? [['Entre les blocs',w.betweenBlocksSeconds == null ? 'Manuel' : formatTime(w.betweenBlocksSeconds*1000)]] : []), ['Retour au calme',w.cooldownSeconds == null ? 'Manuel' : formatTime(w.cooldownSeconds*1000)]];
  else if (w.type === 'jog') rows = [['Jog',`${w.durationSeconds/60} min`],['Après le compte à rebours','Temps supplémentaire libre']];
  else if (w.type === 'easy-strides') rows = [...(w.warmup?[['Échauffement','Libre · départ manuel']]:[]),['Jog',`${w.durationSeconds/60} min`],['Strides',`${w.strideCount} × ${w.strideSeconds} s`],['Récupération','Complète, libre']];
  else if (w.type === 'steps') rows = w.steps.map(s=>s.repeat?[`${s.repeat} accélérations`,s.steps.map(p=>p.seconds==null?'Manuel':formatTime(p.seconds*1000)).join(' / ')]:[`${s.label}${s.zone?' · '+s.zone:''}`,s.seconds==null?'Manuel':formatTime(s.seconds*1000)]);
  else rows = [['Distance','4,8 à 5 km'],['Départ','Horaire à confirmer']];
  return `${workoutGraph(day,true)}<ol class="session-outline">${rows.map(([a,b])=>`<li><span>${escape(a)}</span><strong>${escape(b)}</strong></li>`).join('')}</ol>`;
}
function renderDetail() {
  const d = selected;
  const saved = readSaved();
  const canResume = saved?.date === d.date && saved?.signature === signature(d) && validSnapshot(saved.state,buildPhases(d.workout)) && !saved.state.done;
  $('day-detail').innerHTML = `<div class="detail-top"><span>${escape(dayFormat.format(date(d.date)))}</span>${statusNames[d.status]?`<span class="badge ${d.status}">${statusNames[d.status]}</span>`:''}</div><h2 id="detail-title">${escape(d.title)}</h2>${d.warmupRecommendation?'':`<p class="summary">${escape(d.summary)}</p>`}${outline(d)}${(d.notes||[]).map(n=>`<p class="detail-note">${escape(n)}</p>`).join('')}${d.workout ? `<button type="button" id="open-timer" class="primary">${canResume ? 'Retrouver ma séance' : 'Ouvrir le chronomètre'} <span aria-hidden="true">↗</span></button>` : ''}`;
  $('open-timer')?.addEventListener('click',()=>{location.hash=`chrono=${d.date}`;});
  if(d.workout) {
    const button=document.createElement('button');button.type='button';button.className=`mark-done ${completed[d.date]?'is-done':''}`;button.id='mark-done';button.setAttribute('aria-pressed',String(!!completed[d.date]));button.textContent=completed[d.date]?'✓ Séance faite · annuler':'○ Marquer la séance faite';button.addEventListener('click',()=>markDone(d));$('day-detail').append(button);
    const note=document.createElement('p');note.className='button-caption';note.textContent=storageAvailable?'Suivi local à ce navigateur, sans synchronisation. Effacer ses données efface le suivi.':'Sauvegarde indisponible : ce suivi ne sera pas conservé.';$('day-detail').append(note);
  }
}
function selectDay(key) {
  selected = data.days.find(d=>d.date===key) || data.days[0];
  renderDays(); renderDetail();
}
function openDay(day) {
  selectDay(day.date);
  if(!$('day-dialog').open) $('day-dialog').showModal();
  document.body.classList.add('detail-open');
}
function closeDay() {
  if($('day-dialog').open) $('day-dialog').close();
  document.body.classList.remove('detail-open');
}
function returnToCalendar() {
  closeDay(); history.replaceState(null,'','#calendar');
  document.querySelector(`[data-day="${selected.date}"]`)?.focus();applyPendingUpdate();
}
function openTimer(day) {
  if (!day?.workout) return;
  closeDay();
  if (activeDay?.date !== day.date || !timer) {
    const saved = readSaved(day.date);
    const phases = buildPhases(day.workout);
    const same = saved?.date === day.date && saved?.signature === signature(day) && validSnapshot(saved.state,phases);
    timer = new Timer(phases,same ? saved.state : undefined);
    activeDay = day; locked = same ? !!saved.locked : false;
    restoreNotice = same && saved.state.running ? 'Séance retrouvée : le temps écoulé a été recalculé.' : saved && !same ? 'Séance mise à jour : le chrono repart du début.' : '';
    timer.tick();
    if (timer.state.done) locked = false;
  }
  screenOpen = true; $('home').inert = true; $('timer-screen').hidden = false; document.body.classList.add('timer-open');
  $('session-title').textContent = day.title;
  $('timer-date').textContent = dayFormat.format(date(day.date));
  message(restoreNotice || 'Les commandes se verrouillent au démarrage. Maintiens 3 s pour les libérer.');
  setLocked(locked); renderTimer(); syncWake();
  (locked ? $('lock') : $('play-pause')).focus();
}
function closeTimer() {
  if (locked || timer?.state.running) { message('Déverrouille et mets en pause pour revenir au calendrier.'); return false; }
  cancelHold(); screenOpen=false; $('home').inert=false; $('timer-screen').hidden=true; document.body.classList.remove('timer-open');
  if (document.fullscreenElement === $('timer-screen')) document.exitFullscreen().catch(()=>{});
  syncWake(); renderDetail(); $('open-timer')?.focus(); return true;
}
function route() {
  const m = location.hash.match(/^#(jour|chrono)=(\d{4}-\d{2}-\d{2})$/);
  const target = m && data.days.find(d=>d.date===m[2]);
  if (screenOpen && (m?.[1] !== 'chrono' || target?.date !== activeDay.date)) {
    if (!closeTimer()) { history.replaceState(null,'',`#chrono=${activeDay.date}`); return; }
  }
  if(target) {
    if(m[1] === 'chrono' && target.workout) {selectDay(target.date);openTimer(target);}
    else openDay(target);
  } else closeDay();
  applyPendingUpdate();
}
async function fullscreen() {
  if (document.fullscreenElement === $('timer-screen')) return;
  try { if (!$('timer-screen').requestFullscreen) throw Error(); await $('timer-screen').requestFullscreen(); }
  catch { message('Mode grand écran actif. Le plein écran du navigateur n’est pas disponible ici.'); }
}
async function syncWake() {
  const epoch = ++wakeEpoch;
  const needed = screenOpen && timer?.state.running && !document.hidden;
  if(!needed) { const old=wake; wake=null; if(old) await old.release().catch(()=>{}); return; }
  if(wake || wakePending) return;
  if(!navigator.wakeLock) { wakeNote='Maintien de l’écran non disponible'; return; }
  wakePending=true;
  try {
    const acquired = await navigator.wakeLock.request('screen');
    if(!screenOpen || !timer?.state.running || document.hidden) { await acquired.release(); return; }
    wake=acquired; wakeNote='Écran maintenu éveillé';
    acquired.addEventListener('release',()=>{if(wake===acquired) {wake=null;wakeNote='Maintien de l’écran interrompu';}});
  } catch { wakeNote='Écran éveillé non garanti'; } finally {
    wakePending=false;
    // Retry only when lifecycle changed during the request, never loop on denial.
    if(epoch!==wakeEpoch && screenOpen && timer?.state.running && !document.hidden && !wake) syncWake();
  }
}
function enableAudio() {
  try { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) { audio ||= new Audio(); audio.resume().catch(()=>{}); } } catch { /* Optional signal only. */ }
}
function beep() {
  if(document.hidden || !audio || audio.state!=='running') return;
  try { const oscillator=audio.createOscillator(), gain=audio.createGain(); oscillator.frequency.value=660; gain.gain.value=.08; oscillator.connect(gain);gain.connect(audio.destination); oscillator.start(); gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22); oscillator.stop(audio.currentTime+.23); } catch {}
}
function renderSummary() {
  const labels={warmup:'Échauffement',easy:'Jog / facile',effort:'Efforts',recovery:'Récupérations', 'long-recovery':'Entre les blocs',cooldown:'Retour au calme',overtime:'Temps supplémentaire',race:'Course',stride:'Accélérations'};
  const totals={};timer.phases.forEach((p,i)=>{totals[p.kind]=(totals[p.kind]||0)+timer.state.elapsed[i];});
  let rows=Object.entries(totals).filter(([,ms])=>ms>0).map(([kind,ms])=>`<div><dt>${labels[kind]||kind}</dt><dd>${formatTime(ms)}</dd></div>`).join('');
  if(activeDay.workout.type==='easy-strides') rows+=`<div><dt>Strides lancés</dt><dd>${timer.state.strides} / ${activeDay.workout.strideCount}</dd></div><div><dt>Strides complétés</dt><dd>${timer.state.stridesCompleted}</dd></div>${timer.state.strides>timer.state.stridesCompleted?`<div><dt>Strides interrompus</dt><dd>${timer.state.strides-timer.state.stridesCompleted}</dd></div>`:''}`;
  $('summary-rows').innerHTML=rows;
}
function renderTimer() {
  if(!timer||!screenOpen)return;
  const wasRunning=timer.state.running,completedBefore=timer.state.stridesCompleted;timer.tick();const s=timer.state,p=timer.current;
  if((s.done&&locked)||(wasRunning&&!s.running)){setLocked(false);syncWake();save();}
  if(s.stridesCompleted>completedBefore&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches)
    $('stride-flash').animate([{opacity:0},{opacity:.14},{opacity:0}],{duration:1000,iterations:2});
  const strideActive=s.strideStart!=null,remaining=timer.remainingMs();
  const label=s.done?'Résumé':p.label,phaseKey=`${s.index}:${strideActive}:${s.done}`;
  if(lastPhase!==phaseKey){if(lastPhase)beep();$('phase-announcer').textContent=label;lastPhase=phaseKey;}
  $('timer-screen').dataset.kind=s.done?'done':p.kind==='overtime'?'overtime':strideActive?'stride':p.kind;
  $('phase-label').textContent=label;$('phase-zone').textContent=p.zone||'';
  $('phase-detail').textContent=s.done?'Séance arrêtée':p.kind==='warmup'&&activeDay.warmupRecommendation?`${activeDay.warmupRecommendation} recommandées`:p.kind==='cooldown'&&activeDay.cooldownRecommendation?`${activeDay.cooldownRecommendation} recommandées`:p.detail||'';
  $('time').textContent=s.done?formatTime(s.totalMs):formatTime(remaining==null?s.phaseMs:remaining,remaining!=null);
  $('time-caption').textContent=s.done?'Temps actif total':p.kind==='overtime'?'Après le temps prévu · Stop quand tu as terminé':remaining==null?'Temps écoulé · arrêt manuel':'Temps restant';
  $('phase-progress').style.width=s.done?'100%':p.seconds==null?'0%':`${Math.min(100,s.phaseMs/(p.seconds*10))}%`;
  const next=timer.phases[s.index+1];
  $('up-next').textContent=s.done?'':p.action?'Départ à ton choix · aucun changement automatique':p.kind==='overtime'?'Le chrono continue jusqu’à Stop.':next?`Ensuite : ${next.label}${next.seconds==null?' · libre':' · '+formatTime(next.seconds*1000)}`:'';
  $('session-total').textContent=s.done?'':`Temps actif total · ${formatTime(s.totalMs)}${!s.running?' · en pause':''}`;
  $('play-pause').textContent=s.running?'Pause':s.started?'Reprendre':'Démarrer';$('play-pause').disabled=s.done||locked;$('play-pause').hidden=s.done;
  $('next-phase').hidden=s.done||!p.action||p.seconds!=null;
  $('next-label').textContent=p.action||'Commencer les intervalles';$('next-phase').disabled=!s.running||s.done;
  const strides=activeDay.workout.type==='easy-strides';
  $('stride-area').hidden=!strides||s.done||!p.jog;
  $('stride-counter').textContent=`Strides effectués ${s.strides}/${activeDay.workout.strideCount}`;
  $('stride-caption').textContent='Compteur de déclenchements';
  $('stride-clock').hidden=!strideActive;
  $('stride-time').textContent=strideActive?formatTime(s.strideDuration*1000-(s.totalMs-s.strideStart),true):'00:00';
  $('stride-label').textContent=`Stride · ${activeDay.workout.strideSeconds||10} s`;
  $('stride').disabled=!s.running||s.done||strideActive||p.kind==='overtime';
  $('stop').hidden=s.done||!s.started;$('stop').disabled=locked;
  $('reset').disabled=locked;$('close-timer').disabled=locked||s.running;$('fullscreen').disabled=locked;
  $('mark-timer-done').hidden=!s.done;$('mark-timer-done').disabled=locked;$('mark-timer-done').textContent=completed[activeDay.date]?'✓ Séance faite · annuler':'Marquer la séance faite';
  $('session-summary').hidden=!s.done;if(s.done)renderSummary();
  $('lock').hidden=s.done;
  $('device-status').textContent=`${s.running?wakeNote:'Écran éveillé seulement en course'} · Sons non garantis en arrière-plan${!storageAvailable?' · Sauvegarde indisponible':''}`;
  if(Date.now()-savedAt>1000){savedAt=Date.now();save();}
}
function setLocked(value) {
  locked=value;$('timer-screen').classList.toggle('locked',locked);$('lock').setAttribute('aria-pressed',String(locked));
  $('lock-label').textContent=locked?'Commandes verrouillées · maintenir 3 s':'Maintiens 3 s pour verrouiller';
  for(const id of ['close-timer','fullscreen','reset','play-pause','stop','mark-timer-done'])$(id).disabled=locked;
  save();
}
function cancelHold(){if(hold)hold.button.style.setProperty('--hold','0');hold=null;}
function paintHold(){
  if(!hold)return;
  if(hold.button.disabled||document.hidden){cancelHold();return;}
  const elapsed=performance.now()-hold.start;hold.button.style.setProperty('--hold',Math.min(1,elapsed/hold.duration));
  if(elapsed>=hold.duration){const action=hold.action;cancelHold();action();}
}
function bindHold(id,duration,action){
  const button=$(id);
  const begin=input=>{if(hold||button.disabled)return;hold={button,input,start:performance.now(),duration,action};};
  button.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false||hold||button.disabled)return;e.preventDefault();button.setPointerCapture(e.pointerId);begin(e.pointerId);});
  button.addEventListener('pointerup',e=>{if(hold?.button===button&&hold.input===e.pointerId){paintHold();cancelHold();}});
  for(const event of ['pointercancel','lostpointercapture','blur'])button.addEventListener(event,()=>{if(hold?.button===button)cancelHold();});
  button.addEventListener('pointermove',e=>{const r=button.getBoundingClientRect();if(hold?.button===button&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))cancelHold();});
  button.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)begin('keyboard');}});
  button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(hold?.button===button){paintHold();cancelHold();}}});
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});button.addEventListener('contextmenu',e=>e.preventDefault());
}
bindHold('lock',3000,()=>{setLocked(!locked);message(locked?'Commandes verrouillées.':'Commandes libérées.');renderTimer();});
bindHold('next-phase',3000,()=>{if(timer?.state.running&&timer.current.action&&timer.current.seconds==null){timer.next();save();renderTimer();}});
bindHold('stride',1000,()=>{if(timer?.startStride(activeDay.workout)){beep();save();renderTimer();}});
$('play-pause').addEventListener('click',()=>{if(locked||!timer)return;if(timer.state.running)timer.pause();else{enableAudio();fullscreen();timer.start();setLocked(true);}syncWake();save();renderTimer();});
$('stop').addEventListener('click',()=>{if(locked||!timer)return;cancelHold();timer.finish();setLocked(false);syncWake();save();renderTimer();});
$('mark-timer-done').addEventListener('click',()=>{if(!locked&&timer?.state.done)markDone(activeDay);});
$('reset').addEventListener('click',()=>{if(locked||!timer)return;if(!confirm('Recommencer cette séance à zéro?'))return;timer=new Timer(buildPhases(activeDay.workout));lastPhase='';cancelHold();save();syncWake();renderTimer();});
$('close-timer').addEventListener('click',()=>{if(closeTimer())location.hash=`jour=${activeDay.date}`;});
$('fullscreen').addEventListener('click',()=>{if(!locked)fullscreen();});
$('days').addEventListener('click',e=>{const button=e.target.closest('[data-day]');if(button){const day=data.days.find(d=>d.date===button.dataset.day);history.pushState(null,'',`#jour=${day.date}`);openDay(day);}});
$('close-day').addEventListener('click',returnToCalendar);
$('day-dialog').addEventListener('cancel',e=>{e.preventDefault();returnToCalendar();});
$('day-dialog').addEventListener('click',e=>{if(e.target===$('day-dialog')){const r=$('day-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)returnToCalendar();}});
window.addEventListener('hashchange',()=>data&&route());
window.addEventListener('blur',cancelHold);
document.addEventListener('visibilitychange',()=>{cancelHold();if(timer){timer.tick();save();renderTimer();}syncWake();if(!document.hidden){checkForUpdates();applyPendingUpdate();}});
window.addEventListener('pagehide',()=>{cancelHold();timer?.tick();save();});
window.addEventListener('pageshow',()=>{timer?.tick();renderTimer();syncWake();checkForUpdates();applyPendingUpdate();});
document.addEventListener('keydown',e=>{if(screenOpen&&e.key==='Escape'&&(locked||timer?.state.running)){e.preventDefault();message('Déverrouille et mets en pause pour revenir au calendrier.');}});
setInterval(()=>{renderTimer();paintHold();},100);
async function offlineSetup(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext){$('offline-status').textContent='Hors ligne non disponible ici';return;}
  const readyText=()=>`Prêt hors ligne · version ${data.revision}`;
  let ready=false;
  try{
    const previous=await navigator.serviceWorker.getRegistration();
    if(previous?.active){ready=true;$('offline-status').textContent=readyText();}
    registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
    await navigator.serviceWorker.ready;
    $('offline-status').textContent=readyText();askWorkerVersion();checkForUpdates();
  } catch{if(!ready)$('offline-status').textContent='Hors ligne non préparé';}
}

try {
  const response=await fetch('./schedule.json');if(!response.ok)throw Error();data=await response.json();
  const today=new Date(); const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  selectDay(data.days.find(d=>d.date>=todayKey)?.date||data.days.at(-1).date);route();offlineSetup();
} catch { $('days').innerHTML='<p>Le calendrier n’a pas pu être chargé. Recharge la page avec une connexion réseau.</p>'; $('offline-status').textContent='Chargement interrompu'; }
