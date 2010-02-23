var sys = require('sys')

// glorious streaming json parser, built specifically for the twitter streaming api
// assumptions:
//   1) ninjas are mammals
//   2) tweets come in chunks of text, surrounded by {}'s, separated by line breaks
//   3) only one tweet per chunk
//
//   p = new parser.instance()
//   p.addListener('object', function...)
//   p.receive(data)
//   p.receive(data)
//   ...
var p = exports.instance = function() {
  this.chunks    = "";
  this.startJSON = /^\s*\{/
  this.endJSON   = /\}\s*$/
}

sys.inherits(p, process.EventEmitter)

p.prototype.receive = function(data) {
  var pieces = (this.chunks + data).split("\n")
  var text   = pieces.shift()
  var json_and_chunk = this.parseChunked(text, pieces)

  var json    = json_and_chunk[0]
  this.chunks = json_and_chunk[1]

  if(json)
    this.emit('object', json)
}

p.prototype.parseChunked = function(text, pieces) {
  var json;
  while(1) {
    json = this.attemptedParse(text)
    if(!json) {
      if(pieces.length > 0) {
        text += pieces.shift();
      } else {
        return [json, text]
      }
    } else {
      return [json, pieces.join("\n")]
    }
  }
}

// returns parsed JSON object or null if given JSON is invald.
p.prototype.attemptedParse = function(text) {
  if(!text.match(this.startJSON) || !text.match(this.endJSON)) {
    return null;
  }

  try {
    return JSON.parse(text)
  } catch(err) {
    // sometimes what looks like valid json from the regexes isn't:
    //   {"a": {"b": 1}
    // starting and ending brackets, but still invalid.
    // hopefully the next chunk will finish the json.
    if(this.debug || err.name != 'SyntaxError') {
      sys.puts(sys.inspect(text))
      sys.puts(err.stack)
    }
    return null;
  }
}