// places to store the current state of the application
// as we don't use a database of any kind (it's all in memory!)
const AutomatedDriver = require('./automatedDriver');

class ElectronState {
    constructor() {
        this.driverTokens = {};     // stores the authentication tokens of drivers
        this.riders = {};           // stores all sockets for people riding each session
        this.lastMessages = {};     // storage of incoming messages (setting waveform parameters, pain tool, etc.)
        this.automatedDrivers = {}; // stores automated drivers by their session ids
    }

    addDriverToken(sessId, token) {
        this.driverTokens[sessId] = token;
    }

    driverTokenExists(sessId) {
        return sessId in this.driverTokens || sessId in this.automatedDrivers;
    }

    validateDriverToken(sessId, driverToken) {
        if (!(sessId in this.driverTokens)) {
            return false;
        }
        return this.driverTokens[sessId] == driverToken;
    }

    addRiderSocket(sessId, socket) {
        if (this.riders[sessId]) {
            this.riders[sessId].push(socket);
        } else {
            this.riders[sessId] = [socket];
        }
    }

    getRiderSockets(sessId) {
        if (!(sessId in this.riders)) {
            return [];
        }
        return this.riders[sessId];
    }

    storeLastMessage(sessId, channel, message) {
        if (!this.lastMessages[sessId]) {
            this.lastMessages[sessId] = {};
        }
        this.lastMessages[sessId][channel] = message;
    }

    getLastMessage(sessId, channel) {
        if (!(sessId in this.lastMessages) || !(channel in this.lastMessages[sessId])) {
            return null;
        }
        return this.lastMessages[sessId][channel];
    }

    onDisconnect(socket) {
        for (const sessId in this.riders) {
            const index = this.riders[sessId].indexOf(socket);
            if (index > -1) {
                this.riders[sessId].splice(index, 1);
            }
        }
    }

    startAutomatedDriver(sessId, automatedDriverConfig) {
        if (this.driverTokenExists(sessId)) {
            return false;
        }

        if (!this.automatedDrivers[sessId]) {
            this.automatedDrivers[sessId] = new AutomatedDriver(sessId, automatedDriverConfig);
            this.automatedDrivers[sessId].run(this);
            return true;
        } else {
            return false;
        }
    }

    unregisterAutomatedDriver(sessId) {
        delete this.automatedDrivers[sessId];
        delete this.lastMessages[sessId];
    }

}

module.exports = ElectronState;
