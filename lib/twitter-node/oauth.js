require('./math');

var http = require('http'),
		qs = querystring = require('querystring'),
		url = require('url'),
		crypto = require('crypto')
		sys = require('sys');

var oauth = exports;

var percentEncodeURI = function(str) {
 return encodeURIComponent(str).replace(/%/g,'%25');
};

var encodeURI = function(str) {
  // https://developer.mozilla.org/En/Core_javascript_1.5_reference:global_functions:encodeuricomponent
  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
                                 replace(/\)/g, '%29').replace(/\*/g, '%2A');
};

var sortKeys = function(obj, fn) {
	if (!obj) return obj;
	var vals = Object.keys(obj).sort(fn)
	var sorted = {}
	for(var i = 0; i < vals.length; i++)
		sorted[vals[i]] = obj[vals[i]]
	obj = sorted
	return obj
};

Object.merge = function(a,b) {
  if (!b || !(b instanceof Object)) return a;
  var keys = Object.keys(b)
  for (var i = 0, len = keys.length; i < len; ++i)
    a[keys[i]] = b[keys[i]]
  return a;
};

exports.version = '1.0';

exports.normalize = function(obj) {
	if (!(obj instanceof Object)) return obj;
	obj = sortKeys(obj);
	for(var prop in obj) {
		if (typeof(obj[prop]) === 'function') {
			delete obj[prop];
			continue;
		}
		if (obj[prop].constructor === Array) {
			obj[prop] = obj[prop].sort();
			for(var child in obj[prop])
				prop[child] = oauth.normalize(child);
		}
		else if (obj[prop] instanceof Object)
			obj[prop] = oauth.normalize(obj[prop]);
	}
	return obj;
};

exports.fillURL = function(path, host, port, secure) {
  var p = url.parse(path);
  p.protocol =  p.protocol  || (secure ? 'https:' : 'http:');
  p.hostname =  p.hostname  || host;
  p.port     =  p.port      || port;
  return url.format(p);
};

exports.normalizeURL = function(path) {
  var p = url.parse(path.replace(/^https/i, 'https').replace(/^http/i, 'http'));
  var ret = {
    protocol: p.protocol,
    hostname: p.hostname,
    pathname: p.pathname,
    port:     p.port,
    slashes:  true,
  };

  if ((p.port == 80 && p.protocol == 'http:') || (p.port == 443 && p.protocol == 'https:'))
    delete ret.port;

  ret.protocol = ret.protocol.toLowerCase();
  ret.hostname = ret.hostname.toLowerCase();

  if (!ret.pathname && !ret.path)
    ret.pathname = ret.path = '/';
  return url.format(ret);
}

exports.createClient = function(port, host, secure, creds) {
  var c = http.createClient(port, host, secure, creds);
  c.secure = secure;
  c.defaultHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': host,
    'User-Agent': 'node-oauth',
    'Accept': '*/*',
    'WWW-Authenticate': 'OAuth realm=' + (this.https ? 'https' : 'http') + '://' + host,
  }

  c.request = function(method, path, headers, body, signature) {
    if (!headers)
      headers = c.defaultHeaders;
    else
      Object.merge(c.defaultHeaders,headers);

    if (typeof(path) != "string") {
      headers = url;
      path = method;
      method = "GET";
    }

    var req = new Request(this, method, path, headers, body, signature);
    c._outgoing.push(req);
    if (this.readyState === 'closed') this._reconnect();

    return req;
  }

  return c;
};

function Request(socket, method, path, headers, body, signature) {
  var uri = oauth.fillURL(path, socket.host, socket.port, socket.secure);
  var signed_header = this.signRequest(method, uri, headers, body, signature);
  http.ClientRequest.call(this, socket, method, path, signed_header);
}
sys.inherits(Request,http.ClientRequest);

exports.Request = Request;

