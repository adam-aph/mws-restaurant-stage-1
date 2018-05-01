let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      document.getElementById('map').style.display = "inline";
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
      // Remove focus for the map
      self.map.addListener("tilesloaded", function(){
          var anchors = document.querySelectorAll('#map a');

          [].forEach.call(anchors, function(item) {
              item.setAttribute('tabindex','-1');
          });
      });
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchOneRestaurant(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML(); 
      callback(null, restaurant);

      DBHelper.fetchOneRestaurantReviews(id, (error, reviews) => {
        self.restaurant.reviews = reviews;
        fillReviewsHTML(); 
      });      

     });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.setAttribute("tabindex", "0");
  name.innerHTML = restaurant.name + '&emsp;&emsp;&emsp;&emsp;&emsp;' +
      (restaurant.is_favorite === 'true' ? '[Favorite]' : '[Not favorite]');

  const address = document.getElementById('restaurant-address');
  address.setAttribute("tabindex", "0");
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.srcset = DBHelper.imageSrcSetUrlForRestaurant(restaurant); 
  image.sizes = DBHelper.imageSizesUrlForRestaurant(restaurant); 
  image.src = DBHelper.imageSrcUrlForRestaurant(restaurant); 
  image.alt = DBHelper.imageAltDescForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Update restaurant HTML
 */
updateRestaurantTitleHTML = (fav) => {
  const name = document.getElementById('restaurant-name');
  const restaurant = self.restaurant;

  name.innerHTML = restaurant.name + '&emsp;&emsp;&emsp;&emsp;&emsp;' +
      (restaurant.is_favorite === 'true' ? '[Favorite]' : '[Not favorite]');
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  hours.setAttribute("tabindex", "0");

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h4');
  title.innerHTML = 'Reviews';
  const refLink = document.createElement('a');
  refLink.innerHTML = 'Add Review';
  refLink.href = "javascript:%20div_show()";
  refLink.setAttribute("aria-label", "add review");
  refLink.setAttribute("role", "button");
  refLink.setAttribute("tabindex", "0"); 
  title.append(refLink);
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(null, review));
  });
  container.appendChild(ul);
}


/**
 * Add new review HTML and add them to the webpage.
 */
addReviewsHTMLOffline = (nm, rat, msg, uid) => {

  const ul = document.getElementById('reviews-list');
  ul.insertBefore(createReviewHTML(null, {name: nm, rating: rat, comments: msg, updatedAt: 0, uuid: uid}), null);
}

/**
 * Add new review HTML and add them to the webpage.
 */
addReviewsHTML = (response) => {

  const ul = document.getElementById('reviews-list');
  ul.insertBefore(createReviewHTML(null, response), null);
}

/**
 * Update new review HTML and add them to the webpage.
 */
updateReviewsHTMLOffline = (nm, rat, msg, uid, time) => {

  console.log('Updating uuid: ' + uid);

  var ul = document.getElementById('reviews-list');
  var items = ul.getElementsByTagName('li');
  for (var i = 0; i < items.length; ++i) {
    if (items[i].getAttribute("uuid") == uid) { 
      createReviewHTML(items[i], {name: nm, rating: rat, comments: msg, updatedAt: time}); 
    }
  }
}


