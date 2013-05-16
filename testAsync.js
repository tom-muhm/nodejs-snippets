var http  = require('http')
  , async = require('async')
  , CONCURRENCY = 5 // edit to fit your OS concurrency limit
  , results = {}
  , urls = [
    '/cameron',
    '/sara',
    '/...'
];

// Time a url collection.
function timeUrl(url, callback) {
    var options = { host: 'www.google.com', port: 80 }
      , start = Date.now()
      , socket = null;
    options.path = url;

    http.get(options, function(res) {
      var response = Date.now()
        , size = 0;
        res.on('data', function(chunk) { size += chunk.length; });   
        res.on('end',  function() {
          var end = Date.now();
          console.log(start-end + "ms");
          results[url] = { start: start, socket: socket, response: response, end: end, size: size };
          callback();
        });
    }).on('error', function(e) {
      results[url] = { start: start, socket: socket, error: Date.now(), stack: e };
      callback();
    }).on('socket', function () {
      socket = Date.now();
    });
}

async.forEachLimit(urls, CONCURRENCY, timeUrl, function() {
  console.log(JSON.stringify(results));
});