var TwitterNode = require('../lib').TwitterNode,
         assert = require('assert'),
            sys = require('sys');

process.mixin(GLOBAL, require('ntest'));

describe("json TwitterNode instance")
  before(function() { this.twit = new TwitterNode(); })

  it("accepts JSON in chunks", function() {
    var promise = new process.Promise();
    var result;

    this.twit.addListener('tweet', function(tweet) {
      result = tweet
      promise.emitSuccess()
    })

    this.twit.processTweet("")
    this.twit.processTweet(" ")
    this.twit.processTweet("{")
    this.twit.processTweet('"a":{')
    this.twit.processTweet('"b":1}')
    this.twit.processTweet("}\n{\"a\":1}")

    if(!promise.hasFired && promise._blocking) promise.wait()

    assert.ok(result)
    assert.equal(1, result.a.b)
  })

  it("emits tweet with parsed JSON tweet", function() {
    var promise = new process.Promise();
    var result;
    this.twit
      .addListener('tweet', function(tweet) {
        result = tweet
        promise.emitSuccess()
      })
      .addListener('limit', function(tweet) {
        promise.emitError()
      })
      .addListener('delete', function(tweet) {
        promise.emitError()
      })
      .processTweet('{"a":1}')

    if(!promise.hasFired) promise.wait()
    assert.equal(1, result.a)
  })

  it("emits delete with parsed JSON delete command", function() {
    var promise = new process.Promise();
    this.twit
      .addListener('tweet', function(tweet) {
        promise.emitError()
      })
      .addListener('limit', function(tweet) {
        promise.emitError()
      })
      .addListener('delete', function(tweet) {
        result = tweet
        promise.emitSuccess()
      })
      .processTweet('{"delete":{"status":{"id": 1234}}}')

    if(!promise.hasFired) promise.wait()
    assert.equal(1234, result.status.id)
  })

  it("emits limit with parsed JSON limit command", function() {
    var promise = new process.Promise();
    this.twit
      .addListener('tweet', function(tweet) {
        promise.emitError()
      })
      .addListener('delete', function(tweet) {
        promise.emitError()
      })
      .addListener('limit', function(tweet) {
        result = tweet
        promise.emitSuccess()
      })
      .processTweet('{"limit":{"track": 1234}}')

    if(!promise.hasFired) promise.wait()
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

  it("can add tracking keywords", function() {
    this.twit.track('abc+def')
    this.twit.track('ghi')
    assert.equal('?track=abc%2Bdef%2Cghi', this.twit.buildParams())
  })

  it("can add following users", function() {
    this.twit.follow(123)
    this.twit.follow(456)
    assert.equal('?follow=123%2C456', this.twit.buildParams())
  })

describe("custom TwitterNode instance")
  before(function() {
    this.options = {
      port:81,
      host:'10.0.0.1',
      path: 'abc/',
      action: 'retweet',
      format: 'xml',
      follow: [123,456],
      track: ['abc', 'def'],
      headers: {'a': 'abc'},
      params: {count: 5}
    }
    this.twit = new TwitterNode(this.options); 
  })

  it("has default requestUrl()", function() {
    assert.equal("abc/retweet.xml" + this.twit.buildParams(), this.twit.requestUrl())
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