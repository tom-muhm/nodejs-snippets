//process.env.NODE_DEBUG = 'net';
//process.env.NODE_DEBUG = 'https';

/* imports */
var winston = require("winston");
var urlParser = require("url");
var HttpAgent = require("agentkeepalive"); // more active than forever-agent? - https://github.com/TBEDP/agentkeepalive
var HttpsAgent = HttpAgent.HttpsAgent;
var foreverAgent = require('forever-agent'); // module by request creator - https://github.com/mikeal/forever-agent

var log = winston;
/* var log = new (winston.logger)({
 transports: [
 new (winston.transports.console)({'timestamp': true})
 ]
 });*/

/* import tests */
var httpTest = require("./keep-alive-agent-http-test").start;
var requestTest = require("./keep-alive-agent-request-test").start;

/* global test configuration */
var url = "http://api.twitter.com/1.1/statuses/mentions_timeline.json";
//var url = "https://btc-e.com/api/2/ltc_btc/depth";
var numOfRequests = 1000
var numOfParRequests = 30

/* tests to run */
// name - function - run_?
var run = [
    ["HttpTest", httpTest, true],
    ["RequestTest", requestTest, true],
    ["PrintResults", printResults, true]
];

/* prog start */
var testRunning = false
var results = new Array();

function testStopped(name, time, parseErrors, otherErrors) {
    testRunning = false;
    var result = name + " finished for " + numOfRequests + " requests in " + time / 1000 + "sec, parse errors: " + parseErrors + ", other errors: " + otherErrors + ", parallel requests " + numOfParRequests;
    log.info(result);
    results.push(result);
}

function startTest(name, testFunction) {
    if (testRunning) {
        log.debug("test still running waiting 1sec");
        setTimeout(function () {
            startTest(name, testFunction)
        }, 1000);
    } else {
        log.info("starting test: " + name);
        testRunning = true;
        var options = urlParser.parse(url);
        var agent;
        if (options.protocol == "http:") {
            agent = new HttpAgent({
                maxSockets: numOfParRequests,
                maxKeepAliveRequests: 0, // max requests per keepalive socket, default is 0, no limit.
                maxKeepAliveTime: 3600000 // keepalive for ... mili seconds
            });
        } else {
            agent = new HttpsAgent({
                maxSockets: numOfParRequests,
                maxKeepAliveRequests: 0, // max requests per keepalive socket, default is 0, no limit.
                maxKeepAliveTime: 3600000 // keepalive for ... mili seconds
            });
        }
        options.agent = agent;
        options.uri = url;
        options.timeout = 2000;

        testFunction(numOfRequests, numOfParRequests, options, testStopped);
    }
}

function printResults() {
    for (var i in results) {
        log.info(results[i]);
    }
}

// start tests
for (var i in run) {
    var name = run[i][0];
    var test = run[i][1];
    var start = run[i][2];

    if (start) {
        startTest(name, test);
    }
}
