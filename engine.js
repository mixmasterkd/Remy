// Pure state machine: elapsed time comes from timestamps, never callback counts.
const phase = (label, kind, seconds = null, extra = {}) => ({ label, kind, seconds, ...extra });
export function buildPhases(workout) {
  if (!workout) return [];
  if (workout.type === 'race') return [phase('Oxford Cup', 'race')];
  if (['jog','easy-strides'].includes(workout.type)) return [
    ...((workout.warmup ?? (workout.type==='easy-strides')) ? [phase('Échauffement','warmup',null,{action:'Commencer les intervalles'})] : []),
    phase('Jog','easy',workout.durationSeconds,{jog:true}),
    phase('Temps supplémentaire','overtime',null,{jog:true})
  ];
  if (workout.type === 'steps') {
    const expand = steps => steps.flatMap(s => s.repeat
      ? Array.from({ length: s.repeat }, (_, i) => expand(s.steps).map(p => ({ ...p, detail: `${i + 1} / ${s.repeat}` }))).flat()
      : [phase(s.label, s.kind, s.seconds, { zone: s.zone })]);
    return [...((workout.warmup ?? workout.steps.some(s=>s.repeat))?[phase('Échauffement','warmup',null,{action:'Commencer les intervalles'})]:[]),...expand(workout.steps)];
  }
  if (workout.type !== 'repeats') throw new Error('Type de séance inconnu');
  const phases = [phase('Échauffement', 'warmup', null, {action:'Commencer les intervalles'})];
  for (let b = 1; b <= workout.blocks; b++) {
    for (let r = 1; r <= workout.reps; r++) {
      const detail = `Bloc ${b} / ${workout.blocks} · répétition ${r} / ${workout.reps}`;
      phases.push(phase('Effort', 'effort', workout.effortSeconds, { detail }));
      if (r < workout.reps) phases.push(phase('Récupération', 'recovery', workout.recoverySeconds, { detail }));
    }
    if (b < workout.blocks) phases.push(phase('Entre les blocs', 'long-recovery', workout.betweenBlocksSeconds, {action:`Commencer le bloc ${b+1}`}));
  }
  phases.push(phase('Retour au calme', 'cooldown'));
  return phases;
}

export class Timer {
  constructor(phases, saved) {
    this.phases = phases;
    this.state = { index:0, phaseMs:0, totalMs:0, started:false, running:false, lastAt:null, done:false,
      strideStart:null, strides:0, stridesCompleted:0, elapsed:phases.map(()=>0), ...saved };
    this.state.elapsed=[...this.state.elapsed];
  }
  get current() { return this.phases[this.state.index]; }
  tick(now = Date.now()) {
    const s = this.state;
    if (!s.running || s.done) return s;
    let delta = Math.max(0, now - s.lastAt);
    s.lastAt = Math.max(s.lastAt, now);
    while (delta > 0 && !s.done) {
      const p = this.current;
      const used = p.seconds == null ? delta : Math.min(delta, Math.max(0, p.seconds * 1000 - s.phaseMs));
      s.phaseMs += used; s.totalMs += used; s.elapsed[s.index] += used; delta -= used;
      if (p.seconds != null && s.phaseMs >= p.seconds * 1000) this.advance();
    }
    if (s.strideStart != null && s.totalMs - s.strideStart >= s.strideDuration * 1000) {
      s.strideStart = null; s.stridesCompleted++;
    }
    return s;
  }
  start(now = Date.now()) { if (!this.state.done && !this.state.running) { this.state.lastAt=now; this.state.running=true; this.state.started=true; } }
  pause(now = Date.now()) { this.tick(now); this.state.running=false; this.state.lastAt=null; }
  advance() {
    if (this.state.index + 1 >= this.phases.length) { this.state.done=true; this.state.running=false; this.state.lastAt=null; }
    else { this.state.index++; this.state.phaseMs=0; }
  }
  next(now = Date.now()) { this.tick(now); if(this.state.started && !this.state.done && this.current.seconds==null) this.advance(); }
  finish(now = Date.now()) {
    this.tick(now);
    if(!this.state.started || this.state.done) return;
    this.state.done=true; this.state.running=false; this.state.lastAt=null; this.state.strideStart=null;
  }
  startStride(workout, now = Date.now()) {
    this.tick(now);
    const s=this.state;
    if(workout.type!=='easy-strides' || !s.running || s.done || s.strideStart!=null || !this.current.jog || this.current.kind==='overtime') return false;
    s.strideStart=s.totalMs; s.strideDuration=workout.strideSeconds; s.strides++; return true;
  }
  remainingMs() { return this.current.seconds==null ? null : Math.max(0,this.current.seconds*1000-this.state.phaseMs); }
  snapshot() { return {...this.state,elapsed:[...this.state.elapsed]}; }
}
export function formatTime(ms, countdown = false) {
  const seconds=Math.max(0,countdown?Math.ceil(ms/1000):Math.floor(ms/1000));
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
export function validSnapshot(saved,phases) {
  return saved && Number.isInteger(saved.index) && saved.index>=0 && saved.index<phases.length
    && ['phaseMs','totalMs','strides','stridesCompleted'].every(k=>Number.isFinite(saved[k])&&saved[k]>=0)
    && Number.isInteger(saved.strides) && Number.isInteger(saved.stridesCompleted) && saved.stridesCompleted<=saved.strides
    && Array.isArray(saved.elapsed) && saved.elapsed.length===phases.length && saved.elapsed.every(n=>Number.isFinite(n)&&n>=0)
    && typeof saved.running==='boolean' && typeof saved.done==='boolean' && typeof saved.started==='boolean'
    && (!saved.running || Number.isFinite(saved.lastAt))
    && (saved.strideStart==null || (Number.isFinite(saved.strideStart)&&saved.strideStart>=0&&saved.strideStart<=saved.totalMs&&Number.isFinite(saved.strideDuration)&&saved.strideDuration>0));
}
