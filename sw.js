
var name = 'restaurants-simple-cache-v2',
    filesToCache = [
      './',
      './index.html',
      './restaurant.html',
      './sw.js',
      './css/styles.css',
      './js/dbhelper.js',
      './js/main.js',      
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

  if (event.request.method != 'GET') {
    return;
  }

  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img')) {
      event.respondWith(servePhoto(event.request));
      return;
    }
  }

  if (requestUrl.pathname.indexOf('/reviews/') != -1) {  // cache all reviews = '/reviews/?restaurant_id=id'

    event.respondWith(
      caches.open(name).then(function(cache) {
        return fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        }).catch(function() {
          return cache.match(event.request);
        });
      })
    );

    return;
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

/* temporary store */
const syncStore = {}

self.addEventListener('message', event => {
  if(event.data.type === 'sync') {
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
      savedEvent.ports[0].postMessage(data);

    }).catch(function(err) { 
      console.error(err); 
    })
  );
});

// ===================================== indexedDB ================================
var dbName = 'restaurants-simple-idb'
var objStoreName = 'mws-restaurant-calls'
var osReviewName = 'mws-restaurant-reviews'
var idbDatabase;


function openDatabase() {

  var indexedDBOpenRequest = indexedDB.open(dbName, 1);

  return new Promise((resolve, reject) => {

    indexedDBOpenRequest.onupgradeneeded = function() {
      this.result.createObjectStore(objStoreName, {keyPath: 'url'});
      this.result.createObjectStore(osReviewName, {keyPath: 'url'});      
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

function getReviewOS() {
  return idbDatabase.transaction(osReviewName, 'readwrite').objectStore(osReviewName);
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

function getDBCachedReviews(requestUrl) {

  var getRequest = getReviewOS().get(requestUrl);

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

function putDBCachedReviews(requestUrl, response) {

  response.json().then(function(json) {
    getReviewOS().put({
      url: requestUrl,
      data: json
    });
  });
};
