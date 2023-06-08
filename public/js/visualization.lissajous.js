function drawLissajous() {
    strokeWeight(4);
    noFill();

    /************/
    /* Waveform */
    /************/
    waveformL = wavL.waveform();
    waveformR = wavR.waveform();

    // centered horizontal line for left channel along x axis
    stroke(leftColor);
    line((width - 3 * height) / 6, height / 2, (width + 3 * height) / 6, height / 2);

    // centered vertical line for right channel along y axis
    stroke(rightColor);
    line(width / 6, 0, width / 6, height);

    // Lissajous
    let plotLength = Math.min(waveformL.length, waveformR.length);
    stroke(lissajousColor);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        const xLR = map(waveformL[iLR], -1, 1, (width - 3 * height) / 6, (width + 3 * height) / 6);
        const yLR = map(waveformR[iLR], -1, 1, height, 0);
        vertex(xLR, yLR);
    }
    endShape();

    /*************/
    /* Amplitude */
    /*************/
    let amplL = wavLa.waveform();
    let amplR = wavRa.waveform();

    // bottom horizontal line for left channel along x axis
    stroke(leftColor);
    line((width - height) / 2, height, (width + height) / 2, height);

    // left vertical line for right channel along y axis
    stroke(rightColor);
    line((width - height) / 2, 0, (width - height) / 2, height);

    // Lissajous
    plotLength = Math.min(amplL.length, amplR.length);
    stroke(lissajousColor);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        let al = Math.abs(leftOsc.getAmp() + amplL[iLR]);
        let ar = Math.abs(rightOsc.getAmp() + amplR[iLR]);
        // NOTE: AM oscillators return nonzero values even if main oscillator not started
        if (!leftOsc.started) {
            al = 0;
        }
        if (!rightOsc.started) {
            ar = 0;
        }
        const xLR = map(al, 0, 1, (width - height) / 2, (width + height) / 2);
        const yLR = map(ar, 0, 1, height, 0);
        vertex(xLR, yLR);
    }
    endShape();

    /*************/
    /* Frequency */
    /*************/
    let freqL = wavLf.waveform('float');
    let freqR = wavRf.waveform('float');

    // bottom horizontal line for left channel along x axis
    stroke(leftColor);
    line((5 * width - 3 * height) / 6, height, (5 * width + 3 * height) / 6, height);

    // left vertical line for right channel along y axis
    stroke(rightColor);
    line((5 * width - 3 * height) / 6, 0, (5 * width - 3 * height) / 6, height);

    // Lissajous
    plotLength = Math.min(freqL.length, freqR.length);
    stroke(lissajousColor);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        let fl = Math.abs(leftOsc.getFreq() + freqL[iLR]);
        let fr = Math.abs(rightOsc.getFreq() + freqR[iLR]);
        // NOTE: FM oscillators return nonzero values even if main oscillator not started
        if (!leftOsc.started) {
            fl = 0;
        }
        if (!rightOsc.started) {
            fr = 0;
        }
        const xLR = map(fl, 0, 2000, (5 * width - 3 * height) / 6, (5 * width + 3 * height) / 6);
        const yLR = map(fr, 0, 2000, height, 0);
        vertex(xLR, yLR);
    }
    endShape();

    fill(textColor);
    angleMode(DEGREES);
    noStroke();
    textAlign(CENTER, BOTTOM);
    textSize(18);

    push();
    translate((width - 3 * height) / 6, height / 2);
    rotate(270);
    text('Waveform:', 0, 0);
    pop();

    push();
    translate((width - height) / 2, height / 2);
    rotate(270);
    text('Amplitude:', 0, 0);
    pop();

    push();
    translate((5 * width - 3 * height) / 6, height / 2);
    rotate(270);
    text('Frequency:', 0, 0);
    pop();
}