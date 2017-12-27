'use strict';


let map, infoWindow;
let pos = {};
let des = [];
let elevPos = {};
let statusE = false;
let statusD = false;

localStorage.setItem('searchHistory','');
let searchResults = [];

function SearchResultsObject(name, add, openh, dis, duration, ele, rating, elecomp, imgUrl,ed) {
  this.name = name;
  this.address = add;
  this.openhrs = openh
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
//        searchHistory += `${now}- ${$('#search').val()} <br> `;
        localStorage.searchHistory += `${now}- ${$('#search').val()} <br> `;

        let service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, processResults);

        // center map on current Location
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
      searchResults[i].openhrs = (results[i].opening_hours) ? results[i].opening_hours : 'Not Available';
    }
    // console.log(results);
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

  let infowindow = new google.maps.InfoWindow();
  let service = new google.maps.places.PlacesService(map);

  service.getDetails({
    placeId: place.place_id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map
      });
      google.maps.event.addListener(marker, 'click', function() {
        let space = '&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp'
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' +
          'Address: ' + place.formatted_address + '<br>' +
          'Raiting: ' + place.rating + '<br>' + 'Phone: '+ place.formatted_phone_number + '<br>' + 'Open Hours: '+ place.opening_hours.weekday_text[0] + '<br>' + space + place.opening_hours.weekday_text[1] + '<br>' + space + place.opening_hours.weekday_text[2] + '<br>' + space + place.opening_hours.weekday_text[3] + '<br>' + space + place.opening_hours.weekday_text[4] + '<br>' + space + place.opening_hours.weekday_text[6] + '<br>' + '</div>');
        infowindow.open(map, this);
      });
    }
  });
}

// function createMarker(place) {
//   let marker = new google.maps.Marker({
//     position: place.geometry.location,
//     name: place.name,
//     map: map
//   });
//
//   google.maps.event.addListener(marker, 'click', function() {
//     infoWindow.setContent('<div><strong>' + place.name + '</strong><br>' +
//                 'Place ID: ' + place.place_id + '<br>' +
//                 place.formatted_address + '</div>');
//     infoWindow.open(map, this);
//   });
// }

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
