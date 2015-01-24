'use strict';

var Twitter = require('../lib/twitter');

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

client.get('statuses/user_timeline', {}, function(err, data){});
client.get('statuses/home_timeline', {}, function(err, data){});
client.get('statuses/retweets_of_me', {}, function(err, data){});
client.get('statuses/retweets/:id', {}, function(err, data){});
client.get('statuses/show/:id', {}, function(err, data){});
client.post('statuses/destroy/:id', {}, function(err, data){});
client.post('statuses/update', {}, function(err, data){});
client.post('statuses/retweet/:id', {}, function(err, data){});
client.post('statuses/update_with_media', {}, function(err, data){});
client.get('statuses/oembed', {}, function(err, data){});
client.get('statuses/retweeters/ids', {}, function(err, data){});
client.get('statuses/lookup', {}, function(err, data){});
