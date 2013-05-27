var http = require("http");
var https = require("https");
var request = require("request"); //.defaults({"proxy":"http://localhost:8080"});
var httpProxy = require("http-proxy");
var fs = require('fs');
var util = require('util');
var colors = require('colors');
var url = require("url");

process.on('uncaughtException', function (exception) {
    console.log("Uncaught Exception");
    console.log(exception);
});

// HTTPS Helpers
var helpers = {
    https: {
        key: fs.readFileSync('agent2-key.pem', 'utf8'),
        cert: fs.readFileSync('agent2-cert.pem', 'utf8')
    },
    target: {
        https: {
            key: fs.readFileSync('agent2-key.pem', 'utf8'),
            cert: fs.readFileSync('agent2-cert.pem', 'utf8')
        }, // This could also be an Object with key and cert properties
        rejectUnauthorized: false
    }
};
console.log(helpers);

//

https.createServer(helpers.https,function (request, response) {
    console.log("GOT REQUEST");
    console.log(JSON.stringify(request.headers, true, 2))
    console.log(request.url);
    console.log("------------");
    var parsedUrl = url.parse(request.url);
    var options = {
        host: parsedUrl.host,
        path: request.url,
        method: request.method,
        headers: request.headers
    };
    var protocol;
    if (parsedUrl.protocol === "https:") {
        protocol = https;
        options.port = 443;
        options.key = fs.readFileSync('agent2-key.pem', 'utf8');
        options.cert = fs.readFileSync('agent2-cert.pem', 'utf8');
    } else {
        protocol = http;
        options.port = 80;
    }
    console.log(options);
    var proxy_request = protocol.request(options);
//    var proxy = https.reques(443, request.headers['host'])
//    var proxy_request = proxy.request(request.method, request.url, request.headers);
    proxy_request.on('response', function (proxy_response) {
        proxy_response.pipe(response);
        response.writeHead(proxy_response.statusCode, proxy_response.headers);
    });

    request.pipe(proxy_request);
}).listen(2020);

httpProxy.createServer(helpers ,function (req, res, proxy) {
    console.log("got request");
    proxy.proxyRequest(req, res, {
        host: req.headers["host"],
        port: 443,
        https: true
    });
}).listen(2030);

//var http = require('http'),
//    request = require('request');
//http.createServer(function(req,res){
//    req.pipe(request(req.url)).pipe(res)
//}).listen(8000)
//console.log("Server running at http://127.0.0.1:8000/")


var fs = require('fs');
var opts = {
    key: fs.readFileSync('agent2-key.pem', 'utf8'),
    cert: fs.readFileSync('agent2-cert.pem', 'utf8')
};

var bouncy = require('bouncy');
bouncy(opts, function (req, bounce) {
    console.log("BOUNCE");
    console.log(req.url);
    bounce(3040);
}).listen(7005);

console.log('https://localhost:7005');

//

http.createServer(function (req, res) {
    console.log("--HTTP LALA--")
    console.log(JSON.stringify(req.headers, true, 2))
    console.log(req.headers.host);
    console.log(req.url);
    console.log("--------------")
    req.pipe(request('http://google.at')).pipe(res)
}).listen(3030);

https.createServer(helpers.https,function (req, res) {
    console.log("--HTTPs LALA--")
    console.log(JSON.stringify(req.headers, true, 2))
    console.log(req.headers.host);
    console.log("--------------")
    req.pipe(request('https://google.at')).pipe(res)
}).listen(3040);

//


// HTTP Proxy - Port 8090
httpProxy.createServer(function (req, res, proxy) {
    console.log("--HTTP Proxy--")
    console.log(JSON.stringify(req.headers, true, 2))
    console.log(JSON.stringify(res.headers, true, 2))
    console.log("--------------")
    proxy.proxyRequest(req, res, {
        port: 80,
        host: "google.at"
    });
}).listen(8090);


// HTTPS Proxy - Port 8080
httpProxy.createServer(helpers,function (req, res, proxy) {
    console.log("--HTTPS Proxy--")
    console.log(JSON.stringify(req.headers, true, 2))
    console.log(JSON.stringify(res.headers, true, 2))
    console.log(req.url)
    console.log(req.host)
    console.log("--------------")
    proxy.proxyRequest(req, res, {
        host: 'localhost',
        port: 8000,
        https: true
    });
}).listen(8080);

// Target HTTP Server

http.createServer(function (req, res) {
    console.log("HTTP TARGET");
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("request successfully proxied!" + "\n" + JSON.stringify(req.headers, true, 2));
    res.end();
}).listen(9000);


// Target HTTPS Server
https.createServer(helpers.https,function (req, res) {
    console.log("HTTPS TARGET");
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('hello https\n');
    res.end();
}).listen(8000);

var requestHttpOptions = {
    uri: "http://google.at",
    proxy: "http://localhost:8090"
}

var requestHttpsOptions = {
    uri: "https://localhost:8080",
    strictSSL: false
}

var httpOptions = {
    host: "localhost",
    port: 8090
}

var httpsOptions = {
    host: "localhost",
    port: 8080,
    rejectUnauthorized: false
}

// HTTP
var reqHttp = http.get(httpOptions);
//var req = https.get(test);
reqHttp.on("response", function (response) {
    var resHeaders = JSON.stringify(response.headers, true, 2);
    console.log("--HTTP--");
    console.log(resHeaders);
    console.log("---------");
});


// HTTPS
var reqHttps = https.get(httpsOptions);
//var req = https.get(test);
reqHttps.on("response", function (response) {
    var resHeaders = JSON.stringify(response.headers, true, 2);
    console.log("--HTTPS--");
    console.log(resHeaders);
    console.log("---------");
});

request(requestHttpOptions, function (error, response, body) {
    if (error) {
        console.log("error");
        console.log(error)
    } else {
        var resHeaders = JSON.stringify(response.headers, true, 2);
        console.log("--REQUEST HTTP--");
        console.log(resHeaders);
        console.log("----------------");
    }
});

request(requestHttpsOptions, function (error, response, body) {
    if (error) {
        console.log("error");
        console.log(error);
    } else {
        var resHeaders = JSON.stringify(response.headers, true, 2);
        console.log("--REQUEST HTTPS--");
        console.log(resHeaders);
        console.log("-----------------");
    }
});


request("http://localhost:3030", function (error, response, body) {
    if (error) {
        console.log("error");
        console.log(error);
    } else {
        var resHeaders = JSON.stringify(response.headers, true, 2);
        console.log("--OTHER TEST--");
        console.log(resHeaders);
        console.log("-----------------");
    }
});
