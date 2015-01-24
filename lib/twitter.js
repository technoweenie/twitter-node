'use strict';

/**
 * Module dependencies
 */
var oauth = require('oauth');
var Keygrip = require('keygrip');
var merge = require('util')._extend;
var querystring = require('querystring');
var urlparse = require('url').parse;
var streamparser = require('./parser');

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

    headers: {
      'Accept': '*/*',
      'Connection': 'close',
      'User-Agent': 'node-twitter/' + this.VERSION
    },

    request_token_url: 'https://api.twitter.com/oauth/request_token',
    access_token_url: 'https://api.twitter.com/oauth/access_token',
    authenticate_url: 'https://api.twitter.com/oauth/authenticate',
    authorize_url: 'https://api.twitter.com/oauth/authorize',
    callback_url: null,

    rest_base: 'https://api.twitter.com/1.1',
    stream_base: 'https://stream.twitter.com/1.1',
    search_base: 'https://api.twitter.com/1.1/search',
    user_stream_base: 'https://userstream.twitter.com/1.1',
    site_stream_base: 'https://sitestream.twitter.com/1.1',
    filter_stream_base: 'https://stream.twitter.com/1.1/statuses',
    media_base: 'https://upload.twitter.com/1.1',

    secure: false, // force use of https for login/gatekeeper
    cookie: 'twauth',
    cookie_options: {},
    cookie_secret: null
  };

  this.options = merge(defaults, options);

  if (this.options.cookie_secret === null) {
    this.keygrip = null;
  }
  else {
    this.keygrip = new Keygrip([this.options.cookie_secret]);
  }

  this.oauth = new oauth.OAuth(
    this.options.request_token_url,
    this.options.access_token_url,
    this.options.consumer_key,
    this.options.consumer_secret,
    '1.0',
    this.options.callback_url,
    'HMAC-SHA1', null,
    this.options.headers
  );

  this.__generateURL = function(path, query) {

    query = query === null ? {} : query;

    if (urlparse(path).protocol === null) {
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
    if(path.split('.').pop() !== 'json') {
      path += '.json';
    }

    if (typeof query !== 'undefined') {
      if (Object.keys(query).length > 0) {
        path += '?' + querystring.stringify(query);
      }
    }
    return path;
  };
}

Twitter.prototype.__request = function(method, path, params, callback) {
  // Set the callback if no params are passed
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }

  method = method.toLowerCase();
  if ((method !== 'get') && (method !== 'post')) {
    callback(new Error('Twitter API only accepts GET and POST requests'));
    return this;
  }

  var url = this.__generateURL(path, (method === 'get') ? params : null);

  // Since oauth.get and oauth.post take a different set of arguments. Lets
  // build the arguments in an array as we go.
  var request = [
    url,
    this.options.access_token_key,
    this.options.access_token_secret
  ];

  if (method === 'post') {

  // Workaround: oauth + booleans == broken signatures
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(function(e) {
      if ( typeof params[e] === 'boolean' )
        params[e] = params[e].toString();
      });
    }

    request.push(params);
    request.push('application/x-www-form-urlencoded');
  }

  // Add response callback function
  request.push(function(error, data, response){
    if (error) {
      // Return error, no payload and the oauth response object
      callback(error, null, response);
      return this;
    }
    else if (response.statusCode !== 200) {
      // Return error, no payload and the oauth response object
      callback(new Error('Status Code: ' + response.statusCode), null, response);
      return this;
    }
    else {
      // Do not fail on JSON parse attempt
      try {
        data = JSON.parse(data);
      }
      catch (parseError) {
        data = data;
      }
      // Return no error, payload and the oauth response object
      callback(null, data, response);
      return this;
    }
  });

  // Make oauth request and pass request arguments
  this.oauth[method].apply(this.oauth,request);
};

/**
 * GET
 */
Twitter.prototype.get = function(url, params, callback) {
  return this.__request('GET', url, params, callback);
};

/**
 * POST
 */
Twitter.prototype.post = function(url, params, callback) {
  return this.__request('POST', url, params, callback);
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
