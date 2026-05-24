import fs from 'fs';
import path from 'path';
import { encodeWavPcm16ToUint8Array } from './wav-encode-browser.mjs';

export function encodeWavPcm16ToBuffer(rendered) {
  const bytes = encodeWavPcm16ToUint8Array(rendered);
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

export const encodeWavPcm16 = encodeWavPcm16ToBuffer;

export function writeWavFile(filePath, rendered) {
  const wav = encodeWavPcm16ToBuffer(rendered);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, wav);

  return filePath;
}