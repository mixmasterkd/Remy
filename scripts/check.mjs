import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {buildPhases} from '../engine.js';
const data=JSON.parse(await readFile(new URL('../schedule.json',import.meta.url),'utf8'));
const seen=new Set();
for(const day of data.days){
 assert.match(day.date,/^\d{4}-\d{2}-\d{2}$/);assert(!seen.has(day.date),'Date en double');seen.add(day.date);
 assert(['confirmed','pending','provisional'].includes(day.status));assert(day.title&&day.summary);
 assert(!(day.rest&&day.workout));assert(!(day.status==='pending'&&day.workout),'Une journée à préciser ne doit pas lancer de séance');
 for(const kind of ['warmup','cooldown']) {
  const range=day[`${kind}RangeSeconds`];
  if(range){assert(Array.isArray(range)&&range.length===2&&range.every(n=>Number.isFinite(n)&&n>=0)&&range[0]<=range[1]);const label=`${range[0]/60}${range[1]===range[0]?'':'–'+range[1]/60} min`;assert.equal(day[`${kind}Recommendation`],label,`Plage et recommandation incohérentes : ${day.date} ${kind}`);}
 }
 if(day.workout?.optionalAfterSeconds!=null){const w=day.workout;assert(w.type==='jog'&&Number.isFinite(w.optionalAfterSeconds)&&w.optionalAfterSeconds>0&&w.optionalAfterSeconds<w.durationSeconds,'La portion facultative doit commencer pendant le jog.');}
 if(day.workout){const phases=buildPhases(day.workout);assert(phases.length);for(const p of phases){assert(p.label&&p.kind);assert(p.seconds==null||(Number.isFinite(p.seconds)&&p.seconds>0));}if(day.effortMinutes)assert.equal(phases.filter(p=>p.kind==='effort').reduce((n,p)=>n+p.seconds,0),day.effortMinutes*60);}
}
assert.equal(data.days.length,17);assert.equal(data.days[0].date,'2026-11-05');assert.equal(data.days.at(-1).date,'2026-11-21');
console.log(`Calendrier valide : ${data.days.length} jours, ${data.days.filter(d=>d.workout).length} séances chronométrables.`);
