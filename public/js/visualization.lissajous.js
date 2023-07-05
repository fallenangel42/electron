// Utility function for determining common frequency plot limits for left and right channels
function getFrequencyLimits() {

    let leftMin = leftOsc.getFreq();
    let leftMax = leftOsc.getFreq();
    let rightMin = rightOsc.getFreq();
    let rightMax = rightOsc.getFreq();

    if (leftOsc.started) {
        leftMin = leftMin - fModL.getAmp();
        leftMax = leftMax + fModL.getAmp();
    }
    if (rightOsc.started) {
        rightMin = rightMin - fModR.getAmp();
        rightMax = rightMax + fModR.getAmp();
    }
    let freqMin = Math.min(leftMin, rightMin);
    let freqMax = Math.max(leftMax, rightMax);
    if (freqMin == freqMax) {
        freqMin = freqMin - 1;
        freqMax = freqMax + 1;
    }
    return [freqMin, freqMax];
}

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

    // vertical line at left channel volume
    const xA = map(leftOsc.getAmp(), 0, 1, (width - height) / 2, (width + height) / 2);
    stroke(rightColor);
    line(xA, 0, xA, height);

    // horizontal line at right channel volume
    const yA = map(rightOsc.getAmp(), 0, 1, height, 0);
    stroke(leftColor);
    line((width - height) / 2, yA, (width + height) / 2, yA);

    // Lissajous
    plotLength = Math.min(amplL.length, amplR.length);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        let ml = Math.abs(leftOsc.getAmp() + amplL[iLR]);
        let mr = Math.abs(rightOsc.getAmp() + amplR[iLR]);
        let al = Math.min(ml, 1);
        let ar = Math.min(mr, 1);
        if (ml > 1 || mr > 1) {
            stroke('white');
        } else {
            stroke(lissajousColor);
        }
        // NOTE: AM oscillators return nonzero values even if main oscillator not started
        if (!leftOsc.started) {
            al = leftOsc.getAmp();
        }
        if (!rightOsc.started) {
            ar = rightOsc.getAmp();
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

    const [freqMin, freqMax] = getFrequencyLimits();

    // vertical line at left channel carrier frequency
    stroke(rightColor);
    const xF = map(leftOsc.getFreq(), freqMin, freqMax, (5 * width - 3 * height) / 6, (5 * width + 3 * height) / 6);
    line(xF, 0, xF, height);

    // horizontal line at right channel carrier frequency
    stroke(leftColor);
    const yF = map(rightOsc.getFreq(), freqMin, freqMax, height, 0);
    line((5 * width - 3 * height) / 6, yF, (5 * width + 3 * height) / 6, yF);

    // Lissajous
    plotLength = Math.min(freqL.length, freqR.length);
    stroke(lissajousColor);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        let fl = Math.abs(leftOsc.getFreq() + freqL[iLR]);
        let fr = Math.abs(rightOsc.getFreq() + freqR[iLR]);
        // NOTE: FM oscillators return nonzero values even if main oscillator not started
        if (!leftOsc.started) {
            fl = (freqMin + freqMax) / 2;
        }
        if (!rightOsc.started) {
            fr = (freqMin + freqMax) / 2;
        }
        const xLR = map(fl, freqMin, freqMax, (5 * width - 3 * height) / 6, (5 * width + 3 * height) / 6);
        const yLR = map(fr, freqMin, freqMax, height, 0);
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