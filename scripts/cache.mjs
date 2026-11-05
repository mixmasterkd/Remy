import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {siteFiles} from './site-files.mjs';
const root=new URL('../',import.meta.url),hash=createHash('sha256');
const marker=/(<meta name="remy-build" content=")[^"]*(">)/g;
const sources=new Map();
for(const name of [...siteFiles].sort()){
  const bytes=await readFile(new URL(name,root));
  const normalized=name==='sw.js'?bytes.toString().replace(/const VERSION = '[^']+';/,"const VERSION = '__BUILD__';")
    :name.endsWith('.html')?bytes.toString().replace(marker,'$1__BUILD__$2'):bytes;
  sources.set(name,bytes);hash.update(name);hash.update(normalized);
}
const version=`remy-${hash.digest('hex').slice(0,16)}`;
for(const [name,bytes] of sources){
  if(name!=='sw.js'&&!name.endsWith('.html'))continue;
  const source=bytes.toString();
  const expected=name==='sw.js'?source.replace(/const VERSION = '[^']+';/,`const VERSION = '${version}';`):source.replace(marker,`$1${version}$2`);
  if(process.argv.includes('--check')){if(expected!==source){console.error('Version périmée : exécuter npm run prepare:offline.');process.exit(1);}}
  else await writeFile(new URL(name,root),expected);
}
console.log(`${process.argv.includes('--check')?'Version cohérente':'Version préparée'} : ${version}`);
