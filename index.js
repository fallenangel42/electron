const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 5000;

// generates the random token that only the driver of a session will
// possess and will be used to authenticate their requests
function generateToken() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 16; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// home page
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/index.html');
});

// player page
app.get('/player/:mode/:sessId', function (req, res) {
    const mode = req.params.mode;
    const sessId = req.params.sessId;
    if ((mode == 'play' || mode == 'drive') && sessId.length == 10) {
        // joining or driving a session
        res.sendFile(__dirname + '/html/player.html');
    } else if (mode == 'play' && sessId == 'solo') {
        // solo play
        res.sendFile(__dirname + '/html/player.html');
    } else {
        // something went wrong -> 404!
        res.status(404);
        res.send('Not found');
    }
});

// places to store the current state of the application
// as we don't use a database of any kind (it's all in memory!)
let driverTokens = {}; // stores the authentication tokens of drivers
let riders = {};       // stores all sockets for people riding each session
let lastMessages = {}; // storage of incoming messages (setting waveform parameters, pain tool, etc.)

io.on('connection', function (socket) {
    console.log('User connected');
    socket.on('registerRider', function (msg) {
        const sessId = msg.sessId;
        if (!(sessId in driverTokens)) {
            // this session doesn't exist, apparently
            socket.emit('riderRejected');
            console.log('User REJECTED as rider for ' + sessId);
            return;
        }

        // store the socket for this new rider
        console.log('User APPROVED as rider for ' + sessId);
        if (sessId in riders) {
            riders[sessId].push(socket);
        } else {
            riders[sessId] = [];
            riders[sessId].push(socket);
        }
    });

    socket.on('requestLast', function (msg) {
        const sessId = msg.sessId;
        if (sessId in lastMessages && 'left' in lastMessages[sessId]) {
            // send the last status for the left channel so this new rider
            // is synchronized with the current status
            socket.emit('left', lastMessages[sessId].left);
        }
        if (sessId in lastMessages && 'right' in lastMessages[sessId]) {
            // send the last status for the right channel so this new rider
            // is synchronized with the current status
            socket.emit('right', lastMessages[sessId].right);
        }
    });

    // new driver, let's generate a new authentication token... unless someone
    // else is already driving this session!
    socket.on('registerDriver', function (msg) {
        const sessId = msg.sessId;
        console.log('User registered as driver for ' + sessId);
        if (!(sessId in driverTokens)) {
            const token = generateToken();
            driverTokens[sessId] = token;
            socket.emit('driverToken', token);
            console.log('User APPROVED as driver for ' + sessId);
            lastMessages[sessId] = {};
        } else {
            socket.emit('driverRejected');
            console.log('User REJECTED as driver for ' + sessId);
        }
    });

    // left channel updates... send them over to all riders
    socket.on('left', function (msg) {
        if (!msg.sessId || !(msg.sessId in driverTokens) || msg.driverToken != driverTokens[msg.sessId]) {
            return;
        }

        // store the current status of the left channel for the future
        lastMessages[msg.sessId].left = msg;
        // send real time updates to all riders
        if (msg.sessId in riders) {
            riders[msg.sessId].forEach(function (s) {
                s.emit('left', msg);
            });
        }
    });

    // right channel updates... send them over to all riders
    socket.on('right', function (msg) {
        if (!msg.sessId || !(msg.sessId in driverTokens) || msg.driverToken != driverTokens[msg.sessId]) {
            return;
        }

        // store the current status of the right channel for the future
        lastMessages[msg.sessId].right = msg;
        // send real time updates to all riders
        if (msg.sessId in riders) {
            riders[msg.sessId].forEach(function (s) {
                s.emit('right', msg);
            });
        }
    });

    // left pain tool updates... send them over to all riders
    socket.on('pain-left', function (msg) {
        if (msg.sessId in riders && msg.driverToken == driverTokens[msg.sessId]) {
            riders[msg.sessId].forEach(function (s) {
                s.emit('pain-left', msg);
            });
        }
    });

    // right pain tool updates... send them over to all riders
    socket.on('pain-right', function (msg) {
        if (msg.sessId in riders && msg.driverToken == driverTokens[msg.sessId]) {
            riders[msg.sessId].forEach(function (s) {
                s.emit('pain-right', msg);
            });
        }
    });

    // remove person from list of riders if they close the connection
    socket.on('disconnect', function () {
        console.log('User disconnected');
        for (const sessId in riders) {
            const index = riders[sessId].indexOf(socket);
            if (index > -1) {
                riders[sessId].splice(index, 1);
                console.log('User removed from riders list successfully');
            }
        }
    });
});

// init the server!
app.use(express.static('public'));
http.listen(PORT, () => console.log(`e l e c t r o n initialized and server now listening on port ${PORT}`));
