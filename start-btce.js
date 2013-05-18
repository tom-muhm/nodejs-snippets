var	winston = require('winston');
var async = require('async');
// var http = require("http");
var request = require("request");
var BTCE = require('./btce.js');
var https = require("https");
var HttpsAgent = require("agentkeepalive").HttpsAgent; // more active than forever-agent? - https://github.com/TBEDP/agentkeepalive
var keepAliveAgent = require('./agent.js'); // gist for keep alive agent - https://gist.github.com/atimb/2963672
var foreverAgent = require('forever-agent'); // module by request creator - https://github.com/mikeal/forever-agent


var requests = 10
var parRequests = 1
var numSockets = 100

var testHttp = true
var testRequest = true

var testRunning = false

var agent = new keepAliveAgent({ maxSockets: numSockets });
var keepaliveAgent = new HttpsAgent({
  maxSockets: 1,
  maxKeepAliveRequests: 0, // max requests per keepalive socket, default is 0, no limit.
  maxKeepAliveTime: 30000 // keepalive for 30 seconds
});

// http.globalAgent.maxSockets = parRequests;

var btce = new BTCE();

var log = new (winston.Logger)({
	transports: [
	new (winston.transports.Console)({'timestamp':true})
	]
});

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

function startRequestTest(requests) {
	if (requests <= 0) {
		testRunning = false
		return;
	}

	var options = {
		uri: "https://btc-e.com/api/2/ltc_btc/depth",
		// agentClass: keepaliveAgent
		forever: true
	};

	var start = Date.now();
	request("https://btc-e.com/api/2/ltc_btc/depth", function (error, response, body) {
		var agent = response.request.agent;
		console.log("Agent");
		console.log(agent);
		console.log(requests + " - " + (Date.now() - start) + "ms");
		var json = JSON.parse(body);
		log.info(json.asks[0] + json.bids[0]);
		// log.error(error);
		startRequestTest(--requests);
	});
}

function startHttpTest(requests) {
	// console.log(http.globalAgent);
	if (requests <= 0) {
		testRunning = false
		return;
	}

	var start = Date.now();

	var options = {
		host: 'btc-e.com',
		port: 443,
		path: '/api/2/ltc_btc/depth',
		method: 'GET',
		agent: foreverAgent
	};

	var req = https.get(options); 

	req.on("response", function(res) {
		res.setEncoding("utf8");
		res.on("data", function(body) {
			console.log(requests + " - " + (Date.now() - start) + "ms");
			var json = JSON.parse(body);
			log.info(json.asks[0] + json.bids[0]);
			startHttpTest(--requests);
		});
		res.on("end", function() {
		});
	});
	req.on("error", function(err) {
		console.log("got an error ");
		console.log(err);
	});
	console.log("Agent");
	console.log(req.agent);
	req.end();
}

function startTest(testFunction) {
	if (testRunning) {
		log.debug("test still running waiting 1sec");
		setTimeout(function() {
			startTest(testFunction)
		}, 1000);
	}  else {
		log.info("starting test: " + testFunction.name);
		testRunning = true;
		testFunction(requests);
	}
}

if (testRequest) {
	startTest(startRequestTest);
}

if (testHttp) {
	startTest(startHttpTest);
}

// async.forEachLimit(data, parRequests, requestApi, function(err){
//     // err contains the first error or null
//     console.log("starting");
//     if (err) throw err;
//     console.log('All requests processed!');
// });