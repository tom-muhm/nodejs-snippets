//process.env.NODE_DEBUG = 'http';
//process.env.NODE_DEBUG = 'net';

var url = require('url');
var net = require('net');
var tls = require('tls');
var http = require('./proxyrequest');
//var https = require('https');
var request = require('request');
var HttpAgent = require("agentkeepalive")
var HttpsAgent = require("agentkeepalive").HttpsAgent
var tunnel = require('tunnel');

//var proxyrequest = require('./proxyrequest');

//var HttpAgent = HttpAgent.HttpsAgent;

//process.on('uncaughtException', function(err) {
//    console.log("uncaught error");
//    console.log(err);
//})

var agent = new HttpAgent({
    maxSockets: 100,
    maxKeepAliveRequests: 0, // max requests per keepalive socket, default is 0, no limit.
    maxKeepAliveTime: 500000000 // keepalive for ... mili seconds
});

var agent = new HttpsAgent({
    maxSockets: 100,
    maxKeepAliveRequests: 0, // max requests per keepalive socket, default is 0, no limit.
    maxKeepAliveTime: 50000000 // keepalive for ... mili seconds
});

// Server

var defaultProxyPort = 8080;
var proxyPort = 8080;

//var startProxy = function (proxyPort) {
var proxy = http.createServer();
proxy.on('request', function (req, res) {
    console.log('REQUEST');

    if (req.url.indexOf('/') !== 0) {
        var uri = url.parse(req.url);
        var httpMessage = req.method + ' ' + uri.path + ' HTTP/' + req.httpVersion + '\r\n';
        for (var header in req.headers) {
            httpMessage += header + ': ' + req.headers[header] + '\r\n';
        }
        httpMessage += '\r\n';

        var options = uri;
        options.headers = req.headers;
        options.agent = agent;

        var request = new proxyrequest(options);

        var test = agent.unusedSockets[uri.host + ":" + (uri.port || 80)];
//        console.error(test);

        agent.addRequest(request, uri.host, uri.port || 80);

        request.on('socket', function (serverSocket) {

            console.error("socket writable");
            console.error(serverSocket.writeable);


            var proxySocket = res.connection;

            console.error('sending head');
            serverSocket.write(httpMessage);

            serverSocket.on('data', function (chunk) {
                console.log("---DATA---")
                proxySocket.write(chunk, {end: false});
            });

            serverSocket.on('close', function () {
                console.log('close');
            });

            proxySocket.on('data', function (chunk) {
                console.log('PROXY DATA');
            });

            proxySocket.on('end', function (chunk) {
                console.log('PROXY END');
//                serverSocket.emit('end');
            });

//            serverSocket.pipe(proxySocket);
//            proxySocket.pipe(serverSocket, {end: false});
//            proxySocket.on('end', function () {
//                serverSocket.emit('end');
//            });
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('nothing here');
    }

    /* TODO - test which method is more effective - piping with request or directly with socket
     *
     // test the path - if it starts with a slash it isn't a proxy request
     if (req.url.indexOf('/') !== 0) {
     if (req.headers['proxy-connection']) {
     req.headers.connection = req.headers['proxy-connection'];
     delete req.headers['proxy-connection']
     }
     var options = {
     uri: req.url,
     headers: req.headers,
     method: req.method,
     path: req.url
     }
     req.pipe(request(options)).pipe(res);
     } else {
     res.writeHead(200, {'Content-Type': 'text/plain'});
     res.end('nothing here');
     }
     */
});
proxy.on('connect',function (req, clientSocket) {
    console.log('CONNECT');

    var serverUrl = url.parse('https://' + req.url);

    var httpMessage = 'HTTP/1.1 200 Connection Established\r\n';
    httpMessage += 'Proxy-agent: Node-Proxy\r\n';
    httpMessage += '\r\n';

    var options = serverUrl;
    options.agent = agent;
    options.headers = {
        host: serverUrl.hostname
    };

    console.error('sending ready');
    clientSocket.write(httpMessage);

    var req = https.request(options);
//    req.end();

//    var serverSocket = net.connect(serverUrl.port, serverUrl.hostname);

    req.on('socket', function(serverSocket) {

        var data = '';

        clientSocket.on('data', function (chunk) {
            console.error('CLIENT DATA');
            console.error(chunk.length);
            data += chunk;
            serverSocket.write(chunk);
        });
        serverSocket.on('data', function(chunk) {
            console.error('SERVER DATA');
            console.error(chunk);
//            proxySocket.write(chunk);
        });
        clientSocket.on('end', function() {
            console.error('PROXY END');
//            req.end();
//            serverSocket.end();
        });
        serverSocket.on('end', function() {
            console.trace('SERVER END');
        })
    });

//    req.on('response', function(res) {
//        console.error('response');
//       res.on('data', function(chunk) {
//           console.error('data');
//           console.error(chunk);
//       });
//       res.on('end', function() {
//          console.error('end');
//       });
//    });


//    var request = new proxyrequest(serverUrl);
//
//    console.log(serverUrl.hostname, serverUrl.port)
//
//    agent.addRequest(request, serverUrl.hostname, serverUrl.port || 443);
//
//    request.on('socket', function (serverSocket) {
//
//
//        serverSocket.on('data', function (chunk) {
//            console.log("---CONNECT DATA---")
//            proxySocket.write(chunk);
//            var read = serverSocket.bytesRead
//            var write = serverSocket.bytesWritten
//            console.log(read);
//            console.log(write);
//        });
//
//        serverSocket.on('close', function () {
//            console.trace('CLOSE CONNECT');
//        });
//
//        serverSocket.on('end', function () {
//            console.trace('END CONNECT');
//        });
//
//        proxySocket.on('data', function (chunk) {
//            console.log('PROXY CONNECT DATA');
//            console.log(chunk);
//            if (chunk != 0) {
//                serverSocket.write(chunk);
//            } else {
//                console.log("end reached");
//            }
//            var read = proxySocket.bytesRead
//            var write = proxySocket.bytesWritten
//            console.log(read);
//            console.log(write);
//        });
//
//        proxySocket.on('end', function () {
//            console.log('PROXY CONNECT END');
//            serverSocket.emit('free');
//            var read = serverSocket.bytesRead
//            var write = serverSocket.bytesWritten
//            console.log(read);
//            console.log(write);
//
//            var read = proxySocket.bytesRead
//            var write = proxySocket.bytesWritten
//            console.log(read);
//            console.log(write);
//        });
//
//        console.error('sending ready');
//        proxySocket.write(httpMessage);


//        proxySocket.write(httpMessage);
//        serverSocket.pipe(proxySocket);
//        proxySocket.pipe(serverSocket, {end: false, close: false});
//        proxySocket.on('end', function () {
////            serverSocket.emit('end');
//        });
//    });

//        var serverSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
//            proxySocket.write('HTTP/1.1 200 Connection Established\r\n' +
//                'Proxy-agent: Node-Proxy\r\n' +
//                '\r\n');
//            serverSocket.pipe(proxySocket);
//            proxySocket.pipe(serverSocket);
//        });
}).listen(proxyPort || defaultProxyPort);
//}

// Client Tests
//var runTests = function () {

//var request = require('request').defaults({
//    proxy: 'http://localhost:8080',
//    headers: {
//        connection: 'keep-alive'
//    },
//    agent: false
//});

// HTTP TEST
//request('http://btc-e.com/api/2/ltc_btc/depth', function (err, res, body) {
//    if (!err) {
//        var headers = JSON.stringify(res.headers, true, 2);
//        console.log('HTTP REQUEST SUCCESSFUL');
//        console.log(headers);
//        console.log(body);
//    } else {
//        console.log('HTTP REQUEST ERROR');
//        console.log(err);
//    }
//});

//setTimeout(function () {
//    request('http://btc-e.com/api/2/ltc_btc/depth', function (err, res, body) {
//        if (!err) {
//            var headers = JSON.stringify(res.headers, true, 2);
//            console.log('HTTP REQUEST SUCCESSFUL');
//            console.log(headers);
//            console.log(body);
//        } else {
//            console.log('HTTP REQUEST ERROR');
//            console.log(err);
//        }
//    });
//}, 5000);

// HTTPS TEST
/*request('https://btc-e.com/api/2/ltc_btc/depth', function (err, res, body) {
 if (!err) {
 var headers = JSON.stringify(res.headers, true, 2);
 console.log('HTTPS REQUEST SUCCESSFUL');
 console.log(headers);
 console.log(body);
 } else {
 throw err
 console.log('HTTPS REQUEST ERROR');
 console.log(err);
 }
 });

 setTimeout(function () {
 request('https://btc-e.com/api/2/ltc_btc/depth', function (err, res, body) {
 if (!err) {
 var headers = JSON.stringify(res.headers, true, 2);
 console.log('HTTPS REQUEST SUCCESSFUL');
 console.log(headers);
 console.log(body);
 } else {
 throw err;
 console.log('HTTPS REQUEST ERROR');
 console.log(err);
 }
 });
 }, 5000);*/


var i = 0;
var counter = setInterval(function () {
//    if (i-- <= 0) {
//        clearInterval(counter);
//        process.exit();
//    } else {
//    console.log(agent);
    console.log(15 - i + "sec");
    console.log("sockets creqted: " + agent.createSocketCount);
    console.log("request finished: " + agent.requestFinishedCount);
    var count = 0;
    for (var k in agent.unusedSockets) {
        for (var l in agent.unusedSockets[k]) {
            ++count;
        }
    }
    console.log("unused sockets: " + count);
    var count = 0;
    for (var k in agent.sockets) {
        for (var l in agent.sockets[k]) {
            ++count;
        }
    }
    console.log("sockets: " + count);
//    }
}, 2000);