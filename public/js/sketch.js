// the connection between electron and the sound generation capabilities
// of the p5 library. it initializes all the necessary oscillators, as well
// as drawing the waveforms in the signal monitor.
let fftL;
let fftR;
let fftLa;
let fftRa;
let fftLf;
let fftRf;

// Initialize sine wave oscillators
const leftOsc = new p5.Oscillator();
const rightOsc = new p5.Oscillator();
leftOsc.setType('sine');
rightOsc.setType('sine');

// Assign left oscillator to left channel and right oscillator to right channel
leftOsc.pan(-1);
rightOsc.pan(1);

// Initialize oscillators used for Amplitude Modulation
const modL = new p5.Oscillator('sine');
modL.disconnect();
modL.start();

const modR = new p5.Oscillator('sine');
modR.disconnect();
modR.start();

// Initialize oscillators used for Frequency Modulation
const fModL = new p5.Oscillator('sine');
fModL.disconnect();
fModL.start();

const fModR = new p5.Oscillator('sine');
fModR.disconnect();
fModR.start();

let visualization = "Waveform";

function setup() {
    const canvas = createCanvas(930, 200); // width calculated from styles.css sketch-holder-wrapper
    canvas.parent('sketch-holder');
    noFill();
    background(30); // alpha

    // FFT buffers used for main oscillators
    // https://p5js.org/reference/#/p5.FFT says max bins is 1024, but actually can go up to 16384
    const smoothing = 0.9;
    let bins = 16384;
    fftL = new p5.FFT(smoothing, bins);
    fftR = new p5.FFT(smoothing, bins);

    // Waveform buffers used for main oscillators
    // smoothing not used so set to undefined
    bins = 512;
    wavL = new p5.FFT(undefined, bins);
    wavR = new p5.FFT(undefined, bins);

    // Small FFT buffer used to sample AM and FM oscillators
    bins = 16;
    wavLa = new p5.FFT(undefined, bins);
    wavRa = new p5.FFT(undefined, bins);
    wavLf = new p5.FFT(undefined, bins);
    wavRf = new p5.FFT(undefined, bins);

    fftL.setInput(leftOsc);
    fftR.setInput(rightOsc);
    wavL.setInput(leftOsc);
    wavR.setInput(rightOsc);
    wavLa.setInput(modL);
    wavRa.setInput(modR);
    wavLf.setInput(fModL);
    wavRf.setInput(fModR);
}

function selectVisualization(evt, vis) {
    // Get all elements with class="tablinks" and remove the class "active"
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Add an "active" class to the button that opened the tab
    evt.currentTarget.className += " active";

    visualization = vis;
}

function draw() {
    background(30, 30, 30, 100);

    if (visualization == "Waveform") {
        drawWaveform();
    } else if (visualization == "VU Meter") {
        drawVuMeter();
    } else if (visualization == "Spectrum") {
        drawSpectrum();
    } else if (visualization == "Lissajous") {
        drawLissajous();
    }
}

function drawWaveform() {
    waveformL = wavL.waveform();
    waveformR = wavR.waveform();

    stroke(3, 169, 244);
    strokeWeight(4);
    noFill();

    // left channel
    beginShape();
    for (let iL = 0; iL < waveformL.length; iL++) {
        const xL = map(iL, 0, waveformL.length, 0, width);
        const yL = map(waveformL[iL], -1, 1, 0, height);
        vertex(xL, yL);
    }
    endShape();

    // right channel
    stroke(139, 195, 74);
    beginShape();
    for (let iR = 0; iR < waveformR.length; iR++) {
        const xR = map(iR, 0, waveformR.length, 0, width);
        const yR = map(waveformR[iR], -1, 1, 0, height);
        vertex(xR, yR);
    }
    endShape();
}

function drawVuMeter() {
    strokeWeight(4);
    // rectMode(CORNER); // not needed because this is the default (left, upper, width, height)

    var leftFreq;
    var rightFreq;

    // Outline left rectangle
    stroke(3, 169, 244);
    noFill();
    rect(25, 25, width - 50, 50);

    // Outline right rectangle
    stroke(139, 195, 74);
    noFill();
    rect(25, 100, width - 50, 50);

    textAlign(CENTER, BOTTOM);
    textSize(18);

    if (leftOsc.started) {
        let amplL = wavLa.waveform();
        let freqL = wavLf.waveform('float'); // NOTE: Need to pass a string otherwise clips to [-1,1]
        let leftAmpl = leftOsc.getAmp() + amplL[0];
        leftFreq = leftOsc.getFreq() + freqL[0];

        // Fill left rectangle
        fill(3, 169, 244);
        noStroke();

        text('Left Frequency: ' + leftFreq.toFixed(2) + ' Hz.', width / 6, 175);
        rect(25, 25, Math.abs(leftAmpl) * (width - 50), 50);
    }
    if (rightOsc.started) {
        let amplR = wavRa.waveform();
        let freqR = wavRf.waveform('float');
        let rightAmpl = rightOsc.getAmp() + amplR[0];
        rightFreq = rightOsc.getFreq() + freqR[0];

        // Fill right rectangle
        fill(139, 195, 74);
        noStroke();

        text('Right Frequency: ' + rightFreq.toFixed(2) + ' Hz.', 5 * width / 6, 175);
        rect(25, 100, Math.abs(rightAmpl) * (width - 50), 50);
    }
    if (leftOsc.started && rightOsc.started) {
        fill(255, 255, 255);
        noStroke();
        let deltaFreq = rightFreq - leftFreq;
        text('Delta Frequency: ' + deltaFreq.toFixed(2) + ' Hz.', width / 2, 175);
    }
}

