'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('account/settings', {}, function(err, data){});
client.get('account/verify_credentials', {}, function(err, data){});
client.post('account/settings', {}, function(err, data){});
client.post('account/update_delivery_device', {}, function(err, data){});
client.post('account/update_profile', {}, function(err, data){});
client.post('account/update_profile_background_image', {}, function(err, data){});
client.post('account/update_profile_image', {}, function(err, data){});
client.post('account/remove_profile_banner', {}, function(err, data){});
client.post('account/update_profile_banner', {}, function(err, data){});
