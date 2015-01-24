'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('friendships/no_retweets/ids', {}, function(err, data){});
client.get('friendships/incoming', {}, function(err, data){});
client.get('friendships/outgoing', {}, function(err, data){});
client.post('friendships/create', {}, function(err, data){});
client.post('friendships/destroy', {}, function(err, data){});
client.post('friendships/update', {}, function(err, data){});
client.get('friendships/show', {}, function(err, data){});
client.get('friendships/lookup', {}, function(err, data){});
