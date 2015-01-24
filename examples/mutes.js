'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.post('mutes/users/create', {}, function(err, data){});
client.post('mutes/users/destroy', {}, function(err, data){});
client.get('mutes/users/ids', {}, function(err, data){});
client.get('mutes/users/list', {}, function(err, data){});