Request.prototype.signRequest = function(method, path, headers, body, signature) {

  if (body)
    this.hasBody = true;

  var auth = {
    'oauth_nonce':this.nonce(),
    'oauth_timestamp':this.timestamp(),
    'oauth_signature_method':signature.name,
    'oauth_version':oauth.version
  };

  //split out any oauth_* params in the querystring and merge them into
  // the authorization header
  var parsed = url.parse(path);

  // if any parameters are passed with the path we need them
  if(parsed.query)
    var params = querystring.parse(parsed.query);

  var removed = this.splitParams(parsed.query);

  var t = signature.token;
  var c = signature.consumer;

  Object.merge(auth,removed ? removed : null);
  Object.merge(auth,t ? t.encode() : null);
  Object.merge(auth,c ? c.encode() : null);

  var base64;
  var joined = {};

  Object.merge(joined,body ? body : null);
  Object.merge(joined,auth);
  Object.merge(joined,params);

  if (signature instanceof HMAC)
    base64 = signature.sign(method, path, joined);
  else if (signature instanceof Signature)
    base64 = signature.sign();
  else
    throw new TypeError("Invalid signature type");

  querystring.escape = encodeURI;
  auth = querystring.stringify(oauth.normalize(auth),'\",','=\"');

  headers['Authorization'] = "OAuth " + auth + '\",oauth_signature=\"' + encodeURI(base64) + '\"';
  return headers;
}

Request.prototype.nonce = function() {
	return Math.uuidFast();
};

Request.prototype.normalizeBody = function(chunk) {
	qs.escape = function(str) { return encodeURIComponent(str).replace('%20','+') }
	return qs.stringify(chunk);
};

Request.prototype.splitParams = function(obj) {
	var removed = null;
	for (var prop in obj)
		if (/^oauth_\w+$/.test(prop)) {
			if(!removed) removed = {};
			removed[prop] = obj[prop];
			delete obj[prop];
		}
	return removed;
};

Request.prototype.timestamp = function() {
	return parseInt(new Date().getTime()/1000);
};

Request.prototype.write = function(chunk,normalize) {
	if (normalize || this.hasBody)
	  chunk = this.normalizeBody(chunk);
	return http.ClientRequest.prototype.write.call(this,chunk,'utf8');
};

function Consumer() {};

exports.Consumer = Consumer;

exports.createConsumer = function(key,secret) {
	var c = new Consumer();
	c.oauth_consumer_key = key;
	c.oauth_consumer_secret = secret;
	return c;
};

Consumer.prototype.decode = function(str) {
	var parsed = qs.parse(str);
	for (var prop in parsed)
			this[prop] = parsed[prop];
};

Consumer.prototype.encode = function() {
  return {
    oauth_consumer_key:this.oauth_consumer_key
  }
};

function Token() {};

exports.Token = Token;

exports.createToken = function(key,secret) {
	var t = new Token();
	t.oauth_token = key || '';
	t.oauth_token_secret = secret || '';
	return t;
};

Token.prototype.decode = function(str) {
	var parsed = qs.parse(str);
	for (var prop in parsed)
			this[prop] = parsed[prop];
};

Token.prototype.encode = function(str) {
	var ret = {
	  oauth_token:this.oauth_token
	}

	if (this.oauth_verifier)
	  Object.merge(ret,{oauth_verifier:this.oauth_verifier});

	return ret;
}

function Signature() {};

exports.Signature = Signature;

exports.createSignature = function(consumer,token){
	var p = new Signature();
	p.consumer = consumer;
	p.token = token;
	p.name = 'PLAINTEXT';
	return p;
};

Signature.prototype.key = function () {
  return [
    encodeURI(this.consumer ? this.consumer.oauth_consumer_secret : ''),
    encodeURI( this.token ? this.token.oauth_token_secret : '')
  ].join('&');
};

Signature.prototype.sign = function() {
	return key;
};

Signature.prototype.baseString = function(method, url, params) {
  querystring.escape = encodeURI;
  return [
    method.toUpperCase(),
    encodeURI(oauth.normalizeURL(url)),
    encodeURI(querystring.stringify(oauth.normalize(params))),
  ].join('&');
};

function HMAC() {};

sys.inherits(HMAC,Signature);

exports.HMAC = HMAC;

exports.createHmac = function(consumer,token){
	var h = new HMAC(consumer,token);
	h.algo = 'sha1';
	h.encoding = 'base64';
	h.name = 'HMAC-SHA1';
	h.consumer = consumer;
	h.token = token;
	return h;
};

HMAC.prototype.base = function(method,path,params) {
  return this.baseString(method, path, params);
};

HMAC.prototype.sign = function(method,path,params) {
  if (!this.consumer && !this.token)
    throw new Error('Must provide a valid consumer or token');

  var base = this.baseString(method,path,params);
  var hmac = crypto.createHmac(this.algo,this.key());

  hmac.update(base);

  return hmac.digest(this.encoding);
};
