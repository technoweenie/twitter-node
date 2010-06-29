all:
	node-waf configure build
tests:
	node ./test.js
install:
	cp ./build/default/base64.node /usr/local/lib/node/libraries/base64.node
clean:
	rm -rf ./build
