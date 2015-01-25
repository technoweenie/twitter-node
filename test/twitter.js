'use strict';

var assert = require('assert');
var Twitter = require('../lib/twitter');

describe("Constructor", function() {

  describe(".__generateURL()", function() {
    var client;

    before(function(){
      client = new Twitter({});
    });

    it("method exists", function(){
      assert(client.hasOwnProperty('__generateURL'));
      assert.equal(typeof client.__generateURL, 'function');
    });

    it("build url", function(){

      var path = 'statuses';
      var endpoint = 'https://stream.twitter.com/1.1/statuses';

      assert.throws(
        client.__generateURL,
        Error
      );

      assert.equal(
        client.__generateURL(path),
        client.options.rest_base + '/' + path + '.json'
      );

      assert.equal(
        client.__generateURL(path + '.json'),
        client.options.rest_base + '/' + path + '.json'
      );

      assert.equal(
        client.__generateURL('/' + path),
        client.options.rest_base + '/' + path + '.json'
      );

      assert.equal(
        client.__generateURL(path + '/'),
        client.options.rest_base + '/' + path + '.json'
      );

      assert.equal(
        client.__generateURL(endpoint),
        endpoint + '.json'
      );

      assert.equal(
        client.__generateURL(endpoint),
        endpoint + '.json'
      );


    });
  });
});
