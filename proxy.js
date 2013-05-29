var url = require('url');
var net = require('net');
var http = require('http');
var request = require('request');

// Server

var defaultProxyPort = 8080;

var startProxy = function (proxyPort) {
    var proxy = http.createServer();
    proxy.on('request', function (req, res) {
        if (req.url.indexOf('/') !== 0) {
            var uri = url.parse(req.url);
            var httpMessage = req.method + ' ' + uri.path + ' HTTP/' + req.httpVersion + '\r\n';
            for (var header in req.headers) {
                httpMessage += header + ': ' + req.headers[header] + '\r\n';
            }
            httpMessage += '\r\n';

            var serverSocket = net.connect(uri.port || 80, uri.hostname);

            var proxySocket = req.connection
            serverSocket.write(httpMessage);
            serverSocket.pipe(res.connection);
            proxySocket.pipe(serverSocket);
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
    proxy.on('connect',function (req, proxySocket) {
        var serverUrl = url.parse('http://' + req.url);
        var serverSocket = net.connect(serverUrl.port, serverUrl.hostname, function () {
            proxySocket.write('HTTP/1.1 200 Connection Established\r\n' +
                'Proxy-agent: Node-Proxy\r\n' +
                '\r\n');
            serverSocket.pipe(proxySocket);
            proxySocket.pipe(serverSocket);
        });
    }).listen(proxyPort || defaultProxyPort);
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
    request('http://btc-e.com/api/2/ltc_btc/depth', function (err, res, body) {
        if (!err) {
            var headers = JSON.stringify(res.headers, true, 2);
            console.log('HTTP REQUEST SUCCESSFUL');
            console.log(headers);
            console.log(body);
        } else {
            console.log('HTTP REQUEST ERROR');
            console.log(err);
        }
    });

    // HTTPS TEST
    request('https://btc-e.com/api/2/ltc_btc/depth', function (err, res, body) {
        if (!err) {
            var headers = JSON.stringify(res.headers, true, 2);
            console.log('HTTPS REQUEST SUCCESSFUL');
            console.log(headers);
            console.log(body);
        } else {
            console.log('HTTPS REQUEST ERROR');
            console.log(err);
        }
    })

//    var httpOptions = {
//        host: 'localhost',
//        port: 8080,
//        path: 'http://www.google.at',
//        headers: {
//            host: 'www.google.at',
//            'proxy-connection': 'keep-alive'
//        }
//    }
//    var httpsOptions = {
//        host: 'localhost',
//        port: 8080,
//        path: 'https://encrypted.google.com',
//        headers: {
//            host: 'encrypted.google.com',
//            'proxy-connection': 'keep-alive'
//        }
//    }
//    var connectOptions = {
//        port: 8080,
//        hostname: '127.0.0.1',
//        method: 'CONNECT',
//        path: 'btc-e.com:443'
//    };
//    var req = http.get(connectOptions);
//    req.on('connect', function (res, socket) {
//        console.log('got connected!');
//
//        // make a request over an HTTP tunnel
//        socket.write('GET / HTTP/1.1\r\n' +
//            'Host: btc-e.com\r\n' +
//            'Connection: keep-alive\r\n' +
//            '\r\n');
//        socket.on('data', function (chunk) {
//            console.log(chunk.toString());
//        });
//        socket.on('end', function () {
//            proxy.close();
//        });
//    });
}

startProxy()
runTests()

console.log(HttpAgent)

module.exports.start = startProxy
module.exports.runTests = runTests