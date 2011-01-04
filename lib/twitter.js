var	http = require('http'),
	querystring = require('querystring'),
	oauth = require('oauth'),
	streamparser = require('./parser');

function merge(defaults, options) {
	defaults = defaults || {};
	options = options || {};
	if (typeof options === 'object') {
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

	var defaults = {
		consumer_key: null,
		consumer_secret: null,
		access_token_key: null,
		access_token_secret: null,

		headers: {
			'Accept': '*/*',
			'Connection': 'close',
			'User-Agent': 'node-twitter/' + Twitter.VERSION
		},

		request_token_url: 'https://api.twitter.com/oauth/request_token',
		access_token_url: 'https://api.twitter.com/oauth/access_token',
		authenticate_url: 'https://api.twitter.com/oauth/authenticate',
		authorize_url: 'https://api.twitter.com/oauth/authorize',

		rest_base: 'https://api.twitter.com/1',
		search_base: 'http://search.twitter.com',
		stream_base: 'http://stream.twitter.com/1',
		user_stream_base: 'https://userstream.twitter.com/2',
		site_stream_base: 'https://betastream.twitter.com/2b'
	};
	this.options = merge(defaults, options);

	// FIXME: first null is auth dest; fix when we add auth helper funcs
	this.oauth = new oauth.OAuth(
		this.options.request_token_url,
		this.options.access_token_url,
		this.options.consumer_key,
		this.options.consumer_secret,
		'1.0', null, 'HMAC-SHA1', null,
		this.options.headers);
}
Twitter.VERSION = '0.1.7';
module.exports = Twitter;


/*
 * GET
 */
Twitter.prototype.get = function(url, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	if ( typeof callback !== 'function' ) {
		throw "FAIL: INVALID CALLBACK.";
		return this;
	}

	if (url.charAt(0) == '/')
		url = this.options.rest_base + url;

	this.oauth.get(url + '?' + querystring.stringify(params),
		this.options.access_token_key,
		this.options.access_token_secret,
	function(error, data, response) {
		if (error) {
			var err = new Error('HTTP Error '
				+ error.statusCode + ': '
				+ http.STATUS_CODES[error.statusCode]);
			err.statusCode = error.statusCode;
			err.data = error.data;
			callback(err);
		} else {
			try {
				var json = JSON.parse(data);
				callback(json);
			} catch(err) {
				callback(err);
			}
		}
	});
	return this;
}


/*
 * POST
 */
Twitter.prototype.post = function(url, content, content_type, callback) {
	if (typeof content === 'function') {
		callback = content;
		content = null;
		content_type = null;
	} else if (typeof content_type === 'function') {
		callback = content_type;
		content_type = null;
	}

	if ( typeof callback !== 'function' ) {
		throw "FAIL: INVALID CALLBACK.";
		return this;
	}

	if (url.charAt(0) == '/')
		url = this.options.rest_base + url;

	this.oauth.post(url,
		this.options.access_token_key,
		this.options.access_token_secret,
		content, content_type,
	function(error, data, response) {
		if (error) {
			var err = new Error('HTTP Error '
				+ error.statusCode + ': '
				+ http.STATUS_CODES[error.statusCode]);
			err.statusCode = error.statusCode;
			err.data = error.data;
			callback(err);
		} else {
			try {
				var json = JSON.parse(data);
				callback(json);
			} catch(err) {
				callback(err);
			}
		}
	});
	return this;
}


/*
 * SEARCH (not API stable!)
 */
Twitter.prototype.search = function(q, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	if ( typeof callback !== 'function' ) {
		throw "FAIL: INVALID CALLBACK.";
		return this;
	}

	var url = this.options.search_base + '/search.json';
	params = merge(params, {q:q});
	this.get(url, params, callback);
	return this;
}


/*
 * STREAM
 */
Twitter.prototype.stream = function(method, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var stream_base = this.options.stream_base;

	if (method === 'user')
		stream_base = this.options.user_stream_base;
	else if (method === 'site')
		stream_base = this.options.site_stream_base;

	var url = '/' + method + '.json?' + querystring.stringify(params);

	var request = this.oauth.get(stream_base + url,
		this.options.access_token_key,
		this.options.access_token_secret);

	var stream = new streamparser();
	stream.destroy = function() {
		// FIXME: should we emit end/close on explicit destroy?
		request.socket.destroy();
	};

	request.on('response', function(response) {
		response.on('data', function(chunk) {
			stream.receive(chunk);
		});
		response.on('end', function () {
			stream.emit('end');
			stream.emit('close');
		});
	});
	request.end();

	if ( typeof callback === 'function' ) callback(stream);
	return this;
}


/*
 * CONNECT/STACK STYLE TWITTER "O"AUTHENTICATION MIDDLEWARE
 */
// FIXME: options should include cookie lifetime
Twitter.prototype.auth = function(mount) {
	var	self = this,
		cookie = require('cookie'),
		url = require('url'),
		mount = mount || '/twauth';

	return function handle(req, res, next) {
		try {
			var twauth = JSON.parse(req.getSecureCookie('twauth'));
		} catch (error) {
			var twauth = null;
		}

		if ( twauth && twauth.screen_name && twauth.access_token_secret ) {
			return next();
		}

		// FIXME: these don't reflect how the server might do http/https
		var purl = url.parse('http://' + req.headers.host + req.url, true);
		if ( !self.oauth._authorize_callback ) {
			var pmount = url.parse('http://' + req.headers.host + mount, true);
			self.oauth._authorize_callback = pmount.href;
		}

		// Returning from Twitter with oauth_token
		if ( purl.pathname == mount && purl.query && purl.query.oauth_token && twauth && twauth.oauth_token_secret ) {
			self.oauth.getOAuthAccessToken(
				purl.query.oauth_token,
				twauth.oauth_token_secret,
				purl.query.oauth_verifier,
			function(error, access_token, access_token_secret, params) {
				var user_id = params && params.user_id,
					screen_name = params && params.screen_name;
				if ( error ) {
					return next(error);
				} else {
					res.setSecureCookie('twauth', JSON.stringify({
						user_id: user_id,
						screen_name: screen_name,
						access_token: access_token,
						access_token_secret: access_token_secret
					}), {});
					// FIXME: remember where we came from
					res.writeHead(302, {'Location': '/'});
					res.end();
					return;
				}
			});

		// Begin OAuth transaction
		} else {
			self.oauth.getOAuthRequestToken(
			function(error, oauth_token, oauth_token_secret, oauth_authorize_url, params) {
				if ( error ) {
					return next(error);
				} else {
					res.setSecureCookie('twauth', JSON.stringify({
						oauth_token: oauth_token,
						oauth_token_secret: oauth_token_secret
					}), {});
					res.writeHead(302, {
						'Location': self.options.authorize_url + '?'
							+ querystring.stringify({oauth_token: oauth_token})
					});
					res.end();
					return;
				}
			});
		}
	};
}


/*
 * CONVENIENCE FUNCTIONS (not API stable!)
 */

// Timeline resources

Twitter.prototype.getPublicTimeline = function(params, callback) {
	var url = '/statuses/public_timeline.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getHomeTimeline = function(params, callback) {
	var url = '/statuses/home_timeline.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getFriendsTimeline = function(params, callback) {
	var url = '/statuses/friends_timeline.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getUserTimeline = function(params, callback) {
	var url = '/statuses/user_timeline.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getMentions = function(params, callback) {
	var url = '/statuses/mentions.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getRetweetedByMe = function(params, callback) {
	var url = '/statuses/retweeted_by_me.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getRetweetedToMe = function(params, callback) {
	var url = '/statuses/retweeted_to_me.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getRetweetsOfMe = function(params, callback) {
	var url = '/statuses/retweets_of_me.json';
	this.get(url, params, callback);
	return this;
}

// Tweets resources

Twitter.prototype.showStatus = function(id, callback) {
	var url = '/statuses/show/' + id + '.json';
	this.get(url, null, callback);
	return this;
}

Twitter.prototype.updateStatus = function(text, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/statuses/update.json';
	var defaults = {
		status: text,
		include_entities: 1
	};
	params = merge(defaults, params);
	this.post(url, params, null, callback);
	return this;
}

Twitter.prototype.destroyStatus = function(id, callback) {
	var url = '/statuses/destroy/' + id + '.json';
	this.post(url, null, null, callback);
	return this;
}
Twitter.prototype.deleteStatus
	= Twitter.prototype.destroyStatus;

Twitter.prototype.retweetStatus = function(id, callback) {
	var url = '/statuses/retweet/' + id + '.json';
	this.post(url, null, null, callback);
	return this;
}

Twitter.prototype.getRetweets = function(id, params, callback) {
	var url = '/statuses/retweets/' + id + '.json';
	this.post(url, params, null, callback);
	return this;
}

Twitter.prototype.getRetweetedBy = function(id, params, callback) {
	var url = '/statuses/' + id + '/retweeted_by.json';
	this.post(url, params, null, callback);
	return this;
}

Twitter.prototype.getRetweetedByIds = function(id, params, callback) {
	var url = '/statuses/' + id + '/retweeted_by/ids.json';
	this.post(url, params, null, callback);
	return this;
}

// User resources

Twitter.prototype.showUser = function(id, callback) {
	// FIXME: handle id-array and id-with-commas as lookupUser
	//  NOTE: params with commas b0rk between node-oauth and twitter
	//        https://github.com/ciaranj/node-oauth/issues/7
	var url = '/users/show.json';

	var params = {};
	if (typeof id === 'string')
		params.screen_name = id;
	else
		params.user_id = id;

	this.get(url, params, callback);
	return this;
}
Twitter.prototype.lookupUser
	= Twitter.prototype.lookupUsers
	= Twitter.prototype.showUser;

Twitter.prototype.searchUser = function(q, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/users/search.json';
	params = merge(params, {q:q});
	this.get(url, params, callback);
	return this;
}
Twitter.prototype.searchUsers
	= Twitter.prototype.searchUser;

// FIXME: users/suggestions**

Twitter.prototype.userProfileImage = function(id, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	} else if (typeof params === 'string') {
		params = { size: params };
	}

	var url = '/users/profile_image/' + id + '.json?' + querystring.stringify(params);

	// Do our own request, so we can return the 302 location header
	var request = this.oauth.get(this.options.rest_base + url,
		this.options.access_token_key,
		this.options.access_token_secret);
	request.on('response', function(response) {
		// return the location or an HTTP error
		callback(response.headers.location || new Error('HTTP Error '
			+ response.statusCode + ': '
			+ http.STATUS_CODES[response.statusCode]));
	});
	request.end();

	return this;
}

