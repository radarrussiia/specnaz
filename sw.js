const CACHE='specnaz-v2-20';
const APP=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./sw.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  e.respondWith((async()=>{
    try{
      const net=await fetch(r);
      const u=new URL(r.url);
      if(net && (net.ok || net.type==='opaque') && (u.origin===location.origin || /(^|\\.)unpkg\.com$|(^|\\.)openstreetmap\.org$|(^|\\.)arcgisonline\.com$|(^|\\.)esri\.com$|(^|\\.)open-meteo\.com$|(^|\\.)openfreemap\.org$/.test(u.hostname))){
        const c=await caches.open(CACHE);c.put(r,net.clone()).catch(()=>{});
      }
      return net;
    }catch(err){
      const hit=await caches.match(r); if(hit)return hit;
      if(r.mode==='navigate'){const app=await caches.match('./index.html');if(app)return app;}
      throw err;
    }
  })());
});
