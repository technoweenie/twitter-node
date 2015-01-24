'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('direct_messages/sent', {}, function(err, data){});
client.get('direct_messages/show', {}, function(err, data){});
client.get('diret_messages', {}, function(err, data){});
client.post('direct_messages/destroy', {}, function(err, data){});
client.post('direct_messages/new', {}, function(err, data){});
