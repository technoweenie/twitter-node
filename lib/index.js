var sys = require('sys'), 
   http = require('http'),
    b64 = require('./base64'),
  query = require('querystring'),
 parser = require('./streaming_json_parser')

// process.mixin is gone, a function for replacement
function extend(a, b) {
  var prop;
  for (prop in Object.keys(b)) {
    a[prop] = b[prop];
  }
  return a;
} 

// Creates a streaming connection with twitter, and pushes any incoming
// statuses to a tweet event.
//
// options - optional Object that specifies custom configuration values.
//
// Valid option keys:
//
// port      - Integer of the streaming api connection port.  Defaults to 80.
// host      - String of the streaming api host.  Defaults to 'stream.twitter.com'.
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
  if(!options) options = {}
  this.port          = options.port      || 80
  this.host          = options.host      || 'stream.twitter.com'
  this.path          = options.path      || '/1/statuses/'
  this.action        = options.action    || 'filter'
  this.trackKeywords = options.track     || []
  this.following     = options.follow    || []
  this.locations     = options.locations || []
  this.params        = options.params    || {}
  this.user          = options.user
  this.password      = options.password
  this.headers       = {"User-Agent": 'Twitter-Node: node.js streaming client'}
  this.debug         = false
  this.parser = new parser.instance();
  this.parser.addListener('object', this.processJSONObject(this))
  if(options.headers) {
    extend(this.headers, options.headers)
  }
}

TwitterNode.prototype = Object.create(process.EventEmitter.prototype);

// Track the following keyword.  If called multiple times, all words are sent
// as a comma-separated parameter to Twitter.
//
// See: http://apiwiki.twitter.com/Streaming-API-Documentation#track
//
// word - String word to track.
//
// Returns nothing.
TwitterNode.prototype.track = function(word) {
  this.trackKeywords.push(word);
}

// Follow the given twitter user (specified by their userID, not screen name)
// If called multiple times, all userIDs are sent as a comma-separated
// parameter to Twitter.
//
// See: http://apiwiki.twitter.com/Streaming-API-Documentation#follow
//
// userID - Integer userID to track.
//
// Returns nothing.
TwitterNode.prototype.follow = function(userId) {
  this.following.push(userId);
}

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
TwitterNode.prototype.location = function(lng1, lat1, lng2, lat2) {
  this.locations.push(lng1, lat1, lng2, lat2)
}

TwitterNode.prototype.stream = function() {
  var client = this.createClient(this.port, this.host),
     headers = extend({}, this.headers),
        twit = this,
     request;

  headers['Host'] = this.host
  if (this.user)
    headers['Authorization'] = this.basicAuth(this.user, this.password)

  request = client.request("GET", this.requestUrl(), headers);

  request.addListener('response', function(response) {
    if (twit._clientResponse && twit._clientResponse.connection) {
      twit._clientResponse.connection.end();
    }
    twit._clientResponse = response;

    response.setBodyEncoding('utf8');
    response.addListener('data', function(chunk) {
      twit.receive(chunk);
    });
    response.addListener('end', function() {
      twit.emit('end',   this);
      twit.emit('close', this);
    });
  });
  request.end();
  return this;
};

// UTILITY METHODS

// Creates a callback for the object Event of the JSON Parser.
//
// twit - an instance of this TwitterNode.
//
// Returns a function to be passed to the addListener call on the parser.
TwitterNode.prototype.processJSONObject = function(twit) {
  return function(tweet) {
    if(tweet.limit) {
      twit.emit('limit', tweet.limit)
    } else if(tweet['delete']) {
      twit.emit('delete', tweet['delete'])
    } else {
      twit.emit('tweet', tweet)
    }
  }
}

// Passes the received data to the streaming JSON parser.
//
// chunk - String data received from the HTTP stream.
//
// Returns nothing.
TwitterNode.prototype.receive = function(chunk) {
  this.parser.receive(chunk);
};

// Creates the HTTP client object for the stream connection.  Override this
// to pass in your own client if needed.
//
// port - Integer port number to connect to.
// host - String host name to connect to.
//
// returns Http Client instance.
TwitterNode.prototype.createClient = function(port, host) {
  return http.createClient(this.port, this.host)
};

// Base64 encodes the given username and password.
//
// user - String Twitter screen name or email.
// pass - String password.
//
// Returns a Basic Auth header fit for HTTP.
TwitterNode.prototype.basicAuth = function(user, pass) {
  return "Basic " + b64.encode(user + ":" + pass)
};

// Builds the URL for the streaming request.
//
// Returns a String absolute URL.
TwitterNode.prototype.requestUrl = function() {
  return this.path + this.action + ".json" + this.buildParams()
};

// Builds the GET params for the streaming request.
//
// Returns URI encoded string: "?track=LOST"
TwitterNode.prototype.buildParams = function() {
  var options = {}
  extend(options, this.params)
  if(this.trackKeywords.length > 0)
    options.track = this.trackKeywords.join(",")
  if(this.following.length > 0)
    options.follow = this.following.join(",")
  if(this.locations.length > 0)
    options.locations = this.locations.join(",")
  if(options.track || options.follow || options.locations)
    return "?" + query.stringify(options)
  else
    return ""
};
