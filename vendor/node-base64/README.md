# node-base64
* C/C++ library for encode and decode in base 64


## Install:
### way 1
1) go to the directory with node-base64 library

2) execute `node-waf configure build`

3) get module from `./build/default/base64.node`

You should use `var base64 = require("./build/default/base64");` (way to module)

### way 2 (works if node are installed in default path)
1) go to the directory with node-base64 library

2) execute `make`

3) execute `sudo make install`

You should use `var base64 = require("base64");` (from any path)

## Functions:
	encode(str); // Encode string
	decode(str); // Decode string
	
## Usage:
	var base64 = require('base64');
	var code = base64.encode('text');
	var str = base64.decode(code); // text
	
## Speed testing
To run speed test on your computer run test.js, here is my:
	C++ base64 result is: 82
	JS base64 result is: 517
	C++ module faster than JS in 6.304878048780488 times

<img src="http://nodejs.ru/img/small.png">
