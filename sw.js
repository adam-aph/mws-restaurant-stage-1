
var name = 'restaurants-simple-cache-v2',
    filesToCache = [
      './index.html',
      './restaurant.html',
      './sw.js',
      './css/styles.css',
      './data/restaurants.json',
      './js/dbhelpers.js',
      './js/main.js',
      './js/restaurant_info.js'
    ];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(name).then(function(cache) {
      return cache.addAll(filesToCache);
    }).catch(function(e) {
        console.log(e);
    })
  );
});  

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurants-');
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).catch(function(e) {
        console.log(e);
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  event.respondWith(
    caches.open(name).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        }).catch(function(e) {
            console.log(e);
        });
      });
    }).catch(function(e) {
        console.log(e);
    })
  );
});

function servePhoto(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(name).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      }).catch(function(e) {
        console.log(e);
      });
    }).catch(function(e) {
        console.log(e);
    });
  });
}
