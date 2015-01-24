'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

/**
 * Get Favorites
 **/
client.get('/favorites/list', function(err, payload){
  console.log(err);
  console.log(payload);
});

/**
 * Create Favorite
 **/
client.post('/favorites/create', {id: 'TWEET_ID'},  function(err, payload){
  console.log(err);
  console.log(payload);
});

/**
 * Destroy Favorite
 **/
client.post('/favorites/destroy', {id: 'TWEET_ID'},  function(err, payload){
 console.log(err);
 console.log(payload);
});
