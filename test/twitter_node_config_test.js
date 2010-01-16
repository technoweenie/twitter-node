var twitterNode = require('../lib'),
         assert = require('assert'),
            sys = require('sys');

process.mixin(GLOBAL, require('ntest'));

describe("default TwitterNode instance")
  before(function() { this.twit = twitterNode.create(); })

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
      params: {count: 5}
    }
    this.twit = twitterNode.create(this.options); 
  })

  it("has default requestUrl()", function() {
    assert.equal("abc/retweet.xml" + this.twit.buildParams(), this.twit.requestUrl())
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