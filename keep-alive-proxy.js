var url = require('url');
var net = require('net');
var http = require('http');
var request = require('request');

var defaultProxyPort = 8080;

var startProxy = function (proxyPort) {
    var proxy = http.createServer();
    proxy.on('request', function (req, res) {
        // test the path - if it starts with a slash it isn't a proxy request
        console.log(req.url);
        console.log(req.headers);
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
            console.log(options);
            req.pipe(request(options)).pipe(res);
        } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('nothing here');
        }
    });
    proxy.on('connect',function (req, proxySocket) {
        var serverUrl = url.parse('http://' + req.url);
        console.log(serverUrl);
        var serverSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
            proxySocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: Node-Proxy\r\n' +
                '\r\n');
            serverSocket.pipe(proxySocket);
            proxySocket.pipe(serverSocket);
        });
    }).listen(proxyPort || defaultProxyPort);
}


startProxy();


var options = {
    url: 'https://www.google.com',
    proxy: 'http://localhost:8080'
};

request(options, function(error, response, body) {
    if (!error) {
        var resHeaders = JSON.stringify(response.headers, true, 2);
        console.log(resHeaders);
    } else {
        console.log('error');
        console.log(error);
    }
});