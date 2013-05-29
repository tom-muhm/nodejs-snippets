/* imports */
var winston = require("winston");
var async = require("async");
var BTCE = require("./btce.js");


var log = winston;
/* var log = new (winston.Logger)({
 transports: [
 new (winston.transports.Console)({'timestamp': true})
 ]
 });*/

var btce = new BTCE();

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