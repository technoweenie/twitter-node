Twitter for Node.js  [![NPM](https://nodei.co/npm/twitter.png?mini=true)](https://nodei.co/npm/twitter/) [![wercker status](https://app.wercker.com/status/624dbe8ad011852d1e01d7dc03941fc5/s/master "wercker status")](https://app.wercker.com/project/bykey/624dbe8ad011852d1e01d7dc03941fc5)
======================================

[node-twitter](https://github.com/desmondmorris/node-twitter) aims to provide a complete, asynchronous client library for the Twitter API, including the REST, search and streaming endpoints. It's a fork of [@jdub](https://github.com/jdub)'s [twitter-node](https://github.com/jdub) which was inspired by, and used some code from, [@technoweenie](https://github.com/technoweenie)'s [twitter-node](https://github.com/technoweenie/twitter-node).

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

## [1.x Changes](https://github.com/desmondmorris/node-twitter/wiki/1.x)

## LICENSE

node-twitter: Copyright (c) 2014 Desmond Morris

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
