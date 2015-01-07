/**
* Module dependencies
*/
var oauth = require('oauth');
var Keygrip = require('keygrip');
var merge = require('./utils').merge;
var querystring = require('querystring');
var urlparse = require('url').parse;

// Package version
var VERSION = require('../package.json').version;

function Twitter(options) {
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

    secure: false, // force use of https for login/gatekeeper
    cookie: 'twauth',
    cookie_options: {},
    cookie_secret: null
  };

  this.options = merge(defaults, options);

  if (this.options.cookie_secret === null) {
    this.keygrip =  null;
  }
  else {
    new Keygrip([this.options.cookie_secret]);
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
    if (urlparse(path).protocol === null) {
      if (path.charAt(0) != '/') {
        path = '/' + path;
      }
    }
    path = this.options.rest_base + path;
    // Add json extension if not provided in call
    if(path.split('.').pop() !== 'json') {
      path += '.json';
    }
    if (query !== null) {
      path += '?' + querystring.stringify(query);
    }
    return path;
  }

}

Twitter.prototype.__request = function(method, path, params, callback) {
  // Set the callback if no params are passed
  if (typeof params === 'function') {
    callback = params;
    params = {};
  }

  var method = method.toLowerCase();
  if ((method !== 'get') && (method !== 'post')) {
    callback(new Error('Twitter API only accepts GET and POST requests'));
    return this;
  }

  url = this.__generateURL(path, (method === 'get') ? params : null);

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

  return this;
}

/**
 * GET
 */
Twitter.prototype.get = function(url, params, callback) {
  this.__request('GET', url, params, callback);
};

/**
 * POST
 */
Twitter.prototype.post = function(url, params, callback) {
  this.__request('POST', url, params, callback);
};

// Load legacy helper methods
Twitter = require('./legacy')(Twitter);

module.exports = Twitter;
