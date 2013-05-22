var request = require("request").defaults({'proxy':'http://localhost:8080'});

var options = {
    uri: "http://google.com"
}


request(options, function(error, response, body) {
    if (error) {
        console.log("Error");
        console.log(error)
    } else {
        console.log("Response");
        console.log(body);
    }
});
