'use strict';

var app = app || {};
(function(module) {
  const view = {};
  let item = {};

  $('#pokemon, #side-image').hide();

  // builds the according
  view.accordPopulate = function() {
    $('.search-details').show();
    $('#info').hide();
    $('search').empty();
    $('.main').show();
    $('#pokemon').hide();
    $('#searchHistory').hide();
    $('#side-image').show();

    let template = Handlebars.compile($('#results-template').text());
    app.mainPage.ordSearchResults.map(place => {$('.search-details').append(template(place));})

    // adding the eventListener to each button
    var acc = $('.accordion');
    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener('click', function() {
        this.classList.toggle('active');
        var panel = this.nextElementSibling;
        if (panel.style.display === 'block') {
          $(this.nextElementSibling).slideUp(200);
        } else {
          $('.panel').slideUp(300);
          $(this.nextElementSibling).slideDown(200);
          item = this.firstChild.innerHTML;
          view.highLightMarker();
        }
      });
    }
  }

  view.highLightMarker = function() {
    for (var i = 0; i < app.mainPage.markers.length; i++) {
      if (app.mainPage.markers[i].name === item) {
        app.mainPage.markers[i].setIcon('http://maps.gstatic.com/mapfiles/ms2/micons/blue.png')
      } else {
        app.mainPage.markers[i].setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png')
      }
    }
  }

  // builds the loading screen
  view.loadingScreen = function(){
    $('#pokemon').show();
    $('#side-image').hide();
    $('.main').hide()
    $('.search-details').hide();
    $('.us').hide();
    $('#map').show();
  }

  // the hamburger MENU
  $(document).ready(function(){
    $('.hamburger-shell').click(function(){
      $('#menu').slideToggle(300);
      $('.top').toggleClass('rotate');
      $('.middle').toggleClass('rotate-back');
      $('.menu-name').toggleClass('bump');
      $('.bg-cover').toggleClass('reveal');
    });
    $('.searchHistory, .about, .home').click(function(){
      $('#menu').slideToggle(300);
      $('.top').toggleClass('rotate');
      $('.middle').toggleClass('rotate-back');
      $('.menu-name').toggleClass('bump');
      $('.bg-cover').toggleClass('reveal');
    })
  });

  // button click to start search
  $('#search-btn').on('click', function(){
    app.mainPage.initMap(event);
    view.loadingScreen();
  })

  // for main page
  $('.home').on('click', function(){
    // location.reload(); // this is for reseting the map
    $('.container').hide();
    $('#pokemon, #side-image').hide();
    $('#pokemon').hide();
    $('.main').show();
    $('#side-image').hide();
    app.mapMake.mapCreate();
  })

  // for the searchHistory page
  $('.searchHistory').on('click', function(){
    $('.container').hide();
    $('#searchHistory').empty();
    $('#searchHistory').html(localStorage.getItem('searchHistory'));
    $('#searchHistory').fadeIn(1000);
  })

  // for the about page
  $('.about').on('click', function(){
    $('.container').hide();
    $('.us').fadeIn(1000);
    $('#pokemon, #side-image').hide();
  })

  // resets the input to being blanks
  $('#search').click(function() {
    this.value = '';
  });

  module.view = view;

}) (app)
