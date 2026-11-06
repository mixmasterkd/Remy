import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Timer,buildPhases,formatTime,validSnapshot,plannedDuration} from '../engine.js';
const data=JSON.parse(await readFile(new URL('../schedule.json',import.meta.url),'utf8'));
const day=n=>data.days.find(d=>d.date===`2026-11-${n}`);
test('calendar covers every date from Thursday 5 to race Saturday 21',()=>{
 assert.equal(data.days.length,17);assert.equal(new Date(`${day('07').date}T12:00:00Z`).getUTCDay(),6);
 data.days.forEach((d,i)=>assert.equal(d.date,`2026-11-${String(i+5).padStart(2,'0')}`));
 assert.equal(day('20').status,'confirmed');assert.equal(day('15').rest,true);
 for(const d of data.days.filter(d=>d.status==='pending'))assert.equal(d.workout,undefined);
});
test('Monday: 24 minutes of effort, six 2-minute recoveries, three open steps',()=>{
 const p=buildPhases(day('09').workout);assert.equal(p.filter(p=>p.kind==='effort').reduce((n,p)=>n+p.seconds,0),1440);
 assert.equal(p.filter(p=>p.seconds===120).length,6);assert.equal(p.filter(p=>p.seconds==null).length,3);
 assert.equal(p[8].label,'Entre les blocs');assert.equal(p.at(-1).label,'Retour au calme');
});
test('Wednesday: 20 minutes of effort and nine recoveries',()=>{
 const p=buildPhases(day('11').workout);assert.equal(p.filter(p=>p.kind==='effort').length,10);assert.equal(p.filter(p=>p.seconds===60).length,9);assert.equal(p.filter(p=>p.kind==='effort').reduce((n,p)=>n+p.seconds,0),1200);
});
test('Friday activation has exact zones, five complete cycles and 20-minute total',()=>{
 const p=buildPhases(day('20').workout);assert.equal(p.reduce((n,p)=>n+p.seconds,0),1200);assert.equal(p.filter(p=>p.kind==='stride').length,5);assert.equal(p.filter(p=>p.kind==='recovery').length,5);assert.deepEqual(p.filter(p=>p.zone).map(p=>p.zone),['Z1','Z3',...Array(5).fill('Z4–Z5'),'Z1']);
});
test('timestamp drift: a delayed tick crosses several timed phases exactly',()=>{
 const t=new Timer(buildPhases(day('20').workout));t.start(1000);t.tick(646500);assert.equal(t.state.index,3);assert.equal(t.state.phaseMs,25500);assert.equal(t.state.totalMs,645500);assert.equal(t.remainingMs(),14500);
});
test('open warmup does not silently start prescribed work after an hour',()=>{
 const t=new Timer(buildPhases(day('09').workout));t.start(0);t.tick(3600000);assert.equal(t.state.index,0);assert.equal(t.state.phaseMs,3600000);t.next(3600000);assert.equal(t.current.label,'Effort');assert.equal(t.remainingMs(),180000);
});
test('open inter-block recovery catches extra time without starting block 2',()=>{
 const t=new Timer(buildPhases(day('09').workout));t.start(0);t.next(0);t.tick(1200000);assert.equal(t.current.label,'Entre les blocs');assert.equal(t.state.phaseMs,120000);t.next(1200000);assert.match(t.current.detail,/Bloc 2/);
});
test('pause captures time and excludes paused duration on resume',()=>{
 const t=new Timer(buildPhases(day('20').workout));t.start(100);t.pause(10100);t.tick(1000000);assert.equal(t.state.totalMs,10000);t.start(2000000);t.tick(2005000);assert.equal(t.state.totalMs,15000);
});
test('saved running timer catches up after reload; paused timer stays paused',()=>{
 const p=buildPhases(day('20').workout),t=new Timer(p);t.start(1000);t.tick(11000);const r=new Timer(p,t.snapshot());r.tick(321000);assert.equal(r.state.index,1);assert.equal(r.state.phaseMs,20000);r.pause(321000);const paused=new Timer(p,r.snapshot());paused.tick(9999999);assert.equal(paused.state.totalMs,320000);
});
test('end clamps total and does not accumulate more time',()=>{
 const t=new Timer(buildPhases(day('20').workout));t.start(0);t.tick(9999999);assert.equal(t.state.done,true);assert.equal(t.state.running,false);assert.equal(t.state.totalMs,1200000);t.start(10000000);t.tick(12000000);assert.equal(t.state.totalMs,1200000);
});
test('timed phase cannot be skipped by the manual next action',()=>{
 const t=new Timer(buildPhases(day('20').workout));t.start(0);t.next(10000);assert.equal(t.state.index,0);assert.equal(t.state.phaseMs,10000);
});
test('14 keeps 40 minutes and 20-second strides after a manual warmup; seventh stride allowed',()=>{
 const w=day('14').workout,t=new Timer(buildPhases(w));assert.equal(t.startStride(w,0),false);t.start(0);assert.equal(t.startStride(w,0),false);t.next(0);
 for(let i=0;i<7;i++){assert.equal(t.startStride(w,i*60000),true);assert.equal(t.startStride(w,i*60000+1000),false);t.tick(i*60000+20000);assert.equal(t.state.strideStart,null);}
 assert.equal(t.state.strides,7);assert.equal(t.state.stridesCompleted,7);assert.equal(w.strideCount,6);
 t.tick(2400000);assert.equal(t.current.kind,'overtime');assert.equal(t.state.phaseMs,0);assert.equal(t.state.done,false);
});
test('stride pauses with main timer; resume preserves both clocks',()=>{
 const w=day('07').workout,t=new Timer(buildPhases(w));t.start(0);t.startStride(w,0);t.pause(4000);t.start(100000);t.tick(115000);assert.equal(t.state.strideStart,0);assert.equal(t.state.phaseMs,19000);t.tick(116000);assert.equal(t.state.strideStart,null);assert.equal(t.state.stridesCompleted,1);
});
test('background crossing a jog counts overtime without inventing strides',()=>{
 const w=day('07').workout,t=new Timer(buildPhases(w));t.start(0);t.tick(9999999);assert.equal(t.state.strides,0);assert.equal(t.state.totalMs,9999999);assert.equal(t.state.phaseMs,9999999-2400000);assert.equal(t.current.kind,'overtime');assert.equal(t.state.done,false);
});
test('race uses open elapsed time and explicit finish',()=>{
 const t=new Timer(buildPhases(day('21').workout));t.start(0);t.tick(1500999);assert.equal(t.remainingMs(),null);assert.equal(formatTime(t.state.phaseMs),'25:00');t.next(1500999);assert(t.state.done);
});
test('unstarted manual phases cannot be skipped or marked finished',()=>{
 for(const n of ['09','21']){const t=new Timer(buildPhases(day(n).workout));t.next(1000);assert.equal(t.state.index,0);assert.equal(t.state.done,false);assert.equal(t.state.started,false);}
});
test('duplicate start does not lose elapsed time',()=>{const t=new Timer(buildPhases(day('21').workout));t.start(0);t.start(1000);t.tick(2000);assert.equal(t.state.totalMs,2000);});
test('negative clock jumps never rewind or double count',()=>{
 const t=new Timer(buildPhases(day('21').workout));t.start(10000);t.tick(15000);t.tick(12000);t.tick(16000);assert.equal(t.state.totalMs,6000);
});
test('countdowns round up, elapsed time rounds down',()=>{assert.equal(formatTime(299999,true),'05:00');assert.equal(formatTime(299999),'04:59');assert.equal(formatTime(0,true),'00:00');assert.equal(formatTime(3600000),'60:00');});
test('invalid saved snapshots rejected',()=>{
 const p=buildPhases(day('09').workout),s=new Timer(p).snapshot();assert(validSnapshot(s,p));assert(!validSnapshot({...s,index:999},p));assert(!validSnapshot({...s,phaseMs:-1},p));assert(!validSnapshot({...s,running:true,lastAt:null},p));assert(!validSnapshot(null,p));
});

