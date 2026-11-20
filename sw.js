const C='masjid-v5';
const SHELL=['./','js/a1.js','js/a2.js','js/a3.js','js/posts.js','js/a5.js','js/a6.js','js/demo.js','js/a4.js','config.js','manifest.webmanifest','icon.svg','logo.webp','bg.avif'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||r.url.includes('script.google'))return;
  e.respondWith(fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{})}return res})
  .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('./'):Response.error()))))});
