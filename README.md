Twitter for Node.js [![NPM](https://nodei.co/npm/twitter.png?mini=true)](https://nodei.co/npm/twitter/)
======================================


[node-twitter](https://github.com/desmondmorris/node-twitter) aims to provide a complete, asynchronous client library for the Twitter API, including the REST, search and streaming endpoints. It's a fork of [@jdub](https://github.com/jdub)'s [twitter-node](https://github.com/jdub) which was inspired by, and used some code from, [@technoweenie](https://github.com/technoweenie)'s [twitter-node](https://github.com/technoweenie/twitter-node).

## 1.x

This library pre-1.x is comprised of patterns and an API that has been mostly un-changed since its inception.  The 1.x branch is an effort to:

* Introduce a more standard callback pattern https://github.com/desmondmorris/node-twitter/issues/23
* Support for all 1.1 and future endpoints
* Add test coverage (Planned)
* Add better examples and documentation (Planned)

### Migrating to 1.x

There are two major changes in 1.x:

**An updated callback pattern**

This has been the most popular feature request in this project and rightfully so.

The new callback pattern is as follows:

````
/**
* I am a callback.
*
* error An error object
* body The payload from the API request
* response The raw response object from the oauth request.  We will keep this in case folks are using it in some way.
*/
function(error, body, response) {}
````

Previously, the `error` and `payload` arguments were ambigous (in the same argument position), causing all sorts of mayhem.

**Deprecate the helper modules**

Helper methods like `getFavorites` and `updateStatus` now include a console warning to use the corresponding `get` and `post` method versions.

So `.getFavorites(callback)` becomes `.get('favorites/list')`.

Why?  Because the helper methods do not scale, meaning - as the API changes we will need to update the helper methods accordingly.

Do not worry, the legacy methods are still available. Though it is recommended to use the above suggested syntax as these will soon go the way of the dinosaurs.


## Installation

`npm install twitter`


## Configuration

You will need valid Twitter developer credentials in the form of a set of consumer and access tokens/keys.  You can get these [here](https://apps.twitter.com/).  Do not forgot to adjust your permissions - most POST request require write permissions.

````
var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});
````

Add your credentials accordingly.  I would use environment variables to keep your private info safe.  So something like:

````
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
	});
````

## Usage

The library comes with two helper methods for `get` and `post` requests.  To use, you simply need to pass the API path and parameters.  Example, lets get a list of favorites:

````
// @see configuration above for the client variable

client.get('favorites/list', function(error, params, response){

	if(error) throw error;

	console.log(params);  // The favorites.

	console.log(response);  // Raw response object.

});

````

How about an example that passes parameters?  Let's post a tweet:

````
// @see configuration above for the client variable

client.post('statuses/update', {status: 'TYBG for twitter'},  function(error, params, response){

  if(error) throw error;

  console.log(params);  // Tweet body.

  console.log(response);  // Raw response object.

});
````

Or even streaming? Let's see whose talking about javascript:

````
// @see configuration above for the client variable

client.stream('statuses/filter', {track: 'javascript'}, function(stream) {

	stream.on('data', function(tweet) {
		console.log(tweet.text);
	});

});
````
