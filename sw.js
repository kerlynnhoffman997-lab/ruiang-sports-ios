const scope = new URL(self.registration.scope);
const cachePrefix = 'ruiang-mobile:'+scope.href+':';
const cacheName = cachePrefix+'v5-phone';
const outfitNames = ['sport','running','badminton','basketball','football','yoga','tang','hanfu','casual','festive'];
const propNames = ['coin','fruit','bottle','bell','headband','wristband','ribbon','gift'];
const images = [
  'app-icon.png','app-icon-192.png','app-icon-512.png','app-icon-maskable.png','wordmark.png','plan-cover.jpg',
  'ruiang-bike.png','ruiang-box.png','ruiang-celebrate.png','ruiang-face.png','ruiang-rest.png','ruiang-shop.png',
  ...outfitNames.flatMap(name => [0,1,2].map(view => name+'-'+view+'.png')),
  ...propNames.map(name => 'prop-'+name+'.jpg'),
  ...['m','f'].flatMap(coach => Array.from({length:8},(_,index) => 'coach-'+coach+(index+1)+'.jpg')),
];
const appFiles = [
  'index.html','app.css','content.js','views.js','app.js','app.webmanifest',
  ...images.map(name => 'assets/'+name),
];
const appUrls = new Set(appFiles.map(file => new URL(file,scope).href));
const indexUrl = new URL('index.html',scope);

self.addEventListener('install',event => {
  // Install a complete version before serving any of its files.
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll([...appUrls].map(url => new Request(url,{cache:'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;
  const appEntry = request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === indexUrl.pathname);
  if (!appEntry && !appUrls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(appEntry ? indexUrl.href : request) || fetch(request);
  })());
});
