var	sys = require('sys'),
	twitter = require('twitter');

function tweet(data) {
	if ( typeof data === 'string' )
		sys.puts(data);
	else if ( data.text && data.user && data.user.screen_name )
		sys.puts('"' + data.text + '" -- ' + data.user.screen_name);
	else if ( data.message )
		sys.puts('ERROR: ' + sys.inspect(data));
	else
		sys.puts(sys.inspect(data));
}

function memrep() {
	console.log(JSON.stringify(process.memoryUsage()));
	setTimeout(memrep, 60000);
}

var twit = new twitter({
	consumer_key: 'STATE YOUR NAME',
	consumer_secret: 'STATE YOUR NAME',
	access_token_key: 'STATE YOUR NAME',
	access_token_secret: 'STATE YOUR NAME'
})
.stream('statuses/sample', function(stream) {
	stream.on('data', tweet);
	setTimeout(memrep, 15000);
})
