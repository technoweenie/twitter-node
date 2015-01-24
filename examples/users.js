'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('users/lookup', {}, function(err, data){});
client.get('users/show', {}, function(err, data){});
client.get('users/search', {}, function(err, data){});
client.get('users/contributees', {}, function(err, data){});
client.get('users/contributors', {}, function(err, data){});
client.get('users/suggestions/:slug', {}, function(err, data){});
client.get('users/suggestions', {}, function(err, data){});
client.get('users/suggestions/:slug/members', {}, function(err, data){});
client.post('users/report_spam', {}, function(err, data){});
client.get('users/profile_banner', {}, function(err, data){});
