'use strict';

require("babel-polyfill");

let angular = require("angular");
window.Headroom = require('headroom.js');
window.introJs = require('intro.js');
window.detect = require('detect.js');

angular.module('app', [
        require("./controllers/app.controllers"),
        require("./services/app.services"),
        require("./directives/app.directives"),
        require("./filters/app.filters")
    ])
    .provider('globalFN', require("./api"))
    .constant("CONST", require("./const"))
    .config(require("./config"))
    .config(require("./routes/main-route"))
    .run(require("./run"));
