// Generated content version: npm run prepare:offline. One atomic cache per release.
const VERSION = 'remy-49ba0b2e762a19c1';
const FILES = ['./','./index.html','./style.css','./app.js','./engine.js','./schedule.json','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES)));});
// No skipWaiting: an active workout keeps its current, coherent release.
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('remy-')&&key!==VERSION)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{const cache=await caches.open(VERSION);const match=await cache.match(event.request,{ignoreSearch:true});if(match)return match;return fetch(event.request);})());
});
