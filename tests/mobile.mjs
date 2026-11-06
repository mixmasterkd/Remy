import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=(process.env.TEST_URL||'http://127.0.0.1:4173/Remy').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const errors=[],contexts=[],sessions=new WeakMap();let count=0;
const pass=s=>{count++;console.log(`✓ ${s}`);};
await mkdir('test-results',{recursive:true});
async function open(day){
 const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});contexts.push(context);
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install({time:new Date('2026-11-05T14:00:00Z')});await p.clock.pauseAt(new Date('2026-11-05T14:00:01Z'));
 await p.goto(`${base}/${day?'#chrono=2026-11-'+day:''}`);await p.locator(day?'#timer-screen':'[data-day]').first().waitFor();return p;
}
async function touchHold(p,id,ms,ending='end'){
 if(!sessions.has(p))sessions.set(p,await p.context().newCDPSession(p));const cdp=sessions.get(p);
 const button=p.locator(id);await button.scrollIntoViewIfNeeded();const b=await button.boundingBox(),point={x:b.x+b.width/2,y:b.y+b.height/2,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await p.clock.runFor(ms);
 if(ending==='outside'){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,x:1,y:1}]});await p.clock.runFor(3500);}
 await cdp.send('Input.dispatchTouchEvent',{type:ending==='cancel'?'touchCancel':'touchEnd',touchPoints:[]});
}
const kind=p=>p.locator('#timer-screen').getAttribute('data-kind');
const clock=p=>p.locator('#time').innerText();
try {
 const calendar=await open();
 const box=await calendar.locator('[data-day="2026-11-09"]').boundingBox();assert(Math.abs(box.width-box.height)<1);assert(box.width>120);
 assert(await calendar.locator('[data-day="2026-11-11"] svg').isVisible());assert.match(await calendar.locator('[data-day="2026-11-05"]').innerText(),/JEU|jeu/);
 const bounds=await calendar.locator('#calendar').boundingBox();assert(bounds.height>915*.85);pass('Galaxy viewport: square large cells, day names, graphs and calendar covering most of the screen');
 for(const day of ['07','14']) {
  assert.equal(await calendar.locator(`[data-day="2026-11-${day}"] svg rect`).count(),1);
  await calendar.locator(`[data-day="2026-11-${day}"]`).click();
  assert.equal(await calendar.locator('#day-detail svg rect').count(),1);
  assert.match(await calendar.locator('#day-detail').innerText(),/6 × 20 s/);
  await calendar.locator('#close-day').click();
 }
 const graphColors=await calendar.locator('[data-day="2026-11-09"] svg rect').evaluateAll(els=>Object.fromEntries(els.map(e=>[e.dataset.kind,getComputedStyle(e).fill])));
 assert.deepEqual(graphColors,{'effort':'rgb(25, 116, 71)','recovery':'rgb(179, 57, 55)','long-recovery':'rgb(148, 213, 242)'});
 assert.equal(await calendar.locator('[data-day="2026-11-11"] svg [data-kind="effort"]').count(),10);
 assert.equal(await calendar.locator('[data-day="2026-11-11"] svg [data-kind="recovery"]').count(),9);
 assert.equal(await calendar.locator('[data-day="2026-11-20"] svg rect').count(),8);
 assert.equal(await calendar.locator('svg [data-kind="stride"]').count(),0);
 await calendar.locator('[data-day="2026-11-20"]').click();
 assert.equal(await calendar.locator('#day-detail svg rect').count(),8);
 assert.match(await calendar.locator('#day-detail').innerText(),/5 accélérations/);
 assert.equal(await calendar.locator('#day-detail svg [data-kind="easy"]').first().evaluate(e=>getComputedStyle(e).fill),'rgb(148, 213, 242)');
 await calendar.locator('#close-day').click();
 pass('calendar and sheet graphs omit strides while keeping descriptions; interval phases use timer colors');
 await calendar.locator('[data-day="2026-11-09"]').click();assert.equal(await calendar.locator('#detail-title').innerText(),'2 × (4 × 3 min / 2 min)');assert.match(await calendar.locator('#day-detail').innerText(),/10–15 min/);assert.match(await calendar.locator('#day-detail').innerText(),/5–10 min/);assert.equal(await calendar.locator('#day-detail svg rect[height="24"]').count(),8);pass('Monday sheet: exact title, recommended ranges and two blocks of four efforts');
 const monday=await open('09');await monday.locator('#play-pause').click();await monday.clock.fastForward(1200000);assert.equal(await kind(monday),'warmup');assert.equal(await clock(monday),'20:00');
 await touchHold(monday,'#next-phase',2999);assert.equal(await kind(monday),'warmup');await touchHold(monday,'#next-phase',1000,'cancel');await monday.clock.runFor(2500);assert.equal(await kind(monday),'warmup');
 await touchHold(monday,'#next-phase',1000,'outside');assert.equal(await kind(monday),'warmup');
 await monday.screenshot({path:'test-results/mobile-warmup.png'});
 await touchHold(monday,'#next-phase',3000);assert.equal(await kind(monday),'effort');assert.equal(await clock(monday),'03:00');assert.equal(await monday.locator('#timer-screen').evaluate(e=>getComputedStyle(e).backgroundColor),graphColors.effort);assert.equal(await monday.locator('#lock').getAttribute('aria-pressed'),'true');pass('ascending warmup never auto-starts; separate 3-second touch hold works while locked, early and cancelled touches do not');
 await monday.clock.fastForward(180000);assert.equal(await kind(monday),'recovery');assert.equal(await monday.locator('#timer-screen').evaluate(e=>getComputedStyle(e).backgroundColor),graphColors.recovery);assert.equal(await clock(monday),'02:00');await monday.clock.fastForward(900000);assert.equal(await kind(monday),'long-recovery');await monday.clock.fastForward(600000);assert.equal(await kind(monday),'long-recovery');assert.match(await monday.locator('#next-label').innerText(),/bloc 2/);
 assert.equal(await monday.locator('#timer-screen').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(148, 213, 242)');
 await touchHold(monday,'#next-phase',3000);assert.equal(await kind(monday),'effort');await monday.clock.fastForward(1080000);assert.equal(await kind(monday),'cooldown');await monday.clock.fastForward(300000);assert.equal(await kind(monday),'cooldown');
 await touchHold(monday,'#lock',3000);await monday.locator('#stop').click();assert.match(await monday.locator('#summary-rows').innerText(),/Efforts\s+24:00/);assert.match(await monday.locator('#summary-rows').innerText(),/Récupérations\s+12:00/);pass('green efforts, red recoveries, open sky-blue block break, gray cooldown and exact effort totals in summary');
 const wed=await open('11');await wed.locator('#play-pause').click();await wed.clock.fastForward(900000);assert.equal(await kind(wed),'warmup');await touchHold(wed,'#next-phase',3000);assert.equal(await clock(wed),'02:00');pass('Wednesday also starts with open ascending warmup and manual interval departure');
 const jog=await open('05');assert.equal(await clock(jog),'30:00');await jog.locator('#play-pause').click();assert.equal(await kind(jog),'easy');await jog.clock.fastForward(1800000);assert.equal(await kind(jog),'overtime');assert.equal(await clock(jog),'00:00');await jog.clock.runFor(12000);assert.equal(await clock(jog),'00:12');await jog.reload();await jog.locator('#timer-screen').waitFor();assert.equal(await kind(jog),'overtime');assert.equal(await clock(jog),'00:12');await touchHold(jog,'#lock',3000);await jog.locator('#stop').click();assert.equal(await kind(jog),'done');assert.match(await jog.locator('#summary-rows').innerText(),/Temps supplémentaire\s+00:15/);pass('30-minute jog enters gray ascending overtime, survives reload, and stops only on Stop with summary');
 const strides=await open('07');await strides.locator('#play-pause').click();await touchHold(strides,'#stride',999);assert.match(await strides.locator('#stride-counter').innerText(),/0\/6/);await touchHold(strides,'#stride',500,'cancel');await strides.clock.runFor(1500);assert.match(await strides.locator('#stride-counter').innerText(),/0\/6/);
 await touchHold(strides,'#stride',1000);assert.equal(await kind(strides),'stride');assert.equal(await strides.locator('#stride-time').innerText(),'00:20');assert.match(await strides.locator('#stride-counter').innerText(),/1\/6/);await strides.clock.runFor(100);const main=await clock(strides);await strides.clock.runFor(5000);assert.notEqual(await clock(strides),main);assert.equal(await strides.locator('#stride-time').innerText(),'00:15');await strides.screenshot({path:'test-results/mobile-stride.png'});pass('one-second touch starts a 20-second secondary timer; main jog keeps counting down and short/cancelled touches do nothing');
 await touchHold(strides,'#lock',3000);await strides.locator('#play-pause').click();const pausedMain=await clock(strides),pausedStride=await strides.locator('#stride-time').innerText();await strides.clock.runFor(30000);assert.equal(await clock(strides),pausedMain);assert.equal(await strides.locator('#stride-time').innerText(),pausedStride);await strides.locator('#play-pause').click();await strides.reload();await strides.locator('#timer-screen').waitFor();assert.equal(await clock(strides),pausedMain);assert.equal(await strides.locator('#stride-time').innerText(),pausedStride);await strides.clock.fastForward(20000);assert.equal(await kind(strides),'easy');pass('pause freezes both clocks; resume and reload restore a running stride without losing or double-counting it');
 for(let i=1;i<7;i++){await touchHold(strides,'#stride',1000);await strides.clock.runFor(20000);}
 assert.match(await strides.locator('#stride-counter').innerText(),/7\/6/);assert.equal(await strides.locator('#stride').isEnabled(),true);assert.equal(await kind(strides),'easy');assert((await strides.locator('#stride-flash').evaluate(e=>e.getAnimations().length))>0);pass('seventh stride is allowed; completion returns to blue with two gentle pulses');
 await touchHold(strides,'#stride',1000);await touchHold(strides,'#lock',3000);await strides.locator('#stop').click();const summary=await strides.locator('#summary-rows').innerText();assert.match(summary,/Strides lancés\s+8 \/ 6/);assert.match(summary,/Strides complétés\s+7/);assert.match(summary,/Strides interrompus\s+1/);await strides.screenshot({path:'test-results/mobile-summary.png'});pass('Stop summary distinguishes eight launched strides, seven completed and one interrupted');
 const boundary=await open('07');await boundary.locator('#play-pause').click();await boundary.clock.fastForward(2395000);await touchHold(boundary,'#stride',1000);await boundary.clock.fastForward(4000);assert.equal(await kind(boundary),'overtime');assert.equal(await clock(boundary),'00:00');assert.equal(await boundary.locator('#stride-time').innerText(),'00:16');await boundary.clock.fastForward(16000);assert.equal(await boundary.locator('#stride-clock').isVisible(),false);assert.equal(await boundary.locator('#stride').isEnabled(),false);pass('jog turns gray at zero even with a stride in flight; that stride finishes independently in overtime');
 assert.deepEqual(errors,[]);pass('no uncaught errors across the new mobile flows');
 console.log(`\n${count} mobile scenarios passed.`);
} finally {await Promise.all(contexts.map(c=>c.close()));await browser.close();}
