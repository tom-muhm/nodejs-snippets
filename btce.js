var cur = require("./currencies.js");
var request = require("request");
var http = require("http");
var crypto = require("crypto");
var querystring = require("querystring");
// http.globalAgent.maxSockets = 100;

function BTCE(apiKey, secret, nonceGenerator) {
	var self = this;
	self.url = "https://btc-e.com/tapi";
	self.publicApiUrl = "https://btc-e.com/api/2/";
	self.apiKey = apiKey;
	self.secret = secret;
	self.nonce = nonceGenerator;

	self.currency_pairs = [
	[cur.BTC, cur.USD],
	[cur.BTC, cur.RUR],
	[cur.BTC, cur.EUR],
	[cur.LTC, cur.BTC],
	[cur.LTC, cur.USD],
	[cur.LTC, cur.RUR],
	[cur.NMC, cur.BTC],
	[cur.USD, cur.RUR],
	[cur.EUR, cur.USD],
	[cur.NVC, cur.BTC],
	[cur.TRC, cur.BTC],
	[cur.PPC, cur.BTC],
	[cur.FTC, cur.BTC],
	[cur.CNC, cur.BTC]];

	self.makeRequest = function(method, params, callback) {
		var queryString,
		sign,
		headers;

		if(!self.apiKey || !self.secret) {
			callback(new Error("Must provide API key and secret to use the trade API."));
			return;
		}

    // If the user provided a function for generating the nonce, then use it.
    if(self.nonce) {
    	params.nonce = self.nonce();
    } else {
    	params.nonce = Math.round((new Date()).getTime() / 1000);
    }

    params.method = method;
    queryString = querystring.stringify(params);

    sign = crypto.createHmac("sha512", self.secret).update(new Buffer(queryString)).digest('hex').toString();
    headers = {
    	'Sign': sign,
    	'Key': self.apiKey
    };

    request({ url: self.url, method: "POST", form: params, headers: headers }, function(err, response, body) {
    	if(err || response.statusCode !== 200) {
    		callback(new Error(err ? err : response.statusCode));
    		return;
    	}

    	var result = JSON.parse(body);
    	if(result.success === 0) {
    		callback(new Error(result.error));
    		return;
    	}

    	callback(null, result['return']);
    });};

    self.makePublicApiRequest = function(pair, method, callback) {
    	var req = request({ url: self.publicApiUrl + pair + '/' + method }, function(err, response, body) {
    		if(err || response.statusCode !== 200) {
    			callback(new Error(err ? err : response.statusCode));
    			return;
    		}

    		var result = JSON.parse(body);

    		if (result.error) {
    			callback(new Error(result.error));
    			return;
    		}

    		callback(null, result);
    	});
    	console.log(req);
    };

    self.getInfo = function(callback) {
    	self.makeRequest('getInfo', {}, callback);
    };

    self.transHistory = function(params, callback) {
    	self.makeRequest('TransHistory', params, callback);
    };

    self.tradeHistory = function(params, callback) {
    	self.makeRequest('TradeHistory', params, callback);
    };

    self.orderList = function(params, callback) {
    	self.makeRequest('OrderList', params, callback);
    };

    self.trade = function(pair, type, rate, amount, callback) {
    	self.makeRequest('Trade', {
    		'pair': pair,
    		'type': type,
    		'rate': rate,
    		'amount': amount
    	}, callback);
    };

    self.cancelOrder = function(orderId, callback) {
    	self.makeRequest('CancelOrder', {'order_id': orderId}, callback);
    };

    self.ticker = function(pair, callback) {
    	self.makePublicApiRequest(pair, 'ticker', callback);
    };

    self.trades = function(pair, callback) {
    	self.makePublicApiRequest(pair, 'trades', callback);
    };

    self.depth = function(pair, callback) {
    	self.makePublicApiRequest(pair, 'depth', callback);
    };
};

module.exports = BTCE;