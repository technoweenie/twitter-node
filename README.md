# twitter-node

Creates a streaming connection with twitter, and pushes any incoming statuses to a tweet event.

## Installation

Depends on ntest.

Use NPM:

    npm install twitter-node

Otherwise create a symlink in `~/.node_libraries`

    $ ln -s /path/to/twitter-node/lib/twitter-node ~/.node_libraries/twitter-node

## Events

TwitterNode emits these events:

* tweet(json) - This is emitted when a new tweet comes in.  This will be a parsed JSON object.
* limit(json) - This is emitted when a new limit command comes in.  Currently, limit detection only works with parsed JSON objects.
* delete(json) - This is emitted when a new delete command comes in.  Currently, delete detection only works with parsed JSON objects.
* end(response) - This is emitted when the http connection is closed.  The HTTP response object is sent.

See the [streaming API docs][api-docs] for examples of the limit and delete commands.

[api-docs]: http://apiwiki.twitter.com/Streaming-API-Documentation

## Usage

    // twitter-node does not modify GLOBAL, that's so rude
    var TwitterNode = require('twitter-node').TwitterNode
      , sys         = require('sys')

    // you can pass args to create() or set them on the TwitterNode instance
    var twit = new TwitterNode({
      user: 'username', 
      password: 'password',
      host: 'my_proxy.my_company.com',         // proxy server name or ip addr
      port: 8080,							   // proxy port!
      track: ['baseball', 'football'],         // sports!
      follow: [12345, 67890],                  // follow these random users
      locations: [-122.75, 36.8, -121.75, 37.8] // tweets in SF
    });

    // adds to the track array set above
    twit.track('foosball');

    // adds to the following array set above
    twit.follow(2345);

    // follow tweets from NYC
    twit.location(-74, 40, -73, 41)

    // http://apiwiki.twitter.com/Streaming-API-Documentation#QueryParameters
    twit.params['count'] = 100;

    // http://apiwiki.twitter.com/Streaming-API-Documentation#Methods
    twit.action = 'sample'; // 'filter' is default

    twit.headers['User-Agent'] = 'whatever';

    // Make sure you listen for errors, otherwise
    // they are thrown
    twit.addListener('error', function(error) {
      console.log(error.message);
    });

    twit
      .addListener('tweet', function(tweet) {
        sys.puts("@" + tweet.user.screen_name + ": " + tweet.text);
      })

      .addListener('limit', function(limit) {
        sys.puts("LIMIT: " + sys.inspect(limit));
      })

      .addListener('delete', function(del) {
        sys.puts("DELETE: " + sys.inspect(del));
      })

      .addListener('end', function(resp) {
        sys.puts("wave goodbye... " + resp.statusCode);
      })

      .stream();
      
    // We can also add things to track on-the-fly
    twit.track('#nowplaying');
    twit.follow(1234);
    
    // This will reset the stream
    twit.stream();

## Pre-Launch Checklist

See http://apiwiki.twitter.com/Streaming-API-Documentation.  Keep these points in mind when getting ready to use TwitterNode in production:

* Not purposefully attempting to circumvent access limits and levels?
* Creating the minimal number of connections?
* Avoiding duplicate logins?
* Backing off from failures: none for first disconnect, seconds for repeated network (TCP/IP) level issues, minutes for repeated HTTP (4XX codes)?
* Using long-lived connections?
* Tolerant of other objects and newlines in markup stream? (Non <status> objects...)
* Tolerant of duplicate messages?

## TODO

* Handle failures as recommended from the Twitter stream documentation.

## \m/

* Tim Smart
* Matt Secoske (secos)
* kompozer
* Twitter

## Note on Patches/Pull Requests
 
* Fork the project.
* Make your feature addition or bug fix.
* Add tests for it. This is important so I don't break it in a
  future version unintentionally.
* Commit, do not mess with version or history.
  (if you want to have your own version, that is fine but bump version in a commit by itself I can ignore when I pull)
* Send me a pull request. Bonus points for topic branches.

## Copyright

Copyright (c) 2010 rick. See LICENSE for details.
