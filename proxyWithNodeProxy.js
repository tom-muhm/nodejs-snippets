var url = require('url');
var net = require('net');
var http = require('http');
var httpProxy = require('http-proxy');

// Server

var proxyPort = 8080

var proxy = httpProxy.createServer(function (req, res, proxy) {
    var urlObj = url.parse(req.url)
    proxy.proxyRequest(req, res, {
        host: urlObj.host,
        port: urlObj.port || 80
    });
}).listen(proxyPort);

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


// Client Tests
// https connect currently does not work with node? java is with - check node implementation - need to send via encrypted socket? or encrypt data by myself

var options = {
    port: 8080,
    hostname: '127.0.0.1',
    method: 'CONNECT',
    path: 'btc-e.com:443'
};

var req = http.get(options);

req.on('connect', function(res, socket) {
    console.log('got connected!');

    // make a request over an HTTP tunnel
    socket.write('GET / HTTP/1.1\r\n' +
        'Host: btc-e.com\r\n' +
        'Connection: keep-alive\r\n' +
        '\r\n');
    socket.on('data', function(chunk) {
        console.log(chunk.toString());
    });
    socket.on('end', function() {
    });
});