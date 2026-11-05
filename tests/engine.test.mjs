import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Timer,buildPhases,formatTime,validSnapshot} from '../public/engine.js';
const data=JSON.parse(await readFile(new URL('../public/schedule.json',import.meta.url),'utf8'));
const day=n=>data.days.find(d=>d.date===`2026-11-${n}`);
test('calendar covers every date from Saturday 7 to race Saturday 21',()=>{
 assert.equal(data.days.length,15);assert.equal(new Date(`${day('07').date}T12:00:00Z`).getUTCDay(),6);
 data.days.forEach((d,i)=>assert.equal(d.date,`2026-11-${String(i+7).padStart(2,'0')}`));
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
test('45 minutes includes six user-triggered strides; complete recovery stays free',()=>{
 const w=day('14').workout,t=new Timer(buildPhases(w));assert.equal(t.startStride(w,0),false);t.start(0);
 for(let i=0;i<6;i++){assert.equal(t.startStride(w,i*60000),true);assert.equal(t.startStride(w,i*60000+1000),false);t.tick(i*60000+10000);assert.equal(t.state.strideStart,null);}
 assert.equal(t.startStride(w,400000),false);assert.equal(t.state.strides,6);t.tick(2700000);assert.equal(t.state.totalMs,2700000);assert(t.state.done);
});
test('stride pauses with main timer and cannot overrun remaining session',()=>{
 const w=day('14').workout,t=new Timer(buildPhases(w));t.start(0);t.startStride(w,0);t.pause(4000);t.start(100000);t.tick(105000);assert.equal(t.state.strideStart,0);t.tick(106000);assert.equal(t.state.strideStart,null);t.tick(2795000);assert.equal(t.startStride(w,2795000),false);
});
test('background crossing full easy session does not invent missing strides',()=>{
 const w=day('14').workout,t=new Timer(buildPhases(w));t.start(0);t.tick(9999999);assert.equal(t.state.strides,0);assert.equal(t.state.totalMs,2700000);
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
