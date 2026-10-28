/* ===========================================================
   FloodAI — Acoustic Synthesizer Siren Engine
   Web Audio API Multi-Voice Tone Generator & Civil Defense Siren
   =========================================================== */

const AlertSound = (() => {
  let ctx = null;
  let master = null;
  let voices = [];
  let timers = [];
  let current = null;
  let autoStop = null;

  // Read persisted sound state safely
  let enabled = true;
  try {
    enabled = (typeof localStorage !== 'undefined') ? localStorage.getItem('floodai-sound') !== 'off' : true;
  } catch (_) {}

  let volume = 0.8;
  try {
    const savedVol = typeof localStorage !== 'undefined' ? localStorage.getItem('floodai-volume') : null;
    const parsed = parseFloat(savedVol);
    if (!isNaN(parsed) && parsed >= 0.05) {
      volume = parsed;
    }
  } catch (_) {}

  const listeners = [];

  const ALIAS_MAP = {
    green: 'green',
    chime: 'green',
    notice: 'green',
    yellow: 'yellow',
    advisory: 'yellow',
    moderate: 'yellow',
    orange: 'orange',
    warning: 'orange',
    severe: 'orange',
    red: 'red',
    siren: 'red',
    critical: 'red',
    sos: 'red'
  };

  /**
   * Initializes or resumes the AudioContext safely upon user interaction
   */
  async function ensure() {
    try {
      if (typeof window === 'undefined') return false;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;

      if (!ctx || ctx.state === 'closed') {
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
      }

      // Ensure volume is finite and audible
      if (isNaN(volume) || volume <= 0.05) {
        volume = 0.8;
        try { localStorage.setItem('floodai-volume', '0.8'); } catch (_) {}
      }

      if (master) {
        master.gain.setValueAtTime(volume, ctx.currentTime);
      }

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      return true;
    } catch (err) {
      console.warn('[AlertSound:ensure] Web Audio init notice:', err);
      return false;
    }
  }

  // Preemptively unlock audio on first document interaction
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const unlocker = () => {
      ensure().catch(() => {});
    };
    window.addEventListener('click', unlocker, { once: true, passive: true });
    window.addEventListener('keydown', unlocker, { once: true, passive: true });
    window.addEventListener('touchstart', unlocker, { once: true, passive: true });
  }

  function notify() {
    listeners.forEach(f => {
      try { f(current); } catch (_) {}
    });
  }

  /**
   * Pure tone oscillator with non-clipping linear ramp envelopes
   */
  function osc(type, freq, t0, dur, gain, filterHz) {
    if (!ctx) return null;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);

      // Smooth chronological attack and decay
      const attack = Math.min(0.03, dur * 0.25);
      const release = Math.min(0.06, dur * 0.35);
      const sustainEnd = Math.max(t0 + attack, t0 + dur - release);

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + attack);
      g.gain.setValueAtTime(gain, sustainEnd);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);

      let node = o;
      if (filterHz) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(filterHz, t0);
        o.connect(f);
        node = f;
      }
      node.connect(g);
      g.connect(master);

      o.start(t0);
      o.stop(t0 + dur + 0.05);
      voices.push(o);
      return o;
    } catch (err) {
      console.warn('[AlertSound:osc] Warning:', err);
      return null;
    }
  }

  /**
   * Stops all active voices, loops, and timers
   */
  function stop() {
    timers.forEach(t => clearInterval(t));
    timers = [];
    if (autoStop) {
      clearTimeout(autoStop);
      autoStop = null;
    }
    voices.forEach(o => {
      try {
        if (typeof o.stop === 'function') o.stop();
        if (typeof o.disconnect === 'function') o.disconnect();
      } catch (_) {}
    });
    voices = [];
    if (current) {
      current = null;
      notify();
    }
  }

  /**
   * 1. Green Chime — Gentle advisory dual-tone chime (F5 -> A5)
   */
  function chime() {
    if (!ctx) return 1400;
    const t = ctx.currentTime + 0.03;
    osc('sine', 698.46, t, 0.42, 0.40);       // F5
    osc('sine', 880.00, t + 0.24, 0.68, 0.45); // A5
    return 1400;
  }

  /**
   * 2. Yellow Advisory — Two crisp attention alert beeps (740Hz)
   */
  function advisory() {
    if (!ctx) return 1200;
    const t = ctx.currentTime + 0.03;
    [0, 0.32].forEach(d => {
      osc('sine', 740, t + d, 0.20, 0.38);
      osc('triangle', 370, t + d, 0.20, 0.22);
    });
    return 1200;
  }

  /**
   * 3. Orange Warning — Triple pulsed cycling alarm (920Hz)
   */
  function warning() {
    if (!ctx) return 7000;
    const burst = () => {
      if (!ctx) return;
      const t = ctx.currentTime + 0.03;
      [0, 0.24, 0.48].forEach(d => {
        osc('sawtooth', 920, t + d, 0.15, 0.32, 2800);
        osc('sine', 460, t + d, 0.15, 0.20);
      });
    };
    burst();
    timers.push(setInterval(burst, 1300));
    return 7000;
  }

  /**
   * 4. Red Civil Defense Emergency Siren
   * Continuous wailing municipal siren using hardware-modulated Low-Frequency Oscillator (LFO)
   * Sweeps smoothly between 420Hz and 1240Hz every 2.8 seconds with sub-harmonic body resonance.
   */
  function siren() {
    if (!ctx) return 30000;
    const now = ctx.currentTime + 0.03;

    // Siren sub-master gain for smooth fade-in
    const sirenGain = ctx.createGain();
    sirenGain.gain.setValueAtTime(0.001, now);
    sirenGain.gain.linearRampToValueAtTime(0.42, now + 0.3);

    // Warm lowpass filter to remove piercing digital clipping
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);

    // 1. Primary Wailing Carrier Oscillator
    const carrier = ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(800, now);

    // 2. Continuous Wailing LFO (Low-Frequency Oscillator)
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle'; // Smooth linear rise and fall
    lfo.frequency.setValueAtTime(0.36, now); // ~2.8s per wailing cycle

    // LFO Modulation Depth: sweeps carrier frequency by ±420Hz (380Hz to 1220Hz)
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(420, now);

    lfo.connect(lfoGain);
    lfoGain.connect(carrier.frequency);

    // 3. Sub-harmonic Body Tone (adds deep resonance of outdoor municipal siren horns)
    const sub = ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(400, now);

    const subLfoGain = ctx.createGain();
    subLfoGain.gain.setValueAtTime(210, now);
    lfo.connect(subLfoGain);
    subLfoGain.connect(sub.frequency);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.24, now);

    // Connect node graph
    carrier.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);

    filter.connect(sirenGain);
    sirenGain.connect(master);

    // Start all nodes
    carrier.start(now);
    sub.start(now);
    lfo.start(now);

    voices.push(carrier, sub, lfo, sirenGain);

    return 30000;
  }

  /**
   * Standalone Data-URI Synthetic WAV Audio fallback in case Web Audio API hardware fails
   */
  function playDataUriFallback(normKey) {
    try {
      const sampleRate = 8000;
      const duration = normKey === 'red' ? 1.6 : 0.45;
      const numSamples = Math.floor(sampleRate * duration);
      const header = new Uint8Array(44 + numSamples);
      const view = new DataView(header.buffer);

      view.setUint32(0, 0x52494646, false); // 'RIFF'
      view.setUint32(4, 36 + numSamples, true);
      view.setUint32(8, 0x57415645, false); // 'WAVE'
      view.setUint32(12, 0x666d7420, false); // 'fmt '
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate, true);
      view.setUint16(32, 1, true);
      view.setUint16(34, 8, true);
      view.setUint32(36, 0x64617461, false); // 'data'
      view.setUint32(40, numSamples, true);

      const baseFreq = normKey === 'red' ? 880 : (normKey === 'orange' ? 740 : 660);
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const f = normKey === 'red' ? (550 + Math.sin(t * 7) * 350) : baseFreq;
        const s = Math.sin(2 * Math.PI * f * t);
        header[44 + i] = Math.floor((s + 1) * 127.5);
      }

      let bin = '';
      const bArr = new Uint8Array(header.buffer);
      for (let i = 0; i < bArr.byteLength; i++) {
        bin += String.fromCharCode(bArr[i]);
      }
      const audio = new Audio('data:audio/wav;base64,' + btoa(bin));
      audio.volume = Math.max(0.3, volume);
      audio.play().catch(() => {});
    } catch (_) {}
  }

  /**
   * Main dispatch function to play an alert or siren tone
   */
  async function play(level, opts = {}) {
    const normKey = ALIAS_MAP[level] || level || 'red';

    // If sound is disabled, only force bypasses it
    if (!enabled && !opts.force) return false;

    // Ensure audio hardware is ready and active
    const ready = await ensure();
    if (!ready) {
      playDataUriFallback(normKey);
      return false;
    }

    // Stop previous voice sequence cleanly
    stop();

    current = normKey;
    notify();

    let ms = 2000;
    if (normKey === 'green') ms = chime();
    else if (normKey === 'yellow') ms = advisory();
    else if (normKey === 'orange') ms = warning();
    else if (normKey === 'red') ms = siren();
    else ms = chime();

    if (opts.maxMs) ms = Math.min(ms, opts.maxMs);
    autoStop = setTimeout(() => {
      stop();
    }, ms + 150);

    return true;
  }

  return {
    play,
    stop,
    playAlertSound(level) {
      const norm = ALIAS_MAP[level] || level || 'red';
      return play(norm, { force: true });
    },
    get playing() { return current; },
    get enabled() { return enabled; },
    get volume() { return volume; },
    setEnabled(v) {
      enabled = !!v;
      try { localStorage.setItem('floodai-sound', enabled ? 'on' : 'off'); } catch (_) {}
      if (!enabled) stop();
    },
    setVolume(v) {
      volume = Math.max(0.05, Math.min(1, Number(v) || 0.8));
      try { localStorage.setItem('floodai-volume', String(volume)); } catch (_) {}
      if (master && ctx) {
        master.gain.setValueAtTime(volume, ctx.currentTime);
      }
    },
    onChange(f) {
      if (typeof f === 'function') listeners.push(f);
    }
  };
})();

if (typeof window !== 'undefined') {
  window.AlertSound = AlertSound;
  window.audioService = AlertSound;
}