// FIXME: statuses/friends, statuses/followers

// Trends resources

Twitter.prototype.getTrends = function(callback) {
	var url = '/trends.json';
	this.get(url, null, callback);
	return this;
}

Twitter.prototype.getCurrentTrends = function(params, callback) {
	var url = '/trends/current.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getDailyTrends = function(params, callback) {
	var url = '/trends/daily.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getWeeklyTrends = function(params, callback) {
	var url = '/trends/weekly.json';
	this.get(url, params, callback);
	return this;
}

// Local Trends resources

// List resources

Twitter.prototype.getLists = function(screen_name, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/' + screen_name + '/lists.json';
	params = merge(params, {key:'lists'});
	this._getUsingCursor(url, params, callback);
	return this;
}

Twitter.prototype.createList = function(screen_name, list_name, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/' + screen_name + '/lists.json';
	params = merge(params, {name:list_name});
	this.post(url, params, null, callback);
	return this;
}

Twitter.prototype.updateList = function(screen_name, list_id, params, callback) {
	var url = '/' + screen_name + '/lists/' + list_id + '.json';
	this.post(url, params, null, callback);
	return this;
}

Twitter.prototype.showList = function(screen_name, list_id, callback) {
	var url = '/' + screen_name + '/lists/' + list_id + '.json';
	this.get(url, null, callback);
	return this;
}

