/* Prefer current files over stale cached pages, with offline fallback. */
const CACHE='study-orbit-v10-preview-20261118';
const ASSETS=['./preview.html?v=10','./preview.js?v=10','./preview.css?v=10','./','./index.html','./style.css?v=3','./data.js?v=5','./repo-guides.js?v=5','./media-guides.js?v=3','./sprint-data.js?v=6','./sprint-engine.js?v=6','./two-sum-cards.js?v=8','./two-sum-lesson.js?v=9','./two-sum-lesson.css?v=9','./sprint.js?v=7','./sprint.css?v=6','./app.js?v=7','./ai-helper.js?v=6','./ai-helper.css?v=4','./favicon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  const req=event.request, url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  const fresh=req.mode==='navigate'||/\.(js|css|html)$/.test(url.pathname);
  if(fresh){
    event.respondWith(fetch(req).then(async response=>{
      if(response.ok){const cache=await caches.open(CACHE);await cache.put(req,response.clone());}
      return response;
    }).catch(()=>caches.match(req)));
  }else{
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return response;
    })));
  }
});