'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('help/configuration', {}, function(err, data){});
client.get('help/languages', {}, function(err, data){});
client.get('help/privacy', {}, function(err, data){});
client.get('help/tos', {}, function(err, data){});
