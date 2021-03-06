var util = require('util');
import {HBDevoloCentralUnit} from './HBDevoloCentralUnit';
import {HBDevoloPlatformConfig,HBIDevoloDevice} from './HBDevoloMisc';
import {Devolo} from 'node-devolo/dist/Devolo';

let Homebridge;
let Service;
let Characteristic;

class HBDevoloPlatform {

    config: HBDevoloPlatformConfig;
    centralUnit: HBDevoloCentralUnit;
    log;
    version: string = '201702221607';

    constructor(log, config: HBDevoloPlatformConfig) {
        this.log = log;
        this.log.debug('%s > Initializing (Version: %s)', (this.constructor as any).name, this.version);

        this.config = config;
        this.config.platform = config.platform || 'Devolo';
        this.config.name = config.name || 'Devolo';
        this.config.heartrate = config.heartrate || 3;

        var debugconfig = JSON.parse(JSON.stringify(this.config));
        if(debugconfig.email) debugconfig.email = 'xxx';
        if(debugconfig.password) debugconfig.password = 'xxx';
        if(debugconfig.uuid) debugconfig.uuid = 'xxx';
        if(debugconfig.gateway) debugconfig.gateway = 'xxx';
        if(debugconfig.passkey) debugconfig.passkey = 'xxx';
        this.log.debug('%s > Configuration:\n%s', (this.constructor as any).name, util.inspect(debugconfig, false, null));
    }

    accessories(callback : (accessories: HBIDevoloDevice[]) => void) {

        if(!this.config.email || !this.config.password || !this.config.host) {
            this.log.error('%s > Email, password and/or host missing in config.json.', (this.constructor as any).name);
            return;
        }

        this.log.info('%s > Searching for Devolo Central Unit.', (this.constructor as any).name);
        var self = this;

        this.findCentralUnit(function(err, dOptions) {
            if(err) {
                self.log.error('%s > %s', (self.constructor as any).name, err); return;
            }
            self.log.info('%s > Central Unit found.', (self.constructor as any).name);

            if(!self.config.uuid || !self.config.gateway || !self.config.passkey) {
                let s = '\n';
                s += '  "platforms": [\n';
                s += '    {\n';
                s += '      "platform": "' + self.config.platform + '",\n';
                s += '      "name": "' + self.config.name + '",\n';
                s += '      "host": "' + self.config.host + '",\n';
                s += '      "email": "' + self.config.email + '",\n';
                s += '      "password": "' + self.config.password + '",\n';
                s += '      "uuid": "' + dOptions.uuid + '",\n';
                s += '      "gateway": "' + dOptions.gateway + '",\n';
                s += '      "passkey": "' + dOptions.passkey + '"\n';
                s += '    }\n';
                s += '  ]';
                self.log.info('%s > Please edit config.json and restart homebridge.%s', (self.constructor as any).name, s);
                return;
            }

            self.log.debug('%s > SessionID: %s', (self.constructor as any).name, dOptions.sessionid);

            let accessoryList = [];

            accessoryList.push(self.centralUnit);
            self.centralUnit.accessories(function(err, accessories) {
                if(err) {
                    throw err;
                }
                for(var i=0; i<accessories.length; i++) {
                    accessoryList.push(accessories[i]);
                }

                self.centralUnit.startHeartbeatHandler();

                callback(accessoryList);
            });

        });
    }

    private findCentralUnit(callback: (err:string, dOptions?) => void) : void {

        var self = this;
        let options = {
            email: self.config.email,
            password: self.config.password,
            centralHost: self.config.host, //fetch automatically????
            uuid: self.config.uuid,
            gateway: self.config.gateway,
            passkey: self.config.passkey,
            sessionid: ''
        };
        new Devolo(options, function(err, d) {
            if(err) {
                callback(err); return;
            }
            self.log.debug('%s > Devolo API Version: %s', (self.constructor as any).name, d.version);

            if(self.config.deviceDebugging) {
                d.outputDebugLog(function(err) {
                   if(err) {
                       self.log.error(err);
                   }
                   callback('Debug output finshed. Aborting.');
                   process.exit();
                });
            }
            else {
                self.centralUnit = new HBDevoloCentralUnit(self.log, self.config, d);
                self.centralUnit.setHomebridge(Homebridge);
                self.centralUnit.initStorage();
                callback(null, d._options);
            }
        });

    }

}

