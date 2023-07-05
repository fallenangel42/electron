module.exports = {
    validateAutomatedDriverInput: function (req, res, next) {
        const minFrequency = parseInt(req.body['min-frequency']);
        const maxFrequency = parseInt(req.body['max-frequency']);
        const startFrequency = parseInt(req.body['start-frequency']);
        const startVolume = parseInt(req.body['start-volume']);
        const amPreset = parseInt(req.body['am-preset']);
        const sessionDuration = parseInt(req.body['session-duration']);

        if (isNaN(minFrequency) ||
            isNaN(maxFrequency) ||
            isNaN(startFrequency) ||
            isNaN(startVolume) ||
            isNaN(amPreset) ||
            isNaN(sessionDuration) ||
            minFrequency < 100 || minFrequency > 3000 ||
            maxFrequency < 100 || maxFrequency > 3000 ||
            startFrequency < 0 || startFrequency < minFrequency || startFrequency > maxFrequency ||
            startVolume < 0 ||
            amPreset < 0 || amPreset > 20 ||
            sessionDuration < 30 || sessionDuration > 60 ||
            minFrequency >= maxFrequency
        ) {
            return res.status(400).send('Invalid input values');
        }
        next();
    }
};