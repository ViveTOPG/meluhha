// Ambient score, synthesised live: moving water (filtered brown noise), a low drone
// that shifts with each chapter, and a soft chime when a new moment arrives. No audio files.
window.MeluhhaSound = (() => {
  let ctx, master, waterF, waterG, droneG, drones = [], on = false, analyser;
  const CHORDS = { // root frequencies per chapter mood
    'The Water': [55, 82.4, 110], 'The Crossing': [49, 73.4, 98], 'The Cities': [58.3, 87.3, 116.5],
    'Through Time': [41.2, 61.7, 82.4], 'The Body Remembers': [65.4, 98, 130.8], 'The Vessel': [55, 82.4, 123.5],
    'The Ritual': [61.7, 92.5, 123.5], 'Skin, Scent, Memory': [49, 73.4, 110], 'The Collection': [55, 82.4, 110],
  };

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    analyser = ctx.createAnalyser(); analyser.fftSize = 64;
    master.connect(analyser); analyser.connect(ctx.destination);

    // water: brown noise -> bandpass with slow wandering frequency
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2; } }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    waterF = ctx.createBiquadFilter(); waterF.type = 'lowpass'; waterF.frequency.value = 520; waterF.Q.value = .6;
    waterG = ctx.createGain(); waterG.gain.value = .55;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .07; lfoG.gain.value = 180;
    lfo.connect(lfoG); lfoG.connect(waterF.frequency); lfo.start();
    src.connect(waterF); waterF.connect(waterG); waterG.connect(master); src.start();

    // drone: three soft detuned sines through a lowpass
    droneG = ctx.createGain(); droneG.gain.value = .09;
    const df = ctx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 900;
    droneG.connect(df); df.connect(master);
    CHORDS['The Water'].forEach((f, i) => { const o = ctx.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1) * 6;
      const g = ctx.createGain(); g.gain.value = i ? .5 : .8; o.connect(g); g.connect(droneG); o.start(); drones.push(o); });
  }

  function chime(freq = 660) {
    if (!on) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), o2 = ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = freq; o2.type = 'sine'; o2.frequency.value = freq * 2.76;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 3.2);
    o.connect(g); o2.connect(g); g.connect(master); o.start(t); o2.start(t); o.stop(t + 3.3); o2.stop(t + 3.3);
  }

  return {
    get on() { return on; },
    start() { if (!ctx) build(); ctx.resume(); on = true; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(.5, ctx.currentTime, 1.2); },
    stop() { if (!ctx) return; on = false; master.gain.setTargetAtTime(0, ctx.currentTime, .4); },
    toggle() { on ? this.stop() : this.start(); return on; },
    mood(name) { if (!ctx) return; const c = CHORDS[name]; if (!c) return;
      drones.forEach((o, i) => o.frequency.setTargetAtTime(c[i], ctx.currentTime, 1.8));
      waterF.frequency.setTargetAtTime(name === 'Through Time' ? 340 : name === 'The Cities' ? 700 : 520, ctx.currentTime, 2); },
    chime,
    level() { if (!analyser) return new Uint8Array(32); const a = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(a); return a; },
  };
})();
