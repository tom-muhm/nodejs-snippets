var	winston = require('winston');
var async = require('async');
var http = require("http");
var https = require("https");
var request = require("request");
var BTCE = require('./btce.js');

http.globalAgent.maxSockets = 50;

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



// var btcePublic = new BTCE();

var data = new Array(20);

var requestApi = function(data, next){
	var start = Date.now();
	// btcePublic.ticker("ltc_btc", function(err, data) {
	// 	console.log(Date.now() - start + "ms " + data);
	// 	if (err) {
	// 		throw err;
	// 	}	
	// });
if (true) {

	request("https://btc-e.com/api/2/ltc_btc/depth", function (error, response, body) {
		console.log(Date.now() - start + "ms");
		var json = JSON.parse(body);
		log.info(json.asks[0] + json.bids[0]);
		next(error);
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
	// var start = Date.now();
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

async.forEachLimit(data, 500, requestApi, function(err){
    // err contains the first error or null
    console.log("starting");
    if (err) throw err;
    console.log('All requests processed!');
});



