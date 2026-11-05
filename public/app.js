import { Timer, buildPhases, formatTime, validSnapshot } from './engine.js';
const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = key => new Date(`${key}T12:00:00`);
const dayFormat = new Intl.DateTimeFormat('fr-CA', { weekday:'long',day:'numeric',month:'long' });
const shortDay = new Intl.DateTimeFormat('fr-CA', {weekday:'short'});
const statusNames = {confirmed:'Confirmé',provisional:'Provisoire',pending:'À préciser'};
const STORE = 'remy.timer.v1';
const DONE_STORE = 'remy.completed.v1';
let completed = {};
try { const stored = JSON.parse(localStorage.getItem(DONE_STORE)); if(stored && typeof stored==='object' && !Array.isArray(stored)) completed=stored; } catch {}
let data, selected, timer, activeDay, locked = false, screenOpen = false, wake = null, wakePending = false;
let audio, hold = null, savedAt = 0, lastPhase = '', storageAvailable = true;
let wakeNote = 'Écran éveillé non garanti', restoreNotice = '';
let wakeEpoch = 0;
function readSaved(key = selected?.date) { try { return JSON.parse(localStorage.getItem(`${STORE}.${key}`)); } catch { return null; } }
function save() {
  if (!timer) return;
  try { localStorage.setItem(`${STORE}.${activeDay.date}`, JSON.stringify({date:activeDay.date, signature:JSON.stringify(activeDay.workout), state:timer.snapshot(), locked})); }
  catch { storageAvailable = false; }
}
function message(text) { $('timer-message').textContent = text; }
function signature(day) { return JSON.stringify(day.workout); }
function markDone(day) {
  if(!day?.workout) return;
  completed[day.date]=!completed[day.date];
  try { localStorage.setItem(DONE_STORE,JSON.stringify(completed)); } catch { storageAvailable=false; }
  renderDays(); renderDetail();
  if(screenOpen) renderTimer();
}
function renderDays() {
  let html = '<span class="calendar-blank" aria-hidden="true"></span>'.repeat(5);
  for (const day of data.days) {
    const done=!!completed[day.date];
    const label = day.workout?.type==='race'?'Course':day.rest?'Repos':day.effortMinutes?`${day.effortMinutes} min`:day.workout?.type==='easy-strides'?'45 min':day.workout?.type==='steps'?'20 min':'À préciser';
    html += `<button type="button" class="day-button ${day.status} ${day.workout?.type === 'race' ? 'race' : ''} ${done?'completed':''}" data-day="${day.date}" aria-pressed="${selected.date === day.date}" aria-label="${escape(dayFormat.format(date(day.date)) + ' : ' + day.title + ', ' + statusNames[day.status] + (day.workout ? done ? ', séance faite' : ', séance à faire' : ''))}"><span class="date-block"><strong>${date(day.date).getDate()}</strong></span><span class="day-short">${escape(label)}</span><span class="day-marker" aria-hidden="true">${done?'✓':day.rest?'—':day.status==='pending'?'·':'●'}</span></button>`;
  }
  $('days').innerHTML = html;
  const count=data.days.filter(d=>d.workout&&completed[d.date]).length;
  $('completion-count').textContent=`${count} / ${data.days.filter(d=>d.workout).length} séances faites`;
}
function outline(day) {
  const w = day.workout;
  if (!w) return '';
  let rows;
  if (w.type === 'repeats') rows = [['Échauffement',w.warmupSeconds == null ? 'À préciser' : formatTime(w.warmupSeconds*1000)], [`${w.blocks > 1 ? w.blocks + ' blocs de ' : ''}${w.reps} × ${w.effortSeconds/60} min`,`${day.effortMinutes} min d’effort`], ['Entre les répétitions',`${w.recoverySeconds/60} min`], ...(w.blocks > 1 ? [['Entre les blocs',w.betweenBlocksSeconds == null ? 'À préciser' : formatTime(w.betweenBlocksSeconds*1000)]] : []), ['Retour au calme',w.cooldownSeconds == null ? 'À préciser' : formatTime(w.cooldownSeconds*1000)]];
  else if (w.type === 'easy-strides') rows = [['Course facile',`${w.durationSeconds/60} min au total`],['Accélérations',`${w.strideCount} × ${w.strideSeconds} s`],['Récupération','Complète, libre']];
  else if (w.type === 'steps') rows = w.steps.map(s=>s.repeat?[`${s.repeat} accélérations`,s.steps.map(p=>formatTime(p.seconds*1000)).join(' / ')]:[`${s.label}${s.zone?' · '+s.zone:''}`,formatTime(s.seconds*1000)]);
  else rows = [['Distance','4,8 à 5 km'],['Départ','Horaire à confirmer']];
  return `<ol class="session-outline">${rows.map(([a,b])=>`<li><span>${escape(a)}</span><strong>${escape(b)}</strong></li>`).join('')}</ol>`;
}
function renderDetail() {
  const d = selected;
  const saved = readSaved();
  const canResume = saved?.date === d.date && saved?.signature === signature(d) && validSnapshot(saved.state,buildPhases(d.workout)) && !saved.state.done;
  $('day-detail').innerHTML = `<div class="detail-top"><span>${escape(dayFormat.format(date(d.date)))}</span><span class="badge ${d.status}">${statusNames[d.status]}</span></div><h2 id="detail-title">${escape(d.title)}</h2><p class="summary">${escape(d.summary)}</p>${d.effortMinutes ? `<div class="metric"><strong>${d.effortMinutes}</strong><span>minutes d’effort<br>hors récupération</span></div>` : ''}${outline(d)}${(d.notes||[]).map(n=>`<p class="detail-note">${escape(n)}</p>`).join('')}${d.workout ? `<button type="button" id="open-timer" class="primary">${canResume ? 'Retrouver ma séance' : 'Ouvrir le chronomètre'} <span aria-hidden="true">↗</span></button><p class="button-caption">${d.status === 'provisional' ? 'Ébauche de l’activation · date à confirmer' : 'Ton téléphone suffit. Départ quand tu es prêt.'}</p>` : `<div class="empty-detail">${d.rest ? 'Pas de chronomètre aujourd’hui.<br>Place à la récupération.' : 'On laisse cette journée ouverte.<br>Eric précisera la séance et sa durée.'}</div>`}`;
  $('open-timer')?.addEventListener('click',()=>{location.hash=`chrono=${d.date}`;});
  if(d.workout) {
    const button=document.createElement('button');button.type='button';button.className=`mark-done ${completed[d.date]?'is-done':''}`;button.id='mark-done';button.setAttribute('aria-pressed',String(!!completed[d.date]));button.textContent=completed[d.date]?'✓ Séance faite · annuler':'○ Marquer la séance faite';button.addEventListener('click',()=>markDone(d));$('day-detail').append(button);
    const note=document.createElement('p');note.className='button-caption';note.textContent=storageAvailable?'Suivi sur ce navigateur seulement.':'Sauvegarde indisponible : ce suivi ne sera pas conservé.';$('day-detail').append(note);
  }
}
function selectDay(key, scroll = false) {
  selected = data.days.find(d=>d.date===key) || data.days[0];
  renderDays(); renderDetail();
  if(scroll && matchMedia('(max-width:600px)').matches) $('day-detail').scrollIntoView({behavior:'instant',block:'start'});
}
function openTimer(day) {
  if (!day?.workout) return;
  if (activeDay?.date !== day.date || !timer) {
    const saved = readSaved(day.date);
    const phases = buildPhases(day.workout);
    const same = saved?.date === day.date && saved?.signature === signature(day) && validSnapshot(saved.state,phases);
    timer = new Timer(phases,same ? saved.state : undefined);
    activeDay = day; locked = same ? !!saved.locked : false;
    restoreNotice = same && saved.state.running ? 'Séance retrouvée : le temps écoulé a été recalculé.' : '';
    timer.tick();
    if (timer.state.done) locked = false;
  }
  screenOpen = true; $('home').inert = true; $('timer-screen').hidden = false; document.body.classList.add('timer-open');
  $('session-title').textContent = day.title;
  $('timer-date').textContent = dayFormat.format(date(day.date));
  $('stride').hidden = day.workout.type !== 'easy-strides';
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
  if(target) selectDay(target.date);
  if(m?.[1] === 'chrono' && target?.workout) openTimer(target);
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
function renderTimer() {
  if(!timer || !screenOpen) return;
  const wasRunning=timer.state.running; timer.tick(); const s=timer.state,p=timer.current;
  if((s.done && locked) || (wasRunning && !s.running)) { setLocked(false); syncWake(); save(); }
  const strideActive=s.strideStart!=null;
  const remaining=strideActive ? Math.max(0,s.strideDuration*1000-(s.totalMs-s.strideStart)) : timer.remainingMs();
  const label=s.done?'Séance terminée':strideActive?'Accélération':p.label;
  const phaseKey=`${s.index}:${strideActive}:${s.done}`;
  if(lastPhase!==phaseKey) { if(lastPhase) beep(); $('phase-announcer').textContent=label; lastPhase=phaseKey; }
  $('timer-screen').dataset.kind=s.done?'done':strideActive?'stride':p.kind;
  $('phase-label').textContent=label; $('phase-zone').textContent=strideActive?'':p.zone||'';
  $('phase-detail').textContent=s.done?'Bien joué, Remy.':strideActive?`Accélération ${s.strides} / ${activeDay.workout.strideCount}`:p.detail||'';
  $('time').textContent=s.done?formatTime(s.totalMs):formatTime(remaining==null?s.phaseMs:remaining,remaining!=null);
  $('time-caption').textContent=s.done?'Temps actif de la séance':remaining==null ? (p.kind==='race'?'Temps de course · arrêt manuel':'Temps écoulé · durée à préciser') : (strideActive?'Secondes incluses dans les 45 min':'Temps restant dans cette étape');
  $('phase-progress').style.width=s.done?'100%':p.seconds==null?'0%':`${Math.min(100,s.phaseMs/(p.seconds*10))}%`;
  const next=timer.phases[s.index+1];
  $('up-next').textContent=s.done?(activeDay.workout.type==='easy-strides'?`${s.strides} / ${activeDay.workout.strideCount} accélérations lancées. Aucune ajoutée automatiquement.`:'La séance est terminée.'):strideActive?'Ensuite : facile, récupération complète.':next?`Ensuite : ${next.label}${next.seconds==null?' · durée à préciser':' · '+formatTime(next.seconds*1000)}`:activeDay.workout.type==='easy-strides'?`${s.strides} / ${activeDay.workout.strideCount} accélérations · lance-les quand tu es prêt.`:'Dernière étape';
  $('session-total').textContent=`Temps actif total · ${formatTime(s.totalMs)}${!s.running&&!s.done?' · en pause':''}`;
  $('play-pause').textContent=s.running?'Pause':s.started?'Reprendre':'Démarrer'; $('play-pause').disabled=s.done||locked;
  $('next-phase').hidden=s.done||p.seconds!=null;
  $('next-phase').textContent=next?'Passer à la suite':'Terminer la séance'; $('next-phase').disabled=locked||!s.started;
  $('stride').disabled=locked||!s.running||s.done||strideActive||s.strides>=activeDay.workout.strideCount||timer.remainingMs()<activeDay.workout.strideSeconds*1000;
  $('stride').textContent=`Accélération · ${activeDay.workout.strideSeconds||10} s`;
  $('reset').disabled=locked; $('close-timer').disabled=locked||s.running; $('fullscreen').disabled=locked;
  $('mark-timer-done').hidden=!s.done; $('mark-timer-done').disabled=locked; $('mark-timer-done').textContent=completed[activeDay.date]?'✓ Séance faite · annuler':'Marquer la séance faite';
  $('device-status').textContent=`${s.running?wakeNote:'Écran éveillé seulement en course'} · Sons non garantis en arrière-plan${!storageAvailable?' · Sauvegarde indisponible':''}`;
  if(Date.now()-savedAt>1000){savedAt=Date.now();save();}
}
function setLocked(value) {
  locked=value; $('timer-screen').classList.toggle('locked',locked); $('lock').setAttribute('aria-pressed',String(locked));
  $('lock-label').textContent=locked?'Commandes verrouillées · maintenir 3 s':'Maintiens 3 s pour verrouiller';
  renderButtons(); save();
}
function renderButtons(){for(const id of ['close-timer','fullscreen','reset','next-phase','play-pause','stride','mark-timer-done']) $(id).disabled=locked;}
function cancelHold(){hold=null;$('lock-progress').style.transform='scaleX(0)';}
function beginHold(input){if(hold)return;hold={input,start:performance.now()};}
function paintHold(){if(!hold)return;const elapsed=performance.now()-hold.start;$('lock-progress').style.transform=`scaleX(${Math.min(1,elapsed/3000)})`;if(elapsed>=3000){cancelHold();setLocked(!locked);message(locked?'Commandes verrouillées.':'Commandes libérées.');renderTimer();}}
$('lock').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();$('lock').setPointerCapture(e.pointerId);beginHold(e.pointerId);});
for(const name of ['pointerup','pointercancel','lostpointercapture']) $('lock').addEventListener(name,cancelHold);
$('lock').addEventListener('pointermove',e=>{const r=$('lock').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)cancelHold();});
$('lock').addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)beginHold('keyboard');}});
$('lock').addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();cancelHold();}});
$('lock').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
$('lock').addEventListener('contextmenu',e=>e.preventDefault());
$('lock').addEventListener('blur',cancelHold);
$('play-pause').addEventListener('click',()=>{if(locked||!timer)return;if(timer.state.running)timer.pause();else{enableAudio();fullscreen();timer.start();setLocked(true);}syncWake();save();renderTimer();});
$('next-phase').addEventListener('click',()=>{if(locked||!timer)return;timer.next();save();renderTimer();});
$('stride').addEventListener('click',()=>{if(locked||!timer)return;if(timer.startStride(activeDay.workout)){beep();save();renderTimer();}});
$('mark-timer-done').addEventListener('click',()=>{if(!locked&&timer?.state.done)markDone(activeDay);});
$('reset').addEventListener('click',()=>{if(locked||!timer)return;if(!confirm('Recommencer cette séance à zéro?'))return;timer=new Timer(buildPhases(activeDay.workout));lastPhase='';save();syncWake();renderTimer();});
$('close-timer').addEventListener('click',()=>{if(closeTimer())location.hash=`jour=${activeDay.date}`;});
$('fullscreen').addEventListener('click',()=>{if(!locked)fullscreen();});
$('days').addEventListener('click',e=>{const button=e.target.closest('[data-day]');if(button){selectDay(button.dataset.day,true);history.replaceState(null,'',`#jour=${button.dataset.day}`);}});
window.addEventListener('hashchange',()=>data&&route());
window.addEventListener('blur',cancelHold);
document.addEventListener('visibilitychange',()=>{cancelHold();if(timer){timer.tick();save();renderTimer();}syncWake();});
window.addEventListener('pagehide',()=>{cancelHold();timer?.tick();save();});
window.addEventListener('pageshow',()=>{timer?.tick();renderTimer();syncWake();});
document.addEventListener('keydown',e=>{if(screenOpen&&e.key==='Escape'&&(locked||timer?.state.running)){e.preventDefault();message('Déverrouille et mets en pause pour revenir au calendrier.');}});
setInterval(()=>{renderTimer();paintHold();},100);
async function offlineSetup(){
  if(!('serviceWorker' in navigator)||!window.isSecureContext){$('offline-status').textContent='Hors ligne non disponible ici';return;}
  let ready=false;
  try{
    const previous=await navigator.serviceWorker.getRegistration();
    if(previous?.active){ready=true;$('offline-status').textContent='Prêt hors ligne';}
    await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;
    $('offline-status').textContent='Prêt hors ligne';
  } catch{if(!ready)$('offline-status').textContent='Hors ligne non préparé';}
}
try {
  const response=await fetch('./schedule.json');if(!response.ok)throw Error();data=await response.json();
  const today=new Date(); const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  selectDay(data.days.find(d=>d.date>=todayKey)?.date||data.days.at(-1).date);route();offlineSetup();
} catch { $('days').innerHTML='<p>Le calendrier n’a pas pu être chargé. Recharge la page avec une connexion réseau.</p>'; $('offline-status').textContent='Chargement interrompu'; }
