var url = require('url');
var net = require('net');
var http = require('http');
var httpProxy = require('http-proxy');

// Server
var defaultProxyPort = 8080

var startProxy = function (proxyPort) {
    var proxy = httpProxy.createServer(function (req, res, proxy) {
        var urlObj = url.parse(req.url)
        proxy.proxyRequest(req, res, {
            host: urlObj.host,
            port: urlObj.port || 80
        });
    }).listen(proxyPort || defaultProxyPort);
    proxy.on("connect", function (req, proxySocket) {
        var serverUrl = url.parse('https://' + req.url);
        var serverSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
            proxySocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: Node-Proxy\r\n' +
                '\r\n');
            serverSocket.pipe(proxySocket);
            proxySocket.pipe(serverSocket);
        });
    });
}


// Client Tests
var runTests = function () {

    var request = require('request').defaults({
        proxy: 'http://localhost:8080',
        headers: {
            connection: 'keep-alive'
        }
    });

    // HTTP TEST
    request('http://www.google.com', function(err, res, body) {
        if (!err) {
            var headers = JSON.stringify(res.headers, true, 2);
            console.log('HTTP REQUEST SUCCESSFUL');
            console.log(headers);
        } else {
            console.log('HTTP REQUEST ERROR');
            console.log(err);
        }
    });

    // HTTPS TEST
    request('https://encrypted.google.com', function(err, res, body) {
        if (!err) {
            var headers = JSON.stringify(res.headers, true, 2);
            console.log('HTTPS REQUEST SUCCESSFUL');
            console.log(headers);
        } else {
            console.log('HTTPS REQUEST ERROR');
            console.log(err);
        }
    })

}

startProxy()
runTests()

module.exports.start = startProxy
module.exports.runTests = runTests