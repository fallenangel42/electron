// places to store the current state of the application
// as we don't use a database of any kind (it's all in memory!)
const AutomatedDriver = require('./automatedDriver');

class ElectronState {
    constructor() {
        this.driverTokens = {};     // stores the authentication tokens of drivers
        this.driverSockets = {};    // stores sockets for people driving sessions
        this.riders = {};           // stores all sockets for people riding each session
        this.lastMessages = {};     // storage of incoming messages (setting waveform parameters, pain tool, etc.)
        this.automatedDrivers = {}; // stores automated drivers by their session ids
        this.trafficLights = {};    // dictionary binding sockets to red / yellow / green traffic lights
    }

    addDriverToken(sessId, token, socket) {
        this.driverTokens[sessId] = token;
        this.driverSockets[sessId] = socket;
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

    getDriverSocket(sessId) {
        return this.driverSockets[sessId];
    }

    storeLastMessage(sessId, channel, message) {
        if (!this.lastMessages[sessId]) {
            this.lastMessages[sessId] = {};
        }
        this.lastMessages[sessId][channel] = message;
    }

    setRiderTrafficLight(sessId, socket, color) {
        const sockets = this.getRiderSockets(sessId);
        const invalidColor = ['R', 'Y', 'G', 'N'].indexOf(color) === -1;
        if (sockets.indexOf(socket) === -1 || invalidColor) {
            return;
        }
        this.trafficLights[socket.id] = color;
    }

    getRiderTrafficLight(socket) {
        // valid values: R (red), Y (yellow), G (green), N (none)
        if (socket.id in this.trafficLights) {
            return this.trafficLights[socket.id];
        }
        return 'N';
    }

    getLastMessage(sessId, channel) {
        if (!(sessId in this.lastMessages) || !(channel in this.lastMessages[sessId])) {
            return null;
        }
        return this.lastMessages[sessId][channel];
    }

    getRiderData(sessId) {
        const riderSockets = this.getRiderSockets(sessId);
        const self = this;
        let riderData = { 'G': 0, 'Y': 0, 'R': 0, 'N': 0, 'total': 0 };

        riderSockets.forEach(function (s) {
            const color = self.getRiderTrafficLight(s);
            riderData[color]++;
            riderData.total++;
        });
        return riderData;
    }

    onDisconnect(socket) {
        for (const sessId in this.riders) {
            const index = this.riders[sessId].indexOf(socket);
            if (index > -1) {
                this.riders[sessId].splice(index, 1);
            }
        }
        delete this.trafficLights[socket.id];
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
