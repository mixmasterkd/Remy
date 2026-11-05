import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const root=fileURLToPath(new URL('../public/',import.meta.url));
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root.slice(0,-1)&&!path.startsWith(root.endsWith(sep)?root:root+sep))throw Error();if((await stat(path)).isDirectory())path=resolve(path,'index.html');res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(path));}catch{res.writeHead(404);res.end('Introuvable');}}).listen(port,host,()=>console.log(`Remy · http://${host}:${port}`));