/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (liref, review) => {
  var li = liref;

  if (liref == null) {
    li = document.createElement('li');
  } else {
    // remove childs
    while (li.firstChild) {
      li.removeChild(li.firstChild);
    }
  }

  li.setAttribute("tabindex", "0");

  if (review.hasOwnProperty('uuid')) {
    li.setAttribute("uuid", review.uuid);
  } 

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  if (review.updatedAt != 0) {
    dateTime = new Date(review.updatedAt);
    date.innerHTML = dateTime.toString();
  } else {
    date.innerHTML = 'Not yet updated at the Server';
  }
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = escapeUnicode(review.comments);
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.setAttribute("aria-label", "breadcrumb");
  breadcrumb.setAttribute("role", "navigation");
 
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Check review form.
 */
function check_empty() {
  let name = document.getElementById('name').value;
  let rating = document.getElementById('rating').value;
  let msg = document.getElementById('msg').value;
  let fav = document.getElementById('favorite').checked;

  if (name == "" || rating == "" || msg == "") {
    
    alert("Fill All Fields !");

  } else if (rating < 1 || rating > 6) {
    
    alert("Rating: 1-6 !");

  } else {

    submit_form(name, rating, msg, fav);
    div_hide();
  }
}

/**
 * Show the review form.
 */
function div_show() {
  document.getElementById('name').value = "";
  document.getElementById('favorite').checked = (self.restaurant.is_favorite === 'true' ? true : false);
  document.getElementById('rating').value = "";
  document.getElementById('msg').value = "";
  document.getElementById('reviewform').style.display = "block";
  document.getElementById("name").focus();
}

/**
 * Hide the review form.
 */
function div_hide() {
  document.getElementById('reviewform').style.display = "none";
}

/**
 * Escape the review text.
 */
function escapeUnicode(str) {
    return str.replace(/[^\0-~]/g, function(ch) {
        return "&#x" + ("0000" + ch.charCodeAt().toString(16)).slice(-4) + ";";
    });
}

/**
 * Generate UUID.
 */
function generateUUID() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 * Send Info to Service Worker.
 */
function sendMessageToSW(msg) {

    return new Promise(function(resolve, reject){
        // Create a Message Channel
        var msg_chan = new MessageChannel();

        // Handler for recieving message reply from service worker
        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };

        // Send message to service worker along with port for reply
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
}

/**
 * Send Ppostponed Message.
 */
function sendPostponedMsg(id, nm, rat, msg) {

  const uid = generateUUID();
  addReviewsHTMLOffline(nm, rat, msg, uid);

  console.log('New sendPostponedMsg uuid: ' + uid);
  sendMessageToSW({type: 'review', uuid: uid, url: DBHelper.DATABASE_SUBMIT_REVIEW,
                  options: {method: 'POST', headers: {"Content-Type": "application/json;charset=UTF-8"},
                  body: {restaurant_id: id, name: nm, rating: rat, comments: msg}}})

    .then(function(response) {
      console.log('Updating updateReviewsHTMLOffline response: ' + JSON.stringify(response));
      updateReviewsHTMLOffline(nm, rat, msg, uid, response.updatedAt);
     
    }).catch(function(error) {
      console.log(error);
    });
}

/**
 * Send Ppostponed Message.
 */
function sendPostponedFavMsg(id, fav) {

  const uid = generateUUID();

  console.log('New sendPostponedFavMsg uuid: ' + uid);
  sendMessageToSW({type: 'favorite', uuid: uid, url: DBHelper.setDatabaseUrlOneFavorite(id, fav),
                  options: {method: 'POST', headers: {"Content-Type": "application/json;charset=UTF-8"},
                  }})

    .then(function(response) {
      console.log('Updating updateRestaurantTitleHTML response: ' + JSON.stringify(response));
      updateRestaurantTitleHTML(fav);
     
    }).catch(function(error) {
      console.log(error);
    });
}

/**
 * Submit the review.
 */
function submit_review(id, nm, rat, msg) {

  let xhr = new XMLHttpRequest();
  xhr.open('POST', DBHelper.DATABASE_SUBMIT_REVIEW);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) { // Got a success response from server!

      var jsonResponse = JSON.parse(xhr.responseText);
      addReviewsHTML(jsonResponse);

      // update cache
      DBHelper.fetchOneRestaurantReviews(id, (error, reviews) => {
        self.restaurant.reviews = reviews;
      }); 

    } else { // Oops!. Got an error from server.
      alert("Submit Error: " + xhr.status + "\nYour review will be re-submitted automatically later");
      sendPostponedMsg(id, nm, rat, msg);
    }
  }

  xhr.onerror = () => {
      alert("Submit Error: " + xhr.status + "\nYour review will be re-submitted automatically later");
      sendPostponedMsg(id, nm, rat, msg);
  }

  xhr.send(JSON.stringify({restaurant_id: id, name: nm, rating: rat, comments: msg}));
}

/**
 * Submit the favorite.
 */
function submit_favorite(id, fav) {

  let xhr = new XMLHttpRequest();

  xhr.open('POST', DBHelper.setDatabaseUrlOneFavorite(id, fav));
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  
  xhr.onload = () => {
    if (xhr.status === 200 || xhr.status === 201) { // Got a success response from server!

      // update cache
      DBHelper.fetchOneRestaurant(id, (error, restaurant) => {
        self.restaurant = restaurant;

        if (!restaurant) {
          console.error(error);
          return;
        }

        updateRestaurantTitleHTML(fav);
      });

    } else { // Oops!. Got an error from server.

      sendPostponedFavMsg(id, fav);
    }
  }

  xhr.onerror = () => {
    
      sendPostponedFavMsg(id, fav);
  }

  xhr.send();
}

/**
 * Submit the review form.
 */
function submit_form(nm, rat, msg, fav) {

  const id = getParameterByName('id');

  submit_review(id, nm, rat, msg);

  var curFav = (self.restaurant.is_favorite === 'true' ? true : false);

  if (fav != curFav) {

    submit_favorite(id, fav);
  }
}
