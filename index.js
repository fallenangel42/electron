const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const ElectronState = require('./electronState');
const automatedDriverConfig = require('./automatedDriverConfig');
const inputValidationMiddleware = require('./inputValidation');
const socketHandler = require('./socketHandler');
const { generateAutomatedSessId } = require('./utils');

const PORT = process.env.PORT || 5000;
const electronState = new ElectronState();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// middleware we need for form submission
app.use(express.urlencoded({ extended: false }));

// set template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// home page
app.get('/', function (req, res) {
    res.render('index');
});

// actually start new automated driver
app.use('/start-automated-driver', inputValidationMiddleware.validateAutomatedDriverInput);
app.post('/start-automated-driver', function (req, res) {
    const minFrequency = parseInt(req.body['min-frequency']);
    const maxFrequency = parseInt(req.body['max-frequency']);
    const startFrequency = parseInt(req.body['start-frequency']);
    const startVolume = parseInt(req.body['start-volume']);
    const amPreset = parseInt(req.body['am-preset']);
    const sessionDuration = parseInt(req.body['session-duration']);
    const painProbability = parseInt(req.body['pain-probability']);
    const painIntensity = parseInt(req.body['pain-intensity']);
    const sessId = generateAutomatedSessId();

    const sessionConfig = {
        sessionDuration: sessionDuration,
        minAMDepth: amPreset,
        maxAMDepth: amPreset * 3,
        minFrequency: minFrequency,
        maxFrequency: maxFrequency,
        initialFrequency: startFrequency,
        startVolume: startVolume,
        painProbability: painProbability,
        painIntensity: painIntensity,
        ...automatedDriverConfig
    };

    if (electronState.startAutomatedDriver(sessId, sessionConfig)) {
        res.render('automated', { sessId: sessId, sessDuration: sessionConfig.sessionDuration });
    } else {
        res.status(500).send('Failed to start automated driver');
    }
});

// set parameters for new automated driver
app.get('/config-automated-driver', function (req, res) {
    res.render('cfgautomated');
});

// player page
app.get('/player/:mode/:sessId', function (req, res) {
    const mode = req.params.mode;
    const sessId = req.params.sessId;
    if ((mode === 'play' || mode === 'drive') && sessId.length === 10) {
        // joining or driving a session
        res.render('player');
    } else if (mode === 'play' && sessId === 'solo') {
        // solo play
        res.render('player');
    } else {
        // something went wrong -> 404!
        res.status(404);
        res.send('Not found');
    }
});

// assign callbacks to handle sockets, which is the core
// of the remote driving functionality
io.on('connection', socketHandler(electronState));

// init the server!
app.use(express.static('public'));
server.listen(PORT, () => console.log(`e l e c t r o n initialized and server now listening on port ${PORT}`));
