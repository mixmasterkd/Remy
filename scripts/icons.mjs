// Technical renditions of the approved PNG: no redrawing or retouching.
import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const source=await readFile(new URL('docs/logo-approuve.png',root));
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try {
 const page=await browser.newPage();
 const result=await page.evaluate(async data=>{
  const img=new Image();img.src=data;await img.decode();
  const original=document.createElement('canvas');original.width=img.width;original.height=img.height;
  const ctx=original.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,img.width,img.height).data;
  const visibleAlpha=16;
  let left=img.width,top=img.height,right=0,bottom=0,transparent=0;
  for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){
   if(pixels[(y*img.width+x)*4+3]>=visibleAlpha){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}else transparent++;
  }
  const cx=(left+right+1)/2,cy=(top+bottom+1)/2;let radius=0;
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if(pixels[(y*img.width+x)*4+3]>=visibleAlpha)radius=Math.max(radius,Math.hypot(x+.5-cx,y+.5-cy));
  const specs=[['logo-remy-128.png',128,'any'],['icon-remy-v1-192.png',192,'any'],['icon-remy-v1-512.png',512,'any'],['icon-remy-maskable-v1-192.png',192,'maskable'],['icon-remy-maskable-v1-512.png',512,'maskable'],['favicon-remy-v1-32.png',32,'favicon'],['favicon-remy-v1-64.png',64,'favicon']];
  const files=specs.map(([name,size,purpose])=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const c=canvas.getContext('2d');
   if(purpose!=='any'){c.fillStyle='#f5f4f0';c.fillRect(0,0,size,size);}
   // Measure the visible silhouette, ignoring faint alpha specks only for fitting.
   // The source itself is unchanged; the portrait stays inside the 40% safe circle.
   const scale=purpose==='maskable'?.38*size/radius:.92*size/Math.max(right-left+1,bottom-top+1);
   c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(img,size/2-cx*scale,size/2-cy*scale,img.width*scale,img.height*scale);
   return {name,size,purpose,png:canvas.toDataURL('image/png').split(',')[1]};
  });
  return {source:{width:img.width,height:img.height,bounds:{left,top,right,bottom},fitAlphaThreshold:visibleAlpha,pixelsBelowFitAlpha:transparent},maskableContentRadius:.38,files};
 },'data:image/png;base64,'+source.toString('base64'));
 for(const f of result.files)await writeFile(new URL(f.name,root),Buffer.from(f.png,'base64'));
 const metadata={sourceSha256:createHash('sha256').update(source).digest('hex'),...result,files:result.files.map(({png,...file})=>file)};
 await writeFile(new URL('docs/logo-renditions.json',root),JSON.stringify(metadata,null,2)+'\n');
 console.log(JSON.stringify(metadata,null,2));
}finally{await browser.close();}
