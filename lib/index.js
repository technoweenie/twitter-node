var sys = require('sys'), 
   http = require('http'),
    b64 = require('./base64'),
  query = require('querystring'),
 parser = require('./streaming_json_parser')

// Creates a streaming connection with twitter, and pushes any incoming
// statuses to a tweet event.
var TwitterNode = exports.TwitterNode = function(options) {
  if(!options) options = {}
  this.port          = options.port   || 80
  this.host          = options.host   || 'stream.twitter.com'
  this.path          = options.path   || '/1/statuses/'
  this.action        = options.action || 'filter'
  this.trackKeywords = options.track  || []
  this.following     = options.follow || []
  this.params        = options.params || {}
  this.user          = options.user
  this.password      = options.password
  this.headers       = {"User-Agent": 'Twitter-Node: node.js streaming client'}
  this.debug         = false
  this.setupJSONParser();
  if(options.headers) {
    process.mixin(this.headers, options.headers)
  }
}

sys.inherits(TwitterNode, process.EventEmitter)

TwitterNode.prototype.track = function(word) {
  this.trackKeywords.push(word);
}

TwitterNode.prototype.follow = function(userId) {
  this.following.push(userId);
}

TwitterNode.prototype.stream = function() {
  var client = this.createClient(this.port, this.host),
     headers = process.mixin({}, this.headers),
        node = this
  headers['Host'] = this.host
  if (this.user)
    headers['Authorization'] = this.basicAuth(this.user, this.password)
  client.request("GET", this.requestUrl(), headers)
    .finish(function(resp) {
      resp.setBodyEncoding("utf8");
      resp.addListener('body', function(chunk) {
        node.parser.receive(chunk)
      });
      resp.addListener('complete', function() {
        node.emit('close', this)
      });
    });
  return this;
}

TwitterNode.prototype.setupJSONParser = function() {
  var node = this;
  this.parser = new parser.instance();
  this.parser.addListener('object', function(tweet) {
    if(tweet.limit) {
      node.emit('limit', tweet.limit)
    } else if(tweet['delete']) {
      node.emit('delete', tweet['delete'])
    } else {
      node.emit('tweet', tweet)
    }
  })
}

TwitterNode.prototype.receive = function(chunk) {
  this.parser.receive(chunk);
}

// override this to pass in your own client if needed.
TwitterNode.prototype.createClient = function(port, host) {
  return http.createClient(this.port, this.host)
}

TwitterNode.prototype.basicAuth = function(user, pass) {
  return "Basic " + b64.encode(user + ":" + pass)
}

TwitterNode.prototype.requestUrl = function() {
  return this.path + this.action + ".json" + this.buildParams()
}

TwitterNode.prototype.buildParams = function() {
  var options = {}
  process.mixin(options, this.params)
  if(this.trackKeywords.length > 0)
    options.track = this.trackKeywords.join(",")
  if(this.following.length > 0)
    options.follow = this.following.join(",")
  if(options.track || options.follow)
    return "?" + query.stringify(options)
  else
    return ""
}