function drawSpectrum() {
    let centerFreq = (leftOsc.getFreq() + rightOsc.getFreq()) / 2;
    let deltaFreq = Math.abs(leftOsc.getFreq() - rightOsc.getFreq());
    if (leftOsc.started && !rightOsc.started) {
        centerFreq = leftOsc.getFreq();
        deltaFreq = 0;
    } else if (!leftOsc.started && rightOsc.started) {
        centerFreq = rightOsc.getFreq();
        deltaFreq = 0;
    }

    // Automatically choose the span (zoom level) along the frequency axis
    let span = 2000;
    if (deltaFreq < 50) {
        span = 200;
    } else if (deltaFreq < 100) {
        span = 500;
    } else if (deltaFreq < 200) {
        span = 1000;
    }

    let startFreq = centerFreq - span / 2;
    let stopFreq = centerFreq + span / 2;

    strokeWeight(4);
    noFill();

    // left channel
    stroke(3, 169, 244);
    drawSpectrumChannel(fftL, startFreq, stopFreq);

    // right channel
    stroke(139, 195, 74);
    drawSpectrumChannel(fftR, startFreq, stopFreq);

    if (leftOsc.started || rightOsc.started) {
        // text labels for center frequency and frequency span
        fill(255, 255, 255);
        noStroke();
        textAlign(CENTER, BASELINE);
        textSize(18);
        text('Center: ' + centerFreq.toFixed(2) + ' Hz.', 90, 25);
        text('Span: ' + span.toFixed(2) + ' Hz.', 90, 40);
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
        // let y = map(spectrum[i], 0, 255, height, 0); // without 'db'
        let y = map(spectrum[i], -50, -10, height, 0); // with 'db'
        vertex(x, y);
    }
    endShape();
}

function drawLissajous() {

    strokeWeight(4);
    noFill();

    // Waveform
    waveformL = wavL.waveform();
    waveformR = wavR.waveform();

    // horizontal line for left channel along x axis
    stroke(3, 169, 244);
    line((width - 3 * height) / 6, height / 2, (width + 3 * height) / 6, height / 2);

    // vertical line for right channel along y axis
    stroke(139, 195, 74);
    line(width / 6, 0, width / 6, height);

    // Lissajous
    let plotLength = Math.min(waveformL.length, waveformR.length);
    stroke(200, 200, 200);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        const xLR = map(waveformL[iLR], -1, 1, (width - 3 * height) / 6, (width + 3 * height) / 6);
        const yLR = map(waveformR[iLR], -1, 1, height, 0);
        vertex(xLR, yLR);
    }
    endShape();

    // Amplitude
    let amplL = wavLa.waveform();
    let amplR = wavRa.waveform();

    // horizontal line for left channel along x axis
    stroke(3, 169, 244);
    line((width - height) / 2, height, (width + height) / 2, height);

    // vertical line for right channel along y axis
    stroke(139, 195, 74);
    line((width - height) / 2, 0, (width - height) / 2, height);

    // Lissajous
    plotLength = Math.min(amplL.length, amplR.length);
    stroke(200, 200, 200);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        let al = Math.abs(leftOsc.getAmp() + amplL[iLR]);
        let ar = Math.abs(rightOsc.getAmp() + amplR[iLR]);
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

    // Frequency
    let freqL = wavLf.waveform('float');
    let freqR = wavRf.waveform('float');

    // horizontal line for left channel along x axis
    stroke(3, 169, 244);
    line((5 * width - 3 * height) / 6, height, (5 * width + 3 * height) / 6, height);

    // vertical line for right channel along y axis
    stroke(139, 195, 74);
    line((5 * width - 3 * height) / 6, 0, (5 * width - 3 * height) / 6, height);

    // Lissajous
    plotLength = Math.min(freqL.length, freqR.length);
    stroke(200, 200, 200);
    beginShape();
    for (let iLR = 0; iLR < plotLength; iLR++) {
        let fl = Math.abs(leftOsc.getFreq() + freqL[iLR]);
        let fr = Math.abs(rightOsc.getFreq() + freqR[iLR]);
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

    fill(255, 255, 255);
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