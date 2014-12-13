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
// client.getFavorites(function(err, payload){
//   console.log(err);
//   console.log(payload);
// });

client.get('/favorites/list', function(err, payload){
  console.log(err);
  console.log(payload);
});

/**
 * Create Favorite
//  **/
// client.deleteFavorite({id: '535121766117408768'}, function(err, payload){
//   console.log(payload);
// });

/**
 * Destroy Favorite
 **/
// client.destroyFavorite({id: 'XXXXX'}, function(payload){
//   console.log(payload);
// });
