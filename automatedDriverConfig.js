const automatedDriverConfig = {
    startMaxVolumeChange: 2,
    endMaxVolumeChange: 5,
    noChangesProbability: 0.3,
    msBetweenUpdates: 15000,
    painMinShocks: 5,
    painMaxShocks: 15,
    painMinShockLength: 0.05,
    painMaxShockLength: 0.5,
    painMinTimeBetweenShocks: 0.2,
    painMaxTimeBetweenShocks: 1.0,
    amTypes: {
        waveforms: ["sine", "square", "triangle", "sawtooth"],
        probabilities: [0.4, 0.3, 0.15, 0.15],
    } // make sure probabilities add up to 1.0
};

module.exports = automatedDriverConfig;