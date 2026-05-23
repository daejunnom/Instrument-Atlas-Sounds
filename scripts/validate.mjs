import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

const paths = {
  manifest: path.join(rootDir, 'manifests', 'v1', 'manifest.json'),
  sources: path.join(rootDir, 'manifests', 'v1', 'sources'),
  policies: path.join(rootDir, 'manifests', 'v1', 'policies'),
  licenseGroups: path.join(rootDir, 'manifests', 'v1', 'license-groups')
};

const VALID_SOURCE_TYPES = new Set([
  'physical_model',
  'sample_instrument',
  'one_shot_sample',
  'synth_patch',
  'external_engine'
]);

const VALID_STATUS_VALUES = new Set([
  'planned',
  'experimental',
  'prototype',
  'production_candidate',
  'production',
  'disabled'
]);

const VALID_EXECUTION_TARGETS = new Set([
  'client',
  'server',
  'offline'
]);

const VALID_LICENSE_CATEGORIES = new Set([
  'public_domain',
  'permissive_code',
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
]);

const VALID_LICENSE_GROUP_RISK_LEVELS = new Set([
  'low',
  'medium',
  'high',
  'very_high',
  'blocked'
]);

const VALID_LICENSE_GROUP_DEFAULT_BEHAVIORS = new Set([
  'allow',
  'allow_with_report',
  'opt_in_only',
  'blocked_by_default',
  'blocked'
]);

const VALID_DURATION_POLICIES = new Set([
  'generated_sustain',
  'generated_decay',
  'looped_sustain',
  'natural_decay',
  'one_shot',
  'time_stretch'
]);

