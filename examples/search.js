var Twitter = require('../lib/twitter');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

/**
 * Search
 **/
client.get('/search/tweets', {q: 'node.js'},  function(err, payload){
  console.log(err);
  console.log(payload);
});
