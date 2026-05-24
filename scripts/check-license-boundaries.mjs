import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { unzipSync } from 'fflate';

const rootDir = process.cwd();

const errors = [];
const warnings = [];

const paths = {
  sources: path.join(rootDir, 'manifests', 'v1', 'sources'),
  policies: path.join(rootDir, 'manifests', 'v1', 'policies'),
  licenseGroups: path.join(rootDir, 'manifests', 'v1', 'license-groups'),
  distRoot: path.join(rootDir, 'dist', 'sounds', 'v1'),
  releaseDir: path.join(rootDir, 'release')
};

const FORBIDDEN_TRACKED_PATH_PREFIXES = [
  '_optional/',
  'third_party_optional/',
  'third_party/',
  'vendor/',
  'external/',
  'downloads/',
  'models/',
  'checkpoints/',
  'datasets/',
  'dist/',
  'release/'
];

const FORBIDDEN_RELEASE_PATH_PARTS = [
  '_optional/',
  'third_party_optional/',
  'third_party/',
  'vendor/',
  'external/',
  'downloads/',
  'models/',
  'checkpoints/',
  'datasets/'
];

const FORBIDDEN_AUDIO_EXTENSIONS = new Set([
  '.wav',
  '.mp3',
  '.flac',
  '.ogg',
  '.aac',
  '.m4a',
  '.aiff',
  '.aif',
  '.mid',
  '.midi'
]);

const FORBIDDEN_ARCHIVE_EXTENSIONS = new Set([
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.rar',
  '.7z'
]);

const BLOCKED_CORE_LICENSE_CATEGORIES = new Set([
  'network_copyleft',
  'noncommercial',
  'no_derivatives',
  'proprietary',
  'unknown',
  'restricted',
  'to_be_verified'
]);

const BLOCKED_CORE_LICENSE_IDS = new Set([
  'AGPL-3.0-only',
  'AGPL-3.0-or-later',
  'CC-BY-NC-4.0',
  'CC-BY-NC-SA-4.0',
  'CC-BY-NC-ND-4.0',
  'CC-BY-ND-4.0',
  'unknown',
  'proprietary',
  'disputed',
  'unverified'
]);

const COMMERCIAL_SAFE_DENY_CATEGORIES = [
  'commercial_sharealike',
  'weak_copyleft',
  'server_only_copyleft',
  'strong_copyleft',
  'network_copyleft',
  'noncommercial',
  'no_derivatives',
  'proprietary',
  'unknown',
  'restricted',
  'to_be_verified'
];

const CLIENT_SAFE_DENY_CATEGORIES = [
  'commercial_attribution',
  'commercial_sharealike',
  'weak_copyleft',
  'server_only_copyleft',
  'strong_copyleft',
  'network_copyleft',
  'noncommercial',
  'no_derivatives',
  'proprietary',
  'unknown',
  'restricted',
  'to_be_verified'
];

const SAAS_SAFE_DENY_CATEGORIES = [
  'server_only_copyleft',
  'commercial_sharealike',
  'strong_copyleft',
  'network_copyleft',
  'noncommercial',
  'no_derivatives',
  'proprietary',
  'unknown',
  'restricted',
  'to_be_verified'
];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function toPosix(filePath) {
  return filePath.replaceAll(path.sep, '/');
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
}

