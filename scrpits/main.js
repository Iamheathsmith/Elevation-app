'use strict';


let map, infoWindow;
let pos = {};
let des = [];
let elevPos = {};
let statusE = false;
let statusD = false;
let hours = [];

localStorage.setItem('searchHistory','');
let searchResults = [];

function SearchResultsObject(name, add, hours, dis, duration, ele, rating, elecomp, imgUrl,ed) {
  this.name = name;
  this.address = add;
  this.storeHours = hours
  this.distance = dis;
  this.duration = duration;
  this.elevation = ele;
  this.rating = rating;
  this.elevationcomp = elecomp;
  this.imgUrl = imgUrl;
  this.equivdist = ed;
}
// this.distance + (7.92*this.elecomp)
function initMap(e) {
  e.preventDefault();

  app.mapMake.mapCreate();

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        // empty the handlebars and results
        des = [];
        searchResults = [];
        $('.search-details').empty();

        var elevator = new google.maps.ElevationService;
        getElevationPos(elevator);

        function getElevationPos(elevator) {
          // Initiate the location request
          elevator.getElevationForLocations({
            locations: [pos],
          }, function(response, err) {
            elevPos = (Math.floor(response[0].elevation*3.28))
          })
        }

        let request = {
          location: pos,
          // rankBy: google.maps.places.RankBy.DISTANCE,
          radius: '800', //in meters
          // name: [$('#search-name').val()],//search by name
          // type: [$('#search-type').val()],// search by type
          keyword: [$('#search').val()]// search by keyword
        };

        // For every input log to History Tab
        let now = Date().split(' ').slice(0, 5).join(' ');
        //searchHistory += `${now}- ${$('#search').val()} <br> `;
        localStorage.searchHistory += `${now}- ${$('#search').val()} <br> `;

        let service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, processResults);


        centerMarker();
      },
      function() {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function processResults(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (let i = 0; i < results.length; i++) {
      createMarker(results[i])
      des.push({
        lat: results[i].geometry.location.lat(),
        lng: results[i].geometry.location.lng()
      })
      searchResults.push(new SearchResultsObject(results[i].name, results[i].vicinity, null, 0, 0, 0, results[i].rating,0));
      searchResults[i].imgUrl = (results[i].photos) ? results[i].photos[0].getUrl({maxWidth: 1000}) : 'img/error.gif';
    }
    console.log(results);
  }
  let distance = new google.maps.DistanceMatrixService;
  statusD = distanceLocation(distance);
  let elevator = new google.maps.ElevationService;
  statusE = displayLocationElevation(elevator);

  setTimeout(equivdistCalc, 3000);
}

function centerMarker() {
  let marker = new google.maps.Marker({
    position: pos,
    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png', // image,
    animation: google.maps.Animation.DROP,
    map: map
  });
  map.setCenter(pos);
}

// creates the markers and lets you click on the marker for more info

function createMarker(place) {
  let service = new google.maps.places.PlacesService(map);
  let infoWindow = new google.maps.InfoWindow();

  service.getDetails({
    placeId: place.place_id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
      });
      // console.log(place);
      let today = new Date();
      let weekday = today.getDay();
      infoWindow.setContent('<div id="name">' + place.name + '</div>' +
        'Address: ' + place.formatted_address + '<br>' +
        'Hours: ' + place.opening_hours.weekday_text[weekday] + '<br>' + 'Phone: '+ place.formatted_phone_number + '<br>' + '</div>');

      google.maps.event.addListener(marker, 'click', function(event) {
        infoWindow.open(map, marker);
      });

      google.maps.event.addListener(map, 'click', function(event) {
        infoWindow.close();
      });
      hours.push(place.opening_hours.weekday_text[weekday]);
    }
  });
}

//calculate distance
function distanceLocation(distance) {
  for (let i = 0; i < searchResults.length; i++) {
    distance.getDistanceMatrix({
      origins: [pos],
      destinations: [des[i]],
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    }, function(results, err){
      searchResults[i].distance =  Number((results.rows[0].elements[0].distance.text).substr(0,(results.rows[0].elements[0].distance.text).length-3));
      searchResults[i].duration =  Number((results.rows[0].elements[0].duration.text).substr(0,(results.rows[0].elements[0].duration.text).length-5));
      if (i == searchResults.length) {statusD = true;} ;
    })
  }
  return statusD;
}

// calculate elevation
function displayLocationElevation(elevator) {
  for (let i = 0; i < searchResults.length; i++) {
    elevator.getElevationForLocations({
      locations: [des[i]],
    }, function(response, err){
      searchResults[i].elevation =  Math.floor(response[0].elevation*3.28);
      searchResults[i].elevationcomp =  searchResults[i].elevation - elevPos;
      if (i == searchResults.length) {statusE = true;} ;
    });
  }
  return statusE;
}

// applying Naismiths formula
function equivdistCalc() {
  for (let i = 0; i < searchResults.length; i++) {
    let naismith_ed = ((((searchResults[i].distance*1.6) + (7.92*Math.abs(searchResults[i].elevationcomp*.3048/1000))))*0.62);
    searchResults[i].equivdist = Number(naismith_ed.toPrecision(2));
    searchResults[i].storeHours = hours[i];
  }
  searchResults.sort((a, b) => {return a.equivdist - b.equivdist;});

  app.view.accordPopulate();
  checkSearchResultIsNone();
}

// this functions tell you if you are allowed the GPS to be accessed.
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
  infoWindow.open(map);

}

function checkSearchResultIsNone(){
  if (searchResults.length === 0){
    alert('Outside of walking distance.');
  }
}
