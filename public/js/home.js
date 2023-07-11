// generates a 10 character long random session ID
function generateSessionId() {
    let text = "";
    const possible = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz023456789";

    for (let i = 0; i < 10; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

// checks if the entered session ID is valid before attempting to join the session
function checkSessionID(sessionID) {
    resetWarning();

    fetch(`/player/play/${sessionID}`).then(res => {
        if (res.status === 200) {
            window.location = `/player/play/${sessionID}`;
        } else {
            // alert user of malunction
            document.getElementById("join-session-warning-text").style.display = "";
            document.getElementById("session-id").style.border = "1px solid #f00";
        }
    });
}

// reset styling of alerts
function resetWarning() {
    document.getElementById("join-session-warning-text").style.display = "none";
    document.getElementById("session-id").style.border = "";
}