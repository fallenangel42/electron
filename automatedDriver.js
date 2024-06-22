class AutomatedDriver {
    constructor(sessId, config) {
        // read all config values and transfer them as properties for this object
        Object.entries(config).forEach(([key, value]) => {
            this[key] = value;
        });

        // set initial internal state
        this.inUse = false; // is anyone listening to this session?
        this.sessId = sessId;
        this.startTime = new Date();
        const defaultChannelState = {
            volume: this.startVolume,
            freq: this.initialFrequency,
            amType: 'none',
            amDepth: 0,
            amFreq: 0
        };

        this.leftChannel = { ...defaultChannelState };
        this.rightChannel = { ...defaultChannelState };
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
            channel.amType = this.getRandomAMType();
            // Increase max value from 2 to 10 over session
            const amFreqMax = Math.min(2 + 8 * (elapsedMinutes / this.sessionDuration), 10);
            channel.amFreq = parseFloat((Math.random() * amFreqMax).toFixed(2));

            let amDepth = this.minAMDepth + Math.random() * (this.maxAMDepth - this.minAMDepth);
            amDepth = amDepth * (channel.volume / 100.0); // make AM depth proportional to volume
            channel.amDepth = parseFloat(amDepth).toFixed(2);
        }
    }

    getRandomAMType() {
        const probabilityConfig = this.amTypes;
        let probabilitySum = 0;

        // Add all probabilities together in order to determine a cutoff point later
        const waveformProbabilities = probabilityConfig.waveforms.map((waveform, index) => {
            probabilitySum += probabilityConfig.probabilities[index];
            return { waveform, probability: probabilitySum };
        });

        // Find the randomly selected waveform based on a random number
        const randomNum = Math.random();
        const selectedWaveform = waveformProbabilities.find(waveform => randomNum < waveform.probability);
        return selectedWaveform.waveform;
    }

    varyFrequency(channel, otherChannelFreq) {
        // Vary the frequencies using a random walk with reflective boundaries
        // Limit the step size to be the lesser of 50 Hz or the min-to-max frequency span
        const variation = (Math.random() * 2 - 1) * Math.min(50, this.maxFrequency - this.minFrequency);
        let newFreq = channel.freq + variation;
        if (newFreq < this.minFrequency) {
            newFreq = 2 * this.minFrequency - newFreq;
        } else if (newFreq > this.maxFrequency) {
            newFreq = 2 * this.maxFrequency - newFreq;
        }
        // Round frequency to the nearest 0.1 Hz
        newFreq = Math.round(newFreq * 10) / 10;
        if (newFreq != otherChannelFreq) {
            channel.freq = newFreq;
        }
        // Do not change frequency if it is the same as other channel's frequency,
        // because in triphase configuration channels can cancel or add too strongly.
        // Instead keep the same frequency and wait for the next update.
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

    processChannel(channel, channelName, otherChannel, elapsedMinutes, electronState) {
        // first, we consider the possibility of pain!
        if (Math.random() < (this.painProbability * 0.01) && elapsedMinutes > 0) {
            console.log(`Automated driver ${this.sessId} is sending PAIN signal to the ${channelName.toUpperCase()} channel`);
            this.processPain(channel, channelName, electronState);
            return;
        }

        this.updateVolume(channel, elapsedMinutes);
        if (Math.random() < 0.3 && this.minAMDepth > 0) {
            // 30% chance of making changes to the AM
            this.toggleAM(channel, elapsedMinutes);
        }

        this.varyFrequency(channel, otherChannel.freq);
        this.emitToRiders(channel, channelName, electronState);
        console.log(`Automated driver ${this.sessId} made changes to the ${channelName.toUpperCase()} channel. Elapsed minutes: ${elapsedMinutes.toFixed(2)}`);
    }

    processPain(channel, channelName, electronState) {
        const msg = {
            volume: Math.min(1.0, (channel.volume + this.painIntensity) * 0.01),
            frequency: channel.freq,
            shockDuration: Math.random(this.painMinShockLength, this.painMaxShockLength),
            timeBetweenShocks: Math.random(this.painMinTimeBetweenShocks, this.painMaxTimeBetweenShocks),
            numberOfShocks: Math.round(this.painMinShocks + Math.random() * (this.painMaxShocks - this.painMinShocks))
        };

        electronState.getRiderSockets(this.sessId).forEach(function (s) {
            s.emit('pain-' + channelName, msg);
        });
    }

    runActionsOnChannels(elapsedMinutes, electronState) {
        if (Math.random() < 0.5 || elapsedMinutes === 0) {
            // 50% chance of making changes to the left channel
            this.processChannel(this.leftChannel, 'left', this.rightChannel, elapsedMinutes, electronState);
        }

        if (Math.random() < 0.5 || elapsedMinutes === 0) {
            // 50% chance of making changes to the right channel
            this.processChannel(this.rightChannel, 'right', this.leftChannel, elapsedMinutes, electronState);
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