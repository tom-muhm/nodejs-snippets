var	winston = require('winston');
var async = require('async');
var http = require("http");
var https = require("https");
var request = require("request");
var BTCE = require('./btce.js');

var requests = 10
var parRequests = 1

var testHttp = true
var testRequest = false

http.globalAgent.maxSockets = parRequests;

var btce = new BTCE();

var log = new (winston.Logger)({
	transports: [
	new (winston.transports.Console)({'timestamp':true})
	]
});
log.log('debug', "127.0.0.1 - there's no place like home");

function getBTCEPairs() {
	var pairs = new Array();
	for (var i in btce.currency_pairs) {
		pairs[i] = btce.currency_pairs[i].join("_").toLowerCase();
	}
	return pairs;
}

var pairs = getBTCEPairs();
function updateBTCEData() {
	for (var i in pairs) {
		var pair = pairs[i];
		log.info("get Depth for Pair " + pair);


		function tickerCallback(err, data) {
			if (err) {
				log.error("Error");
			} else {
				log.info(data);
			}
		}

		btce.ticker(pair, tickerCallback);
	}
};



// var btcePublic = new BTCE();

var data = new Array(20);

var requestApi = function(data, errorFunc){
	var start = Date.now();
	if (true) {

		request("https://btc-e.com/api/2/ltc_btc/depth", function (error, response, body) {
			console.log(Date.now() - start + "ms");
			var json = JSON.parse(body);
			log.info(json.asks[0] + json.bids[0]);
			errorFunc(error);
		});

	} else {

		var options = {
			host: 'btc-e.com',
			port: 443,
			path: '/api/2/ltc_btc/depth',
			method: 'POST',
			agent: false,
			headers: {
				'connection': 'keep-alive',
			}
		};

		var req = https.request(options, function(res) {

			res.setEncoding('utf8');
			var buffer = '';
			res.on('data', function (data) { 
				buffer += data; });
			res.on('end', function() { 
				console.log(Date.now() - start + "ms");
				var json = JSON.parse(buffer);
				log.info(json.asks[0] + json.bids[0]);
			});
		});

		req.on('error', function(e) {
			console.log('warning: problem with request: ' + e.message);
		});

		req.write("");
		req.end();
	}


};


function restart(testFunction, timesLeft) {
	log.debug("restart " + testFunction.name + " timesLeft " + timesLeft)
	timesLeft--
	if (timesLeft > 0) {
		testFunction(timesLeft)
	}
}

function startRequestTest(requests) {
	if (requests <= 0) {
		return;
	}

	var start = Date.now();
	request("https://btc-e.com/api/2/ltc_btc/depth", function (error, response, body) {
		console.log(requests + " - " + (Date.now() - start) + "ms");
		var json = JSON.parse(body);
		log.info(json.asks[0] + json.bids[0]);
		// log.error(error);
		startRequestTest(--requests);
	});
}

function startHttpTest(requests) {
	if (requests <= 0) {
		return;
	}

	var start = Date.now();

	var options = {
		host: 'btc-e.com',
		port: 443,
		path: '/api/2/ltc_btc/depth',
		method: 'POST',
		// agent: false,
		// headers: {
			// 'connection': 'keep-alive',
		// }
	};

	https.get(options, function(res) {
		res.on("data", function(body) {
			console.log(requests + " - " + (Date.now() - start) + "ms");
			var json = JSON.parse(body);
			log.info(json.asks[0] + json.bids[0]);
			startHttpTest(--requests);
		});
		res.on("end", function() {
		});
	}).end();

}

if (testRequest) {
	log.info("starting request test");
	startRequestTest(requests);
}

if (testHttp) {
	log.info("starting http test");
	startHttpTest(requests);
}

// async.forEachLimit(data, 500, requestApi, function(err){
//     // err contains the first error or null
//     console.log("starting");
//     if (err) throw err;
//     console.log('All requests processed!');
// });