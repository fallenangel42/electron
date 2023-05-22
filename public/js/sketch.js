// the connection between electron and the sound generation capabilities
// of the p5 library. it initializes all the necessary oscillators, as well
// as drawing the waveforms in the signal monitor.
let fftL;
let fftR;

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


function setup() {
    const canvas = createCanvas(500, 200);
    canvas.parent('sketch-holder');
    noFill();
    background(30); // alpha

    fftL = new p5.FFT(0.9, 128);
    fftL.setInput(leftOsc);
    fftR = new p5.FFT(0.9, 128);
    fftR.setInput(rightOsc);
}

function draw() {
    background(30, 30, 30, 100);
    waveformL = fftL.waveform();
    waveformR = fftR.waveform();
    drawWaveform(waveformL, waveformR);
}

function drawWaveform(waveformL, waveformR) {
    stroke(3, 169, 244);
    strokeWeight(4);

    // left channel
    beginShape();
    for (let iL = 0; iL < waveformL.length; iL++) {
        const xL = map(iL, 0, waveformL.length, 0, width);
        const yL = map(waveformL[iL], -1, 1, -height / 2, height / 2);
        vertex(xL, yL + height / 2);
    }
    endShape();

    // right channel
    stroke(139, 195, 74);
    beginShape();
    for (let iR = 0; iR < waveformR.length; iR++) {
        const xR = map(iR, 0, waveformR.length, 0, width);
        const yR = map(waveformR[iR], -1, 1, -height / 2, height / 2);
        vertex(xR, yR + height / 2);
    }
    endShape();
}