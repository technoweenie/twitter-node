var base64 = require("./build/default/base64"),
    jsbase64 = require("./js_base64_for_comparsion"),
    Buffer = require('buffer').Buffer,
    sys = require("sys");

//sys.puts(base64.encode('wow'));
var textBuff = new Buffer('What do ya want for nothing?', 'utf8');
var baseBuff = new Buffer('V2hhdCBkbyB5YSB3YW50IGZvciBub3RoaW5nPw==', 'utf8');

if (base64.encode('What do ya want for nothing?')=='V2hhdCBkbyB5YSB3YW50IGZvciBub3RoaW5nPw==')
	sys.puts('test 1 PASSED');
else
	sys.puts('test 1 FAILS');
	
if (base64.decode(base64.encode('What do ya want for nothing?'))=='What do ya want for nothing?')
	sys.puts('test 2 PASSED');
else
	sys.puts('test 2 FAILS');
	
if (base64.encode(textBuff)=='V2hhdCBkbyB5YSB3YW50IGZvciBub3RoaW5nPw==')
	sys.puts('test 3 PASSED');
else
	sys.puts('test 3 FAILS');
	
if (base64.decode(baseBuff)=='What do ya want for nothing?')
	sys.puts('test 4 PASSED');
else
	sys.puts('test 4 FAILS');
	
	
// C++ base64
var m1=new Date().getTime();
for(i=0;i<10000;i++) {
	h=base64.decode(base64.encode('EdPy2H71Q1MjTzkuRxAr1CJWs2ZapZEuaY3XwJL8mpxaTBLWZPkw1yakKLv2r79eHmNQ1m2Cc6PErAkH5FR3Nmd011F09LCas76Z'+String(i)));
}
var m2=new Date().getTime();
var c=m2-m1;
sys.puts('C++ base64 result is: '+(c));


// JS base64
var m1=new Date().getTime();
for(i=0;i<10000;i++) {
	h=jsbase64.decode(jsbase64.encode('EdPy2H71Q1MjTzkuRxAr1CJWs2ZapZEuaY3XwJL8mpxaTBLWZPkw1yakKLv2r79eHmNQ1m2Cc6PErAkH5FR3Nmd011F09LCas76Z'+String(i)));
}
var m2=new Date().getTime();
var js=m2-m1;
sys.puts('JS base64 result is: '+(js));
if (c<js) sys.puts('C++ module faster than JS in '+(js/c)+' times');
else if (c>js) sys.puts('JS module faster than C++ in '+(c/j)+' times');

