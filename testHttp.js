var http = require('http');
var concurrentServerRequests = 0;
var totalServerRequests = 0;
var PORT_BASE = 1337;
 
function createServer(host, port) {
    http.createServer(function (req, res) {
        ++concurrentServerRequests;
        ++totalServerRequests;


        // console.log("req");
        // console.log(req);
        console.log("res");
        console.log(res);

 
        // console.log('Concurrent active server requests:' + 
        //             concurrentServerRequests + ', total received:'  + 
        //             totalServerRequests);
 
        
        // setTimeout(function() {
        //     --concurrentServerRequests;
        //     console.log("stopping res");
        //     res.end();
        // }, 300);
 
    }).listen(port, host);
    console.log('Server running at http://' + host + ':' + port);
}

function runTestCase3() {
    createServer('127.0.0.1', PORT_BASE);
    // createServer('127.0.0.1', PORT_BASE + 1);
 
    http.globalAgent.maxSockets = 10;
    for(var i=0;i<1; ++i) {
 
        http.request({
            host: '127.0.0.1',
            port: PORT_BASE,
            method: 'GET'
        }, function(res) {
        }).end();
 
        // http.request({
        //     host: '127.0.0.1',
        //     port: PORT_BASE + 1,
        //     method: 'GET'
        // }, function(res) {
        // }).end();
    }
}
runTestCase3();