Twitter.prototype.deleteList = function(screen_name, list_id, callback) {
	var url = '/' + screen_name + '/lists/' + list_id + '.json?_method=DELETE';
	this.post(url, null, callback);
	return this;
}
Twitter.prototype.destroyList
	= Twitter.prototype.deleteList;

Twitter.prototype.getListTimeline = function(screen_name, list_id, params, callback) {
	var url = '/' + screen_name + '/lists/' + list_id + '/statuses.json';
	this.get(url, params, callback);
	return this;
}
Twitter.prototype.showListStatuses
	= Twitter.prototype.getListTimeline;

Twitter.prototype.getListMemberships = function(screen_name, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/' + screen_name + '/lists/memberships.json';
	params = merge(params, {key:'lists'});
	this._getUsingCursor(url, params, callback);
	return this;
}

Twitter.prototype.getListSubscriptions = function(screen_name, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/' + screen_name + '/lists/subscriptions.json';
	params = merge(params, {key:'lists'});
	this._getUsingCursor(url, params, callback);
	return this;
}

// List Members resources

Twitter.prototype.getListMembers = function(screen_name, list_id, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/' + screen_name + '/' + list_id + '/members.json';
	params = merge(params, {key:'users'});
	this._getUsingCursor(url, params, callback);
	return this;
}

