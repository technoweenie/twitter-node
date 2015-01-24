'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('lists/list', {}, function(err, data){});
client.get('lists/statuses', {}, function(err, data){});
client.post('lists/members/destroy', {}, function(err, data){});
client.get('lists/memberships', {}, function(err, data){});
client.get('lists/subscribers', {}, function(err, data){});
client.post('lists/subscribers/create', {}, function(err, data){});
client.get('lists/subscribers/show', {}, function(err, data){});
client.post('lists/subscribers/destroy', {}, function(err, data){});
client.post('lists/members/create_all', {}, function(err, data){});
client.get('lists/members/show', {}, function(err, data){});
client.get('lists/members', {}, function(err, data){});
client.post('lists/members/create', {}, function(err, data){});
client.post('lists/destroy', {}, function(err, data){});
client.post('lists/update', {}, function(err, data){});
client.post('lists/create', {}, function(err, data){});
client.get('lists/show', {}, function(err, data){});
client.get('lists/subscriptions', {}, function(err, data){});
client.post('lists/members/destroy_all', {}, function(err, data){});
client.get('lists/ownerships', {}, function(err, data){});