const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function toPosix(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  try {
    const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
    return JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON: ${toPosix(filePath)} (${error.message})`);
    return null;
  }
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    fail(`Missing directory: ${toPosix(dir)}`);
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function hasDuplicates(values) {
  if (!Array.isArray(values)) return false;
  return new Set(values).size !== values.length;
}

function isHttpUrl(value) {
  if (value === null) return true;
  if (typeof value !== 'string') return false;
  if (value.trim() === '') return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function requireString(object, field, context) {
  if (typeof object[field] !== 'string' || object[field].trim() === '') {
    fail(`${context}.${field} must be a non-empty string.`);
  }
}

function requireBoolean(object, field, context) {
  if (typeof object[field] !== 'boolean') {
    fail(`${context}.${field} must be boolean.`);
  }
}

function validateManifest() {
  if (!fs.existsSync(paths.manifest)) {
    fail('Missing manifests/v1/manifest.json. Did you create manifests.json by mistake?');
    return null;
  }

  const manifest = readJson(paths.manifest);
  if (!manifest) return null;

  const context = 'manifest';

  if (manifest.schemaVersion !== 1) {
    fail(`${context}.schemaVersion must be 1.`);
  }

  requireString(manifest, 'soundLibraryVersion', context);
  requireString(manifest, 'basePath', context);

  if (!isPlainObject(manifest.policyFiles)) {
    fail(`${context}.policyFiles must be an object.`);
  } else {
    for (const [key, filePath] of Object.entries(manifest.policyFiles)) {
      if (typeof filePath !== 'string' || !filePath.endsWith('.json')) {
        fail(`${context}.policyFiles.${key} must be a JSON file path.`);
      }
    }
  }

  if (manifest.licenseGroupFiles !== undefined) {
    if (!isPlainObject(manifest.licenseGroupFiles)) {
      fail(`${context}.licenseGroupFiles must be an object when present.`);
    } else {
      for (const [key, filePath] of Object.entries(manifest.licenseGroupFiles)) {
        if (typeof filePath !== 'string' || !filePath.endsWith('.json')) {
          fail(`${context}.licenseGroupFiles.${key} must be a JSON file path.`);
        }
      }
    }
  }

  if (!isPlainObject(manifest.indexFiles)) {
    fail(`${context}.policyFiles must be an object.`);
  } else {
    for (const [key, filePath] of Object.entries(manifest.policyFiles)) {
      if (typeof filePath !== 'string' || !filePath.endsWith('.json')) {
        fail(`${context}.policyFiles.${key} must be a JSON file path.`);
      }
    }
  }

  if (!isPlainObject(manifest.indexFiles)) {
    fail(`${context}.indexFiles must be an object.`);
  }

  if (!isPlainObject(manifest.defaults)) {
    fail(`${context}.defaults must be an object.`);
  } else {
    if (!isStringArray(manifest.defaults.preferredSourceTypes)) {
      fail(`${context}.defaults.preferredSourceTypes must be an array of strings.`);
    } else {
      for (const sourceType of manifest.defaults.preferredSourceTypes) {
        if (!VALID_SOURCE_TYPES.has(sourceType)) {
          fail(`${context}.defaults.preferredSourceTypes contains invalid source type "${sourceType}".`);
        }
      }
    }

    if (typeof manifest.defaults.defaultPolicy !== 'string') {
      fail(`${context}.defaults.defaultPolicy must be a string.`);
    }
  }

  return manifest;
}

function validatePolicyFile(fileName, policyIds) {
  const filePath = path.join(paths.policies, fileName);
  const policy = readJson(filePath);
  if (!policy) return;

  const expectedId = fileName.replace(/\.json$/, '');
  const context = `policy "${fileName}"`;

  requireString(policy, 'id', context);
  requireString(policy, 'title', context);
  requireString(policy, 'description', context);

  if (policy.id !== expectedId) {
    fail(`${context}.id must match filename: "${policy.id}" !== "${expectedId}".`);
  }

  if (policyIds.has(policy.id)) {
    fail(`Duplicate policy id: ${policy.id}`);
  }
  policyIds.add(policy.id);

  for (const field of ['allowCategories', 'denyCategories']) {
    if (policy[field] !== undefined) {
      if (!isStringArray(policy[field])) {
        fail(`${context}.${field} must be an array of strings.`);
      } else {
        for (const category of policy[field]) {
          if (!VALID_LICENSE_CATEGORIES.has(category)) {
            fail(`${context}.${field} contains invalid category "${category}".`);
          }
        }
      }
    }
  }

  for (const field of ['allowLicenses', 'denyLicenses']) {
    if (policy[field] !== undefined && !isStringArray(policy[field])) {
      fail(`${context}.${field} must be an array of strings.`);
    }
  }

  for (const field of [
    'allowCommercialUseOnly',
    'allowAttributionRequired',
    'allowClientDistribution',
    'allowServerOnlyCopyleft',
    'preferPublicDomain'
  ]) {
    if (policy[field] !== undefined && typeof policy[field] !== 'boolean') {
      fail(`${context}.${field} must be boolean when present.`);
    }
  }
}

function validatePolicies() {
  const policyIds = new Set();

  for (const fileName of listJsonFiles(paths.policies)) {
    validatePolicyFile(fileName, policyIds);
  }

  return policyIds;
}

function validateLicenseGroupFile(fileName, licenseGroupIds) {
  const filePath = path.join(paths.licenseGroups, fileName);
  const group = readJson(filePath);
  if (!group) return;

  const expectedId = fileName.replace(/\.json$/, '');
  const context = `license group "${fileName}"`;

  if (group.id !== expectedId) {
    fail(`${context}.id must match filename: "${group.id}" !== "${expectedId}".`);
  }

  if (licenseGroupIds.has(group.id)) {
    fail(`Duplicate license group id: ${group.id}`);
  }
  licenseGroupIds.add(group.id);

  requireString(group, 'id', context);
  requireString(group, 'title', context);
  requireString(group, 'description', context);

  if (group.schemaVersion !== 1) {
    fail(`${context}.schemaVersion must be 1.`);
  }

  if (!VALID_LICENSE_GROUP_RISK_LEVELS.has(group.riskLevel)) {
    fail(`${context}.riskLevel has invalid value "${group.riskLevel}".`);
  }

  if (!VALID_LICENSE_GROUP_DEFAULT_BEHAVIORS.has(group.defaultBehavior)) {
    fail(`${context}.defaultBehavior has invalid value "${group.defaultBehavior}".`);
  }

  if (!isStringArray(group.licenseIds) || group.licenseIds.length === 0) {
    fail(`${context}.licenseIds must be a non-empty array of strings.`);
  }

  if (!isStringArray(group.licenseFamilies) || group.licenseFamilies.length === 0) {
    fail(`${context}.licenseFamilies must be a non-empty array of strings.`);
  }

  if (!Array.isArray(group.restrictions)) {
    fail(`${context}.restrictions must be an array.`);
  }

  for (const field of [
    'defaultIncludedInCore',
    'fetchableByDefault',
    'requiresExplicitConsent'
  ]) {
    if (typeof group[field] !== 'boolean') {
      fail(`${context}.${field} must be boolean.`);
    }
  }
}

function validateLicenseGroups() {
  const licenseGroupIds = new Set();

  for (const fileName of listJsonFiles(paths.licenseGroups)) {
    validateLicenseGroupFile(fileName, licenseGroupIds);
  }

  return licenseGroupIds;
}

function validateCapabilities(source, context) {
  if (!isPlainObject(source.capabilities)) {
    fail(`${context}.capabilities must be an object.`);
    return;
  }

  for (const field of [
    'notes',
    'velocity',
    'duration',
    'pitchBend',
    'sustainLoop',
    'polyphony',
    'realtime',
    'offlineRender'
  ]) {
    requireBoolean(source.capabilities, field, `${context}.capabilities`);
  }
}

function validateRenderDefaults(source, context) {
  if (!isPlainObject(source.renderDefaults)) {
    fail(`${context}.renderDefaults must be an object.`);
    return;
  }

  const defaults = source.renderDefaults;

  if (!VALID_DURATION_POLICIES.has(defaults.durationPolicy)) {
    fail(`${context}.renderDefaults.durationPolicy has invalid value "${defaults.durationPolicy}".`);
  }

  for (const field of ['defaultDurationMs', 'minDurationMs', 'maxDurationMs']) {
    if (typeof defaults[field] !== 'number' || defaults[field] < 0) {
      fail(`${context}.renderDefaults.${field} must be a non-negative number.`);
    }
  }

  if (
    typeof defaults.minDurationMs === 'number' &&
    typeof defaults.maxDurationMs === 'number' &&
    defaults.minDurationMs > defaults.maxDurationMs
  ) {
    fail(`${context}.renderDefaults.minDurationMs must be <= maxDurationMs.`);
  }
}

function validateLicense(source, context) {
  if (!isPlainObject(source.license)) {
    fail(`${context}.license must be an object.`);
    return;
  }

  const license = source.license;

  requireString(license, 'id', `${context}.license`);
  requireString(license, 'category', `${context}.license`);

  if (!VALID_LICENSE_CATEGORIES.has(license.category)) {
    fail(`${context}.license.category has invalid value "${license.category}".`);
  }

  for (const field of [
    'commercialUse',
    'attributionRequired',
    'sourceRequiredOnDistribution',
    'networkSourceRequired',
    'clientDistributionAllowed',
    'serverUseAllowed'
  ]) {
    requireBoolean(license, field, `${context}.license`);
  }

  const isGpl =
    typeof license.id === 'string' &&
    (license.id.startsWith('GPL-') || license.id.includes('GPL-'));

  const isAgpl =
    typeof license.id === 'string' &&
    (license.id.startsWith('AGPL-') || license.id.includes('AGPL-'));

  if (isAgpl) {
    fail(`${context} uses AGPL license "${license.id}". AGPL sources are blocked by default.`);
  }

  if (isGpl && source.executionTargets?.includes('client')) {
    fail(`${context} uses GPL license "${license.id}" but includes client execution target.`);
  }

  if (license.category === 'server_only_copyleft' && source.executionTargets?.includes('client')) {
    fail(`${context} is server_only_copyleft but includes client execution target.`);
  }

  if (license.id === 'unknown' || license.category === 'restricted') {
    fail(`${context} has restricted or unknown license.`);
  }
}

function validateParameters(source, context) {
  if (source.parameters === undefined) return;

  if (!Array.isArray(source.parameters)) {
    fail(`${context}.parameters must be an array when present.`);
    return;
  }

  const ids = new Set();

  source.parameters.forEach((parameter, index) => {
    const paramContext = `${context}.parameters[${index}]`;

    if (!isPlainObject(parameter)) {
      fail(`${paramContext} must be an object.`);
      return;
    }

    requireString(parameter, 'id', paramContext);
    requireString(parameter, 'type', paramContext);

    if (ids.has(parameter.id)) {
      fail(`${context}.parameters contains duplicate id "${parameter.id}".`);
    }
    ids.add(parameter.id);

    if (parameter.type === 'number') {
      for (const field of ['min', 'max', 'default']) {
        if (typeof parameter[field] !== 'number') {
          fail(`${paramContext}.${field} must be a number for number parameters.`);
        }
      }

      if (
        typeof parameter.min === 'number' &&
        typeof parameter.max === 'number' &&
        parameter.min > parameter.max
      ) {
        fail(`${paramContext}.min must be <= max.`);
      }

      if (
        typeof parameter.default === 'number' &&
        typeof parameter.min === 'number' &&
        typeof parameter.max === 'number' &&
        (parameter.default < parameter.min || parameter.default > parameter.max)
      ) {
        fail(`${paramContext}.default must be between min and max.`);
      }
    }
  });
}

function validateProvenance(source, context) {
  if (!isPlainObject(source.provenance)) {
    fail(`${context}.provenance must be an object.`);
    return;
  }

  const provenance = source.provenance;

  requireString(provenance, 'origin', `${context}.provenance`);

  if (!('upstreamName' in provenance)) {
    fail(`${context}.provenance.upstreamName is missing.`);
  } else if (!(provenance.upstreamName === null || typeof provenance.upstreamName === 'string')) {
    fail(`${context}.provenance.upstreamName must be null or string.`);
  }

  if (!('upstreamUrl' in provenance)) {
    fail(`${context}.provenance.upstreamUrl is missing.`);
  } else if (!isHttpUrl(provenance.upstreamUrl)) {
    fail(`${context}.provenance.upstreamUrl must be null or http(s) URL.`);
  }

  requireString(provenance, 'verifiedAt', `${context}.provenance`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(provenance.verifiedAt)) {
    fail(`${context}.provenance.verifiedAt must use YYYY-MM-DD format.`);
  }
}

function validateSource(source, context, sourceIds) {
  if (!isPlainObject(source)) {
    fail(`${context} must be an object.`);
    return;
  }

  requireString(source, 'id', context);
  requireString(source, 'title', context);
  requireString(source, 'description', context);
  requireString(source, 'sourceType', context);
  requireString(source, 'status', context);

  if (!/^src_[a-z0-9_]+$/.test(source.id ?? '')) {
    fail(`${context}.id must start with "src_" and use lowercase snake_case.`);
  }

  if (sourceIds.has(source.id)) {
    fail(`Duplicate source id: ${source.id}`);
  }
  sourceIds.add(source.id);

  if (!VALID_SOURCE_TYPES.has(source.sourceType)) {
    fail(`${context}.sourceType has invalid value "${source.sourceType}".`);
  }

  if (!VALID_STATUS_VALUES.has(source.status)) {
    fail(`${context}.status has invalid value "${source.status}".`);
  }

  if (!isStringArray(source.instrumentIds) || source.instrumentIds.length === 0) {
    fail(`${context}.instrumentIds must be a non-empty array of strings.`);
  } else {
    if (hasDuplicates(source.instrumentIds)) {
      fail(`${context}.instrumentIds contains duplicate values.`);
    }

    for (const instrumentId of source.instrumentIds) {
      if (!/^inst_[a-z0-9_]+$/.test(instrumentId)) {
        fail(`${context}.instrumentIds contains invalid instrument id "${instrumentId}".`);
      }
    }
  }

  if (typeof source.priority !== 'number') {
    fail(`${context}.priority must be a number.`);
  }

  if (!isStringArray(source.executionTargets) || source.executionTargets.length === 0) {
    fail(`${context}.executionTargets must be a non-empty array of strings.`);
  } else {
    if (hasDuplicates(source.executionTargets)) {
      fail(`${context}.executionTargets contains duplicate values.`);
    }

    for (const target of source.executionTargets) {
      if (!VALID_EXECUTION_TARGETS.has(target)) {
        fail(`${context}.executionTargets contains invalid target "${target}".`);
      }
    }
  }

  if (source.sourceType === 'physical_model' && typeof source.engineType !== 'string') {
    fail(`${context}.engineType is required for physical_model sources.`);
  }

  validateLicense(source, context);
  validateCapabilities(source, context);
  validateRenderDefaults(source, context);
  validateParameters(source, context);
  validateProvenance(source, context);
}

function validateSourceFile(fileName, sourceIds) {
  const filePath = path.join(paths.sources, fileName);
  const data = readJson(filePath);
  if (!data) return;

  const context = `source file "${fileName}"`;

  if (data.schemaVersion !== 1) {
    fail(`${context}.schemaVersion must be 1.`);
  }

  if (!VALID_SOURCE_TYPES.has(data.sourceType)) {
    fail(`${context}.sourceType has invalid value "${data.sourceType}".`);
  }

  if (!Array.isArray(data.items)) {
    fail(`${context}.items must be an array.`);
    return;
  }

  data.items.forEach((source, index) => {
    const sourceContext = `${context}.items[${index}]`;

    if (source?.sourceType !== data.sourceType) {
      fail(`${sourceContext}.sourceType must match file sourceType "${data.sourceType}".`);
    }

    validateSource(source, sourceContext, sourceIds);
  });
}

function validateSources() {
  const sourceIds = new Set();

  for (const fileName of listJsonFiles(paths.sources)) {
    validateSourceFile(fileName, sourceIds);
  }

  return sourceIds;
}

function validateManifestReferences(manifest, policyIds, licenseGroupIds) {
  if (!manifest) return;

  if (manifest.policyFiles) {
    for (const [key, filePath] of Object.entries(manifest.policyFiles)) {
      const expectedPath = path.join(rootDir, 'manifests', 'v1', filePath);

      if (!fs.existsSync(expectedPath)) {
        fail(`manifest.policyFiles.${key} points to missing file: ${filePath}`);
        continue;
      }

      const expectedPolicyId = path.basename(filePath).replace(/\.json$/, '');
      if (!policyIds.has(expectedPolicyId)) {
        fail(`manifest.policyFiles.${key} points to policy id "${expectedPolicyId}", but that policy was not loaded.`);
      }
    }
  }

  if (manifest.licenseGroupFiles) {
    for (const [key, filePath] of Object.entries(manifest.licenseGroupFiles)) {
      const expectedPath = path.join(rootDir, 'manifests', 'v1', filePath);

      if (!fs.existsSync(expectedPath)) {
        fail(`manifest.licenseGroupFiles.${key} points to missing file: ${filePath}`);
        continue;
      }

      const expectedLicenseGroupId = path.basename(filePath).replace(/\.json$/, '');
      if (!licenseGroupIds.has(expectedLicenseGroupId)) {
        fail(`manifest.licenseGroupFiles.${key} points to license group id "${expectedLicenseGroupId}", but that group was not loaded.`);
      }
    }
  }

  if (manifest.sourceFiles) {
    for (const [key, filePath] of Object.entries(manifest.sourceFiles)) {
      const expectedPath = path.join(rootDir, 'manifests', 'v1', filePath);

      if (!fs.existsSync(expectedPath)) {
        fail(`manifest.sourceFiles.${key} points to missing file: ${filePath}`);
      }
    }
  }

  if (manifest.defaults?.defaultPolicy && !policyIds.has(manifest.defaults.defaultPolicy)) {
    fail(`manifest.defaults.defaultPolicy points to missing policy "${manifest.defaults.defaultPolicy}".`);
  }
}

function main() {
  const manifest = validateManifest();
  const policyIds = validatePolicies();
  const licenseGroupIds = validateLicenseGroups();
  validateSources();
  validateManifestReferences(manifest, policyIds, licenseGroupIds);

  if (warnings.length > 0) {
    console.warn(`Validation completed with ${warnings.length} warning(s):`);
    for (const message of warnings) {
      console.warn(`- ${message}`);
    }
    console.warn('');
  }

  if (errors.length > 0) {
    console.error(`Validation failed with ${errors.length} error(s):`);
    for (const message of errors) {
      console.error(`- ${message}`);
    }
    process.exit(1);
  }

  console.log('Validation OK');
  console.log(`Checked ${policyIds.size} policies.`);
  console.log(`Checked ${licenseGroupIds.size} license groups.`);
  console.log('Checked source manifests.');
}

main();