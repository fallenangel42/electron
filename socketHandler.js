const { generateToken } = require('./utils');

module.exports = function (electronState) {
    return function (socket) {
        console.log('User connected');

        // ====== registerRider ======
        // a rider trying to join a session driven by someone else
        // (or an automated session)
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

        // ====== requestLast ======
        // send the last status for the left & right channels so this new rider
        // is synchronized with the current status
        socket.on('requestLast', function (msg) {
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

        // ====== registerDriver ======
        // new driver, let's generate a new authentication token... unless someone
        // else is already driving this session!
        socket.on('registerDriver', function (msg) {
            const sessId = msg.sessId;
            console.log('User registered as driver for ' + sessId);
            if (!electronState.driverTokenExists(sessId)) {
                const token = generateToken();
                electronState.addDriverToken(sessId, token, socket);
                socket.emit('driverToken', token);
                console.log('User APPROVED as driver for ' + sessId);
            } else {
                socket.emit('driverRejected');
                console.log('User REJECTED as driver for ' + sessId);
            }
        });

        // ====== left ======
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

        // ====== right ======
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

        // ====== pain-left ======
        // left pain tool updates... send them over to all riders
        socket.on('pain-left', function (msg) {
            if (electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
                electronState.getRiderSockets(msg.sessId).forEach(function (s) {
                    s.emit('pain-left', msg);
                });
            }
        });

        // ====== pain-right ======
        // right pain tool updates... send them over to all riders
        socket.on('pain-right', function (msg) {
            if (electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
                electronState.getRiderSockets(msg.sessId).forEach(function (s) {
                    s.emit('pain-right', msg);
                });
            }
        });

        // ====== getRiderCount ======
        // returns how many riders are currently connected to this session
        // and how many are there in each possible traffic light status
        // (green, yellow, red)
        socket.on('getRiderCount', function (msg) {
            if (electronState.validateDriverToken(msg.sessId, msg.driverToken)) {
                const riderData = electronState.getRiderData(msg.sessId);
                socket.emit('riderCount', riderData);
            }
        });

        // ====== trafficLight ======
        // handles the red / yellow / green traffic light system that riders
        // use to inform drivers about how they are doing
        socket.on('trafficLight', function (msg) {
            electronState.setRiderTrafficLight(msg.sessId, socket, msg.color);
            const riderData = electronState.getRiderData(msg.sessId);
            const driverSocket = electronState.getDriverSocket(msg.sessId);
            if (driverSocket) {
                driverSocket.emit('riderCount', riderData);
            }
        });

        // ====== disconnect ======
        // remove person from list of riders if they close the connection
        socket.on('disconnect', function () {
            console.log('User disconnected');
            electronState.onDisconnect(socket);
        });
    };
};