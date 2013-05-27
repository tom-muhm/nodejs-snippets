var url = require('url');
var net = require('net');
var http = require('http');
var request = require('request');

// Server

var proxyPort = 8080;

var proxy = http.createServer();
proxy.on('request', function (req, res) {
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
});
proxy.on('connect',function (req, proxySocket) {
    var serverUrl = url.parse('http://' + req.url);
    var serverSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
        proxySocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node-Proxy\r\n' +
            '\r\n');
        serverSocket.pipe(proxySocket);
        proxySocket.pipe(serverSocket);
    });
}).listen(proxyPort);


// Client Tests

// simple http test
var httpOptions = {
    host: 'localhost',
    port: 8080,
    path: 'http://www.google.at',
    headers: {
        host: 'www.google.at',
        'proxy-connection': 'keep-alive'
    }
}
var req = http.get(httpOptions);
req.on('response', function (response) {
    var resHeaders = JSON.stringify(response.headers, true, 2);
    console.log('--HTTP--');
    console.log(resHeaders);
    console.log('--------');
    response.on('data', function (data) {
        //        console.log(data.toString());
    });
});

// https test
var httpsOptions = {
    host: 'localhost',
    port: 8080,
    path: 'https://encrypted.google.com',
    headers: {
        host: 'encrypted.google.com',
        'proxy-connection': 'keep-alive'
    }
}
var req = http.get(httpsOptions);
req.on('response', function (response) {
    var resHeaders = JSON.stringify(response.headers, true, 2);
    console.log('--HTTPS--');
    console.log(resHeaders);
    console.log('---------');
    response.on('data', function (data) {
        //        console.log(data.toString());
    });
});

// https connect test
var connectOptions = {
    port: 8080,
    hostname: '127.0.0.1',
    method: 'CONNECT',
    path: 'btc-e.com:443'
};

var req = http.get(connectOptions);

req.on('connect', function (res, socket) {
    console.log('got connected!');

    // make a request over an HTTP tunnel
    socket.write('GET / HTTP/1.1\r\n' +
        'Host: btc-e.com\r\n' +
        'Connection: keep-alive\r\n' +
        '\r\n');
    socket.on('data', function (chunk) {
        console.log(chunk.toString());
    });
    socket.on('end', function () {
        proxy.close();
    });
});