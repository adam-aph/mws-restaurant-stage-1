
var name = 'restaurants-simple-cache-v2',
    filesToCache = [
      './',
      './index.html',
      './restaurant.html',
      './sw.min.js',
      './dest/styles.css',
      './dest/main.js',      
      './dest/restaurant_info.js'
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
  self.clients.matchAll({
    includeUncontrolled: true
  }).then(function(clientList) {
    var urls = clientList.map(function(client) {
      return client.url;
    });
    console.log('[ServiceWorker] Matching clients:', urls.join(', '));
  });

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('restaurants-');
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );

    }).then(function() {
      return self.clients.claim();

    }).catch(function(e) {
        console.log(e);
    })
  );
});


self.addEventListener('fetch', function(event) {

  if (event.request.method != 'GET' ||
     (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin')) {
    return;
  }

  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }


  // all json
  if (requestUrl.origin.indexOf('localhost:1337') != -1) {

    var errRspnd;
    var url = requestUrl.href;

    event.respondWith(fetch(event.request).then(function(response) {
        putDBCachedMessage(url, response.clone());
        return response;

      }).catch(function(e) {

        return getDBCachedMessage(url).then(function(resp) {       
          return resp;  

        }).catch(function(e) {      
          return e;

        });
      })
    );

    return;
  }

  // non-json
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

/* temporary store */
const syncStore = {}

self.addEventListener('message', event => {
  if(event.data.type === 'review' || event.data.type === 'favorite') {
    const id = event.data.uuid;
    syncStore[id] = event;

    // register a sync and pass the id as tag for it to get the data
    self.registration.sync.register(id)
  }
});

self.addEventListener('sync', event => {
  // get the data by tag
  const savedEvent = syncStore[event.tag];
  // do not delete for testing purposes
  // delete syncStore[event.tag]

    event.waitUntil(fetch(savedEvent.data.url, savedEvent.data.options).then(function(response) {  
      return response.json();

    }).then(function(data) {
      data.type = savedEvent.data.type;
      savedEvent.ports[0].postMessage(data);

    }).catch(function(err) { 
      console.error(err); 
    })
  );
});



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

function getDBCachedMessage(reqKey) {

  var getRequest = getObjectStore().get(reqKey);

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

function putDBCachedMessage(reqKey, response) {

  response.json().then(function(json) {
    getObjectStore().put({
      url: reqKey,
      data: json
    });
  });
};
