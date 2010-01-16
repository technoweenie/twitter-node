var sys = require('sys'), 
   http = require('http'),
  query = require('querystring')
exports.create = function(options) {
  return new TwitterNode(options);
}

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
  this.userAgent     = options.userAgent || 'Twitter-Node: node.js streaming client'

  this.track = function(word) {
    this.trackKeywords.push(word);
  }

  this.follow = function(userId) {
    this.following.push(userId);
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