export = function(homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    // Devolo Switch Meter
    Characteristic.DevoloCurrentConsumption = function() {
        Characteristic.call(this, 'Devolo Current Consumption', '00000010-0000-0000-0000-199207310822');

        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'W',
            maxValue: 100000,
            minValue: 0,
            minStep: 1,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });

        this.value = 0;
    };
    util.inherits(Characteristic.DevoloCurrentConsumption, Characteristic);
    Characteristic.DevoloCurrentConsumption.UUID = '00000010-0000-0000-0000-199207310822';

    Characteristic.DevoloTotalConsumption = function() {
        Characteristic.call(this, 'Devolo Total Consumption', '00000011-0000-0000-0000-199207310822');

        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'kWh',
            maxValue: 100000000000,
            minValue: 0,
            minStep: 0.001,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });

        this.value = 0;
    };
    util.inherits(Characteristic.DevoloTotalConsumption, Characteristic);
    Characteristic.DevoloTotalConsumption.UUID = '00000011-0000-0000-0000-199207310822';

    Characteristic.DevoloTotalConsumptionSince = function() {
        Characteristic.call(this, 'Devolo Total Consumption Since', '00000012-0000-0000-0000-199207310822');

        this.setProps({
            format: Characteristic.Formats.STRING,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });

        this.value = '';
    };
    util.inherits(Characteristic.DevoloTotalConsumptionSince, Characteristic);
    Characteristic.DevoloTotalConsumptionSince.UUID = '00000012-0000-0000-0000-199207310822';

    // START FakeGato (eve app)

        /// Eve Door + Eve Energy
            Characteristic.ResetTotal = function() {
                Characteristic.call(this, 'Reset Total', 'E863F112-079E-48FF-8F27-9C2605A29F52');

                this.setProps({
                    format: Characteristic.Formats.UINT32,
                    unit: Characteristic.Units.SECONDS,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.ResetTotal, Characteristic);
            Characteristic.ResetTotal.UUID = 'E863F112-079E-48FF-8F27-9C2605A29F52';

        /// Eve Door + Eve Motion
            Characteristic.LastActivation = function() {
                Characteristic.call(this, 'Last Activation', 'E863F11A-079E-48FF-8F27-9C2605A29F52');
                this.setProps({
                    format: Characteristic.Formats.UINT32,
                    unit: Characteristic.Units.SECONDS,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.LastActivation, Characteristic);
            Characteristic.LastActivation.UUID = 'E863F11A-079E-48FF-8F27-9C2605A29F52';

        /// Eve Door
            Characteristic.OpenDuration = function() {
                Characteristic.call(this, 'Open Duration', 'E863F118-079E-48FF-8F27-9C2605A29F52');

                this.setProps({
                    format: Characteristic.Formats.UINT32,
                    unit: Characteristic.Units.SECONDS,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.OpenDuration, Characteristic);
            Characteristic.OpenDuration.UUID = 'E863F118-079E-48FF-8F27-9C2605A29F52';

            Characteristic.ClosedDuration = function() {
                Characteristic.call(this, 'Closed Duration', 'E863F119-079E-48FF-8F27-9C2605A29F52');

                this.setProps({
                    format: Characteristic.Formats.UINT32,
                    unit: Characteristic.Units.SECONDS,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.WRITE]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.ClosedDuration, Characteristic);
            Characteristic.ClosedDuration.UUID = 'E863F119-079E-48FF-8F27-9C2605A29F52';

            Characteristic.TimesOpened = function() {
                Characteristic.call(this, 'Times Opened', 'E863F129-079E-48FF-8F27-9C2605A29F52');

                this.setProps({
                    format: Characteristic.Formats.UINT32,
                    unit: Characteristic.Units.SECONDS,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.TimesOpened, Characteristic);
            Characteristic.TimesOpened.UUID = 'E863F129-079E-48FF-8F27-9C2605A29F52';

        /// Eve Energy
            Characteristic.CurrentConsumption = function() {
                Characteristic.call(this, 'Current Consumption', 'E863F10D-079E-48FF-8F27-9C2605A29F52');

                this.setProps({
                    format: Characteristic.Formats.FLOAT,
                    unit: 'W',
                    maxValue: 100000,
                    minValue: 0,
                    minStep: 1,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                });

                this.value = 0;
            };
            util.inherits(Characteristic.CurrentConsumption, Characteristic);
            Characteristic.CurrentConsumption.UUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';

            Characteristic.TotalConsumption = function() {
                Characteristic.call(this, 'Total Consumption', 'E863F10C-079E-48FF-8F27-9C2605A29F52');

                this.setProps({
                    format: Characteristic.Formats.UInt16,
                    unit: "kWh",
                    maxValue: 100000000000,
                    minValue: 0,
                    minStep: 0.001,
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                });

                this.value = 0;
            };
            util.inherits(Characteristic.TotalConsumption, Characteristic);
            Characteristic.TotalConsumption.UUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';

            Characteristic.Voltage = function() {
                Characteristic.call(this, 'Voltage', 'E863F10A-079E-48FF-8F27-9C2605A29F52');
                this.setProps({
                    format: Characteristic.Formats.UInt16,
                    unit: "V",
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.Voltage, Characteristic);
            Characteristic.Voltage.UUID = 'E863F10A-079E-48FF-8F27-9C2605A29F52';

        /// Eve Weather
            Characteristic.AirPressure = function () {
                Characteristic.call(this, 'AirPressure', 'E863F10F-079E-48FF-8F27-9C2605A29F52');
                this.setProps({
                    format: Characteristic.Formats.UINT16,
                    unit: "hPa", // Eve use hPa
                    perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                });

                this.value = this.getDefaultValue();
            };
            util.inherits(Characteristic.AirPressure, Characteristic);
            Characteristic.AirPressure.UUID = 'E863F10F-079E-48FF-8F27-9C2605A29F52';

            Service.AirPressure = function (displayName, subtype) {
                Service.call(this, displayName, 'E863F001-079E-48FF-8F27-9C2605A29F52', subtype);
                //this.addCharacteristic(Characteristic.AirPressure);
            };
            util.inherits(Service.AirPressure, Service);
            Service.AirPressure.UUID = 'E863F001-079E-48FF-8F27-9C2605A29F52';

    // END FakeGato (eve app)

    // START Z-Weather

        Characteristic.WindSpeed = function () {
            Characteristic.call(this, 'WindSpeed', '00000020-0000-0000-0000-199207310822');
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: "km/h",
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });

            this.value = this.getDefaultValue();
        };
        util.inherits(Characteristic.WindSpeed, Characteristic);
        Characteristic.WindSpeed.UUID = '00000020-0000-0000-0000-199207310822';

        Service.WindSpeed = function (displayName, subtype) {
            Service.call(this, displayName, '00000030-0000-0000-0000-199207310822', subtype);
            //this.addCharacteristic(Characteristic.WindSpeed);
        };
        util.inherits(Service.WindSpeed, Service);
        Service.WindSpeed.UUID = '00000030-0000-0000-0000-199207310822';

        Characteristic.DewPoint = function () {
            Characteristic.call(this, 'DewPoint', '00000021-0000-0000-0000-199207310822');
            this.setProps({
                format: Characteristic.Formats.FLOAT,
                unit: "celsius",
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });

            this.value = this.getDefaultValue();
        };
        util.inherits(Characteristic.DewPoint, Characteristic);
        Characteristic.DewPoint.UUID = '00000021-0000-0000-0000-199207310822';

        Service.DewPoint = function (displayName, subtype) {
            Service.call(this, displayName, '00000031-0000-0000-0000-199207310822', subtype);
            //this.addCharacteristic(Characteristic.DewPoint);
        };
        util.inherits(Service.DewPoint, Service);
        Service.DewPoint.UUID = '00000031-0000-0000-0000-199207310822';
        
    // END Z-Weather

    homebridge.registerPlatform("homebridge-devolo", "Devolo", HBDevoloPlatform, false);
};