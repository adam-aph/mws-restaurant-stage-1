
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
  openDatabase();

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

  var idbType = false;
  if (requestUrl.pathname.indexOf('/restaurants') != -1) {
    idbType = true;
    getDBCachedMessage(requestUrl.pathname, function(response) { // yay

      if (response != null) {
        event.respondWith(response);
        return;
      } 
    });
  }

  event.respondWith(
    caches.open(name).then(function(cache) {
      return cache.match(event.request).then(function (response) {

        return response || fetch(event.request).then(function(response) {

          if (idbType) {
            putDBCachedMessage(requestUrl.pathname, response.clone());

          } else {
            cache.put(event.request, response.clone());

          }
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

  indexedDBOpenRequest.onerror = function(error) {
    console.error('IndexedDB error:', error);
  };

  indexedDBOpenRequest.onupgradeneeded = function() {
    this.result.createObjectStore(objStoreName, {keyPath: 'url'});
  };

  indexedDBOpenRequest.onsuccess = function() {
    idbDatabase = this.result;
  };
};

function getObjectStore() {
  return idbDatabase.transaction(objStoreName, 'readwrite').objectStore(objStoreName);
};

function getDBCachedMessage(requestUrl, yayHdlr) {

  var getRequest = getObjectStore().get(requestUrl);

  getRequest.onsuccess = function(e) {
      var item = e.target.result;

      if (item != null) {

        yayHdlr(item.data);
      } else {
        yayHdlr(null);
      }
  };
};

function putDBCachedMessage(requestUrl, response) {

  console.log('db-put1: '+ response);
  var rData = JSON.stringify(response);
  console.log('db-put2: '+ rData);

  getObjectStore().put({
    url: requestUrl,
    data: rData
  });
};
