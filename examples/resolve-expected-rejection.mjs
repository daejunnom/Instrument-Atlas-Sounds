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

function fail(message, result = null) {
  console.error(`Expected rejection check failed: ${message}`);

  if (result?.rejectedSources?.length > 0) {
    console.error('');
    console.error('Actual rejected sources:');

    for (const rejected of result.rejectedSources) {
      const groups = (rejected.licenseGroups ?? []).join(', ') || 'none';
      console.error(`- ${rejected.id}: ${rejected.reason} [groups: ${groups}]`);
    }
  }

  process.exit(1);
}

function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(rootDir, 'examples', 'saas-safe-expected-rejection-request.json');

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing expected rejection request file: ${toRelative(inputPath)}`);
  }

  const requestWithExpectation = readJson(inputPath);
  const { expectedRejection, ...request } = requestWithExpectation;

  if (!expectedRejection || typeof expectedRejection !== 'object') {
    fail('request.expectedRejection must be present.');
  }

  const result = resolveSoundSource(request);

  if (result.selectedSource) {
    fail(`expected no selected source, but selected "${result.selectedSource.id}".`, result);
  }

  const expectedSourceId = expectedRejection.sourceId;
  const expectedReason = expectedRejection.reason;

  const matchingRejectedSource = result.rejectedSources.find((rejected) => {
    const sourceMatches =
      typeof expectedSourceId !== 'string' ||
      rejected.id === expectedSourceId;

    const reasonMatches =
      typeof expectedReason !== 'string' ||
      rejected.reason === expectedReason;

    return sourceMatches && reasonMatches;
  });

  if (!matchingRejectedSource) {
    fail(
      `expected rejection was not found: sourceId=${expectedSourceId ?? '*'}, reason=${expectedReason ?? '*'}.`,
      result
    );
  }

  console.log('Expected rejection OK');
  console.log(`Request: ${toRelative(inputPath)}`);
  console.log(`Instrument: ${result.request.instrumentId}`);
  console.log(`Policy: ${result.request.policyId}`);
  console.log(`Rejected source: ${matchingRejectedSource.id}`);
  console.log(`Reason: ${matchingRejectedSource.reason}`);
}

main();