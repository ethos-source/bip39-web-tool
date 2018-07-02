// use strict compiling
"use strict";
var express = require('express');
var path = require('path');

var app = express();

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/../static/serverIndex.html'));
});

app.use(express.static('static'));

app.listen(8080, function() {
    console.log('- Server listening on port 8080');
 });

