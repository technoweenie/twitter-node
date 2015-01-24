'use strict';

/**
 * Legacy helper functions
 *
 */

/**
 * Module dependencies
 */

var querystring = require('querystring');
var Cookies = require('cookies');
var streamparser = require('./parser');
var merge = require('util')._extend;

module.exports = function(Twitter) {

  /*
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
      params);

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


  /*
   * TWITTER "O"AUTHENTICATION UTILITIES, INCLUDING THE GREAT
   * CONNECT/STACK STYLE TWITTER "O"AUTHENTICATION MIDDLEWARE
   * and helpful utilities to retrieve the twauth cookie etc.
   */
  Twitter.prototype.cookie = function cookie(req) {
    // Fetch the cookie
    var cookies = new Cookies(req, null, this.keygrip);
    return this._readCookie(cookies);
  };

  Twitter.prototype.login = function login(mount, success) {
    var self = this,
      url = require('url');

    // Save the mount point for use in gatekeeper
    this.options.login_mount = mount = mount || '/twauth';

    // Use secure cookie if forced to https and haven't configured otherwise
    if ( this.options.secure && !this.options.cookie_options.secure )
      this.options.cookie_options.secure = true;

    return function handle(req, res, next) {
      var path = url.parse(req.url, true);

      // We only care about requests against the exact mount point
      if ( path.pathname !== mount ) return next();

      // Set the oauth_callback based on this request if we don't have it
      if ( !self.oauth._authorize_callback ) {
        // have to get the entire url because this is an external callback
        // but it's only done once...
        var scheme = (req.socket.secure || self.options.secure) ? 'https://' : 'http://';
        path = url.parse(scheme + req.headers.host + req.url, true);
        self.oauth._authorize_callback = path.href;
      }

      // Fetch the cookie
      var cookies = new Cookies(req, res, self.keygrip);
      var twauth = self._readCookie(cookies);

      // We have a winner, but they're in the wrong place
      if ( twauth && twauth.user_id && twauth.access_token_secret ) {
        res.status(302).redirect( success || '/');
        res.end();
        return;

      // Returning from Twitter with oauth_token
      } else if ( path.query && path.query.oauth_token && path.query.oauth_verifier && twauth && twauth.oauth_token_secret ) {
        self.oauth.getOAuthAccessToken(
          path.query.oauth_token,
          twauth.oauth_token_secret,
          path.query.oauth_verifier,
        function(error, access_token_key, access_token_secret, params) {
          // FIXME: if we didn't get these, explode
          var user_id = (params && params.user_id) || null,
            screen_name = (params && params.screen_name) || null;

          if ( error ) {
            // FIXME: do something more intelligent
            return next(500);
          } else {
            // store access token
            self.options.access_token_key = twauth.access_token_key;
            self.options.access_token_secret = twauth.access_token_secret;
            cookies.set(self.options.cookie, JSON.stringify({
              user_id: user_id,
              screen_name: screen_name,
              access_token_key: access_token_key,
              access_token_secret: access_token_secret
            }), self.options.cookie_options);
            res.writeHead(302, {'Location': success || '/'});
            res.end();
            return;
          }
        });

      // Begin OAuth transaction if we have no cookie or access_token_secret
      } else if ( !(twauth && twauth.access_token_secret) ) {
        self.oauth.getOAuthRequestToken(
        function(error, oauth_token, oauth_token_secret, oauth_authorize_url, params) {
          if ( error ) {
            // FIXME: do something more intelligent
            return next(500);
          } else {
            cookies.set(self.options.cookie, JSON.stringify({
              oauth_token: oauth_token,
              oauth_token_secret: oauth_token_secret
            }), self.options.cookie_options);
            res.writeHead(302, {
              'Location': self.options.authorize_url + '?' +
                  querystring.stringify({oauth_token: oauth_token})
            });
            res.end();
            return;
          }
        });

      // Broken cookie, clear it and return to originating page
      // FIXME: this is dumb
      } else {
        cookies.set(self.options.cookie, null, self.options.cookie_options);
        res.writeHead(302, {'Location': mount});
        res.end();
        return;
      }
    };
  };

  Twitter.prototype.gatekeeper = function gatekeeper(options) {
    var self = this,
      mount = this.options.login_mount || '/twauth',
          defaults = {
              failureRedirect: null
          };
      options = merge(defaults, options);

    return function(req, res, next) {
      var twauth = self.cookie(req);

      // We have a winner
      if ( twauth && twauth.user_id && twauth.access_token_secret ) {
        self.options.access_token_key = twauth.access_token_key;
        self.options.access_token_secret = twauth.access_token_secret;
        return next();
      }

      if (options.failureRedirect) {
          res.redirect(options.failureRedirect);
      } else {
          res.writeHead(401, {}); // {} for bug in stack
          res.end([
              '<html><head>',
              '<meta http-equiv="refresh" content="1;url=' + mount + '">',
              '</head><body>',
              '<h1>Twitter authentication required.</h1>',
              '</body></html>'
          ].join(''));
      }
    };
  };

  /*
   * INTERNAL UTILITY FUNCTIONS
   */

  Twitter.prototype._getUsingCursor = function _getUsingCursor(url, params, callback) {
    var key,
      result = [],
      self = this;

    params = params || {};
    key = params.key || null;

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
  };

  Twitter.prototype._readCookie = function(cookies) {
    // parse the auth cookie
    try {
      return JSON.parse(cookies.get(this.options.cookie));
    } catch (error) {
      return null;
    }
  };

  return Twitter;

};
