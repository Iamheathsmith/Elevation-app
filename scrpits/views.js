'use strict';

// builds the according
function accordPopulate() {
  $('.search-details').show();
  $('#info').hide();
  $('search').empty();
  $('.main').show();
  $('#pokemon').hide();
  $('#searchHistory').hide();
  $('#side-image').show();

  let template = Handlebars.compile($('#results-template').text());
  searchResults.map(place => {$('.search-details').append(template(place));})

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
      }
    });
  }
}

// builds the loading screen
var pikachu = $('#pokemon, #side-image').hide();
function loadingScreen(){
  $('#pokemon').show();
  $('#side-image').hide();
  $('.main').hide()
  $('.search-details').hide();
  $('.us').hide();
  $('#map').show();
}

$('#search-btn').on('click', function(){
  initMap(event);
  loadingScreen();
})

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

// for the about page
$('.about').on('click', function(){
  $('.container').hide();
  $('.us').fadeIn(1000);
})


// for main page
$('.home').on('click', function(){
  // location.reload(); // this is for reseting the map
  $('.container').hide();
  $('#pokemon').hide();
  $('.main').show();
  $('#side-image').hide();
  app.mapMake.mapCreate();
})

// for the searchHistory page
$('.searchHistory').on('click', function(){
  $('.container').hide();
  $('#searchHistory').empty();
  $('#searchHistory').html(localStorage.getItem("searchHistory"));
  $('#searchHistory').fadeIn(1000);
})

$("#search").click(function() {
  this.value = '';
});
