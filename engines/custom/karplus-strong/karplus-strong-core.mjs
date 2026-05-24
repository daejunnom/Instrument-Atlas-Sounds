const DEFAULT_SAMPLE_RATE = 48000;
const DEFAULT_CHANNELS = 2;

const NOTE_OFFSETS = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createMulberry32(seed) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteNameToMidi(noteName) {
  if (typeof noteName !== 'string') {
    throw new TypeError('noteName must be a string.');
  }

  const match = noteName.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);

  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const [, rawNote, accidental, rawOctave] = match;
  const note = rawNote.toUpperCase();
  const octave = Number(rawOctave);

  let semitone = NOTE_OFFSETS[note];

  if (accidental === '#') {
    semitone += 1;
  } else if (accidental === 'b') {
    semitone -= 1;
  }

  return (octave + 1) * 12 + semitone;
}

export function resolveNoteFrequency(note = {}) {
  if (typeof note.frequencyHz === 'number' && note.frequencyHz > 0) {
    return note.frequencyHz;
  }

  if (typeof note.midi === 'number') {
    return midiToFrequency(note.midi);
  }

  if (typeof note.name === 'string') {
    return midiToFrequency(noteNameToMidi(note.name));
  }

  throw new Error('Note must include frequencyHz, midi, or name.');
}

export function renderKarplusStrongNote(options = {}) {
  const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
  const channels = options.channels ?? DEFAULT_CHANNELS;
  const frequencyHz = options.frequencyHz;
  const durationMs = options.durationMs ?? 1200;
  const velocity = clamp(options.velocity ?? 0.75, 0, 1);
  const damping = clamp(options.damping ?? 0.35, 0, 1);
  const brightness = clamp(options.brightness ?? 0.65, 0, 1);
  const seed = options.seed ?? hashStringToSeed(`${frequencyHz}:${durationMs}:${velocity}:${damping}:${brightness}`);

  if (typeof frequencyHz !== 'number' || frequencyHz <= 0) {
    throw new Error('frequencyHz must be a positive number.');
  }

  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error('sampleRate must be a positive integer.');
  }

  if (!Number.isInteger(channels) || channels < 1 || channels > 2) {
    throw new Error('channels must be 1 or 2.');
  }

  if (typeof durationMs !== 'number' || durationMs <= 0) {
    throw new Error('durationMs must be a positive number.');
  }

  const frameCount = Math.max(1, Math.round((durationMs / 1000) * sampleRate));
  const delayLength = Math.max(2, Math.round(sampleRate / frequencyHz));
  const delayLine = new Float32Array(delayLength);
  const output = Array.from({ length: channels }, () => new Float32Array(frameCount));

  const random = createMulberry32(seed);

  let previousExcitation = 0;

  for (let index = 0; index < delayLength; index += 1) {
    const white = random() * 2 - 1;
    const smoothed = previousExcitation * 0.65 + white * 0.35;
    const excitation = brightness * white + (1 - brightness) * smoothed;

    delayLine[index] = excitation * velocity;
    previousExcitation = excitation;
  }

  const feedback = clamp(0.998 - damping * 0.12, 0.82, 0.998);
  const toneBlend = clamp(0.25 + damping * 0.65, 0.25, 0.9);
  const attackFrames = Math.max(1, Math.round(sampleRate * 0.003));
  const releaseFrames = Math.max(1, Math.round(sampleRate * 0.02));

  let readIndex = 0;
  let filterState = 0;
  let peak = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const nextIndex = (readIndex + 1) % delayLength;

    const current = delayLine[readIndex];
    const next = delayLine[nextIndex];

    const averaged = (current + next) * 0.5;
    filterState = toneBlend * filterState + (1 - toneBlend) * averaged;

    const newValue = filterState * feedback;
    delayLine[readIndex] = newValue;

    let sample = current;

    if (frame < attackFrames) {
      sample *= frame / attackFrames;
    }

    if (frame > frameCount - releaseFrames) {
      const remaining = frameCount - frame;
      sample *= clamp(remaining / releaseFrames, 0, 1);
    }

    peak = Math.max(peak, Math.abs(sample));

    output[0][frame] = sample;

    if (channels === 2) {
      output[1][frame] = sample;
    }

    readIndex = nextIndex;
  }

  if (peak > 0.98) {
    const gain = 0.98 / peak;

    for (const channel of output) {
      for (let frame = 0; frame < frameCount; frame += 1) {
        channel[frame] *= gain;
      }
    }
  }

  return {
    sampleRate,
    channels,
    frameCount,
    durationMs,
    samples: output,
    metadata: {
      engineType: 'karplus_strong',
      frequencyHz,
      delayLength,
      damping,
      brightness,
      velocity,
      seed
    }
  };
}

export function renderKarplusStrongFromRequest(request = {}) {
  const frequencyHz = resolveNoteFrequency(request.note);
  const render = request.render ?? {};
  const parameters = request.parameters ?? {};

  return renderKarplusStrongNote({
    frequencyHz,
    durationMs: request.durationMs,
    velocity: request.velocity,
    sampleRate: render.sampleRate ?? DEFAULT_SAMPLE_RATE,
    channels: render.channels ?? DEFAULT_CHANNELS,
    damping: parameters.damping ?? 0.35,
    brightness: parameters.brightness ?? 0.65,
    seed: parameters.seed
  });
}