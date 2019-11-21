
var Service  = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Timer = require('yow/timer');
var Accessory = require('../accessory.js');


module.exports = class extends Accessory {

    constructor(options) {

        var defaultConfig = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5,
            enabled: true
        };

        var {config, ...options} = options;
        super({...options, config:{...defaultConfig, ...config}});

        this.pingState              = false;
        this.requiredBatteryLevel   = config.requiredBatteryLevel;
        this.timer                  = new Timer();
        this.timerInterval          = this.config.timerInterval * 60000;

        this.addService(new Service.Switch(this.name));

        this.enableOn();


        this.vehicle.on('vehicleData', (vehicleData) => {

            Promise.resolve().then(() => {
                if (vehicleData.getBatteryLevel() < this.requiredBatteryLevel) {
                    this.log(`Battery level too low for ping to be enabled. Turning off.`);
                    return this.setPingState(false);
                }
                else   
                    return Promise.resolve();
    
            })
            .then(() => {
                return this.switch.updateValue();
            })
            .catch((error) => {
                this.log(error);
            });
        });

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getPingState()) {
                this.debug('Response from Tesla API, resetting ping timer.');
                this.timer.setTimer(this.timerInterval, this.ping.bind(this));
            }
            else
                this.timer.cancel();

        });

    }

    enableOn() {
        var service = this.getService(Service.Switch);

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.setPingState(value).then(() => {
                callback(null, this.getPingState());
            })
            .catch((error) => {
                callback(error);
            })
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(this.getPingState());
        });
    }

    updatePingState() {
        this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.getPingState());
    }

    getPingState() {
        return this.pingState;
    }

    setPingState(value) {
        value = value ? true : false;

        return new Promise((resolve, reject) => {
            Promise.resolve().then(() => {
                if (this.pingState != value) {
                    this.pingState = value;
                    this.updatePingState();
                    return this.pingState ? this.ping() : Promise.resolve();
                }
                else
                    return Promise.resolve();
    
            })
            .then(() => {
                resolve();
            })
            .catch((error) => {
                this.log(error);
                reject();
            })
        });
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     
    }


}







