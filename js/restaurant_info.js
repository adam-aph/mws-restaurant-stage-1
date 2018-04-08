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
  name.innerHTML = restaurant.name;

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
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute("tabindex", "0");

  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  dateTime = new Date(review.updatedAt);
  date.innerHTML = dateTime.toString();
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
  if (document.getElementById('name').value == "" || 
    document.getElementById('rating').value == "" || 
    document.getElementById('msg').value == "") {
    
    alert("Fill All Fields !");
  } else {

    //document.getElementById('form').submit();
    alert("Form Submitted Successfully...");
    div_hide();
  }
}

/**
 * Show the review form.
 */
function div_show() {
  document.getElementById('name').value = ""; 
  document.getElementById('rating').value = ""; 
  document.getElementById('msg').value = "";
  document.getElementById('reviewform').style.display = "block";
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