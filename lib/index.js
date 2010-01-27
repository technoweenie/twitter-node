var sys = require('sys'), 
   http = require('http'),
    b64 = require('./base64'),
  query = require('querystring')

// Creates a streaming connection with twitter, and pushes any incoming
// statuses to a tweet event.
var TwitterNode = exports.TwitterNode = function(options) {
  if(!options) options = {}
  this.port          = options.port   || 80
  this.host          = options.host   || 'stream.twitter.com'
  this.path          = options.path   || '/1/statuses/'
  this.action        = options.action || 'filter'
  this.format        = options.format || 'json'
  this.trackKeywords = options.track  || []
  this.following     = options.follow || []
  this.params        = options.params || {}
  this.user          = options.user
  this.password      = options.password
  this.headers       = {"User-Agent": 'Twitter-Node: node.js streaming client'}
  this.startJSON     = /^\s*\{/
  this.endJSON       = /\}\s*$/
  this.chunks        = ""
  this.debug         = false

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
        node.processTweet(chunk)
      });
      resp.addListener('complete', function() {
        node.emit('close', this)
      });
    });
  return this;
}

// returns parsed JSON object or null if given JSON is invald.
TwitterNode.prototype.processValidJSON = function(text) {
  if(!text.match(this.startJSON) || !text.match(this.endJSON)) {
    return null;
  }

  try {
    return JSON.parse(text)
  } catch(err) {
    // sometimes what looks like valid json from the regexes isn't:
    //   {"a": {"b": 1}
    // starting and ending brackets, but still invalid.
    // hopefully the next chunk will finish the json.
    if(this.debug || err.name != 'SyntaxError') {
      sys.puts(sys.inspect(text))
      sys.puts(err.stack)
    }
    return null;
  }
}

TwitterNode.prototype.processValidJSONFromPieces = function(text, pieces) {
  var tweet;
  while(1) {
    tweet = this.processValidJSON(text)
    if(!tweet) {
      if(pieces.length > 0) {
        text += pieces.shift();
      } else {
        return [tweet, text]
      }
    } else {
      return [tweet, pieces.join("\n")]
    }
  }

  return [tweet, text]
}

TwitterNode.prototype.processTweet = function(incoming) {
  if (this.format == 'json') {

    var pieces = (this.chunks + incoming).split("\n")
    var text   = pieces.shift()

    var tweet_and_chunk = this.processValidJSONFromPieces(text, pieces)

    var tweet   = tweet_and_chunk[0]
    this.chunks = tweet_and_chunk[1]

    if(!tweet) {
      return
    } else if(tweet.limit) {
      this.emit('limit', tweet.limit)
    } else if(tweet['delete']) {
      this.emit('delete', tweet['delete'])
    } else {
      this.emit('tweet', tweet)
    }
  } else {
    this.emit('tweet', incoming)
  }
}

// override this to pass in your own client if needed.
TwitterNode.prototype.createClient = function(port, host) {
  return http.createClient(this.port, this.host)
}

TwitterNode.prototype.basicAuth = function(user, pass) {
  return "Basic " + b64.encode(user + ":" + pass)
}

TwitterNode.prototype.requestUrl = function() {
  return this.path + this.action + "." + this.format + this.buildParams()
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