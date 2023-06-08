function drawSpectrum() {
    // Automatically choose the center and span (zoom level) of the frequency axis
    let centerFreq = (leftOsc.getFreq() + rightOsc.getFreq()) / 2;
    let deltaFreq = Math.abs(leftOsc.getFreq() - rightOsc.getFreq());
    if (leftOsc.started && !rightOsc.started) {
        centerFreq = leftOsc.getFreq();
        deltaFreq = 0;
    } else if (!leftOsc.started && rightOsc.started) {
        centerFreq = rightOsc.getFreq();
        deltaFreq = 0;
    }
    // Selection of span as a function of deltaFreq TBR
    let span = 20000;
    if (deltaFreq < 50) {
        span = 500;
    } else if (deltaFreq < 100) {
        span = 1000;
    } else if (deltaFreq < 200) {
        span = 2000;
    } else if (deltaFreq < 500) {
        span = 5000;
    } else if (deltaFreq < 1000) {
        span = 10000;
    }

    let startFreq = centerFreq - span / 2;
    let stopFreq = centerFreq + span / 2;

    strokeWeight(4);
    noFill();

    // left channel
    stroke(leftColor);
    drawSpectrumChannel(fftL, startFreq, stopFreq);

    // right channel
    stroke(rightColor);
    drawSpectrumChannel(fftR, startFreq, stopFreq);

    if (leftOsc.started || rightOsc.started) {
        // text labels for center frequency and frequency span
        fill(textColor);
        noStroke();
        textAlign(LEFT, BASELINE);
        textSize(18);
        text('Center: ' + centerFreq.toFixed(2) + ' Hz.', 20, 35);
        text('Span: ' + span.toFixed(2) + ' Hz.', 20, 55);
    }
}

function drawSpectrumChannel(fft, startFreq, stopFreq) {
    let spectrum = fft.analyze('db'); // NOTE: Without 'db' peak gets desctructively clipped to 255
    let binWidth = sampleRate() / (2 * spectrum.length);
    let iStart = Math.floor(startFreq / binWidth);
    let iStop = Math.ceil(stopFreq / binWidth);

    beginShape();
    for (let i = iStart; i <= iStop; i++) {
        let x = map(i * binWidth, startFreq, stopFreq, 0, width);
        // let y = map(spectrum[i], 0, 255, height, 0); // without 'db', peaks get squashed
        let y = map(spectrum[i], -63, -13, height, 0); // with 'db'
        vertex(x, y);
    }
    endShape();
}