var request = require("request");
var log = require("winston");
var http = require("http");

log.info("Test");

console.log(http.globalAgent);
console.log(http.globalAgent.maxSockets);

var array = new Array(1);

for (i=0; i<array.length; i++) {
	log.info("i " + i);
	testGet();
	/*
	var request = require('request');
		request('http://www.google.com', function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    console.log(response.headers); // Print the google web page.
		  }
	});
*/
}


function testGet() {
	http.get("http://www.google.com/index.html", function(res) {
	  console.log("Got response: ");
	  console.log(res.headers)
	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});
};


function testHttp() {
	var options = {
	  hostname: 'www.google.com',
	  port: 80,
	  path: '/upload',
	  method: 'POST'
	};

	var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	  res.on('end', function(res, req) {
	  	log.info(res.headers);
	  	log.info(req.headers);	
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write('data\n');
	req.write('data\n');
	req.end();
};