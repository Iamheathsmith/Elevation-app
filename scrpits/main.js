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

function SearchResultsObject(name, add, hours, dis, duration, ele, rating, elecomp, imgUrl, ed, placeId) {
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
  this.placeId = placeId;
}

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
        emptyArray();
        elevatonPos();
        searchNear();
        centerMarker();

        // For every input log to History Tab
        let now = Date().split(' ').slice(0, 5).join(' ');
        localStorage.searchHistory += `${now}- ${$('#search').val()} <br> `;

      }, function() {
        handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

// search near by for places
function searchNear() {
  let request = {
    location: pos,
    rankBy: google.maps.places.RankBy.DISTANCE,
    // radius: '800', //in meters
    keyword: [$('#search').val()]// search by keyword
  };
  let service = new google.maps.places.PlacesService(map);
  service.nearbySearch(request, processResults);
}

// empty the starting array back to zero
function emptyArray() {
  des = [];
  searchResults = [];
  $('.search-details').empty();
}

// get the elevation at my locations
function elevatonPos() {
  var elevator = new google.maps.ElevationService;
  getElevationPos(elevator);

  function getElevationPos(elevator) {
    elevator.getElevationForLocations({
      locations: [pos],
    }, function(response) {
      elevPos = (Math.floor(response[0].elevation*3.28))
    })
  }
}

function processResults(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (let i = 0; i < 10; i++) {
      createMarker(results[i])
      des.push({
        lat: results[i].geometry.location.lat(),
        lng: results[i].geometry.location.lng(),
      })
      searchResults.push(new SearchResultsObject(results[i].name, results[i].vicinity, null, 0, 0, 0, null,0));
      searchResults[i].rating = (results[i].rating) ? results[i].rating : 'no raiting Available';
      searchResults[i].imgUrl = (results[i].photos) ? results[i].photos[0].getUrl({maxWidth: 1000}) : 'img/Sorry-Image-Not-Available.png';
      searchResults[i].id = results[i].place_id;
    }
    // console.log(results);
  }
  let distance = new google.maps.DistanceMatrixService;
  statusD = distanceLocation(distance);
  let elevator = new google.maps.ElevationService;
  statusE = displayLocationElevation(elevator);

  setTimeout(equivdistCalc, 500);
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

function createMarker(place) {
  let service = new google.maps.places.PlacesService(map);
  let infoWindow = new google.maps.InfoWindow();
  service.getDetails({
    placeId: place.place_id
  }, function(place, status) {
    let today = new Date();
    let weekday = !today.getDay() ? 6 : today.getDay() - 1;
    let hourTest = (place.opening_hours) ? (place.opening_hours.weekday_text[weekday]) : 'No Hours Provided'
    hours.push(hourTest);
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
      });
      // console.log(place);
      infoWindow.setContent('<div id="name">' + place.name + '</div>' +
        'Address: ' + place.formatted_address + '<br>' +
        'Hours: ' + hourTest + '<br>' + 'Phone: '+ place.formatted_phone_number + '<br>' + '</div>');

      google.maps.event.addListener(marker, 'click', function(event) {
        infoWindow.open(map, marker);
      });

      google.maps.event.addListener(map, 'click', function(event) {
        infoWindow.close();
      });
    }
  });
}

//calculate distance
function distanceLocation(distance) {
  for (let i = 0; i < searchResults.length; i++) {
    distance.getDistanceMatrix({
      origins: [pos],
      destinations: [des[i]],
      travelMode: google.maps.TravelMode.WALKING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    }, function(results) {
      searchResults[i].distance = Number((results.rows[0].elements[0].distance.text).substr(0,(results.rows[0].elements[0].distance.text).length-3));
      searchResults[i].duration = Number((results.rows[0].elements[0].duration.text).substr(0,(results.rows[0].elements[0].duration.text).length-5));
      if (i === searchResults.length) {statusD = true;}
    })
  }
  return statusD;
}

// calculate elevation
function displayLocationElevation(elevator) {
  for (let i = 0; i < searchResults.length; i++) {
    elevator.getElevationForLocations({
      locations: [des[i]],
    }, function(response) {
      searchResults[i].elevation = Math.floor(response[0].elevation*3.28);
      searchResults[i].elevationcomp = searchResults[i].elevation - elevPos;
      if (i === searchResults.length) {statusE = true;}
    });
  }
  return statusE;
}

// removing items that are over .6 miles awayive
function removeItems() {
  for (let i = 0; i < searchResults.length; i++) {
    if (searchResults[i].equivdist > 0.6) {
      searchResults.splice(i);
    }
  }
}

// applying Naismiths formula
function equivdistCalc() {
  for (let i = 0; i < searchResults.length; i++) {
    let naismith_ed = ((((searchResults[i].distance*1.6) + (7.92*Math.abs(searchResults[i].elevationcomp*.3048/1000))))*0.62);
    searchResults[i].equivdist = Number(naismith_ed.toPrecision(2));
    searchResults[i].storeHours = hours[i];
  }
  // searchResults.sort((a, b) => {return a.equivdist - b.equivdist;});
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
