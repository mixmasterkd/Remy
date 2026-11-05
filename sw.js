// Generated build identity includes this worker and every static resource.
const VERSION = 'remy-3a71922d8d44545f';
const SCOPE = new URL(self.registration.scope);
const CACHE = `${VERSION}@${SCOPE.pathname}`;
const FILES = ['./','./index.html','./mise-a-jour.html','./style.css','./app.js','./engine.js','./schedule.json','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  // Fetch the complete release before activating; never reuse HTTP-cached assets.
  const entries=await Promise.all(FILES.map(async path=>{
    const target=new URL(path,SCOPE),fresh=new URL(target);fresh.searchParams.set('remy-build',VERSION);
    const response=await fetch(fresh,{cache:'no-store'});
    if(!response.ok)throw new Error(`Release incomplete: ${path}`);
    return [target.href,response];
  }));
  const cache=await caches.open(CACHE);
  await Promise.all(entries.map(([url,response])=>cache.put(url,response)));
  await self.skipWaiting();
})()));
function inScope(url){return url.startsWith(SCOPE.href);}
async function announce(client){
  const handled=await new Promise(resolve=>{
    const channel=new MessageChannel();
    const timeout=setTimeout(()=>{channel.port1.close();resolve(false);},1200);
    channel.port1.onmessage=event=>{clearTimeout(timeout);channel.port1.close();resolve(event.data?.handled===true);};
    client.postMessage({type:'REMY_VERSION',version:VERSION},[channel.port2]);
  });
  // Do not await navigate() inside activate: its navigation waits for this
  // worker to finish activating.
  // Legacy pages cannot handle the new update message. Refresh their calendar,
  // but never interrupt a timer that might still be running in an older release.
  if(!handled){const current=await self.clients.get(client.id);if(current&&inScope(current.url)&&!new URL(current.url).hash.startsWith('#chrono='))void current.navigate(current.url).catch(()=>{});}
}
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await self.clients.claim();
  await Promise.all((await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>inScope(c.url)).map(c=>announce(c).catch(()=>{})));
  // Only prune this scope's versioned caches. Never clear localStorage or
  // unscoped legacy caches that could belong to another application.
  for(const key of await caches.keys())if(key!==CACHE&&key.startsWith('remy-')&&key.endsWith(`@${SCOPE.pathname}`))await caches.delete(key);
})()));
self.addEventListener('message',event=>{
  if(event.data?.type==='REMY_HELLO')event.source?.postMessage({type:'REMY_VERSION',version:VERSION});
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!inScope(event.request.url))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(new URL(event.request.url).pathname===new URL('mise-a-jour.html',SCOPE).pathname){
      try {const fresh=new URL(event.request.url);fresh.searchParams.set('actualiser',Date.now());const response=await fetch(fresh,{cache:'no-store'});if(response.ok)return response;} catch {}
    }
    return await cache.match(event.request,{ignoreSearch:true})||fetch(event.request);
  })());
});