function listFilesRecursive(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  function walk(currentDir) {
    const entries = fs
      .readdirSync(currentDir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function normalizeRepoPath(filePath) {
  return toPosix(path.relative(rootDir, filePath));
}

function getTrackedFiles() {
  try {
    const output = execFileSync('git', ['ls-files'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    warn('Could not run "git ls-files". Falling back to filesystem scan.');

    return listFilesRecursive(rootDir)
      .map(normalizeRepoPath)
      .filter((filePath) => {
        return !(
          filePath.startsWith('.git/') ||
          filePath.startsWith('node_modules/') ||
          filePath.startsWith('dist/') ||
          filePath.startsWith('release/') ||
          filePath.startsWith('_local/')
        );
      });
  }
}

function hasForbiddenExtension(filePath) {
  const lower = filePath.toLowerCase();

  for (const extension of FORBIDDEN_AUDIO_EXTENSIONS) {
    if (lower.endsWith(extension)) return true;
  }

  for (const extension of FORBIDDEN_ARCHIVE_EXTENSIONS) {
    if (lower.endsWith(extension)) return true;
  }

  return false;
}

function checkTrackedFiles() {
  const trackedFiles = getTrackedFiles();

  for (const filePath of trackedFiles) {
    for (const prefix of FORBIDDEN_TRACKED_PATH_PREFIXES) {
      if (filePath.startsWith(prefix)) {
        fail(`Forbidden tracked path: ${filePath}`);
      }
    }

    if (filePath.startsWith('optional-sources/')) {
      const allowed =
        filePath.endsWith('.md') ||
        filePath.endsWith('.json') ||
        filePath.endsWith('.gitkeep');

      if (!allowed) {
        fail(`optional-sources may contain metadata only. Forbidden file: ${filePath}`);
      }
    }

    if (hasForbiddenExtension(filePath)) {
      fail(`Forbidden tracked binary/audio/archive file: ${filePath}`);
    }
  }
}

function flattenCoreSources() {
  const sources = [];

  for (const fileName of listJsonFiles(paths.sources)) {
    const filePath = path.join(paths.sources, fileName);
    const data = readJson(filePath);

    if (!Array.isArray(data.items)) {
      continue;
    }

    for (const item of data.items) {
      sources.push({
        ...item,
        sourceFile: fileName
      });
    }
  }

  return sources;
}

function isGplLicense(licenseId) {
  return typeof licenseId === 'string' && (
    licenseId.startsWith('GPL-') ||
    licenseId.includes('GPL-')
  );
}

function isAgplLicense(licenseId) {
  return typeof licenseId === 'string' && (
    licenseId.startsWith('AGPL-') ||
    licenseId.includes('AGPL-')
  );
}

function checkCoreSources() {
  const sources = flattenCoreSources();

  for (const source of sources) {
    const context = `${source.sourceFile}:${source.id}`;
    const license = source.license ?? {};
    const licenseId = license.id;
    const category = license.category;
    const executionTargets = Array.isArray(source.executionTargets)
      ? source.executionTargets
      : [];

    if (BLOCKED_CORE_LICENSE_CATEGORIES.has(category)) {
      fail(`${context} uses blocked core license category "${category}". Move it to optional-sources metadata or mark it disabled outside the core source manifests.`);
    }

    if (BLOCKED_CORE_LICENSE_IDS.has(licenseId)) {
      fail(`${context} uses blocked core license id "${licenseId}".`);
    }

    if (isAgplLicense(licenseId)) {
      fail(`${context} uses AGPL license "${licenseId}". AGPL is blocked from core source manifests.`);
    }

    if (isGplLicense(licenseId) && executionTargets.includes('client')) {
      fail(`${context} uses GPL-family license "${licenseId}" but includes client execution target.`);
    }

    if (category === 'server_only_copyleft' && executionTargets.includes('client')) {
      fail(`${context} is server_only_copyleft but includes client execution target.`);
    }

    if (executionTargets.includes('client') && license.clientDistributionAllowed !== true) {
      fail(`${context} includes client execution target but license.clientDistributionAllowed is not true.`);
    }

    if (source.status !== 'disabled' && (licenseId === 'unknown' || category === 'unknown')) {
      fail(`${context} is usable but has unknown license metadata.`);
    }
  }
}

function loadPolicy(policyId) {
  const filePath = path.join(paths.policies, `${policyId}.json`);

  if (!fs.existsSync(filePath)) {
    fail(`Missing policy file: manifests/v1/policies/${policyId}.json`);
    return null;
  }

  return readJson(filePath);
}

function includesAll(values, requiredValues) {
  return requiredValues.every((value) => values.includes(value));
}

function checkPolicyArray(policy, field, requiredValues) {
  const values = Array.isArray(policy[field]) ? policy[field] : [];
  const missing = requiredValues.filter((value) => !values.includes(value));

  if (missing.length > 0) {
    fail(`policy "${policy.id}" is missing ${field}: ${missing.join(', ')}`);
  }
}

function checkDefaultPolicies() {
  const clientSafe = loadPolicy('client-safe');
  const saasSafe = loadPolicy('saas-safe');
  const commercialSafe = loadPolicy('commercial-safe');
  const commercialSafeNoOutputAttribution = loadPolicy('commercial-safe-no-output-attribution');
  const noncommercialOptIn = loadPolicy('noncommercial-opt-in');
  const noDerivativesOptIn = loadPolicy('no-derivatives-opt-in');
  const networkCopyleftOptIn = loadPolicy('network-copyleft-opt-in');

  if (clientSafe) {
    checkPolicyArray(clientSafe, 'denyCategories', CLIENT_SAFE_DENY_CATEGORIES);

    if (clientSafe.allowClientDistribution !== true) {
      fail('policy "client-safe" must set allowClientDistribution to true.');
    }

    if (clientSafe.allowServerOnlyCopyleft !== false) {
      fail('policy "client-safe" must set allowServerOnlyCopyleft to false.');
    }

    if (clientSafe.allowNoticeRequired !== true) {
      fail('policy "client-safe" must set allowNoticeRequired to true.');
    }

    if (clientSafe.allowCreatorAttributionRequired !== false) {
      fail('policy "client-safe" must set allowCreatorAttributionRequired to false.');
    }

    if (clientSafe.allowOutputAttributionRequired !== false) {
      fail('policy "client-safe" must set allowOutputAttributionRequired to false.');
    }
  }

  if (saasSafe) {
    checkPolicyArray(saasSafe, 'denyCategories', SAAS_SAFE_DENY_CATEGORIES);

    if (saasSafe.allowClientDistribution !== false) {
      fail('policy "saas-safe" must set allowClientDistribution to false.');
    }

    if (!Array.isArray(saasSafe.denyLicenses) || !saasSafe.denyLicenses.includes('AGPL-3.0-only')) {
      fail('policy "saas-safe" must deny AGPL-3.0-only.');
    }

    if (!Array.isArray(saasSafe.denyLicenses) || !saasSafe.denyLicenses.includes('AGPL-3.0-or-later')) {
      fail('policy "saas-safe" must deny AGPL-3.0-or-later.');
    }
  }

  if (commercialSafe) {
    checkPolicyArray(commercialSafe, 'denyCategories', COMMERCIAL_SAFE_DENY_CATEGORIES);

    if (commercialSafe.allowCommercialUseOnly !== true) {
      fail('policy "commercial-safe" must set allowCommercialUseOnly to true.');
    }

    if (commercialSafe.allowServerOnlyCopyleft !== false) {
      fail('policy "commercial-safe" must set allowServerOnlyCopyleft to false.');
    }
  }

  if (commercialSafeNoOutputAttribution) {
    if (commercialSafeNoOutputAttribution.allowNoticeRequired !== true) {
      fail('policy "commercial-safe-no-output-attribution" must set allowNoticeRequired to true.');
    }

    if (commercialSafeNoOutputAttribution.allowCreatorAttributionRequired !== false) {
      fail('policy "commercial-safe-no-output-attribution" must set allowCreatorAttributionRequired to false.');
    }

    if (commercialSafeNoOutputAttribution.allowOutputAttributionRequired !== false) {
      fail('policy "commercial-safe-no-output-attribution" must set allowOutputAttributionRequired to false.');
    }

    checkPolicyArray(commercialSafeNoOutputAttribution, 'denyCategories', [
      'commercial_attribution',
      'commercial_sharealike',
      'noncommercial',
      'no_derivatives',
      'network_copyleft'
    ]);
  }

  if (noncommercialOptIn) {
    if (noncommercialOptIn.requiresExplicitConsent !== true) {
      fail('policy "noncommercial-opt-in" must require explicit consent.');
    }

    if (noncommercialOptIn.allowCommercialUseOnly !== false) {
      fail('policy "noncommercial-opt-in" must set allowCommercialUseOnly to false.');
    }

    if (!Array.isArray(noncommercialOptIn.blockedUseCases) || !noncommercialOptIn.blockedUseCases.includes('commercial_project')) {
      fail('policy "noncommercial-opt-in" must block commercial_project use case.');
    }
  }

  if (noDerivativesOptIn) {
    if (noDerivativesOptIn.requiresExplicitConsent !== true) {
      fail('policy "no-derivatives-opt-in" must require explicit consent.');
    }

    if (!Array.isArray(noDerivativesOptIn.blockedUseCases) || !noDerivativesOptIn.blockedUseCases.includes('generated_output')) {
      fail('policy "no-derivatives-opt-in" must block generated_output use case.');
    }
  }

  if (networkCopyleftOptIn) {
    if (networkCopyleftOptIn.requiresExplicitConsent !== true) {
      fail('policy "network-copyleft-opt-in" must require explicit consent.');
    }

    if (networkCopyleftOptIn.allowClientDistribution !== false) {
      fail('policy "network-copyleft-opt-in" must set allowClientDistribution to false.');
    }

    if (networkCopyleftOptIn.allowServerOnlyCopyleft !== false) {
      fail('policy "network-copyleft-opt-in" must set allowServerOnlyCopyleft to false.');
    }
  }
}

function checkLicenseGroups() {
  for (const fileName of listJsonFiles(paths.licenseGroups)) {
    const filePath = path.join(paths.licenseGroups, fileName);
    const group = readJson(filePath);
    const context = `license group "${fileName}"`;

    if (group.id === 'blocked' && group.fetchableByDefault !== false) {
      fail(`${context} must not be fetchable by default.`);
    }

    if (group.id === 'network-copyleft' && group.fetchableByDefault !== false) {
      fail(`${context} must not be fetchable by default.`);
    }

    if (group.id === 'noncommercial' && group.defaultIncludedInCore !== false) {
      fail(`${context} must not be included in core by default.`);
    }

    if (group.id === 'no-derivatives' && group.defaultIncludedInCore !== false) {
      fail(`${context} must not be included in core by default.`);
    }
  }
}

function checkDistPayload() {
  if (!fs.existsSync(paths.distRoot)) {
    warn('dist/sounds/v1 does not exist. Run npm run build before boundary checking release payloads.');
    return;
  }

  const files = listFilesRecursive(paths.distRoot).map(normalizeRepoPath);

  for (const filePath of files) {
    for (const part of FORBIDDEN_RELEASE_PATH_PARTS) {
      if (filePath.includes(part)) {
        fail(`Forbidden payload path in dist: ${filePath}`);
      }
    }

    if (hasForbiddenExtension(filePath)) {
      fail(`Forbidden binary/audio/archive file in dist: ${filePath}`);
    }
  }
}

function checkReleaseZips() {
  if (!fs.existsSync(paths.releaseDir)) {
    warn('release/ does not exist. Run npm run package before checking release zip payloads.');
    return;
  }

  const zipFiles = fs
    .readdirSync(paths.releaseDir)
    .filter((fileName) => fileName.endsWith('.zip'))
    .sort((a, b) => a.localeCompare(b));

  if (zipFiles.length === 0) {
    warn('No release zip files found.');
    return;
  }

  for (const zipFileName of zipFiles) {
    const zipPath = path.join(paths.releaseDir, zipFileName);
    const zipData = fs.readFileSync(zipPath);
    const entries = unzipSync(zipData);

    for (const entryName of Object.keys(entries)) {
      for (const part of FORBIDDEN_RELEASE_PATH_PARTS) {
        if (entryName.includes(part)) {
          fail(`Forbidden payload path in release zip ${zipFileName}: ${entryName}`);
        }
      }

      if (hasForbiddenExtension(entryName)) {
        fail(`Forbidden binary/audio/archive file in release zip ${zipFileName}: ${entryName}`);
      }
    }
  }
}

function main() {
  checkTrackedFiles();
  checkCoreSources();
  checkDefaultPolicies();
  checkLicenseGroups();
  checkDistPayload();
  checkReleaseZips();

  if (warnings.length > 0) {
    console.warn(`Boundary check completed with ${warnings.length} warning(s):`);
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
    console.warn('');
  }

  if (errors.length > 0) {
    console.error(`Boundary check failed with ${errors.length} error(s):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('License boundary check OK');
}

main();