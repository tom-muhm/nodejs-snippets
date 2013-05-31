process.env.NODE_DEBUG = 'http';
process.env.NODE_DEBUG = 'https';

var url = require("url");
var http = require("http");
var https = require("https");
var winston = require("winston");
var async = require("async");

var log = winston;
/*new (winston.Logger)({
 transports: [
 new (winston.transports.Console)({'timestamp': true})
 ]
 });*/

var parseErrorCount = 0;
var httpErrorCount = 0;

var httpOptions;
var testStopped;
var protocol;

function startTest(numOfRequests, numOfParRequests, options, callback) {
    httpOptions = options;
    testStopped = callback;
    if (options.protocol == "http:") {
        protocol = http;
    } else if (options.protocol == "https:") {
        protocol = https;
    } else {
        log.error("unknown protocol " + options.protocol);
        return;
    }

    var start = Date.now();
    var requests = new Array(numOfRequests);
    async.forEachLimit(requests, numOfParRequests, startHttpTest, function () {
        var end = Date.now();
        testStopped("HttpTest", (end-start), parseErrorCount, httpErrorCount);
    });
};

function startHttpTest(x, callback) {
    var start = Date.now();
    var req = protocol.get(httpOptions);
    req.on("response", function (res) {
        var body = "";
        res.setEncoding("utf8");
        res.on("data", function (data) {
            body += data;
        });
        res.on("end", function () {
            log.info((Date.now() - start) + "ms");
            try {
                var json = JSON.parse(body);
//			    log.info(json.asks[0] + json.bids[0]);
            } catch (err) {
                log.error("parse error " + err);
                console.log(body);
                parseErrorCount++;
            }
            callback();
//            res.destroy();
        });
    });
    req.setTimeout(2000, function() {
        callback();
    });
    req.on("error", function (err) {
        log.error("http error " + err);
        httpErrorCount++;
    });
}

module.exports.start = startTest