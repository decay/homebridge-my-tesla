
var Service = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(tesla, name) {
        super(tesla);

        var service = new Service.Fan(name, "hvac");
        this.addService(service);

        this.on('refresh', (response) => {              
            this.log('Updating HVAC status to', response.isAirConditionerOn());  
            service.getCharacteristic(Characteristic.On).updateValue(response.isAirConditionerOn());
        });

        service.getCharacteristic(Characteristic.On).on('get', (callback) => {
            this.log(`Getting HVAC state...`);
            
            if (this.api.token) {
                Promise.resolve().then(() => {
                    return this.api.wakeUp();
                })
                .then(() => {
                    return this.api.getVehicleData();
                })
                .then((response) => {
                    response = new VehicleData(response);
                    callback(null, response.isAirConditionerOn());
                })
                .catch((error) => {
                    this.log('Could not get HVAC state.');
                    callback(null);
                });
    
            }
            else {
                callback(null);
            }
        });

        service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            this.log('Turning HVAC state to %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return this.api.wakeUp();
            })
            .then(() => {
                this.log(`Setting HVAC state to ${value}...`);

                if (value)
                    return this.api.autoConditioningStart();
                else
                    return this.api.autoConditioningStop();
            })
            .then(() => {
                this.log(`Finished setting HVAC state to ${value}...`);
                callback(null, value);
            })

            .catch((error) => {
                callback(null);
            })

        });

        
    };


}


/*
module.exports = class extends Service.Fan {

    constructor(tesla, name) {
        super(name, "hvac");

        this.on('refresh', (response) => {              
            tesla.log('Updating HVAC status to', response.isAirConditionerOn());  
            this.getCharacteristic(Characteristic.On).updateValue(response.isAirConditionerOn());
        });

        var getHVACState = (callback) => {
            if (tesla.token) {
                tesla.api.getVehicleData((response) => {
                    response = new VehicleData(response);
                    callback(null, response.isAirConditionerOn());
                });
    
            }
            else
                callback(null);

        };

        var setHVACState = (value, callback) => {
            tesla.log('Turning HVAC state to %s.', value ? 'on' : 'off');

            Promise.resolve().then(() => {
                return tesla.api.wakeUp();
            })
            .then(() => {
                if (value)
                    return tesla.api.autoConditioningStart();
                else
                    return tesla.api.autoConditioningStop();
            })
            .then(() => {
                callback(null, value);
            })

            .catch((error) => {
                tesla.log(error);
                callback(null);
            })
        };

        this.getCharacteristic(Characteristic.On).on('get', getHVACState.bind(this));
        this.getCharacteristic(Characteristic.On).on('set', setHVACState.bind(this));


    };
}

*/