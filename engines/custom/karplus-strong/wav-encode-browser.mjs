function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function validateRenderedAudio(rendered) {
  if (!rendered || typeof rendered !== 'object') {
    throw new TypeError('rendered must be an object.');
  }

  const { sampleRate, channels, frameCount, samples } = rendered;

  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error('rendered.sampleRate must be a positive integer.');
  }

  if (!Number.isInteger(channels) || channels < 1 || channels > 2) {
    throw new Error('rendered.channels must be 1 or 2.');
  }

  if (!Number.isInteger(frameCount) || frameCount <= 0) {
    throw new Error('rendered.frameCount must be a positive integer.');
  }

  if (!Array.isArray(samples) || samples.length !== channels) {
    throw new Error('rendered.samples must contain one Float32Array per channel.');
  }

  for (let channel = 0; channel < channels; channel += 1) {
    if (!(samples[channel] instanceof Float32Array)) {
      throw new Error(`rendered.samples[${channel}] must be a Float32Array.`);
    }

    if (samples[channel].length < frameCount) {
      throw new Error(`rendered.samples[${channel}] is shorter than rendered.frameCount.`);
    }
  }
}

export function encodeWavPcm16ToArrayBuffer(rendered) {
  validateRenderedAudio(rendered);

  const { sampleRate, channels, frameCount, samples } = rendered;

  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  let offset = 0;

  function writeAscii(value) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset, value.charCodeAt(index));
      offset += 1;
    }
  }

  function writeUint16(value) {
    view.setUint16(offset, value, true);
    offset += 2;
  }

  function writeUint32(value) {
    view.setUint32(offset, value, true);
    offset += 4;
  }

  writeAscii('RIFF');
  writeUint32(36 + dataSize);
  writeAscii('WAVE');

  writeAscii('fmt ');
  writeUint32(16);
  writeUint16(1);
  writeUint16(channels);
  writeUint32(sampleRate);
  writeUint32(byteRate);
  writeUint16(blockAlign);
  writeUint16(16);

  writeAscii('data');
  writeUint32(dataSize);

  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = clamp(samples[channel][frame], -1, 1);
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

      view.setInt16(offset, Math.round(int16), true);
      offset += 2;
    }
  }

  return buffer;
}

export function encodeWavPcm16ToUint8Array(rendered) {
  return new Uint8Array(encodeWavPcm16ToArrayBuffer(rendered));
}