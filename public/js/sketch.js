// the connection between electron and the sound generation capabilities
// of the p5 library. it initializes all the necessary oscillators, as well
// as drawing the waveforms in the signal monitor.
let fftL;
let fftR;
let fftLa;
let fftRa;
let fftLf;
let fftRf;

function getModulationOscillator() {
    const newOscillator = new p5.Oscillator('sine');
    newOscillator.disconnect();
    newOscillator.start();
    return newOscillator;
}

// Initialize sine wave oscillators
const leftOsc = new p5.Oscillator('sine');
const rightOsc = new p5.Oscillator('sine');

// Assign left oscillator to left channel and right oscillator to right channel
leftOsc.pan(-1);
rightOsc.pan(1);

// Initialize oscillators used for Amplitude Modulation
const modL = getModulationOscillator();
const modR = getModulationOscillator();

// Initialize oscillators used for Frequency Modulation
const fModL = getModulationOscillator();
const fModR = getModulationOscillator();

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