test('5 and 7 November keep their own durations; 14 alone adds manual warmup',()=>{
 assert.equal(day('05').workout.durationSeconds,1800);assert.equal(day('07').workout.durationSeconds,2400);
 assert.equal(day('07').workout.strideSeconds,20);assert.equal(day('14').workout.strideSeconds,20);
 assert.equal(buildPhases(day('07').workout)[0].kind,'easy');assert.equal(buildPhases(day('14').workout)[0].kind,'warmup');
});
test('every repeat warmup is ascending even if a future recommended duration exists',()=>{
 const t=new Timer(buildPhases({...day('09').workout,warmupSeconds:600}));t.start(0);t.tick(1800000);assert.equal(t.current.kind,'warmup');assert.equal(t.remainingMs(),null);
});
test('jog reaches overtime exactly, stays running, and Stop freezes summary',()=>{
 const t=new Timer(buildPhases(day('05').workout));t.start(1000);t.tick(1801000);assert.equal(t.current.kind,'overtime');assert.equal(t.state.phaseMs,0);assert.equal(t.state.running,true);t.finish(1813500);assert.equal(t.state.done,true);assert.equal(t.state.totalMs,1812500);assert.deepEqual(t.state.elapsed,[1800000,12500]);t.tick(9999999);assert.equal(t.state.totalMs,1812500);
});
test('an in-flight stride completes across the jog boundary; no new stride starts in overtime',()=>{
 const w=day('07').workout,t=new Timer(buildPhases(w));t.start(0);assert(t.startStride(w,2395000));t.tick(2400000);assert.equal(t.current.kind,'overtime');assert.equal(t.state.stridesCompleted,0);t.tick(2415000);assert.equal(t.state.stridesCompleted,1);assert.equal(t.state.phaseMs,15000);assert.equal(t.startStride(w,2415000),false);
});
test('Stop distinguishes started and completed strides',()=>{
 const w=day('07').workout,t=new Timer(buildPhases(w));t.start(0);t.startStride(w,0);t.tick(20000);t.startStride(w,30000);t.finish(35000);assert.equal(t.state.strides,2);assert.equal(t.state.stridesCompleted,1);assert.equal(t.state.strideStart,null);assert.equal(t.state.done,true);assert.equal(t.state.totalMs,35000);
});
test('saved active stride restores both clocks and completes exactly once',()=>{
 const w=day('07').workout,p=buildPhases(w),t=new Timer(p);t.start(0);t.startStride(w,5000);t.tick(10000);const saved=t.snapshot(),r=new Timer(p,saved);r.tick(25000);r.tick(35000);assert.equal(r.state.stridesCompleted,1);assert.equal(saved.stridesCompleted,0);assert.equal(saved.elapsed[0],10000);assert.equal(r.state.elapsed[0],35000);
});
test('summary separates warmup, efforts, recoveries, inter-block break and cooldown',()=>{
 const t=new Timer(buildPhases(day('09').workout));t.start(0);t.next(600000);t.tick(1680000);assert.equal(t.current.kind,'long-recovery');t.next(1800000);t.tick(2880000);assert.equal(t.current.kind,'cooldown');t.finish(3180000);
 const sums={};t.phases.forEach((p,i)=>sums[p.kind]=(sums[p.kind]||0)+t.state.elapsed[i]);assert.deepEqual(sums,{warmup:600000,effort:1440000,recovery:720000,'long-recovery':120000,cooldown:300000});assert.equal(t.state.totalMs,3180000);
});
test('Stop before start does not fabricate a completed session',()=>{const t=new Timer(buildPhases(day('05').workout));t.finish(1000);assert.equal(t.state.done,false);});

