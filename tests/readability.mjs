import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=(process.env.TEST_URL||'http://127.0.0.1:4173/Remy').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
await mkdir('test-results',{recursive:true});
const errors=[];let count=0;
const pass=s=>{count++;console.log('✓ '+s);};
async function fits(p,selector){
 const measurements=await p.locator(selector).evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{
  const box=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect();
  return {id:e.id||e.className,width:e.clientWidth,scroll:e.scrollWidth,left:box.left,right:box.right,textLeft:text.left,textRight:text.right,font:parseFloat(getComputedStyle(e).fontSize),weight:getComputedStyle(e).fontWeight};
 }));
 for(const m of measurements){assert(m.scroll<=m.width+1,`${selector}: overflow ${JSON.stringify(m)}`);assert(m.left>=-1&&m.right<=p.viewportSize().width+1,`${selector}: outside screen ${JSON.stringify(m)}`);}
 return measurements;
}
async function hold(p,id,ms=3100){await p.locator(id).scrollIntoViewIfNeeded();const b=await p.locator(id).boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.clock.runFor(ms);await p.mouse.up();}
try {
 for(const viewport of [{width:320,height:568},{width:360,height:640},{width:412,height:915},{width:800,height:360}]){
  const c=await browser.newContext({viewport,isMobile:true,hasTouch:true});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.clock.install({time:new Date('2026-11-09T16:00:00Z')});await p.clock.pauseAt(new Date('2026-11-09T16:00:01Z'));
  await p.goto(base+'/');await p.locator('[data-day]').first().waitFor();
  await fits(p,'#calendar');
  for(const day of await p.locator('[data-day]').evaluateAll(els=>els.map(e=>e.dataset.day))){
   await p.locator(`[data-day="${day}"]`).click();await fits(p,'#day-dialog');
   await fits(p,'#day-detail, .summary, .session-outline li, .planned-total, .graph-legend, .recommendation, .detail-note');
   for(const selector of ['.summary','.detail-note','.session-outline li','.graph-legend'])for(const m of await fits(p,selector))assert(m.font>=16,`${selector} must remain readable`);
   if(day==='2026-11-09'&&viewport.width===360){await p.locator('#day-dialog').evaluate(e=>e.scrollTop=0);await p.screenshot({path:'test-results/readability-sheet-360.png'});}
   await p.locator('#close-day').click();
  }
  pass(`${viewport.width}×${viewport.height}: all 17 sheets fit, key text at least 16 px`);
  await p.goto(base+'/#chrono=2026-11-09');await p.locator('#timer-screen').waitFor();
  const [m]=await fits(p,'#time');assert(m.font>=(viewport.width<600?viewport.width*.34:100));assert(Number(m.weight)>=700);assert(m.textLeft>=0&&m.textRight<=viewport.width);
  await p.locator('#play-pause').click();await hold(p,'#next-phase');await p.locator('#timer-screen').evaluate(e=>e.scrollTop=0);
  await fits(p,'#time');await fits(p,'#timer-screen');
  if(viewport.width===360||viewport.width===412)await p.screenshot({path:`test-results/readability-timer-${viewport.width}.png`});
  await p.clock.fastForward(180000);assert.equal(await p.locator('#phase-label').innerText(),'Récupération');await fits(p,'#time');
  await hold(p,'#lock');await p.locator('#play-pause').click();const paused=await p.locator('#time').innerText();await p.clock.runFor(10000);assert.equal(await p.locator('#time').innerText(),paused);
  await p.locator('#stop').click();await fits(p,'#session-summary');await fits(p,'#time');
  pass(`${viewport.width}×${viewport.height}: bold full-width timer, intervals, pause and summary`);
  await p.goto(base+'/#chrono=2026-11-07');await p.locator('#play-pause').click();await hold(p,'#stride',1100);await p.locator('#timer-screen').evaluate(e=>e.scrollTop=0);
  assert(await p.locator('#stride-clock').isVisible());const [stride]=await fits(p,'#stride-time');assert(stride.font>=48);await fits(p,'#time');await fits(p,'#timer-screen');
  const strideBox=await p.locator('#stride-time').boundingBox(),timeBox=await p.locator('#time').boundingBox();assert(strideBox.y>=timeBox.y+timeBox.height,'clocks must not overlap');
  const unlock=await p.locator('#lock').boundingBox();assert(unlock.y>=0&&unlock.y+unlock.height<=viewport.height,`unlock stays in view: ${JSON.stringify({viewport,unlock})}`);
  if(viewport.width===360||viewport.width===800)await p.screenshot({path:`test-results/readability-stride-${viewport.width}.png`});
  await hold(p,'#lock');await p.locator('#play-pause').click();const stridePaused=await p.locator('#stride-time').innerText();await p.clock.runFor(5000);assert.equal(await p.locator('#stride-time').innerText(),stridePaused);await p.locator('#stop').click();
  pass(`${viewport.width}×${viewport.height}: enlarged second clock and two-clock pause`);
  await p.goto(base+'/#chrono=2026-11-21');await p.locator('#play-pause').click();
  for(const minutes of [100,1000]){await p.clock.fastForward((minutes===100?100:900)*60000);const [long]=await fits(p,'#time');assert(long.textLeft>=0&&long.textRight<=viewport.width);assert.match(await p.locator('#time').innerText(),new RegExp('^'+minutes+':'));}
  pass(`${viewport.width}×${viewport.height}: three- and four-digit minutes remain fully visible`);
  await c.close();
 }
 assert.deepEqual(errors,[]);pass('no JavaScript errors');console.log(`\n${count} readability scenarios passed.`);
}finally{await browser.close();}
