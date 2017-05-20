var util = require('util');
var net = require('net');
var http = require('http');
var EventEmitter = require('events').EventEmitter;

var OutgoingMessage = http.OutgoingMessage;
var ClientRequest = http.ClientRequest;

function httpSocketSetup(socket) {
    socket.removeListener('drain', ondrain);
    socket.on('drain', ondrain);
}

function ondrain() {
    if (this._httpMessage) this._httpMessage.emit('drain');
}

function ProxyRequest(options, cb) {
    var self = this;
    OutgoingMessage.call(self);

    self.agent = options.agent === undefined ? http.globalAgent : options.agent;

    var defaultPort = options.defaultPort || 80;

    var port = options.port || defaultPort;
    var host = options.hostname || options.host || 'localhost';

    if (options.setHost === undefined) {
        var setHost = true;
    }

    self.socketPath = options.socketPath;

    var method = self.method = (options.method || 'GET').toUpperCase();
    self.path = options.path || '/';
    if (cb) {
        self.once('response', cb);
    }

    if (!Array.isArray(options.headers)) {
        if (options.headers) {
            var keys = Object.keys(options.headers);
            for (var i = 0, l = keys.length; i < l; i++) {
                var key = keys[i];
                self.setHeader(key, options.headers[key]);
            }
        }
        if (host && !this.getHeader('host') && setHost) {
            var hostHeader = host;
            if (port && +port !== defaultPort) {
                hostHeader += ':' + port;
            }
            this.setHeader('Host', hostHeader);
        }
    }

    if (options.auth && !this.getHeader('Authorization')) {
        //basic auth
        this.setHeader('Authorization', 'Basic ' +
            new Buffer(options.auth).toString('base64'));
    }

    if (method === 'GET' || method === 'HEAD' || method === 'CONNECT') {
        self.useChunkedEncodingByDefault = false;
    } else {
        self.useChunkedEncodingByDefault = true;
    }

    if (Array.isArray(options.headers)) {
        self._storeHeader(self.method + ' ' + self.path + ' HTTP/1.1\r\n',
            options.headers);
    } else if (self.getHeader('expect')) {
        self._storeHeader(self.method + ' ' + self.path + ' HTTP/1.1\r\n',
            self._renderHeaders());
    }

//    if (self.socketPath) {
//        self._last = true;
//        self.shouldKeepAlive = false;
//        if (options.createConnection) {
//            self.onSocket(options.createConnection(self.socketPath));
//        } else {
//            self.onSocket(net.createConnection(self.socketPath));
//        }
//    } else if (self.agent) {
//        // If there is an agent we should default to Connection:keep-alive.
//        self._last = false;
//        self.shouldKeepAlive = true;
//        self.agent.addRequest(self, host, port, options.localAddress);
//    } else {
//        // No agent, default to Connection:close.
//        self._last = true;
//        self.shouldKeepAlive = false;
//        if (options.createConnection) {
//            options.port = port;
//            options.host = host;
//            var conn = options.createConnection(options);
//        } else {
//            var conn = net.createConnection({
//                port: port,
//                host: host,
//                localAddress: options.localAddress
//            });
//        }
//        self.onSocket(conn);
//    }

    self._deferToConnect(null, null, function () {
        self._flush();
        self = null;
    });

}
util.inherits(ProxyRequest, ClientRequest);

ProxyRequest.prototype.onSocket = function (socket) {
    var req = this;

    process.nextTick(function () {
        req.socket = socket;
        req.connection = socket;

        socket._httpMessage = req;

        // Setup "drain" propogation.
        httpSocketSetup(socket);

//        socket.removeAllListeners('end');
//        socket.on('end', function () {
////            console.trace("SOCKET END");
//            socket.emit('free');
//        });
        req.emit('socket', socket);
    });

};


module.exports = ProxyRequest;