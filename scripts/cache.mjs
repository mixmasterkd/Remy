import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {siteFiles} from './site-files.mjs';
const root=new URL('../',import.meta.url), hash=createHash('sha256');
for(const name of siteFiles.filter(n=>n!=='sw.js').sort()){hash.update(name);hash.update(await readFile(new URL(name,root)));}
const version=`remy-${hash.digest('hex').slice(0,16)}`;
const file=new URL('sw.js',root),source=await readFile(file,'utf8');
const expected=source.replace(/const VERSION = '[^']+';/,`const VERSION = '${version}';`);
if(process.argv.includes('--check')){if(expected!==source){console.error('Cache périmé : exécuter npm run prepare:offline avant le commit.');process.exit(1);}console.log(`Cache cohérent : ${version}`);}
else{await writeFile(file,expected);console.log(`Cache préparé : ${version}`);}
