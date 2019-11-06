"use strict";
var Path = require('path');

// Load .env
require('dotenv').config();


var vin = "5YJ3E7EB9KF240654";
var API = require('./src/tesla-api.js');
var api = new API({vin:vin, debug:console.log, log:console.log});

Promise.resolve().then(() => {
    return api.login();
})
.then(() => {
    return api.wakeUp();
})
.then((response) => {
    return api.getVehicleData();
})
.then(() => {
    console.log('Done.');
})
.catch((error) => {
    console.log(error.stack);
})



