function drawRectangle(x, y, w, h, fillColor = 'none', strokeColor = 'none') {
    if (fillColor == 'none') {
        noFill();
    } else {
        fill(fillColor);
    }
    if (strokeColor == 'none') {
        noStroke();
    } else {
        stroke(strokeColor);
    }
    rect(x, y, w, h);
}

function displayText(textContent, x, y) {
    fill(textColor);
    noStroke();
    text(textContent, x, y);
}

function drawVuMeter() {
    strokeWeight(4);
    // rectMode(CORNER); // not needed because this is the default (left, upper, width, height)

    let leftFreq = undefined;
    let rightFreq = undefined;

    // Draw outline rectangles
    drawRectangle(25, 25, width - 50, 50, 'none', leftColor);
    drawRectangle(25, 100, width - 50, 50, 'none', rightColor);

    textAlign(CENTER, BOTTOM);
    textSize(18);

    if (leftOsc.started) {
        let amplL = wavLa.waveform();
        // NOTE: Need to pass a string to wavLf.waveform() otherwise clips to [-1,1]
        let freqL = wavLf.waveform('float');
        // NOTE: Total amplitude (volume + AM depth) can be greater than 1,
        // resulting in clipping and distortion of the tone.
        // However, we clamp the VU Meter to a maximum of 1.
        let leftMax = Math.abs(leftOsc.getAmp() + amplL[0]);
        let leftAmpl = Math.min(leftMax, 1);
        leftFreq = leftOsc.getFreq() + freqL[0];

        // Fill left rectangle
        drawRectangle(25, 25, leftAmpl * (width - 50), 50, leftColor, 'none');
        if (leftMax > 1) {
            stroke('red');
            line(width - 25, 25, width - 25, 75);
        }
        displayText(`Left Frequency: ${leftFreq.toFixed(2)} Hz.`, width / 6, 185);
    }

    if (rightOsc.started) {
        let amplR = wavRa.waveform();
        let freqR = wavRf.waveform('float');
        let rightMax = Math.abs(rightOsc.getAmp() + amplR[0]);
        let rightAmpl = Math.min(rightMax, 1);
        rightFreq = rightOsc.getFreq() + freqR[0];

        // Fill right rectangle
        drawRectangle(25, 100, rightAmpl * (width - 50), 50, rightColor, 'none');
        if (rightMax > 1) {
            stroke('red');
            line(width - 25, 100, width - 25, 150);
        }
        displayText(`Right Frequency: ${rightFreq.toFixed(2)} Hz.`, 5 * width / 6, 185);
    }

    if (leftOsc.started && rightOsc.started) {
        fill(textColor);
        noStroke();
        let deltaFreq = rightFreq - leftFreq;
        text('Delta Frequency: ' + deltaFreq.toFixed(2) + ' Hz.', width / 2, 185);
    }
}