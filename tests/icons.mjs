import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=(process.env.TEST_URL||'http://127.0.0.1:4173/Remy').replace(/\/$/,'')+'/';
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
const p=await context.newPage();let count=0;const pass=s=>{count++;console.log('✓ '+s);};
await mkdir('test-results',{recursive:true});
try {
 const source=await readFile(new URL('../docs/logo-approuve.png',import.meta.url));
 assert.equal(createHash('sha256').update(source).digest('hex'),'650e50d770d6855707953164ab674d2572dd5bdaf3a162dd8a92b7f0aa69807e');pass('approved original PNG is preserved byte for byte');
 await p.goto(base);await p.locator('.owner img').waitFor();await p.waitForFunction(()=>document.querySelector('.owner img').naturalWidth===128);
 const manifest=await p.evaluate(()=>fetch('./manifest.webmanifest').then(r=>r.json()));
 assert.equal(manifest.id,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.name,'Remy — Calendrier');assert.equal(manifest.icons.length,4);
 assert.deepEqual(manifest.icons.map(i=>i.purpose),['any','any','maskable','maskable']);
 for(const icon of manifest.icons){assert.match(icon.src,/^\.\/icon-remy(?:-maskable)?-v1-(192|512)\.png$/);assert.equal(icon.type,'image/png');}
 pass('same app identity and /Remy path; separate versioned any and maskable icons');
 for(const icon of manifest.icons) {
  const stats=await p.evaluate(async icon=>{
   const img=new Image();img.src=icon.src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
   let minAlpha=255,maxRadius=0,visible=0;
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;minAlpha=Math.min(minAlpha,pixels[i+3]);const difference=Math.max(Math.abs(pixels[i]-245),Math.abs(pixels[i+1]-244),Math.abs(pixels[i+2]-240));if(difference>16){visible++;maxRadius=Math.max(maxRadius,Math.hypot(x+.5-c.width/2,y+.5-c.height/2)/c.width);}}
   return {width:img.width,height:img.height,minAlpha,maxRadius,visible};
  },icon);
  assert.equal(`${stats.width}x${stats.height}`,icon.sizes);assert(stats.visible>0);
  if(icon.purpose==='maskable'){assert.equal(stats.minAlpha,255);assert(stats.maxRadius<=.4,`${icon.src}: portrait outside maskable safe zone`);assert(stats.maxRadius>.3);}
  else assert.equal(stats.minAlpha,0);
 }
 pass('192/512 PNG dimensions, transparent standard icons and opaque maskable portrait inside the 40% safe circle');
 for(const [width,height] of [[320,740],[360,800],[412,915]]){
  await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const r=await p.locator('.owner img').boundingBox();assert.equal(r.width,32);assert.equal(r.height,32);assert.equal(await p.locator('.owner img').getAttribute('alt'),'');await p.screenshot({path:`test-results/logo-calendar-${width}.png`,fullPage:true});
 }
 pass('calendar header remains readable without overflow at 320, 360 and 412 px');
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await p.reload();await p.waitForFunction(()=>document.querySelector('.owner img')?.naturalWidth===128);
 const cached=await p.evaluate(async icons=>Promise.all([...icons.map(i=>i.src),'./logo-remy-128.png','./favicon-remy-v1-32.png','./favicon-remy-v1-64.png'].map(async src=>[src,(await fetch(src)).status])),manifest.icons);
 assert(cached.every(([,status])=>status===200));pass('logo, favicons and all Android icons remain available after offline reload');
 const preview=await browser.newPage({viewport:{width:940,height:700},deviceScaleFactor:1});
 const toData=async name=>'data:image/png;base64,'+(await readFile(new URL('../'+name,import.meta.url))).toString('base64');
 const maskable=await toData('icon-remy-maskable-v1-512.png'),standard=await toData('icon-remy-v1-512.png'),favicon=await toData('favicon-remy-v1-32.png');
 await preview.setContent(`<style>body{margin:0;padding:40px;background:#ecebf2;font:16px Arial;color:#252940}h1{font-size:28px;margin:0 0 8px}p{color:#626b8f;margin:0 0 30px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.card{background:#fff;border-radius:14px;padding:18px;text-align:center}.large{width:128px;height:128px}.circle{border-radius:50%}.rounded{border-radius:24%}.samples{display:flex;gap:8px;justify-content:center;align-items:center;height:90px}.samples img{background:#f5f4f0}h2{font-size:16px;margin:22px 0 4px}small{color:#626b8f}.note{margin-top:32px;line-height:1.6}</style><h1>Remy · Le logo dans l’application</h1><p>Portrait approuvé conservé · formes Android simulées</p><div class="grid">${[['Ronde','circle',maskable],['Arrondie','rounded',maskable],['Carrée','',maskable],['Transparente','',standard]].map(([title,shape,src])=>`<div class="card"><img class="large ${shape}" src="${src}"><h2>${title}</h2><div class="samples">${[32,48,64].map(size=>`<img class="${shape}" src="${src}" width="${size}" height="${size}">`).join('')}</div><small>32 · 48 · 64 pixels</small></div>`).join('')}</div><p class="note"><img src="${favicon}" width="32" height="32" style="vertical-align:middle;margin-right:10px">Icône d’onglet · fond clair<br>Les versions adaptatives gardent le portrait à l’intérieur de la zone protégée.<br>Le rendu du lanceur et la mise à jour d’une icône déjà installée restent à vérifier sur le téléphone.</p>`);
 await preview.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await preview.screenshot({path:'test-results/icons-preview.png',fullPage:true});await preview.close();pass('visual proof sheet generated for circular, rounded, square and transparent variants');
 console.log(`\n${count} icon checks passed.`);
}finally{await context.close();await browser.close();}
