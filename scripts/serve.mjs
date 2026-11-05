import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname} from 'node:path';
import {siteFiles} from './site-files.mjs';
const root=new URL(`../${process.env.SITE_DIR||'.'}/`,import.meta.url);
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const base='/'+(process.env.BASE_PATH||'').split('/').filter(Boolean).join('/');
const prefix=base==='/'?'/':base+'/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(base!=='/'&&pathname===base){res.writeHead(302,{Location:prefix});res.end();return;}
    if(!pathname.startsWith(prefix))throw Error();
    const name=pathname.slice(prefix.length)||'index.html';
    // Serving the repository root must not expose its tooling, docs or .git.
    if(!siteFiles.includes(name))throw Error();
    const content=await readFile(new URL(name,root));
    res.writeHead(200,{'Content-Type':types[extname(name)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(content);
  } catch {res.writeHead(404);res.end('Introuvable');}
}).listen(port,host,()=>console.log(`Remy · http://${host}:${port}${prefix}`));
