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

function generateAutomatedSessId() {
    let text = 'AUTO';
    const possible = '0123456789';
    for (let i = 0; i < 6; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

module.exports = {
    generateToken,
    generateAutomatedSessId,
};