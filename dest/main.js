class DBHelper{static get PORT(){return 1337}static get DATABASE_URL(){return`http://localhost:${DBHelper.PORT}/restaurants`}static getDatabaseUrlOne(e){return`http://localhost:${DBHelper.PORT}/restaurants/${e}`}static getDatabaseUrlOneReviews(e){return`http://localhost:${DBHelper.PORT}/reviews/?restaurant_id=${e}`}static get DATABASE_GET_ALL_FAVORITES(){return`http://localhost:${DBHelper.PORT}/restaurants/?is_favorite=true`}static get DATABASE_SUBMIT_REVIEW(){return`http://localhost:${DBHelper.PORT}/reviews`}static setDatabaseUrlOneFavorite(e,t){return`http://localhost:${DBHelper.PORT}/restaurants/${e}/?is_favorite=${t}`}static fetchRestaurants(e){let t=new XMLHttpRequest;t.open("GET",DBHelper.DATABASE_URL),t.onload=(()=>{if(200===t.status){const s=JSON.parse(t.responseText);e(null,s)}else{const s=`Request failed. Returned status of ${t.status}`;e(s,null)}}),t.send()}static fetchOneRestaurant(e,t){let s=new XMLHttpRequest;s.open("GET",DBHelper.getDatabaseUrlOne(e)),s.onload=(()=>{if(200===s.status){const e=JSON.parse(s.responseText);e?t(null,e):t("Restaurant does not exist",null)}else{const e=`Request failed. Returned status of ${s.status}`;t(e,null)}}),s.send()}static fetchOneRestaurantReviews(e,t){let s=new XMLHttpRequest;s.open("GET",DBHelper.getDatabaseUrlOneReviews(e)),s.onload=(()=>{if(200===s.status){const e=JSON.parse(s.responseText);e?t(null,e):t("Reviews do not exist",null)}else{const e=`Request failed. Returned status of ${s.status}`;t(e,null)}}),s.send()}static fetchRestaurantByCuisine(e,t){DBHelper.fetchRestaurants((s,a)=>{if(s)t(s,null);else{const s=a.filter(t=>t.cuisine_type==e);t(null,s)}})}static fetchRestaurantByNeighborhood(e,t){DBHelper.fetchRestaurants((s,a)=>{if(s)t(s,null);else{const s=a.filter(t=>t.neighborhood==e);t(null,s)}})}static fetchRestaurantByCuisineAndNeighborhood(e,t,s){DBHelper.fetchRestaurants((a,r)=>{if(a)s(a,null);else{let a=r;"all"!=e&&(a=a.filter(t=>t.cuisine_type==e)),"all"!=t&&(a=a.filter(e=>e.neighborhood==t)),s(null,a)}})}static fetchNeighborhoods(e){DBHelper.fetchRestaurants((t,s)=>{if(t)e(t,null);else{const t=s.map((e,t)=>s[t].neighborhood),a=t.filter((e,s)=>t.indexOf(e)==s);e(null,a)}})}static fetchCuisines(e){DBHelper.fetchRestaurants((t,s)=>{if(t)e(t,null);else{const t=s.map((e,t)=>s[t].cuisine_type),a=t.filter((e,s)=>t.indexOf(e)==s);e(null,a)}})}static urlForRestaurant(e){return`./restaurant.html?id=${e.id}`}static imageSrcSetUrlForRestaurant(e){return`/img2/${e.id}`+"-300_small.webp 300w, "+`/img/${e.id}`+".webp 600w"}static imageSizesUrlForRestaurant(e){return"(max-width: 400px) 300px, 600px"}static imageSrcUrlForRestaurant(e){return`/img2/${e.id}`+"-300_small.webp"}static imageAltDescForRestaurant(e){return`Restaurant: ${e.name} of ${e.cuisine_type} cuisine type`}static mapMarkerForRestaurant(e,t){return new google.maps.Marker({position:e.latlng,title:e.name,url:DBHelper.urlForRestaurant(e),map:t,animation:google.maps.Animation.DROP})}}let restaurants,neighborhoods,cuisines;var map,markers=[];document.addEventListener("DOMContentLoaded",e=>{fetchNeighborhoods(),fetchCuisines(),updateRestaurants(!0)}),setTimeout(function(){[].forEach.call(document.querySelectorAll("img[data-src]"),function(e){e.setAttribute("src",e.getAttribute("data-src")),e.onload=function(){e.removeAttribute("data-src")}})},50),fetchNeighborhoods=(()=>{DBHelper.fetchNeighborhoods((e,t)=>{e?console.error(e):(self.neighborhoods=t,fillNeighborhoodsHTML())})}),fillNeighborhoodsHTML=((e=self.neighborhoods)=>{const t=document.getElementById("neighborhoods-select");e.forEach(e=>{const s=document.createElement("option");s.innerHTML=e,s.value=e,s.setAttribute("tabindex","-1"),s.setAttribute("role","option"),t.append(s)})}),fetchCuisines=(()=>{DBHelper.fetchCuisines((e,t)=>{e?console.error(e):(self.cuisines=t,fillCuisinesHTML())})}),fillCuisinesHTML=((e=self.cuisines)=>{const t=document.getElementById("cuisines-select");e.forEach(e=>{const s=document.createElement("option");s.innerHTML=e,s.value=e,s.setAttribute("tabindex","-1"),s.setAttribute("role","option"),t.append(s)})}),swapMap=(()=>{var e=document.createElement("script");e.type="text/javascript",e.src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAq5NHLNEo4kP8bRAwMQe_VnOJb6eZxnkM&libraries=places&callback=initMap",document.body.appendChild(e)}),window.initMap=(()=>{self.map=new google.maps.Map(document.getElementById("map"),{zoom:12,center:{lat:40.722216,lng:-73.987501},scrollwheel:!1}),document.getElementById("map-static").style.display="none",document.getElementById("map").style.display="inline",addMarkersToMap()}),updateRestaurants=(e=>{const t=document.getElementById("cuisines-select"),s=document.getElementById("neighborhoods-select"),a=t.selectedIndex,r=s.selectedIndex,n=t[a].value,l=s[r].value;DBHelper.fetchRestaurantByCuisineAndNeighborhood(n,l,(t,s)=>{t?console.error(t):(resetRestaurants(s),fillRestaurantsHTML(e),null==self.map&&0==e&&swapMap())})}),resetRestaurants=(e=>{self.restaurants=[],document.getElementById("restaurants-list").innerHTML="",self.markers.forEach(e=>e.setMap(null)),self.markers=[],self.restaurants=e}),fillRestaurantsHTML=((e,t=self.restaurants)=>{const s=document.getElementById("restaurants-list");t.forEach(t=>{s.append(createRestaurantHTML(e,t))}),null!=self.map&&addMarkersToMap()}),createRestaurantHTML=((e,t)=>{const s=document.createElement("li"),a=document.createElement("img");a.className="restaurant-img",1==e?a.setAttribute("data-src",DBHelper.imageSrcUrlForRestaurant(t)):a.setAttribute("src",DBHelper.imageSrcUrlForRestaurant(t)),a.alt=DBHelper.imageAltDescForRestaurant(t),s.append(a);const r=document.createElement("h3");r.innerHTML=t.name,r.setAttribute("tabindex","0"),s.append(r);const n=document.createElement("p");n.innerHTML=t.neighborhood,s.append(n);const l=document.createElement("p");l.innerHTML=t.address,s.append(l);const o=document.createElement("a");return o.innerHTML="View Details",o.href=DBHelper.urlForRestaurant(t),o.setAttribute("aria-label","details for restaurant: "+t.name),o.setAttribute("role","button"),o.setAttribute("tabindex","0"),s.append(o),s}),addMarkersToMap=((e=self.restaurants)=>{null!=self.map?e.forEach(e=>{const t=DBHelper.mapMarkerForRestaurant(e,self.map);google.maps.event.addListener(t,"click",()=>{window.location.href=t.url}),self.markers.push(t)}):swapMap()});