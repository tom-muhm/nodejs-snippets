var request = require('request');
var http = require('http');
var httpProxy = require('http-proxy');
//
// Create your proxy server
//
httpProxy.createServer(function (req, res, proxy) {
    proxy.proxyRequest(req, res, {
        port: 80,
        host: 'google.com'
    });
}).listen(8080);

//
// Create your target server
//
http.createServer(function (req, res) {
    console.log("got request");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
    res.end();
}).listen(9000);




