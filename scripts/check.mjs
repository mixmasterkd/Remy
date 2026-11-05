import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {buildPhases} from '../engine.js';
const data=JSON.parse(await readFile(new URL('../schedule.json',import.meta.url),'utf8'));
const seen=new Set();
for(const day of data.days){
 assert.match(day.date,/^\d{4}-\d{2}-\d{2}$/);assert(!seen.has(day.date),'Date en double');seen.add(day.date);
 assert(['confirmed','pending','provisional'].includes(day.status));assert(day.title&&day.summary);
 assert(!(day.rest&&day.workout));assert(!(day.status==='pending'&&day.workout),'Une journée à préciser ne doit pas lancer de séance');
 if(day.workout){const phases=buildPhases(day.workout);assert(phases.length);for(const p of phases){assert(p.label&&p.kind);assert(p.seconds==null||(Number.isFinite(p.seconds)&&p.seconds>0));}if(day.effortMinutes)assert.equal(phases.filter(p=>p.kind==='effort').reduce((n,p)=>n+p.seconds,0),day.effortMinutes*60);}
}
assert.equal(data.days.length,15);assert.equal(data.days[0].date,'2026-11-07');assert.equal(data.days.at(-1).date,'2026-11-21');
console.log(`Calendrier valide : ${data.days.length} jours, ${data.days.filter(d=>d.workout).length} séances chronométrables.`);
