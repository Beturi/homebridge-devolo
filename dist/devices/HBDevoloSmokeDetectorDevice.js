"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloSmokeDetectorDevice = /** @class */ (function (_super) {
    __extends(HBDevoloSmokeDetectorDevice, _super);
    function HBDevoloSmokeDetectorDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > onStateChanged > State is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.smokeSensorService.getCharacteristic(self.Characteristic.SmokeDetected).updateValue(state, null);
        });
        self.dDevice.events.on('onBatteryLevelChanged', function (value) {
            self.log.info('%s (%s / %s) > onBatteryLevelChanged > Battery level is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.BatteryLevel).updateValue(value, null);
        });
        self.dDevice.events.on('onBatteryLowChanged', function (value) {
            self.log.info('%s (%s / %s) > onBatteryLowChanged > Battery is low (%s)', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.StatusLowBattery).updateValue(!value, null);
        });
        return _this;
    }
    HBDevoloSmokeDetectorDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Smoke Detector')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.smokeSensorService = new this.Service.SmokeSensor();
        this.smokeSensorService.getCharacteristic(this.Characteristic.SmokeDetected)
            .on('get', this.getSmokeDetected.bind(this));
        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
            .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
            .on('get', this.getStatusLowBattery.bind(this));
        this.dDevice.listen();
        return [this.informationService, this.smokeSensorService, this.batteryService];
    };
    HBDevoloSmokeDetectorDevice.prototype.getSmokeDetected = function (callback) {
        this.apiGetSmokeDetected = this.dDevice.getState();
        this.log.debug('%s (%s / %s) > getSmokeDetected is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetSmokeDetected);
        return callback(null, this.apiGetSmokeDetected);
    };
    HBDevoloSmokeDetectorDevice.prototype.getBatteryLevel = function (callback) {
        this.apiGetBatteryLevel = this.dDevice.getBatteryLevel();
        this.log.debug('%s (%s / %s) > getBatteryLevel is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetBatteryLevel);
        return callback(null, this.apiGetBatteryLevel);
    };
    HBDevoloSmokeDetectorDevice.prototype.getStatusLowBattery = function (callback) {
        this.apiGetStatusLowBattery = !this.dDevice.getBatteryLow();
        this.log.debug('%s (%s / %s) > getStatusLowBattery is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetStatusLowBattery);
        return callback(null, this.apiGetStatusLowBattery);
    };
    HBDevoloSmokeDetectorDevice.prototype.getChargingState = function (callback) {
        this.apiGetChargingState = false;
        this.log.debug('%s (%s / %s) > getChargingState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetChargingState);
        return callback(null, this.apiGetChargingState);
    };
    return HBDevoloSmokeDetectorDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSmokeDetectorDevice = HBDevoloSmokeDetectorDevice;
