var sys = require('sys'), 
   http = require('http'),
    b64 = require('./base64'),
  query = require('querystring')
exports.create = function(options) {
  return new TwitterNode(options);
}

// Creates a streaming connection with twitter, and pushes any incoming
// statuses to a tweet event.
//
//   var twit = new TwitterNode({user: 'username', password: 'password'});
//   twit.action = 'sample'    // filter is default
//   twit.format = 'xml'       // json is default
//   twit.follow(123)          // needs userIDs, not screen names
//   twit.track('#nowplaying')
//   twit.addListener('tweet', function(tweet) {
//     // tweet is a parsed JSON object or an xml string
//     // xml parsing contributions welcome
//   })
//
// see http://apiwiki.twitter.com/Streaming-API-Documentation for 
// twitter delete messages
//
//   twit.addListener('delete', function(delete) {
//   })
//   twit.addListener('limit', function(delete) {
//   })
//   twit.addListener('close', function() {
//     sys.puts("wave goodbye")
//   })
//   twit.stream();
var TwitterNode = function(options) {
  if(!options) options = {}
  this.port          = options.port      || 80
  this.host          = options.host      || 'stream.twitter.com'
  this.path          = options.path      || '/1/statuses/'
  this.action        = options.action    || 'filter'
  this.format        = options.format    || 'json'
  this.trackKeywords = options.track     || []
  this.following     = options.follow    || []
  this.params        = options.params    || {}
  this.user          = options.user
  this.password      = options.password
  this.headers = {"User-Agent": 'Twitter-Node: node.js streaming client'}

  this.track = function(word) {
    this.trackKeywords.push(word);
  }

  this.follow = function(userId) {
    this.following.push(userId);
  }

  this.stream = function() {
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
          node.processTweet(chunk)
        });
        resp.addListener('complete', function() {
          node.emit('close')
        });
      });
    return this;
  }

  this.processTweet = function(text) {
    if (this.format == 'json') {
      var tweet = JSON.parse(text)
      if(tweet.limit) {
        this.emit('limit', tweet.limit)
      } else if(tweet['delete']) {
        this.emit('delete', tweet['delete'])
      } else {
        this.emit('tweet', tweet)
      }
    } else {
      this.emit('tweet', text)
    }
  }

  // override this to pass in your own client if needed.
  this.createClient = function(port, host) {
    return http.createClient(this.port, this.host)
  }

  this.basicAuth = function(user, pass) {
    return "Basic " + b64.encode(user + ":" + pass)
  }

  this.requestUrl = function() {
    return this.path + this.action + "." + this.format + this.buildParams()
  }

  this.buildParams = function() {
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
}

sys.inherits(TwitterNode, process.EventEmitter)