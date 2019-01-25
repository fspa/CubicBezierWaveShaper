const audioCtx = new AudioContext();
function testTone(curve = new Float32Array([-1, 0, 1])) {
    let osc = audioCtx.createOscillator();
    let waveShaper = audioCtx.createWaveShaper();
    waveShaper.curve = curve;
    let gain1 = audioCtx.createGain();
    let gain2 = audioCtx.createGain();

    let ct = audioCtx.currentTime;
    gain1.gain.setValueAtTime(0,ct)
        .setTargetAtTime(1,ct    ,0.03)
        .setTargetAtTime(0,ct+0.4,0.15)

    osc.connect(gain1).connect(waveShaper).connect(gain2).connect(audioCtx.destination);
    osc.start(ct);
    osc.stop(ct + 1.5);
}

// document.addEventListener("click",_=>testTone(curve));