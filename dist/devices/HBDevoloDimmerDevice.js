"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloDimmerDevice = (function (_super) {
    __extends(HBDevoloDimmerDevice, _super);
    function HBDevoloDimmerDevice(log, dAPI, dDevice, storage) {
        var _this = _super.call(this, log, dAPI, dDevice, storage) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'dimmer') {
                self.log.info('%s (%s / %s) > Dimmer > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.Brightness).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > CurrentConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > TotalConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > TotalConsumptionSince > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBDevoloDimmerDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Dimmer');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.switchService = new this.Service.Lightbulb(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.switchService.getCharacteristic(this.Characteristic.Brightness)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.CurrentConsumption)
            .on('get', this.getCurrentConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.TotalConsumption)
            .on('get', this.getTotalConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.TotalConsumptionSince)
            .on('get', this.getTotalConsumptionSince.bind(this));
        this.switchService.getCharacteristic(this.Characteristic.Brightness).setProps({
            minStep: 5
        });
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        this.dDevice.listen();
        return [this.informationService, this.switchService];
    };
    HBDevoloDimmerDevice.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s) > getSwitchState', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getState() != 0);
    };
    HBDevoloDimmerDevice.prototype.getBrightness = function (callback) {
        this.log.debug('%s (%s) > getBrightness', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getValue('dimmer'));
    };
    HBDevoloDimmerDevice.prototype.getCurrentConsumption = function (callback) {
        this.log.debug('%s > getCurrentConsumption', this.constructor.name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    };
    HBDevoloDimmerDevice.prototype.getTotalConsumption = function (callback) {
        this.log.debug('%s > getTotalConsumption', this.constructor.name);
        return callback(null, this.dDevice.getTotalValue('energy'));
    };
    HBDevoloDimmerDevice.prototype.getTotalConsumptionSince = function (callback) {
        this.log.debug('%s > getTotalConsumptionSince', this.constructor.name);
        return callback(null, new Date(this.dDevice.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    };
    HBDevoloDimmerDevice.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, value);
        if (value == this.dDevice.getState()) {
            callback();
            return;
        }
        var self = this;
        if (value) {
            this.dDevice.turnOn(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        }
    };
    HBDevoloDimmerDevice.prototype.setBrightness = function (value, callback) {
        this.log.debug('%s (%s) > setBrightness to %s', this.constructor.name, this.dDevice.id, value);
        if (value == this.dDevice.getValue('dimmer')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setValue('dimmer', value);
        callback();
    };
    return HBDevoloDimmerDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloDimmerDevice = HBDevoloDimmerDevice;
