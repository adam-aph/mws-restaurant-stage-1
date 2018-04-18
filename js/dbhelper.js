/**
 * Common database helper functions.
 */
class DBHelper {


  static get PORT() {
    return 1337;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:${DBHelper.PORT}/restaurants`;
  }

  /**
   * Database URL.
   */
  static getDatabaseUrlOne(id) {
    return `http://localhost:${DBHelper.PORT}/restaurants/${id}`;
  }

  /**
   * Database URL Reviews.
   */
  static getDatabaseUrlOneReviews(id) {
    return `http://localhost:${DBHelper.PORT}/reviews/?restaurant_id=${id}`;
  }

  /**
   * Database URL All favorites.
   */
  static get DATABASE_GET_ALL_FAVORITES() {
    return `http://localhost:${DBHelper.PORT}/restaurants/?is_favorite=true`;
  }

  /**
   * Database URL Submit Review.
   */
  static get DATABASE_SUBMIT_REVIEW() {
    return `http://localhost:${DBHelper.PORT}/reviews`;
  }

  /**
   * Database URL Update Favorite.
   */
  static setDatabaseUrlOneFavorite(id, fav) {
    return `http://localhost:${DBHelper.PORT}/restaurants/${id}/?is_favorite=${fav}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurants = JSON.parse(xhr.responseText);
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch one restaurant.
   */
  static fetchOneRestaurant(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.getDatabaseUrlOne(id));
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurant = JSON.parse(xhr.responseText);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch one restaurant.
   */
  static fetchOneRestaurantReviews(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.getDatabaseUrlOneReviews(id));
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const reviews = JSON.parse(xhr.responseText);
        if (reviews) { // Got the restaurant
          callback(null, reviews);
        } else { // Restaurant does not exist in the database
          callback('Reviews do not exist', null);
        }
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant SrcSet image URL.
   */
  static imageSrcSetUrlForRestaurant(restaurant) {
      return (`/img2/${restaurant.id}` + `-300_small.webp 300w, ` + `/img/${restaurant.id}` + `.webp 600w`);
  }

 /**
   * Restaurant Sizes image URL.
   */
  static imageSizesUrlForRestaurant(restaurant) {
      return (`(max-width: 400px) 300px, 600px`);
  }

  /**
   * Restaurant Src image URL.
   */
  static imageSrcUrlForRestaurant(restaurant) {
    return (`/img2/${restaurant.id}` + `-300_small.webp`);
  }

  /**
   * Restaurant Alt image description.
   */
  static imageAltDescForRestaurant(restaurant) {
    return (`Restaurant: ${restaurant.name} of ${restaurant.cuisine_type} cuisine type`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }


}
