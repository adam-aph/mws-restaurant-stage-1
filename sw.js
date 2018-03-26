
var name = 'restaurants-simple-cache-v2',
    filesToCache = [
      './index.html',
      './restaurant.html',
      './sw.js',
      './css/styles.css',
      './js/dbhelpers.js',
      './js/main.js',
      './js/IDBcontroller.js',      
      './js/restaurant_info.js'
    ];


self.addEventListener('install', function(event) {

  event.waitUntil(openDatabase().then(function() {
    }).catch(function(e) {
        console.log(e);
    })
  );        

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

  if (requestUrl.pathname.indexOf('/restaurants') != -1) {

    event.respondWith( getDBCachedMessage(requestUrl.pathname).then(function(resp) {

        return resp || fetch(event.request).then(function(respScnd) {

            putDBCachedMessage(requestUrl.pathname, respScnd.clone());
            return respScnd;

        }).catch(function(e) {
            console.log(e);
        });
      })
    );

    return;
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

// ===================================== indexedDB ================================
var dbName = 'restaurants-simple-idb'
var objStoreName = 'mws-restaurant-calls'
var idbDatabase;


function openDatabase() {

  var indexedDBOpenRequest = indexedDB.open(dbName, 1);

  return new Promise((resolve, reject) => {

    indexedDBOpenRequest.onupgradeneeded = function() {
      this.result.createObjectStore(objStoreName, {keyPath: 'url'});
    };

    indexedDBOpenRequest.onsuccess = function() {
      idbDatabase = this.result;
      resolve();
    };

    indexedDBOpenRequest.onerror = function(error) {
      console.error('IndexedDB error:', error);
      reject();
    };    
  });
};

function getObjectStore() {
  return idbDatabase.transaction(objStoreName, 'readwrite').objectStore(objStoreName);
};

function getDBCachedMessage(requestUrl) {

  var getRequest = getObjectStore().get(requestUrl);

  return new Promise((resolve, reject) => {
    
    getRequest.onsuccess = function(e) {
      var item = e.target.result;

      if (item != null) {

        resolve( new Response(JSON.stringify(item.data), {
          headers: {
            'content-type': 'application/json'
          }
        }));

      } else {
        resolve(null);
      }
    };

    getRequest.onerror = function(e) {
      reject(null);
    };
  });
};

function putDBCachedMessage(requestUrl, response) {

  response.json().then(function(json) {
    getObjectStore().put({
      url: requestUrl,
      data: json
    });
  });
};
