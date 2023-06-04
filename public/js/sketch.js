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

    const smoothing = 0.9;
    // Large FFT buffer used for main oscillators
    // https://p5js.org/reference/#/p5.FFT says max bins is 1024, but actually can go up to 16384
    const oscBins = 16384;
    // Small FFT buffer used to check if main oscillators are started,
    // and to sample AM and FM oscillators
    const modBins = 16;

    fftL  = new p5.FFT(undefined, oscBins);
    fftR  = new p5.FFT(undefined, oscBins);
    fftLa = new p5.FFT(undefined, modBins); // smoothing not used so set to undefined
    fftRa = new p5.FFT(undefined, modBins);
    fftLf = new p5.FFT(undefined, modBins);
    fftRf = new p5.FFT(undefined, modBins);

    fftL.setInput(leftOsc);
    fftR.setInput(rightOsc);
    fftLa.setInput(modL);
    fftRa.setInput(modR);
    fftLf.setInput(fModL);
    fftRf.setInput(fModR);
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
    console.log(visualization);
    if (visualization == "Lissajous") {
        console.log("Eureka!");
    }
}

function draw() {
    background(30, 30, 30, 100);
    waveformL = fftL.waveform();
    waveformR = fftR.waveform();

    if (visualization == "Waveform") {
        stroke(3, 169, 244);
        strokeWeight(4);
        noFill();

        const plotLength = 512; // Don't plot entire buffer because you will lose detail
        // left channel
        beginShape();
        for (let iL = 0; iL < plotLength; iL++) {
            const xL = map(iL, 0, plotLength, 0, width);
            const yL = map(waveformL[iL], -1, 1, 0, height);
            vertex(xL, yL);
        }
        endShape();

        // right channel
        stroke(139, 195, 74);
        beginShape();
        for (let iR = 0; iR < plotLength; iR++) {
            const xR = map(iR, 0, plotLength, 0, width);
            const yR = map(waveformR[iR], -1, 1, 0, height);
            vertex(xR, yR);
        }
        endShape();
    } else if (visualization == "VU Meter") {
        strokeWeight(4);
        // rectMode(CORNER); // not needed because this is the default (left, upper, width, height)

        let leftFreq = 0;
        let rightFreq = 0;

        // Outline left rectangle
        stroke(3, 169, 244);
        noFill();
        rect(25, 25, width - 50, 50);

        // Outline right rectangle
        stroke(139, 195, 74);
        noFill();
        rect(25, 100, width - 50, 50);

        if (leftOsc.started) {
            let amplL = fftLa.waveform();
            let freqL = fftLf.waveform();
            let leftAmpl = leftOsc.getAmp() + amplL[0];
            leftFreq = leftOsc.getFreq() + freqL[0];

            // Fill left rectangle
            fill(3, 169, 244);
            noStroke();

            text('Left Frequency: ' + leftFreq.toFixed(2) + ' Hz.', 25, 175);
            rect(25, 25, Math.abs(leftAmpl) * (width - 50), 50);
        }
        if (rightOsc.started) {
            let amplR = fftRa.waveform();
            let freqR = fftRf.waveform();
            let rightAmpl = rightOsc.getAmp() + amplR[0];
            rightFreq = rightOsc.getFreq() + freqR[0];

            // Fill right rectangle
            fill(139, 195, 74);
            noStroke();

            text('Right Frequency: ' + rightFreq.toFixed(2) + ' Hz.', 740, 175);
            rect(25, 100, Math.abs(rightAmpl) * (width - 50), 50);
        }
        if (leftOsc.started && rightOsc.started) {
            fill(255, 255, 255);
            noStroke();
            let deltaFreq = rightFreq - leftFreq;
            text('Delta Frequency: ' + deltaFreq.toFixed(2) + ' Hz.', 400, 175);
        }

    } else if (visualization == "Spectrum") {
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
            span = 100;
        } else if (deltaFreq < 100) {
            span = 200;
        } else if (deltaFreq < 200) {
            span = 500;
        } else if (deltaFreq < 500) {
            span = 1000;
        }

        let startFreq = centerFreq - span / 2;
        let stopFreq = centerFreq + span / 2;

        strokeWeight(4);

        // left channel
        stroke(3, 169, 244);
        drawChannel(fftL, startFreq, stopFreq);

        // right channel
        stroke(139, 195, 74);
        drawChannel(fftR, startFreq, stopFreq);

        if (leftOsc.started || rightOsc.started) {
            // text labels for center frequency and frequency span
            fill(255, 255, 255);
            noStroke();
            text('Center: ' + centerFreq.toFixed(2) + ' Hz.', 25, 25);
            text('Span: ' + span.toFixed(2) + ' Hz.', 25, 40);
            noFill();
        }
    } else if (visualization == "Lissajous") {
        strokeWeight(4);

        // horizontal line for left channel along x axis
        stroke(3, 169, 244);
        beginShape();
        vertex((width - height) / 2, height / 2);
        vertex((width + height) / 2, height / 2);
        endShape();
        
        // vertical line for right channel along y axis
        stroke(139, 195, 74);
        beginShape();
        vertex(width / 2, 0);
        vertex(width / 2, height);
        endShape();

        // Lissajous
        const plotLength = 512; // Don't plot entire buffer because you will lose detail
        stroke(200, 200, 200);
        beginShape();
        for (let iLR = 0; iLR < plotLength; iLR++) {
            const xLR = map(waveformL[iLR], -1, 1, (width - height) / 2, (width + height) / 2);
            const yLR = map(waveformR[iLR], -1, 1, 0, height);
            vertex(xLR, yLR);
        }
        endShape();
    }
}

function drawChannel(fft, startFreq, stopFreq) {
    let spectrum = fft.analyze();
    let binWidth = sampleRate() / (2 * spectrum.length);
    let iStart = Math.floor(startFreq / binWidth);
    let iStop = Math.ceil(stopFreq / binWidth);

    beginShape();
    for (let i = iStart; i <= iStop; i++) {
        let x = map(i * binWidth, startFreq, stopFreq, 0, width);
        let y = map(spectrum[i], 0, 255, height, 0);
        vertex(x, y);
    }
    endShape();
}
