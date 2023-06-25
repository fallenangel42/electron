class AutomatedDriver {
    constructor(sessId, config) {
        // read config
        this.sessionDuration = config.sessionDuration || 60;
        this.startMaxVolumeChange = config.startMaxVolumeChange || 2;
        this.endMaxVolumeChange = config.endMaxVolumeChange || 5;
        this.minAMDepth = config.minAMDepth || 2;
        this.maxAMDepth = config.maxAMDepth || 5;
        this.noChangesProbability = config.noChangesProbability || 0.25;
        this.minFrequency = config.minFrequency || 1000;
        this.maxFrequency = config.maxFrequency || 2000;
        this.initialFrequency = config.initialFrequency || 1500;
        this.msBetweenUpdates = config.msBetweenUpdates || 15000;
        this.startVolume = config.startVolume || 50;

        // set initial internal state
        this.inUse = false; // is anyone listening to this session?
        this.sessId = sessId;
        this.startTime = new Date();
        this.leftChannel = {
            volume: this.startVolume,
            freq: this.initialFrequency,
            amType: 'none',
            amDepth: 0,
            amFreq: 0
        };
        this.rightChannel = {
            volume: this.startVolume,
            freq: this.initialFrequency,
            amType: 'none',
            amDepth: 0,
            amFreq: 0
        };
    }

    updateVolume(channel, elapsedMinutes) {
        // Increase max value for dVolume over duration of session
        const d = this.endMaxVolumeChange - this.startMaxVolumeChange;
        const dVolumeMax = Math.min(this.startMaxVolumeChange + d * (elapsedMinutes / this.sessionDuration), this.endMaxVolumeChange);
        const dVolume = Math.random() * dVolumeMax;
        if (Math.random() < 0.7) {
            channel.volume += dVolume;
        } else {
            channel.volume -= dVolume;
        }

        // Safeguard: Linear function between startvol+10% at 0 minutes and 100% at the end
        const maxVolume = this.startVolume + 10 + Math.min((90 - this.startVolume) * (elapsedMinutes / this.sessionDuration), (90 - this.startVolume));
        channel.volume = Math.min(Math.max(channel.volume, this.startVolume), maxVolume);
        channel.volume = Math.round(channel.volume);
    }

    toggleAM(channel, elapsedMinutes) {
        // Randomly enable or disable AM
        if (channel.amType !== 'none') {
            channel.amType = 'none';
            channel.amFreq = 0;
            channel.amDepth = 0;
        } else {
            if (Math.random() < 0.7) {
                // 70% chance of sine
                channel.amType = 'sine';
            } else {
                // 30% chance of square
                channel.amType = 'square';
            }
            // Increase max value from 2 to 10 over session
            const amFreqMax = Math.min(2 + 8 * (elapsedMinutes / this.sessionDuration), 10);
            channel.amFreq = parseFloat((Math.random() * amFreqMax).toFixed(2));

            let amDepth = this.minAMDepth + Math.random() * (this.maxAMDepth - this.minAMDepth);
            amDepth = amDepth * (channel.volume / 100.0); // make AM depth proportional to volume
            channel.amDepth = parseFloat(amDepth).toFixed(2);

        }
    }

    varyFrequency(channel) {
        // Slightly vary the frequencies
        const variation = (Math.random() * 2 - 1) * 50; // Random value between -50 and 50
        channel.freq = Math.max(this.minFrequency, Math.min(this.maxFrequency, channel.freq + variation));
        channel.freq = Math.round(channel.freq);
    }

    emitToRiders(channel, channelName, electronState) {
        const msg = {
            volume: channel.volume,
            freq: channel.freq,
            amType: channel.amType,
            amDepth: channel.amDepth,
            amFreq: channel.amFreq,
            active: true,
            fmType: 'none',
            fmDepth: 10,
            fmFreq: 0,
            rampTarget: channel.volume,
            rampRate: 0
        };

        electronState.getRiderSockets(this.sessId).forEach(function (s) {
            s.emit(channelName, msg);
        });
        electronState.storeLastMessage(this.sessId, channelName, msg);
    }

    emitEndOfSession(channel, channelName, electronState) {
        const msg = {
            volume: channel.volume,
            freq: channel.freq,
            amType: 'none',
            amDepth: channel.amDepth,
            amFreq: channel.amFreq,
            active: true,
            fmType: 'none',
            fmDepth: 10,
            fmFreq: 0,
            rampTarget: 0,
            rampRate: 1
        };

        electronState.getRiderSockets(this.sessId).forEach(function (s) {
            s.emit(channelName, msg);
        });
        electronState.storeLastMessage(this.sessId, channelName, msg);
    }

    processChannel(channel, channelName, elapsedMinutes, electronState) {
        this.updateVolume(channel, elapsedMinutes);
        if (Math.random() < 0.3) {
            // 30% chance of making changes to the AM
            this.toggleAM(channel, elapsedMinutes);
        }

        this.varyFrequency(channel);
        this.emitToRiders(channel, channelName, electronState);
        console.log(`Automated driver ${this.sessId} made changes to the ${channelName.toUpperCase()} channel. Elapsed minutes: ${elapsedMinutes.toFixed(2)}`);
    }

    runActionsOnChannels(elapsedMinutes, electronState) {
        if (Math.random() < 0.5 || elapsedMinutes === 0) {
            // 50% chance of making changes to the left channel
            this.processChannel(this.leftChannel, 'left', elapsedMinutes, electronState);
        }

        if (Math.random() < 0.5 || elapsedMinutes === 0) {
            // 50% chance of making changes to the right channel
            this.processChannel(this.rightChannel, 'right', elapsedMinutes, electronState);
        }
    }

    run(electronState) {
        this.intervalId = setInterval(() => {
            const elapsedMinutes = (new Date() - this.startTime) / 60000;
            if (Math.random() >= this.noChangesProbability) {
                // there is a chance of not making any changes at all
                this.runActionsOnChannels(elapsedMinutes, electronState);
            }

            if (!this.inUse) {
                const riders = electronState.getRiderSockets(this.sessId);
                if (riders.length > 0) {
                    this.inUse = true;
                }
            }

            // if it has been more than 5 minutes and no one has joined, kill it
            if (elapsedMinutes >= 5 && !this.inUse) {
                console.log(`Automated driver ${this.sessId} has no listeners!`);
                clearTimeout(this.stopTimeoutId);
                this.stop(electronState);
            }

        }, this.msBetweenUpdates);

        // stop session after the duration has elapsed
        this.stopTimeoutId = setTimeout(() => {
            this.emitEndOfSession(this.leftChannel, 'left', electronState);
            this.emitEndOfSession(this.rightChannel, 'right', electronState);
            this.stop(electronState);
        }, 60 * this.sessionDuration * 1000);

        console.log(`Automated driver ${this.sessId} has been initialized`);
        this.runActionsOnChannels(0, electronState);
    }

    stop(electronState) {
        clearInterval(this.intervalId);
        electronState.unregisterAutomatedDriver(this.sessId);
        console.log(`Automated driver ${this.sessId} has been stopped`);
    }
}

module.exports = AutomatedDriver;