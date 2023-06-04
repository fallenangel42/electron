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

let leftColor;
let rightColor;
let textColor;
let lissajousColor;

// Initialize visualization. Should match class="tablinks active" in player.html.
let visualization = "Waveform";

// Handle onclick events from tablinks in player.html
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

// The p5.js setup() function
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

    // Waveform buffers used to sample AM and FM oscillators
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

    leftColor = color(3, 169, 244);
    rightColor = color(139, 195, 74);
    textColor = color(255, 255, 255);
    lissajousColor = color(255, 0, 0);
}

// The p5.js draw() function, continuously executed
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
    strokeWeight(4);
    noFill();

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

function drawVuMeter() {
    strokeWeight(4);
    // rectMode(CORNER); // not needed because this is the default (left, upper, width, height)

    var leftFreq = undefined;
    var rightFreq = undefined;

    // Outline left rectangle
    stroke(leftColor);
    noFill();
    rect(25, 25, width - 50, 50);

    // Outline right rectangle
    stroke(rightColor);
    noFill();
    rect(25, 100, width - 50, 50);

    textAlign(CENTER, BOTTOM);
    textSize(18);

    if (leftOsc.started) {
        let amplL = wavLa.waveform();
        // NOTE: Need to pass a string to wavLf.waveform() otherwise clips to [-1,1]
        let freqL = wavLf.waveform('float');
        // NOTE: Total amplitude (volume + AM depth) can be greater than 1,
        // resulting in clipping and distortion of the tone.
        // The VU Meter will go past its maximum to draw attention to this effect.
        let leftAmpl = leftOsc.getAmp() + amplL[0];
        leftFreq = leftOsc.getFreq() + freqL[0];

        // Fill left rectangle
        fill(leftColor);
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
        fill(rightColor);
        noStroke();

        text('Right Frequency: ' + rightFreq.toFixed(2) + ' Hz.', 5 * width / 6, 175);
        rect(25, 100, Math.abs(rightAmpl) * (width - 50), 50);
    }
    if (leftOsc.started && rightOsc.started) {
        fill(textColor);
        noStroke();
        let deltaFreq = rightFreq - leftFreq;
        text('Delta Frequency: ' + deltaFreq.toFixed(2) + ' Hz.', width / 2, 175);
    }
}

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
        // let y = map(spectrum[i], 0, 255, height, 0); // without 'db', peaks get squashed
        let y = map(spectrum[i], -63, -13, height, 0); // with 'db'
        vertex(x, y);
    }
    endShape();
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
