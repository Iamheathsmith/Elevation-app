'use strict';

var app = app || {};

(function(module) {
  const mainPage = {}

  let map, infoWindow;
  let pos = {};
  let des = [];
  let elevPos = {};
  let statusE = false;
  let statusD = false;
  let hours = [];
  let ordSearchResults = [];
  let phone = [];
  let markers = [];

  localStorage.setItem('searchHistory', '');
  let searchResults = [];

  mainPage.SearchResultsObject = function(name, add, dis, duration, ele, rating, elecomp, imgUrl, ed) {
    this.name = name;
    this.address = add;
    this.distance = dis;
    this.duration = duration;
    this.elevation = ele;
    this.rating = rating;
    this.elevationcomp = elecomp;
    this.imgUrl = imgUrl;
    this.equivdist = ed;
  }

  mainPage.initMap = function(e) {
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
          mainPage.emptyArray();
          mainPage.elevatonPos();
          mainPage.searchNear();
          mainPage.centerMarker();

          // For every input log to History Tab
          let now = Date().split(' ').slice(0, 5).join(' ');
          localStorage.searchHistory += `${now}- ${$('#search').val()} <br> `;

        },
        function() {
          mainPage.handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      mainPage.handleLocationError(false, infoWindow, map.getCenter());
    }
  }

  // search near by for places
  mainPage.searchNear = function() {
    let request = {
      location: pos,
      rankBy: google.maps.places.RankBy.DISTANCE,
      keyword: [$('#search').val()] // search by keyword
    };
    let service = new google.maps.places.PlacesService(app.mapMake.map);
    service.nearbySearch(request, mainPage.processResults);
  }

  // empty the starting array back to zero
  mainPage.emptyArray = function() {
    hours = [];
    des = [];
    searchResults = [];
    ordSearchResults = [];
    $('.search-details').empty();
  }

  // get the elevation at my locations
  mainPage.elevatonPos = function() {
    let elevator = new google.maps.ElevationService;
    elevator.getElevationForLocations({
      locations: [pos],
    }, function(response) {
      elevPos = (Math.floor(response[0].elevation * 3.28))
    })
  }

  mainPage.processResults = function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let conter = (results.length < 10) ? results.length : 10;
      for (let i = 0; i < conter; i++) {
        des.push({
          lat: results[i].geometry.location.lat(),
          lng: results[i].geometry.location.lng(),
        })
        searchResults.push(new mainPage.SearchResultsObject(results[i].name, results[i].vicinity, null, 0, 0, 0, null, 0));
        searchResults[i].rating = (results[i].rating) ? results[i].rating : 'no raiting Available';
        searchResults[i].imgUrl = (results[i].photos) ? results[i].photos[0].getUrl({
          maxWidth: 1000
        }) : 'img/Sorry-Image-Not-Available.png';
        searchResults[i].id = results[i].place_id;
        mainPage.getPlaceInfo(searchResults[i].id)
      }
      // console.log(results);
    }
    let distance = new google.maps.DistanceMatrixService;
    statusD = mainPage.distanceLocation(distance);
    let elevator = new google.maps.ElevationService;
    statusE = mainPage.displayLocationElevation(elevator);

    setTimeout(mainPage.equivdistCalc, 1000);
  }

  mainPage.centerMarker = function() {
    let marker = new google.maps.Marker({
      position: pos,
      icon: 'img/green-dot.png',
      animation: google.maps.Animation.DROP,
      map: app.mapMake.map
    });
    app.mapMake.map.setCenter(pos);
  }

  mainPage.getPlaceInfo = function(place) {
    let service = new google.maps.places.PlacesService(app.mapMake.map);
    service.getDetails({
      placeId: place
    }, function(place) {
      let today = new Date();
      let weekday = !today.getDay() ? 6 : today.getDay() - 1;
      let hourTest = (place.opening_hours) ? (place.opening_hours.weekday_text[weekday]) : 'No Hours Provided';
      hours.push(hourTest);
      phone.push((place.formatted_phone_number) ? place.formatted_phone_number : 'No phone Number')
      // console.log(place);
    });
  }

  mainPage.buildMarker = function(place) {
    let tempMarkers = [];
    for (var i = 0; i < ordSearchResults.length; i++) {
      let marker = new google.maps.Marker({
        position: ordSearchResults[i].latLog,
        map: app.mapMake.map,
        icon: 'img/red-dot.png',
        name: ordSearchResults[i].name,
      });
      // console.log(ordSearchResults);
      let linkAddress = '<a href="https://www.google.com/maps/?q=(' + ordSearchResults[i].address + ')">View on Google Maps</a>'
      let infoWindow = new google.maps.InfoWindow({
        Content: '<div id="name">' + ordSearchResults[i].name + '</div>' + '<div id="infoWindow">' + ordSearchResults[i].address + '<br>' + linkAddress + '<br>' + '</div>'
      });

      google.maps.event.addListener(marker, 'click', function(event) {
        i
        infoWindow.open(map, marker);
      });
      google.maps.event.addListener(app.mapMake.map, 'click', function(event) {
        infoWindow.close();
      });
      tempMarkers.push(marker);
    }
    markers = tempMarkers;
    mainPage.markers = markers;
    mainPage.zoomeExtends();
    // setTimeout(mainPage.zoomeExtends(), 0);
  }

  mainPage.zoomeExtends = function() {
    let bounds = new google.maps.LatLngBounds();
    if (markers.length > 0) {
      for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
      }
      bounds.extend(pos);
      app.mapMake.map.fitBounds(bounds);
    }
    if (app.mapMake.map.getZoom() > 15) {
      app.mapMake.map.setZoom(15);
      app.mapMake.map.setCenter(bounds.getCenter(pos));
    }
  }

  //calculate distance
  mainPage.distanceLocation = function(distance) {
    for (let i = 0; i < searchResults.length; i++) {
      distance.getDistanceMatrix({
        origins: [pos],
        destinations: [des[i]],
        travelMode: google.maps.TravelMode.WALKING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      }, function(results) {
        searchResults[i].distance = results.rows[0].elements[0].distance.text;
        Number((results.rows[0].elements[0].distance.text).substr(0, (results.rows[0].elements[0].distance.text).length - 3));
        searchResults[i].duration = Number((results.rows[0].elements[0].duration.text).substr(0, (results.rows[0].elements[0].duration.text).length - 5));
        if (i === searchResults.length) {
          statusD = true;
        }
      })
      searchResults[i].latLog = des[i];
    }
    return statusD;
  }

  // calculate elevation
  mainPage.displayLocationElevation = function(elevator) {
    for (let i = 0; i < searchResults.length; i++) {
      elevator.getElevationForLocations({
        locations: [des[i]],
      }, function(response) {
        searchResults[i].elevation = Math.floor(response[0].elevation * 3.28);
        searchResults[i].elevationcomp = searchResults[i].elevation - elevPos;
        if (i === searchResults.length) {
          statusE = true;
        }
      });
    }
    return statusE;
  }

  // removing items that are over .6 miles awayive
  mainPage.removeItems = function() {
    for (let i = ordSearchResults.length - 1; i >= 0; i--) {
      let test = ordSearchResults[i].distance;
      let dis = $('input[name="ans1"]:checked').val() ? $('input[name="ans1"]:checked').val() : 0.99;
      if (ordSearchResults[i].equivdist >= dis && test.indexOf('mi') !== -1) {
        ordSearchResults.splice(i, 1);
      }
    }
    mainPage.addUnits();
  }

  mainPage.addUnits = function() {
    for (let i = ordSearchResults.length - 1; i >= 0; i--) {
      let unit = ordSearchResults[i].equivdist.toString();
      let test = ordSearchResults[i].distance;
      if (test.indexOf('mi') !== -1) {
        ordSearchResults[i].equivdist = unit.concat(' Miles');
      } else {
        ordSearchResults[i].equivdist = unit.concat(' Feet');
      }
      if (ordSearchResults[i].latLog) {
        mainPage.buildMarker(ordSearchResults[i].id);
      }
    }
  }

  // applying Naismiths formula
  mainPage.equivdistCalc = function() {
    for (let i = 0; i < searchResults.length; i++) {
      let test = searchResults[i].distance;
      if (test.indexOf('ft') !== -1) {
        ordSearchResults.push(searchResults[i]);
      }
      let naismith_ed = ((((Number((searchResults[i].distance).substr(0, (searchResults[i].distance).length - 3)) * 1.6) + (7.92 * Math.abs(searchResults[i].elevationcomp * .3048 / 1000)))) * 0.62);
      searchResults[i].equivdist = Number(naismith_ed.toPrecision(2));
      searchResults[i].storeHours = hours[i];
      searchResults[i].phone = phone[i];
    }
    searchResults.sort((a, b) => {
      return a.equivdist - b.equivdist;
    });
    ordSearchResults = ordSearchResults.concat(searchResults);
    mainPage.removedups();
    mainPage.removeItems();
    mainPage.checkSearchResultIsNone();
    mainPage.ordSearchResults = ordSearchResults;
    app.view.accordPopulate();
  }

  // remove duplicate items
  mainPage.removedups = function() {
    let finalSearchResults = [];
    let unique = {};
    ordSearchResults.forEach(function(item) {
      if (!unique[item.id]) {
        finalSearchResults.push(item);
        unique[item.id] = item;
      }
    });
    ordSearchResults = finalSearchResults;
  }

  // this functions tell you if you are allowed the GPS to be accessed.
  mainPage.handleLocationError = function(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
      'Error: The Geolocation service failed.' :
      'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);

  }

  mainPage.checkSearchResultIsNone = function() {
    if (ordSearchResults.length === 0) {
      alert('Outside of walking distance.');
    }
  }
  module.mainPage = mainPage;

})(app)
