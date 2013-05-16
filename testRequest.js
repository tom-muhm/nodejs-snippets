#!/usr/bin/env node
var request = require("request"),
    logger = require("winston"),
    argv = require("optimist").argv,
    http = require("http");
http.globalAgent.maxSockets = 10;

var numRequests = argv.requests || argv.r,
    requestsMade = 0,
    wait = argv.wait || argv.w || 0,
    url = argv.url || argv.u || "http://www.google.com",
    requestApi = function(url,callback){
        var requestTime = new Date().getTime();
        request({
                method: "GET",
                // timeout: 300,
                uri: url
            },function(err, response, body){
                var totalTime = (new Date().getTime()) - requestTime;
                callback(err, response, body, totalTime);
        });
    },
    doRequest = function(){
        requestsMade++;
        if(requestsMade==numRequests) clearInterval(requestMaker);
        var thisRequest = requestsMade;
        logger.info("Firing Request #"+thisRequest);
        requestApi(url,function(err, response, body, totalTime){
            if(err){
                logger.error("error contacting API ", err, "trying to request ",reqUrl," after ", totalTime, "ms");
            } else {
                logger.info("Api responded to request #"+thisRequest+" after ", totalTime, "ms");
            }
        });
    };
logger.info("Starting Test with " + numRequests + " Requests.");
var requestMaker = setInterval(doRequest,wait);