// FIXME: the rest of list members

// List Subscribers resources

Twitter.prototype.getListSubscribers = function(screen_name, list_id, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var url = '/' + screen_name + '/' + list_id + '/subscribers.json';
	params = merge(params, {key:'users'});
	this._getUsingCursor(url, params, callback);
	return this;
}

// FIXME: the rest of list subscribers

// Direct Messages resources

Twitter.prototype.getDirectMessages = function(params, callback) {
	var url = '/direct_messages.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.getDirectMessagesSent = function(params, callback) {
	var url = '/direct_messages/sent.json';
	this.get(url, params, callback);
	return this;
}
Twitter.prototype.getSentDirectMessages
	= Twitter.prototype.getDirectMessagesSent;

Twitter.prototype.newDirectMessage = function(id, text, params, callback) {
	if (typeof params === 'function') {
		callback = params;
		params = null;
	}

	var defaults = {
		text: text,
		include_entities: 1
	};
	if (typeof id === 'string')
		defaults.screen_name = id;
	else
		defaults.user_id = id;
	params = merge(defaults, params);

	var url = '/direct_messages/new.json';
	this.post(url, params, null, callback);
	return this;
}
Twitter.prototype.updateDirectMessage
	= Twitter.prototype.sendDirectMessage
	= Twitter.prototype.newDirectMessage;

Twitter.prototype.destroyDirectMessage = function(id, callback) {
	var url = '/direct_messages/destroy/' + id + '.json?_method=DELETE';
	this.post(url, null, callback);
	return this;
}
Twitter.prototype.deleteDirectMessage
	= Twitter.prototype.destroyDirectMessage;

// Friendship resources

// Friends and Followers resources

Twitter.prototype.getFriendsIds = function(id, callback) {
	if (typeof id === 'function') {
		callback = id;
		id = null;
	}

	var params = { key: 'ids' };
	if (typeof id === 'string')
		params.screen_name = id;
	else if (typeof id === 'number')
		params.user_id = id;

	var url = '/friends/ids.json';
	this._getUsingCursor(url, params, callback);
	return this;
}

Twitter.prototype.getFollowersIds = function(id, callback) {
	if (typeof id === 'function') {
		callback = id;
		id = null;
	}

	var params = { key: 'ids' };
	if (typeof id === 'string')
		params.screen_name = id;
	else if (typeof id === 'number')
		params.user_id = id;

	var url = '/followers/ids.json';
	this._getUsingCursor(url, params, callback);
	return this;
}

// Account resources

Twitter.prototype.verifyCredentials = function(callback) {
	var url = '/account/verify_credentials.json';
	this.get(url, null, callback);
	return this;
}

// FIXME: Account resources section not complete

// Favorites resources

Twitter.prototype.getFavorites = function(params, callback) {
	var url = '/favorites.json';
	this.get(url, params, callback);
	return this;
}

Twitter.prototype.createFavorite = function(id, params, callback) {
	var url = '/favorites/create/' + id + '.json';
	this.post(url, params, null, callback);
	return this;
}
Twitter.prototype.favoriteStatus
	= Twitter.prototype.createFavorite;

Twitter.prototype.destroyFavorite = function(id, params, callback) {
	var url = '/favorites/destroy/' + id + '.json';
	this.post(url, params, null, callback);
	return this;
}
Twitter.prototype.deleteFavorite
	= Twitter.prototype.destroyFavorite;

// Notification resources

// Block resources

// Spam Reporting resources

// Saved Searches resources

// OAuth resources

// Geo resources

// Legal resources

// Help resources

// Streamed Tweets resources

// Search resources


/*
 * INTERNAL UTILITY FUNCTIONS
 */

Twitter.prototype._getUsingCursor = function(url, params, callback) {
	var self = this,
		key = params.key || null,
		result = [];

	// if we don't have a key to fetch, we're screwed
	if (!key)
		callback(new Error('FAIL: Results key must be provided to _getUsingCursor().'));
	delete params.key;

	// kick off the first request, using cursor -1
	params = merge(params, {cursor:-1});
	this.get(url, params, fetch);

	function fetch(data) {
		// FIXME: what if data[key] is not a list?
		if (data[key]) result = result.concat(data[key]);

		if (data.next_cursor_str === '0') {
			callback(result);
		} else {
			params.cursor = data.next_cursor_str;
			self.get(url, params, fetch);
		}
	}

	return this;
}
