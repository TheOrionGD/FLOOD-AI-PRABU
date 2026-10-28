/* ===========================================================
   FloodAI — Acoustic Synthesizer Siren Engine
   Web Audio API Multi-Voice Tone Generator
   =========================================================== */

const AlertSound = (() => {
  let ctx = null, master = null, voices = [], timers = [], current = null, autoStop = null;
  let enabled = (typeof localStorage !== 'undefined') ? localStorage.getItem('floodai-sound') !== 'off' : true;
  let volume = parseFloat((typeof localStorage !== 'undefined' ? localStorage.getItem('floodai-volume') : '0.7') || '0.7');
  const listeners = [];

  function ensure() {
    if (!ctx) {
      if (typeof window === 'undefined') return false;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    master.gain.value = volume;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function notify() { listeners.forEach(f => f(current)); }

  function osc(type, freq, t0, dur, gain, filterHz) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.setValueAtTime(gain, t0 + dur - 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o;
    if (filterHz) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterHz;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
    voices.push(o);
    return o;
  }

  function stop() {
    timers.forEach(clearInterval);
    timers = [];
    clearTimeout(autoStop);
    voices.forEach(o => { try { o.stop(); } catch (e) {} });
    voices = [];
    if (current) { current = null; notify(); }
  }

  function chime() {
    const t = ctx.currentTime + 0.05;
    osc('sine', 660, t, 0.45, 0.35);
    osc('sine', 880, t + 0.3, 0.6, 0.35);
    return 1400;
  }

  function advisory() {
    const t = ctx.currentTime + 0.05;
    [0, 0.4].forEach(d => osc('square', 720, t + d, 0.22, 0.22, 2500));
    return 1000;
  }

  function warning() {
    const burst = () => {
      const t = ctx.currentTime + 0.05;
      [0, 0.28, 0.56].forEach(d => osc('square', 920, t + d, 0.18, 0.28, 3000));
    };
    burst();
    timers.push(setInterval(burst, 1500));
    return 7000;
  }

  function siren() {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    f.type = 'lowpass';
    f.frequency.value = 2600;
    g.gain.value = 0.32;
    o.connect(f);
    f.connect(g);
    g.connect(master);
    o.start();
    voices.push(o);
    const sweep = () => {
      const t = ctx.currentTime;
      o.frequency.cancelScheduledValues(t);
      for (let i = 0; i < 3; i++) {
        const b = t + i * 1.6;
        o.frequency.setValueAtTime(650, b);
        o.frequency.exponentialRampToValueAtTime(1350, b + 0.8);
        o.frequency.exponentialRampToValueAtTime(650, b + 1.6);
      }
    };
    sweep();
    timers.push(setInterval(sweep, 4800));
    return 30000;
  }

  const PROFILES = { green: chime, yellow: advisory, orange: warning, red: siren };

  function play(level, opts = {}) {
    if (!enabled && !opts.force) return false;
    if (!ensure()) { toast('Audio is not supported in this browser'); return false; }
    stop();
    current = level;
    notify();
    let ms = PROFILES[level] ? PROFILES[level]() : chime();
    if (opts.maxMs) ms = Math.min(ms, opts.maxMs);
    autoStop = setTimeout(stop, ms + 100);
    return true;
  }

  return {
    play, stop,
    playAlertSound(level) {
      const map = {
        critical: 'red',
        severe: 'orange',
        moderate: 'yellow',
        advisory: 'yellow',
        chime: 'green',
        notice: 'green',
        siren: 'red'
      };
      const key = map[level] || level || 'red';
      return play(key, { force: true });
    },
    get playing() { return current; },
    get enabled() { return enabled; },
    get volume() { return volume; },
    setEnabled(v) { enabled = !!v; localStorage.setItem('floodai-sound', enabled ? 'on' : 'off'); if (!enabled) stop(); },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); localStorage.setItem('floodai-volume', String(volume)); if (master) master.gain.value = volume; },
    onChange(f) { listeners.push(f); }
  };
})();

if (typeof window !== 'undefined') {
  window.AlertSound = AlertSound;
  window.audioService = AlertSound;
}

