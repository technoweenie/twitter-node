var sys = require('sys'), 
   http = require('http'),
    b64 = require('./base64'),
  query = require('querystring')
exports.create = function(options) {
  return new TwitterNode(options);
}

// var twit = new TwitterNode({user: 'username', password: 'password'});
// twit.action = 'sample'
// twit.format = 'xml'
// twit.stream();
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
    var client = http.createClient(this.port, this.host),
       headers = process.mixin({}, this.headers)
    headers['Host'] = this.host
    if(this.user)
      headers['Authorization'] = this.basicAuth(this.user, this.password)
    client.request("GET", this.requestUrl(), headers)
      .finish(function(resp) {
        resp.setBodyEncoding("utf8");
        resp.addListener('body', function(chunk) {
          sys.puts(chunk);
        });
        resp.addListener('complete', function() {
          sys.puts("STOPPING... " + resp.statusCode)
        });
      });
  }

  this.finish

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