/**
* Module dependencies
*/
var oauth = require('oauth');
var Keygrip = require('keygrip');

// Package version
var VERSION = require('../package.json').version;

function merge(defaults, options) {
	defaults = defaults || {};
	if (options && typeof options === 'object') {
		var keys = Object.keys(options);
		for (var i = 0, len = keys.length; i < len; i++) {
			var k = keys[i];
			if (options[k] !== undefined) defaults[k] = options[k];
		}
	}
	return defaults;
}


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

	this.keygrip = this.options.cookie_secret === null ? null :
		new Keygrip([this.options.cookie_secret]);

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
}

// Load legacy helper methods
Twitter = require('./legacy')(Twitter);

module.exports = Twitter;
