import fs from 'fs';
import path from 'path';
import { resolveSoundSource } from '../src/resolve/resolve-sound-source.mjs';

const rootDir = process.cwd();

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function toRelative(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
}

function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(rootDir, 'examples', 'resolve-request.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing resolve request file: ${toRelative(inputPath)}`);
  }

  const request = readJson(inputPath);
  const result = resolveSoundSource(request);

  console.log('Resolve OK');
  console.log(`Request: ${toRelative(inputPath)}`);
  console.log(`Instrument: ${result.request.instrumentId}`);
  console.log(`Execution target: ${result.request.executionTarget ?? 'not specified'}`);
  console.log(`Policy: ${result.request.policyId}`);
  console.log(`Accepted candidates: ${result.counts.accepted}`);
  console.log(`Rejected candidates: ${result.counts.rejected}`);

  if (!result.selectedSource) {
    console.log('');
    console.log('No compatible sound source selected.');

    if (result.rejectedSources.length > 0) {
      console.log('');
      console.log('Rejected sources:');
      for (const rejected of result.rejectedSources) {
        console.log(`- ${rejected.id}: ${rejected.reason}`);
      }
    }

    process.exitCode = 1;
    return;
  }

  console.log('');
  console.log('Selected source:');
  console.log(`- id: ${result.selectedSource.id}`);
  console.log(`- title: ${result.selectedSource.title}`);
  console.log(`- sourceType: ${result.selectedSource.sourceType}`);
  console.log(`- engineType: ${result.selectedSource.engineType ?? 'none'}`);
  console.log(`- status: ${result.selectedSource.status}`);
  console.log(`- license: ${result.selectedSource.license?.id ?? 'unknown'}`);
  console.log(`- attributionRequired: ${result.attributionRequired ? 'yes' : 'no'}`);
  console.log(`- resolverScore: ${result.selectedSource.resolverScore}`);

  if (result.rejectedSources.length > 0) {
    console.log('');
    console.log('Rejected sources:');
    for (const rejected of result.rejectedSources) {
      console.log(`- ${rejected.id}: ${rejected.reason}`);
    }
  }
}

main();