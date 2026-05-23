import fs from 'fs';
import path from 'path';
import {
  renderKarplusStrongFromRequest,
  encodeWavPcm16
} from '../engines/custom/karplus-strong/karplus-strong.mjs';

const rootDir = process.cwd();

const inputPath = path.join(rootDir, 'examples', 'render-request.json');
const outputDir = path.join(rootDir, '_local', 'renders');

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function sanitizeFilePart(value) {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function main() {
  const request = readJson(inputPath);

  if (request.sourceId !== 'src_custom_karplus_strong_pluck') {
    throw new Error(
      `This example only supports sourceId "src_custom_karplus_strong_pluck". Received: ${request.sourceId}`
    );
  }

  const rendered = renderKarplusStrongFromRequest(request);
  const wav = encodeWavPcm16(rendered);

  const noteName = request.note?.name ?? request.note?.midi ?? 'note';
  const fileName = `${sanitizeFilePart(request.sourceId)}_${sanitizeFilePart(noteName)}.wav`;
  const outputPath = path.join(outputDir, fileName);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, wav);

  console.log('Karplus-Strong render OK');
  console.log(`Output: ${path.relative(rootDir, outputPath).replaceAll(path.sep, '/')}`);
  console.log(`Sample rate: ${rendered.sampleRate}`);
  console.log(`Channels: ${rendered.channels}`);
  console.log(`Duration: ${rendered.durationMs} ms`);
  console.log(`Frequency: ${rendered.metadata.frequencyHz.toFixed(3)} Hz`);
  console.log(`Delay length: ${rendered.metadata.delayLength}`);
}

main();