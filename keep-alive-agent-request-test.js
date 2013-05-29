var request = require("request");
var winston = require("winston");
var async = require("async");

var log = winston;
/* var log = new (winston.Logger)({
 transports: [
 new (winston.transports.Console)({'timestamp': true})
 ]
 });*/

var parseErrorCount = 0;
var requestErrorCount = 0;

var httpOptions;
var testStopped;

function startTest(numOfRequests, numOfParRequests, options, callback) {
    httpOptions = options;
    testStopped = callback;

    var start = Date.now();
    var requests = new Array(numOfRequests);
    async.forEachLimit(requests, numOfParRequests, startRequestTest, function () {
        var end = Date.now();
        testStopped("RequestTest", (end-start), parseErrorCount, requestErrorCount);
    });
};

function startRequestTest(x, callback) {
    var start = Date.now();
    request(httpOptions, function (error, response, body) {
        log.info((Date.now() - start) + "ms");
        if (!error) {
            try {
                var json = JSON.parse(body);
//                log.info(json.asks[0] + json.bids[0]);
            } catch (err) {
                log.error("parse error " + err);
                console.log(body);
                parseErrorCount++;
            }
        } else {
            log.error("request error " + error);
            requestErrorCount++;
        }
        callback();
    });

};

module.exports.start = startTest;