test('future repeated sessions get manual warmup; the confirmed activation explicitly keeps its fixed sequence',()=>{
 const stride=buildPhases({type:'easy-strides',durationSeconds:600,strideCount:4,strideSeconds:10});assert.equal(stride[0].kind,'warmup');
 const steps=buildPhases({type:'steps',steps:[{repeat:2,steps:[{label:'Effort',kind:'effort',seconds:60}]}]});assert.equal(steps[0].kind,'warmup');
 assert.equal(buildPhases(day('20').workout)[0].label,'Départ facile');
});

test('16 November keeps exactly three efforts and two recoveries, with open warmup and cooldown',()=>{
 const p=buildPhases(day('16').workout);
 assert.deepEqual(p.map(x=>[x.kind,x.seconds]),[['warmup',null],['effort',120],['recovery',60],['effort',120],['recovery',60],['effort',120],['cooldown',null]]);
 assert.equal(600+p.reduce((n,x)=>n+(x.seconds||0),0)+300,23*60);
 const t=new Timer(p);t.start(0);t.tick(600000);assert.equal(t.current.kind,'warmup');t.next(600000);t.tick(1080000);assert.equal(t.current.kind,'cooldown');assert.equal(t.state.done,false);
});

test('9 November total includes recommended ranges and leaves the block break unknown',()=>{
 assert.deepEqual(plannedDuration(day('09')),{minSeconds:51*60,maxSeconds:61*60,unknownKinds:['long-recovery']});
 assert.equal(day('09').workout.betweenBlocksSeconds,null);
});
test('11 November totals 29 known minutes plus undefined warmup and cooldown',()=>{
 assert.deepEqual(plannedDuration(day('11')),{minSeconds:29*60,maxSeconds:29*60,unknownKinds:['warmup','cooldown']});
});
test('16 November totals 23 recommended minutes including exactly two recoveries',()=>{
 assert.deepEqual(plannedDuration(day('16')),{minSeconds:23*60,maxSeconds:23*60,unknownKinds:[]});
});
