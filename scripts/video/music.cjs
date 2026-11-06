/**
 * Original ambient background music for the promo videos, synthesised from scratch (no samples,
 * no third-party recordings, so no licensing questions). Soft detuned pads, a bell-like arpeggio,
 * a warm sub bass and a stereo echo, with fade in/out.
 *
 * Usage: node scripts/video/music.cjs <variant 1-5> <out.wav> [seconds=30]
 */
const fs = require("fs");

const SR = 44100;
const variant = Number(process.argv[2] || 1);
const out = process.argv[3] || `music-${variant}.wav`;
const SECS = Number(process.argv[4] || 30);
const N = Math.floor(SR * SECS);

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
// Each variant: chord progression (MIDI notes), bars per chord, arpeggio pattern, mood.
const VARIANTS = {
  1: { chords: [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]], chordSecs: 3.75, arp: [0, 2, 3, 4, 3, 2], arpRate: 4, bright: 0.9 }, // D major, hopeful
  2: { chords: [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]], chordSecs: 3.75, arp: [0, 1, 2, 3, 4, 3], arpRate: 5, bright: 0.75 }, // A minor, curious
  3: { chords: [[48, 55, 60, 64, 71], [45, 52, 57, 60, 67], [41, 48, 53, 57, 64], [43, 50, 55, 62, 65]], chordSecs: 3.75, arp: [4, 3, 2, 3, 4, 2], arpRate: 4, bright: 1.0 }, // C maj7, warm & intelligent
  4: { chords: [[52, 59, 64, 68, 71], [49, 56, 61, 64, 68], [45, 52, 57, 61, 64], [47, 54, 59, 63, 66]], chordSecs: 3.75, arp: [0, 2, 4, 2, 3, 1], arpRate: 3, bright: 0.85 }, // E major, reflective
  5: { chords: [[53, 60, 65, 69, 72], [50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [48, 55, 60, 64, 67]], chordSecs: 3.75, arp: [0, 1, 2, 4, 2, 1], arpRate: 4, bright: 0.95 }, // F major, confident
};
const V = VARIANTS[variant] || VARIANTS[1];

const L = new Float32Array(N);
const R = new Float32Array(N);
let seed = 1234 + variant * 77;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// --- Pads: 3 detuned saw-ish voices per note, one-pole low-pass, slow swell per chord
for (let c = 0; c * V.chordSecs < SECS; c++) {
  const chord = V.chords[c % V.chords.length];
  const t0 = c * V.chordSecs;
  const len = V.chordSecs + 1.6; // overlap for legato
  const s0 = Math.floor(t0 * SR), s1 = Math.min(N, Math.floor((t0 + len) * SR));
  for (const note of chord) {
    for (const det of [-0.08, 0, 0.07]) {
      const f = midi(note + det);
      let ph = rnd(), lp = 0;
      const pan = 0.5 + det * 4;
      for (let i = s0; i < s1; i++) {
        const t = (i - s0) / SR;
        const env = Math.min(1, t / 1.4) * Math.min(1, (len - t) / 1.6);
        ph += f / SR; if (ph >= 1) ph -= 1;
        const saw = 2 * ph - 1;
        lp += (saw - lp) * (0.022 * V.bright); // soft low-pass
        const v = lp * env * 0.028;
        L[i] += v * (1 - pan * 0.6); R[i] += v * (0.4 + pan * 0.6);
      }
    }
  }
  // sub bass on the chord root
  const fb = midi(chord[0] - 12);
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const env = Math.min(1, t / 0.6) * Math.min(1, (len - t) / 1.6);
    const v = Math.sin(2 * Math.PI * fb * t) * env * 0.045;
    L[i] += v; R[i] += v;
  }
}

// --- Bell arpeggio: sine + inharmonic partial with exponential decay, alternating pan
const step = 60 / (64 * V.arpRate / 4) / 2; // ~eighth notes at ~64 bpm feel
let k = 0;
for (let t0 = 1.2; t0 < SECS - 2; t0 += step, k++) {
  const chord = V.chords[Math.floor(t0 / V.chordSecs) % V.chords.length];
  const note = chord[V.arp[k % V.arp.length] % chord.length] + 12;
  const f = midi(note);
  const s0 = Math.floor(t0 * SR), s1 = Math.min(N, s0 + Math.floor(2.2 * SR));
  const pan = k % 2 ? 0.25 : 0.75;
  const vel = 0.6 + 0.4 * rnd();
  for (let i = s0; i < s1; i++) {
    const t = (i - s0) / SR;
    const env = Math.exp(-t * 2.6) * Math.min(1, t / 0.004);
    const v = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6)) * env * 0.065 * vel;
    L[i] += v * (1 - pan); R[i] += v * pan;
  }
}

// --- Stereo echo (ping-pong) for space
const d = Math.floor(0.42 * SR);
for (let i = d; i < N; i++) { L[i] += R[i - d] * 0.32; R[i] += L[i - d] * 0.32; }

// --- Fades + normalise + soft clip
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 1.5) * Math.min(1, (SECS - t) / 2.5);
  L[i] *= g; R[i] *= g;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.85 / (peak || 1);

const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const l = Math.tanh(L[i] * norm * 1.1), r = Math.tanh(R[i] * norm * 1.1);
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
fs.writeFileSync(out, buf);
console.log(`wrote ${out} (${SECS}s, variant ${variant})`);
