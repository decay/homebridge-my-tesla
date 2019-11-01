
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');
var Timer = require('yow/timer');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var currentState = false;
        var service = new Service.Switch(this.name, 'anti-freeze-button');
        var timer = new Timer();

        this.addService(service);
    
        this.on('refresh', (response) => {
            if (response.getInsideTemperature() < 8) {
                this.debug('Started air conditioning.');
                this.api.autoConditioningStart();
            }
            else {
                this.debug('Stopped air conditioning.');
                this.api.autoConditioningStop();
            }
        });


        var setState = (state) => {
            if (state != currentState) {
                if (state) {
                    var loop = () => {
                        this.vehicle.refresh().then((response) => {
                        })
                        .catch((error) => {
                            this.log(error);
                        })
                        .then(() => {
                            this.log('Starting fetch timer.')
                            timer.setTimer(1 * 60 * 1000, loop.bind(this));
                        });
                    };        

                    loop();
                }
                else {
                    this.log('Cancelling fetch timer.')
                    timer.cancel();
                }

                service.getCharacteristic(Characteristic.On).updateValue(currentState = state);
            }    

            return currentState;
        };


        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, currentState);
        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            setState(value);
            callback(null, currentState);
        });

        
    }; 





}

