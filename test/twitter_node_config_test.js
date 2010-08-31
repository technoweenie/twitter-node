var TwitterNode = require('../lib/twitter-node').TwitterNode,
         assert = require('assert'),
            sys = require('sys');

process.mixin(GLOBAL, require('ntest'));

describe("streaming json parser")
  it("accepts JSON in chunks", function() {
    var parser  = require("../lib/twitter-node/parser"),
              p = new parser.instance(),
        result

    p.addListener('object', function(tweet) {
      result = tweet
    })
  
    p.receive("")
    p.receive(" ")
    p.receive("{")
    p.receive('"a":{')
    p.receive('"b":1')
    p.receive("}\n}\n{\"a\":1}")

    assert.ok(result)
    assert.equal(1, result.a.b)
  })

describe("json TwitterNode instance")
  before(function() { this.twit = new TwitterNode(); })

  it("emits tweet with parsed JSON tweet", function() {
    var result;
    this.twit
      .addListener('tweet', function(tweet) {
        result = tweet
      })
      .addListener('limit', function(tweet) {
        result = {a:null}
      })
      .addListener('delete', function(tweet) {
        result = {a:null}
      })
      .receive('{"a":1}')

    assert.equal(1, result.a)
  })

  it("emits delete with parsed JSON delete command", function() {
    var result;
    this.twit
      .addListener('tweet', function(tweet) {
        result = {status:null}
      })
      .addListener('limit', function(tweet) {
        result = {status:null}
      })
      .addListener('delete', function(tweet) {
        result = tweet
      })
      .receive('{"delete":{"status":{"id": 1234}}}')

    assert.equal(1234, result.status.id)
  })

  it("emits limit with parsed JSON limit command", function() {
    var result;
    this.twit
      .addListener('tweet', function(tweet) {
        result = {track:null}
      })
      .addListener('delete', function(tweet) {
        result = {track:null}
      })
      .addListener('limit', function(tweet) {
        result = tweet
      })
      .receive('{"limit":{"track": 1234}}')

    assert.equal(1234, result.track)
  })

describe("default TwitterNode instance")
  before(function() { this.twit = new TwitterNode(); })

  it("has default requestUrl()", function() {
    assert.equal("/1/statuses/filter.json", this.twit.requestUrl())
  })

  it("has empty params", function() {
    assert.equal('', this.twit.buildParams())
  })

  it("has default port", function() {
    assert.equal(80, this.twit.port)
  })

  it("has default host", function() {
    assert.equal('stream.twitter.com', this.twit.host)
  })

  it("adds tracking keywords", function() {
    this.twit.track('abc+def')
    this.twit.track('ghi')
    assert.equal('?track=abc%2Bdef%2Cghi', this.twit.buildParams())
  })

  it("adds following users", function() {
    this.twit.follow(123)
    this.twit.follow(456)
    assert.equal('?follow=123%2C456', this.twit.buildParams())
  })

  it("adds locations", function() {
    this.twit.location(122.75, 36.8, -121.75, 37.8) // SF
    this.twit.location(-74, 40, -73, 41) // NYC
    assert.equal('?locations=122.75%2C36.8%2C-121.75%2C37.8%2C-74%2C40%2C-73%2C41', this.twit.buildParams())
  })

describe("custom TwitterNode instance")
  before(function() {
    this.options = {
      port:    81,
      host:    '10.0.0.1',
      path:    'abc/',
      action:  'retweet',
      follow:  [123,456],
      track:   ['abc', 'def'],
      headers: {'a': 'abc'},
      params:  {count: 5}
    }
    this.twit = new TwitterNode(this.options); 
  })

  it("has default requestUrl()", function() {
    assert.equal("abc/retweet.json" + this.twit.buildParams(), this.twit.requestUrl())
  })

  it("merges given headers with defaults", function() {
    assert.equal('abc', this.twit.headers.a)
    assert.ok(this.twit.headers['User-Agent'])
  })

  it("has empty params", function() {
    assert.equal('?count=5&track=abc%2Cdef&follow=123%2C456', this.twit.buildParams())
  })

  it("sets port", function() {
    assert.equal(this.options.port, this.twit.port)
  })

  it("sets host", function() {
    assert.equal(this.options.host, this.twit.host)
  })
