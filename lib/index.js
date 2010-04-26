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
  this.setupJSONParser();
  if(options.headers) {
    extend(this.headers, options.headers)
  }
}

TwitterNode.prototype = Object.create(process.EventEmitter.prototype);

// track the following keyword
// http://apiwiki.twitter.com/Streaming-API-Documentation#track
TwitterNode.prototype.track = function(word) {
  this.trackKeywords.push(word);
}

// follow the given twitter user (specified by their userID, not screen name)
// http://apiwiki.twitter.com/Streaming-API-Documentation#follow
TwitterNode.prototype.follow = function(userId) {
  this.following.push(userId);
}

// match tweets in the given bounding box.
// lng1 and lat1 are the southwest corner
// http://apiwiki.twitter.com/Streaming-API-Documentation#locations
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
      twit.parser.receive(chunk);
    });
    response.addListener('end', function() {
      twit.emit('end', this);
    });
  });
  request.end();
  return this;
};

TwitterNode.prototype.setupJSONParser = function() {
  var twit = this;
  this.parser = new parser.instance();
  this.parser.addListener('object', function(tweet) {
    if(tweet.limit) {
      twit.emit('limit', tweet.limit)
    } else if(tweet['delete']) {
      twit.emit('delete', tweet['delete'])
    } else {
      twit.emit('tweet', tweet)
    }
  })
};

TwitterNode.prototype.receive = function(chunk) {
  this.parser.receive(chunk);
};

// override this to pass in your own client if needed.
TwitterNode.prototype.createClient = function(port, host) {
  return http.createClient(this.port, this.host)
};

TwitterNode.prototype.basicAuth = function(user, pass) {
  return "Basic " + b64.encode(user + ":" + pass)
};

TwitterNode.prototype.requestUrl = function() {
  return this.path + this.action + ".json" + this.buildParams()
};

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
