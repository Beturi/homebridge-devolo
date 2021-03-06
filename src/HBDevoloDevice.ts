import {HBIDevoloDevice} from './HBDevoloMisc';
import {Devolo} from 'node-devolo/dist/Devolo';
import {Device} from 'node-devolo/dist/DevoloDevice';

const moment = require('moment');
const shell = require('shelljs');

export abstract class HBDevoloDevice implements HBIDevoloDevice {

    log;
    uuid_base: string;
    name: string;
    dAPI: Devolo;
    dDevice: Device;
    informationService;
    Homebridge;
    Service;
    Characteristic;
    storage;
    config;

    // FakeGato (eve app)
    displayName;
    loggingService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        this.log = log;
        this.dAPI = dAPI;
        this.dDevice = dDevice;
        this.log.debug('%s > Initializing', (this.constructor as any).name);
        this.name = this.dDevice.name;
        this.uuid_base = this.dDevice.id;
        this.storage = storage;
        this.config = config;

        // FakeGato (eve app)
        this.displayName = this.dDevice.id.replace('/','-'); // shit, hardcoded by simont77 for "filename"
    }

    setHomebridge(homebridge) {
        this.Homebridge = homebridge;
        this.Service = homebridge.hap.Service;
        this.Characteristic = homebridge.hap.Characteristic;
    }

    accessories() : HBIDevoloDevice[] {
        return [];
    }

    getServices() {
        return [];
    };

    protected _isInList(name: string, list: string[]) : boolean {
        for(var i=0; i<list.length; i++) {
            if(name===list[i])
                return true;
        }
        return false;
    }

    // START FakeGato (eve app)
    protected onAfterFakeGatoHistoryLoaded() { }

    protected fakeGatoHistoryLoaded() {
        if(this.loggingService.isHistoryLoaded() == false) {
              this.log.debug("%s (%s / %s) > Wait of FakeGato history loaded.", (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
              setTimeout(this.fakeGatoHistoryLoaded.bind(this), 100);
        } else {
            this.log.debug("%s (%s / %s) > FakeGato history loaded.", (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
            this.onAfterFakeGatoHistoryLoaded();
        }
    }

    protected _addFakeGatoHistory(type: String, disTimer: boolean) {
        var folder = this.Homebridge.user.storagePath() + '/.homebridge-devolo/fakegato-history';
        shell.mkdir('-p', folder);

        var FakeGatoHistoryService = require('fakegato-history')(this.Homebridge);

        this.log.info("%s (%s / %s) > FakeGato initialized (%s).", (this.constructor as any).name, this.dDevice.id, this.dDevice.name, folder);
        this.loggingService = new FakeGatoHistoryService(type, this, {storage: 'fs', path: folder, disableTimer: disTimer});

        this.fakeGatoHistoryLoaded();
    }

    protected _addFakeGatoEntry(data) {
        if ((this.loggingService != undefined) && (data != undefined)) {
            data.time = moment().unix();
            this.loggingService.addEntry(data);
            this.log.debug("%s (%s / %s) > FakeGato > New entry saved: %s.", (this.constructor as any).name, this.dDevice.id, this.dDevice.name, JSON.stringify(data));
        }
    }
    // END FakeGato (eve app)
}