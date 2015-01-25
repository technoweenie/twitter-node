'use strict';

/**
 * Module dependencies
 */

var url = require('url');
var streamparser = require('./parser');
var request = require('request');
var _extend = require('util')._extend;

// Package version
var VERSION = require('../package.json').version;

function Twitter (options) {
  if (!(this instanceof Twitter)) return new Twitter(options);

  this.VERSION = VERSION;

  var defaults = {
    consumer_key: null,
    consumer_secret: null,
    access_token_key: null,
    access_token_secret: null,

    request_options: {
      headers: {
        'Accept': '*/*',
        'Connection': 'close',
        'User-Agent': 'node-twitter/' + this.VERSION
      }
    },

    request_token_url: 'https://api.twitter.com/oauth/request_token',
    access_token_url: 'https://api.twitter.com/oauth/access_token',

    rest_base: 'https://api.twitter.com/1.1',
    stream_base: 'https://stream.twitter.com/1.1',
    search_base: 'https://api.twitter.com/1.1/search',
    user_stream_base: 'https://userstream.twitter.com/1.1',
    site_stream_base: 'https://sitestream.twitter.com/1.1',
    filter_stream_base: 'https://stream.twitter.com/1.1/statuses',
    media_base: 'https://upload.twitter.com/1.1'
  };

  this.options = _extend(defaults, options);

  this.__generateURL = function(path) {

    if (url.parse(path).protocol === null) {
      if (path.charAt(0) !== '/') {
        path = '/' + path;
      }

      switch (true) {
        case /^\/media/.test(path):
          path = this.options.media_base + path;
          break;
        default:
          path = this.options.rest_base + path;
          break;
      }
    }

    // Remove trailing slash
    path = path.replace(/\/$/, "");

    // Add json extension if not provided in call
    path += (path.split('.').pop() !== 'json') ? '.json' : '';

    return path;
  };
}


Twitter.prototype.__request = function(method, path, params, callback) {
  // Set the callback if no params are passed
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }

  var options = {
    method: method.toLowerCase(),
    url: this.__generateURL(path),
    oauth: {
      consumer_key: this.options.consumer_key,
      consumer_secret: this.options.consumer_secret,
      token: this.options.access_token_key,
      token_secret: this.options.access_token_secret
    },
    qs: (method === 'get') ? params : {},
    form: (method === 'post') ? params : {}
  };

  options = _extend(options, this.options.request_options);

  request(options, function(error, response, data){
    if (error) {
      callback(error, data, response)
    }
    else {
      try {
        data = JSON.parse(data);
      }
      catch(parseError) {
        callback(
          new Error('Status Code: ' + response.statusCode),
          data,
          response
        );

      }
      if (typeof data.errors !== 'undefined') {
        callback(data.errors, data, response);
      }
      else if(response.statusCode !== 200) {
        callback(
          new Error('Status Code: ' + response.statusCode),
          data,
          response
        );
      }
      else {
        callback(null, data, response);
      }
    }
  });
};

/**
 * GET
 */
Twitter.prototype.get = function(url, params, callback) {
  return this.__request('get', url, params, callback);
};

/**
 * POST
 */
Twitter.prototype.post = function(url, params, callback) {
  return this.__request('post', url, params, callback);
};

/**
 * STREAM
 */
Twitter.prototype.stream = function (method, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = null;
  }

  var stream_base = this.options.stream_base;

  // Stream type customisations
  if (method === 'user') {
    stream_base = this.options.user_stream_base;
    // Workaround for node-oauth vs. twitter commas-in-params bug
    if ( params && params.track && Array.isArray(params.track) ) {
      params.track = params.track.join(',');
    }

  } else if (method === 'site') {
    stream_base = this.options.site_stream_base;
    // Workaround for node-oauth vs. twitter double-encode-commas bug
    if ( params && params.follow && Array.isArray(params.follow) ) {
      params.follow = params.follow.join(',');
    }
  } else if (method === 'filter') {
    stream_base = this.options.filter_stream_base;
    // Workaround for node-oauth vs. twitter commas-in-params bug
    if ( params && params.track && Array.isArray(params.track) ) {
      params.track = params.track.join(',');
    }
  }

  var url = stream_base + '/' + escape(method) + '.json';

  var request = this.oauth.post(url,
    this.options.access_token_key,
    this.options.access_token_secret,
    params
  );

  var stream = new streamparser();
  stream.destroy = function() {
    // FIXME: should we emit end/close on explicit destroy?
    if ( typeof request.abort === 'function' )
    request.abort(); // node v0.4.0
    else
    request.socket.destroy();
  };

  request.on('response', function(response) {
    // FIXME: Somehow provide chunks of the response when the stream is connected
    // Pass HTTP response data to the parser, which raises events on the stream
    response.on('follow', function(chunk){
      stream.receive(chunk);
    });

    response.on('favorite', function(chunk){
      stream.receive(chunk);
    });

    response.on('unfavorite', function(chunk){
      stream.receive(chunk);
    });

    response.on('block', function(chunk){
      stream.receive(chunk);
    });

    response.on('unblock', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_created', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_destroyed', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_updated', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_member_added', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_member_removed', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_user_subscribed', function(chunk){
      stream.receive(chunk);
    });

    response.on('list_user_unsubscribed', function(chunk){
      stream.receive(chunk);
    });

    response.on('user_update', function(chunk){
      stream.receive(chunk);
    });

    response.on('data', function(chunk) {
      stream.receive(chunk);
    });

    response.on('error', function(error) {
      stream.emit('error', error);
    });

    response.on('end', function() {
      stream.emit('end', response);
    });
  });

  request.on('error', function(error) {
    stream.emit('error', error);
  });
  request.end();

  if ( typeof callback === 'function' ) callback(stream);
  return this;
};

module.exports = Twitter;
