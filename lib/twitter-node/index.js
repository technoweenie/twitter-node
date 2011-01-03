var http         = require('http'),
    query        = require('querystring'),
    Parser       = require('./parser'),
    EventEmitter = require('events').EventEmitter,
    Buffer       = require('buffer').Buffer;

// process.mixin is gone, a function for replacement
function extend(a, b) {
  Object.keys(b).forEach(function (key) {
    a[key] = b[key];
  });
  return a;
}

// Creates a streaming connection with twitter, and pushes any incoming
// statuses to a tweet event.
//
// options - optional Object that specifies custom configuration values.
//
// Valid option keys:
//
// port      - Integer of proxy port
// host      - String or ip address of the proxy server.  Defaults to 'stream.twitter.com'.
// path      - String of the base path for the request.
// action    - String part of the URL that specifies what to query for.
// track     - Array of keywords to filter.  See track()
// following - Array of userIDs to filter.  See follow()
// locations - Array of lat/long tuples.  See location()
// params    - Extra HTTP params Object to send with the request.
// user      - String Twitter login name or email.
// password  - String Twitter password.
//
// Returns TwitterNode instance.
var TwitterNode = exports.TwitterNode = function(options) {
  EventEmitter.call(this);
  if(!options) options = {};
  var self           = this;
  this.port          = options.port      || 80;
  this.host          = options.host      || 'stream.twitter.com';
  this.path          = options.path      || '/1/statuses/';
  this.action        = options.action    || 'filter';
  this.trackKeywords = options.track     || [];
  this.following     = options.follow    || [];
  this.locations     = options.locations || [];
  this.params        = options.params    || {};
  this.user          = options.user;
  this.password      = options.password;
  this.headers       = { "User-Agent": 'Twitter-Node' };
  this.debug         = false;
  this.parser        = new Parser();
  this.parser.addListener('object', processJSONObject(this));
  this.parser.addListener('error', function (error) {
    self.emit('error', new Error('TwitterNode parser error: ' + error.message));
  });
  if (options.headers) {
    extend(this.headers, options.headers);
  }
}

TwitterNode.prototype = Object.create(EventEmitter.prototype);

// Track the following keyword.  If called multiple times, all words are sent
// as a comma-separated parameter to Twitter.
//
// See: http://apiwiki.twitter.com/Streaming-API-Documentation#track
//
// word - String word to track.
//
// Returns nothing.
TwitterNode.prototype.track = function track(word) {
  this.trackKeywords.push(word);
  return this;
};

// Follow the given twitter user (specified by their userID, not screen name)
// If called multiple times, all userIDs are sent as a comma-separated
// parameter to Twitter.
//
// See: http://apiwiki.twitter.com/Streaming-API-Documentation#follow
//
// userID - Integer userID to track.
//
// Returns nothing.
TwitterNode.prototype.follow = function follow(userId) {
  this.following.push(userId);
  return this;
};

// Match tweets in the given bounding box.
//
// See: http://apiwiki.twitter.com/Streaming-API-Documentation#locations
//
// Example: location(-122.75, 36.8, -121.75, 37.8) // SF
//
// lng1, lat1 - southwest corner of the bounding box.
// lng2, lat2 - northeast corner.
//
// Returns nothing.
TwitterNode.prototype.location = function location(lng1, lat1, lng2, lat2) {
  this.locations.push(lng1, lat1, lng2, lat2)
  return this;
};

TwitterNode.prototype.stream = function stream() {
  if (this._clientResponse && this._clientResponse.connection) {
    this._clientResponse.socket.end();
  }

  if (this.action === 'filter' && this.buildParams() === '') return;

  var client  = this._createClient(this.port, this.host),
      headers = extend({}, this.headers),
      twit    = this,
      request;

  headers['Host'] = this.host;

  if (this.user) {
    headers['Authorization'] = basicAuth(this.user, this.password);
  }

  request = client.request("GET", this.requestUrl(), headers);

  request.addListener('response', function(response) {
    twit._clientResponse = response;

    response.addListener('data', function(chunk) {
      twit._receive(chunk);
    });

    response.addListener('end', function() {
      twit.emit('end', this);
      twit.emit('close', this);
    });
  });
  request.end();
  return this;
};

// UTILITY METHODS

// Passes the received data to the streaming JSON parser.
//
// chunk - String data received from the HTTP stream.
//
// Returns nothing.
TwitterNode.prototype._receive = function(chunk) {
  this.parser.receive(chunk);
  return this;
};

// Creates the HTTP client object for the stream connection.  Override this
// to pass in your own client if needed.
//
// port - Integer port number to connect to.
// host - String host name to connect to.
//
// returns Http Client instance.
TwitterNode.prototype._createClient = function(port, host) {
  return http.createClient(port, host)
};

// Builds the URL for the streaming request.
//
// Returns a String absolute URL.
TwitterNode.prototype.requestUrl = function() {
  return this.path + this.action + ".json" + this.buildParams();
};

// Builds the GET params for the streaming request.
//
// Returns URI encoded string: "?track=LOST"
TwitterNode.prototype.buildParams = function() {
  var options = {};
  extend(options, this.params);
  if (this.trackKeywords.length > 0) options.track = this.trackKeywords.join(",");
  if (this.following.length > 0)     options.follow = this.following.join(",");
  if (this.locations.length > 0)     options.locations = this.locations.join(",");
  if (options.track || options.follow || options.locations) {
    return "?" + query.stringify(options);
  }
  return "";
};

// Base64 encodes the given username and password.
//
// user - String Twitter screen name or email.
// pass - String password.
//
// Returns a Basic Auth header fit for HTTP.
var basicAuth = function basicAuth(user, pass) {
  return "Basic " + new Buffer(user + ":" + pass).toString('base64');
};

// Creates a callback for the object Event of the JSON Parser.
//
// twit - an instance of this TwitterNode.
//
// Returns a function to be passed to the addListener call on the parser.
var processJSONObject = function processJSONObject(twit) {
  return function(tweet) {
    if (tweet.limit) {
      twit.emit('limit', tweet.limit);
    } else if (tweet['delete']) {
      twit.emit('delete', tweet['delete']);
    } else {
      twit.emit('tweet', tweet);
    }
  };
};
