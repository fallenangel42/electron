function drawWaveform() {
    strokeWeight(4);
    noFill();

    // left channel
    stroke(leftColor);
    drawWaveformChannel(wavL);

    // right channel
    stroke(rightColor);
    drawWaveformChannel(wavR);
}

function drawWaveformChannel(wav) {
    waveform = wav.waveform();
    beginShape();
    for (let i = 0; i < waveform.length; i++) {
        const x = map(i, 0, waveform.length, 0, width);
        const y = map(waveform[i], -1, 1, 0, height);
        vertex(x, y);
    }
    endShape();
}