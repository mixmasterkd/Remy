import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {siteFiles} from './site-files.mjs';
const output=new URL('../dist/',import.meta.url);
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const name of siteFiles) await cp(new URL(`../${name}`,import.meta.url),new URL(name,output));
await writeFile(new URL('.nojekyll',output),'');
console.log('Site statique prêt dans dist/ — compatible avec /Remy/.');
