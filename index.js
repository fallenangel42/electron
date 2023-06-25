const express = require('express');
const path = require('path');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 5000;
const { generateToken, generateAutomatedSessId } = require('./utils');
const ElectronState = require('./electronState');
const automatedDriverConfig = require('./automatedDriverConfig');

const electronState = new ElectronState();

app.use(express.urlencoded({ extended: false }));

// set template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// home page
app.get('/', function (req, res) {
    res.render('index');
});

// actually start new automated driver
app.post('/start-automated-driver', function (req, res) {
    const minFrequency = parseInt(req.body['min-frequency']);
    const maxFrequency = parseInt(req.body['max-frequency']);
    const startFrequency = parseInt(req.body['start-frequency']);
    const startVolume = parseInt(req.body['start-volume']);
    const sessionDuration = parseInt(req.body['session-duration']);
    const sessId = generateAutomatedSessId();

    // Validate input values
    if (
        isNaN(minFrequency) ||
        isNaN(maxFrequency) ||
        isNaN(startFrequency) ||
        isNaN(startVolume) ||
        isNaN(sessionDuration) ||
        minFrequency < 100 || minFrequency > 3000 ||
        maxFrequency < 100 || maxFrequency > 3000 ||
        startFrequency < 0 || startFrequency < minFrequency || startFrequency > maxFrequency ||
        startVolume < 0 ||
        sessionDuration < 30 || sessionDuration > 60 ||
        minFrequency >= maxFrequency
    ) {
        return res.status(400).send('Invalid input values');
    }

    const sessionConfig = {
        sessionDuration: sessionDuration,
        startMaxVolumeChange: automatedDriverConfig.startMaxVolumeChange,
        endMaxVolumeChange: automatedDriverConfig.endMaxVolumeChange,
        minAMDepth: automatedDriverConfig.minAMDepth,
        maxAMDepth: automatedDriverConfig.maxAMDepth,
        noChangesProbability: automatedDriverConfig.noChangesProbability,
        minFrequency: minFrequency,
        maxFrequency: maxFrequency,
        initialFrequency: startFrequency,
        msBetweenUpdates: automatedDriverConfig.msBetweenUpdates,
        startVolume: startVolume
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

app.get("/favicon.ico", async (req, res) => {
    res.status(200);
    res.sendFile(__dirname + '/public/favicon.ico');
});

io.on('connection', function (socket) {
    console.log('User connected');
    socket.on('registerRider', function (msg) {
        const sessId = msg.sessId;
        if (!electronState.driverTokenExists(sessId)) {
            // this session doesn't exist, apparently
            socket.emit('riderRejected');
            console.log('User REJECTED as rider for ' + sessId);
            return;
        }

        // store the socket for this new rider
        console.log('User APPROVED as rider for ' + sessId);
        electronState.addRiderSocket(sessId, socket);
    });

    socket.on('requestLast', function (msg) {
        // send the last status for the left & right channels so this new rider
        // is synchronized with the current status
        const sessId = msg.sessId;
        const lastLeft = electronState.getLastMessage(sessId, 'left');
        const lastRight = electronState.getLastMessage(sessId, 'right');
        if (lastLeft) {
            socket.emit('left', lastLeft);
        }
        if (lastRight) {
            socket.emit('right', lastRight);
        }
    });

    // new driver, let's generate a new authentication token... unless someone
    // else is already driving this session!
    socket.on('registerDriver', function (msg) {
        const sessId = msg.sessId;
        console.log('User registered as driver for ' + sessId);
        if (!electronState.driverTokenExists(sessId)) {
            const token = generateToken();
            electronState.addDriverToken(sessId, token);
            socket.emit('driverToken', token);
            console.log('User APPROVED as driver for ' + sessId);
        } else {
            socket.emit('driverRejected');
            console.log('User REJECTED as driver for ' + sessId);
        }
    });

    // left channel updates... send them over to all riders
    socket.on('left', function (msg) {
        if (!msg.sessId || !electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
            return;
        }

        // store the current status of the left channel for the future
        electronState.storeLastMessage(msg.sessId, 'left', msg);
        // send real time updates to all riders
        electronState.getRiderSockets(msg.sessId).forEach(function (s) {
            s.emit('left', msg);
        });
    });

    // right channel updates... send them over to all riders
    socket.on('right', function (msg) {
        if (!msg.sessId || !electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
            return;
        }

        // store the current status of the right channel for the future
        electronState.storeLastMessage(msg.sessId, 'right', msg);
        // send real time updates to all riders
        electronState.getRiderSockets(msg.sessId).forEach(function (s) {
            s.emit('right', msg);
        });
    });

    // left pain tool updates... send them over to all riders
    socket.on('pain-left', function (msg) {
        if (electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
            electronState.getRiderSockets(msg.sessId).forEach(function (s) {
                s.emit('pain-left', msg);
            });
        }
    });

    // right pain tool updates... send them over to all riders
    socket.on('pain-right', function (msg) {
        if (electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
            electronState.getRiderSockets(msg.sessId).forEach(function (s) {
                s.emit('pain-right', msg);
            });
        }
    });

    // remove person from list of riders if they close the connection
    socket.on('disconnect', function () {
        console.log('User disconnected');
        electronState.onDisconnect(socket);
    });
});

// init the server!
app.use(express.static('public'));
http.listen(PORT, () => console.log(`e l e c t r o n initialized and server now listening on port ${PORT}`));
