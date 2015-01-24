'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

/**
 * Get a place by id
 **/
var placeId = "df51dec6f4ee2b2c";
client.get('/geo/id/' + placeId, function(err, payload){
  console.log(err);
  console.log(payload);
});

/**
 * Reverse Geocode
 **/
var coordinates = {lat: 'XXX', long: 'XXX'};
client.get('/geo/reverse_geocode', coordinates,  function(err, payload){
  console.log(err);
  console.log(payload);
});

/**
 * Find similar places
 **/
var place = {name: 'NAME', lat: 'XXX', long: 'XXX'};
client.get('/geo/similar_places', place,  function(err, payload){
  console.log(err);
  console.log(payload);
});

/**
 * Search for a place
 **/
client.get('/geo/search', {query: 'Long Island City'},  function(err, payload){
  console.log(err);
  console.log(payload);
});
