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

const LICENSE_CATEGORY_TO_LICENSE_FAMILY = new Map([
  ['public_domain', 'public_domain'],
  ['permissive_code', 'permissive'],
  ['commercial_attribution', 'commercial_attribution'],
  ['commercial_sharealike', 'commercial_sharealike'],
  ['weak_copyleft', 'weak_copyleft'],
  ['server_only_copyleft', 'strong_copyleft'],
  ['strong_copyleft', 'strong_copyleft'],
  ['network_copyleft', 'network_copyleft'],
  ['noncommercial', 'noncommercial'],
  ['no_derivatives', 'no_derivatives'],
  ['proprietary', 'proprietary'],
  ['unknown', 'unknown'],
  ['restricted', 'unknown'],
  ['to_be_verified', 'unknown']
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

const DEFAULT_POLICY_IDS = new Set([
  'client-safe',
  'saas-safe',
  'cc0-only',
  'permissive-only',
  'commercial-safe',
  'commercial-safe-no-output-attribution',
  'commercial-safe-with-attribution'
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

function getIntersection(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function validateNoOverlap(object, leftField, rightField, context) {
  const left = Array.isArray(object[leftField]) ? object[leftField] : [];
  const right = Array.isArray(object[rightField]) ? object[rightField] : [];
  const overlap = getIntersection(left, right);

  if (overlap.length > 0) {
    fail(`${context}.${leftField} and ${context}.${rightField} overlap: ${overlap.join(', ')}`);
  }
}

function validateStringArrayField(object, field, context, options = {}) {
  if (object[field] === undefined) {
    return [];
  }

  if (!isStringArray(object[field])) {
    fail(`${context}.${field} must be an array of strings.`);
    return [];
  }

  if (hasDuplicates(object[field])) {
    fail(`${context}.${field} contains duplicate values.`);
  }

  if (options.allowedValues) {
    for (const value of object[field]) {
      if (!options.allowedValues.has(value)) {
        fail(`${context}.${field} contains invalid value "${value}".`);
      }
    }
  }

  return object[field];
}

function getLicenseFamilyForCategory(category) {
  return LICENSE_CATEGORY_TO_LICENSE_FAMILY.get(category) ?? category;
}

function validatePolicyLicenseGroupReferences(policy, context, licenseGroupIds) {
  for (const field of ['allowLicenseGroups', 'denyLicenseGroups']) {
    const values = Array.isArray(policy[field]) ? policy[field] : [];

    for (const groupId of values) {
      if (!licenseGroupIds.has(groupId)) {
        fail(`${context}.${field} references missing license group "${groupId}".`);
      }
    }
  }
}

function validatePolicyGroupConflicts(policy, context, licenseGroupsById) {
  const allowLicenses = Array.isArray(policy.allowLicenses) ? policy.allowLicenses : [];
  const denyLicenses = Array.isArray(policy.denyLicenses) ? policy.denyLicenses : [];
  const allowCategories = Array.isArray(policy.allowCategories) ? policy.allowCategories : [];
  const denyCategories = Array.isArray(policy.denyCategories) ? policy.denyCategories : [];
  const allowLicenseGroups = Array.isArray(policy.allowLicenseGroups) ? policy.allowLicenseGroups : [];
  const denyLicenseGroups = Array.isArray(policy.denyLicenseGroups) ? policy.denyLicenseGroups : [];

  for (const groupId of denyLicenseGroups) {
    const group = licenseGroupsById.get(groupId);
    if (!group) continue;

    const groupLicenseIds = Array.isArray(group.licenseIds) ? group.licenseIds : [];
    const licenseOverlap = getIntersection(allowLicenses, groupLicenseIds);

    if (licenseOverlap.length > 0) {
      fail(`${context}.allowLicenses includes license(s) denied through denyLicenseGroups.${groupId}: ${licenseOverlap.join(', ')}`);
    }

    const groupFamilies = Array.isArray(group.licenseFamilies) ? group.licenseFamilies : [];
    const categoryOverlap = allowCategories.filter((category) => {
      return groupFamilies.includes(getLicenseFamilyForCategory(category));
    });

    if (categoryOverlap.length > 0) {
      fail(`${context}.allowCategories includes category family denied through denyLicenseGroups.${groupId}: ${categoryOverlap.join(', ')}`);
    }
  }

  for (const groupId of allowLicenseGroups) {
    const group = licenseGroupsById.get(groupId);
    if (!group) continue;

    const groupLicenseIds = Array.isArray(group.licenseIds) ? group.licenseIds : [];
    const licenseOverlap = getIntersection(denyLicenses, groupLicenseIds);

    if (licenseOverlap.length > 0) {
      fail(`${context}.denyLicenses includes license(s) allowed through allowLicenseGroups.${groupId}: ${licenseOverlap.join(', ')}`);
    }

    const groupFamilies = Array.isArray(group.licenseFamilies) ? group.licenseFamilies : [];
    const categoryOverlap = denyCategories.filter((category) => {
      return groupFamilies.includes(getLicenseFamilyForCategory(category));
    });

    if (categoryOverlap.length > 0) {
      fail(`${context}.denyCategories includes category family allowed through allowLicenseGroups.${groupId}: ${categoryOverlap.join(', ')}`);
    }
  }
}

function validateDefaultPolicyDoesNotAllowOptInGroups(policy, context, licenseGroupsById) {
  if (!DEFAULT_POLICY_IDS.has(policy.id)) {
    return;
  }

  const allowLicenseGroups = Array.isArray(policy.allowLicenseGroups)
    ? policy.allowLicenseGroups
    : [];

  for (const groupId of allowLicenseGroups) {
    const group = licenseGroupsById.get(groupId);
    if (!group) continue;

    const isOptIn =
      group.requiresExplicitConsent === true ||
      group.defaultBehavior === 'opt_in_only' ||
      group.defaultBehavior === 'blocked_by_default' ||
      group.defaultBehavior === 'blocked';

    if (isOptIn) {
      fail(
        `${context}.allowLicenseGroups includes opt-in or blocked license group "${groupId}". Default policies must not allow groups that require explicit consent.`
      );
    }
  }
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
    fail(`${context}.indexFiles must be an object.`);
  } else {
    for (const [key, filePath] of Object.entries(manifest.indexFiles)) {
      if (typeof filePath !== 'string' || !filePath.endsWith('.json')) {
        fail(`${context}.indexFiles.${key} must be a JSON file path.`);
      }
    }
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

function validatePolicyFile(fileName, policyIds, licenseGroupIds, licenseGroupsById) {
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

  validateStringArrayField(policy, 'allowCategories', context, {
    allowedValues: VALID_LICENSE_CATEGORIES
  });

  validateStringArrayField(policy, 'denyCategories', context, {
    allowedValues: VALID_LICENSE_CATEGORIES
  });

  validateStringArrayField(policy, 'allowLicenses', context);
  validateStringArrayField(policy, 'denyLicenses', context);
  validateStringArrayField(policy, 'allowLicenseGroups', context);
  validateStringArrayField(policy, 'denyLicenseGroups', context);
  validateStringArrayField(policy, 'allowRestrictions', context);
  validateStringArrayField(policy, 'denyRestrictions', context);
  validateStringArrayField(policy, 'blockedUseCases', context);

  validateNoOverlap(policy, 'allowCategories', 'denyCategories', context);
  validateNoOverlap(policy, 'allowLicenses', 'denyLicenses', context);
  validateNoOverlap(policy, 'allowLicenseGroups', 'denyLicenseGroups', context);
  validateNoOverlap(policy, 'allowRestrictions', 'denyRestrictions', context);

  validatePolicyLicenseGroupReferences(policy, context, licenseGroupIds);
  validatePolicyGroupConflicts(policy, context, licenseGroupsById);
  validateDefaultPolicyDoesNotAllowOptInGroups(policy, context, licenseGroupsById);

  if (policy.allowAttributionRequired !== undefined) {
    fail(`${context}.allowAttributionRequired is deprecated. Use allowNoticeRequired, allowCreatorAttributionRequired, and allowOutputAttributionRequired instead.`);
  }

  for (const field of [
    'allowCommercialUseOnly',
    'allowNoticeRequired',
    'allowCreatorAttributionRequired',
    'allowOutputAttributionRequired',
    'allowClientDistribution',
    'allowServerOnlyCopyleft',
    'preferPublicDomain',
    'requiresNoticeReport',

    // Transitional legacy policy field.
    // Keep this until policy JSON files no longer carry requiresAttributionReport.
    'requiresAttributionReport',

    // Policy-level capability requirements.
    'requiresComplianceReportCapability',
    'requiresAttributionReportCapability',

    'requiresExplicitConsent',
    'requiresSourceDisclosureReview',
    'requiresNetworkSourceDisclosureReview'
  ]) {
    if (policy[field] !== undefined && typeof policy[field] !== 'boolean') {
      fail(`${context}.${field} must be boolean when present.`);
    }
  }

  if (
    policy.requiresAttributionReport !== undefined &&
    policy.requiresAttributionReportCapability !== undefined &&
    policy.requiresAttributionReport !== policy.requiresAttributionReportCapability
  ) {
    fail(`${context}.requiresAttributionReport and ${context}.requiresAttributionReportCapability must match during the migration period.`);
  }

  if (
    policy.requiresNoticeReport === true &&
    policy.requiresComplianceReportCapability !== true
  ) {
    fail(`${context}.requiresNoticeReport=true requires requiresComplianceReportCapability=true.`);
  }

  if (
    policy.requiresAttributionReportCapability === true &&
    policy.requiresComplianceReportCapability !== true
  ) {
    fail(`${context}.requiresAttributionReportCapability=true requires requiresComplianceReportCapability=true.`);
  }

  if (
    policy.requiresSourceDisclosureReview === true &&
    policy.requiresComplianceReportCapability !== true
  ) {
    fail(`${context}.requiresSourceDisclosureReview=true requires requiresComplianceReportCapability=true.`);
  }

  if (
    policy.requiresNetworkSourceDisclosureReview === true &&
    policy.requiresComplianceReportCapability !== true
  ) {
    fail(`${context}.requiresNetworkSourceDisclosureReview=true requires requiresComplianceReportCapability=true.`);
  }

  if (
    (policy.allowCreatorAttributionRequired === true || policy.allowOutputAttributionRequired === true) &&
    policy.requiresAttributionReportCapability !== true
  ) {
    fail(`${context} allows creator/output-attribution-required sources, so requiresAttributionReportCapability must be true.`);
  }
}

function validatePolicies(licenseGroupIds, licenseGroupsById) {
  const policyIds = new Set();

  for (const fileName of listJsonFiles(paths.policies)) {
    validatePolicyFile(fileName, policyIds, licenseGroupIds, licenseGroupsById);
  }

  return policyIds;
}

function validateLicenseGroupFile(fileName, licenseGroupIds) {
  const filePath = path.join(paths.licenseGroups, fileName);
  const group = readJson(filePath);
  if (!group) return null;

  const expectedId = fileName.replace(/\.json$/, '');
  const context = `license group "${fileName}"`;

  requireString(group, 'id', context);
  requireString(group, 'title', context);
  requireString(group, 'description', context);

  if (group.id !== expectedId) {
    fail(`${context}.id must match filename: "${group.id}" !== "${expectedId}".`);
  }

  const groupIdAlreadySeen = licenseGroupIds.has(group.id);

  if (groupIdAlreadySeen) {
    fail(`Duplicate license group id: ${group.id}`);
  } else if (typeof group.id === 'string') {
    licenseGroupIds.add(group.id);
  }

  if (group.schemaVersion !== 1) {
    fail(`${context}.schemaVersion must be 1.`);
  }

  if (!VALID_LICENSE_GROUP_RISK_LEVELS.has(group.riskLevel)) {
    fail(`${context}.riskLevel has invalid value "${group.riskLevel}".`);
  }

  if (!VALID_LICENSE_GROUP_DEFAULT_BEHAVIORS.has(group.defaultBehavior)) {
    fail(`${context}.defaultBehavior has invalid value "${group.defaultBehavior}".`);
  }

  validateStringArrayField(group, 'licenseIds', context);
  validateStringArrayField(group, 'licenseFamilies', context);

  if (!Array.isArray(group.licenseIds) || group.licenseIds.length === 0) {
    fail(`${context}.licenseIds must be a non-empty array of strings.`);
  }

  if (!Array.isArray(group.licenseFamilies) || group.licenseFamilies.length === 0) {
    fail(`${context}.licenseFamilies must be a non-empty array of strings.`);
  }

  validateStringArrayField(group, 'restrictions', context);
  validateStringArrayField(group, 'blockedUseCases', context);
  validateStringArrayField(group, 'notes', context);

  for (const field of [
    'defaultIncludedInCore',
    'fetchableByDefault',
    'requiresExplicitConsent'
  ]) {
    if (typeof group[field] !== 'boolean') {
      fail(`${context}.${field} must be boolean.`);
    }
  }

  for (const field of [
    'commercialUse',
    'derivativesAllowed',
    'redistributionAllowed',
    'noticeRequired',
    'licenseTextRequired',
    'noticeReportRequired',
    'creatorAttributionRequired',
    'outputAttributionRequired',
    'shareAlikeRequired',
    'sourceDisclosureRequired',
    'networkSourceDisclosureRequired',
    'clientDistributionAllowed',
    'serverUseAllowed',
    'requiresNoticeReport',
    'requiresAttributionReport'
  ]) {
    if (group[field] === undefined) {
      continue;
    }

    const value = group[field];

    const valid =
      typeof value === 'boolean' ||
      value === 'unknown' ||
      value === 'license_dependent' ||
      value === 'policy_dependent' ||
      value === 'noncommercial_only';

    if (!valid) {
      fail(`${context}.${field} must be boolean or a known policy marker when present.`);
    }
  }

  if (groupIdAlreadySeen || typeof group.id !== 'string') {
    return null;
  }

  return group;
}

function validateLicenseGroups() {
  const licenseGroupIds = new Set();
  const licenseGroupsById = new Map();

  for (const fileName of listJsonFiles(paths.licenseGroups)) {
    const group = validateLicenseGroupFile(fileName, licenseGroupIds);

    if (group) {
      licenseGroupsById.set(group.id, group);
    }
  }

  return {
    licenseGroupIds,
    licenseGroupsById
  };
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

  if (license.attributionRequired !== undefined) {
    fail(`${context}.license.attributionRequired is deprecated. Use noticeRequired, creatorAttributionRequired, and outputAttributionRequired instead.`);
  }

  for (const field of [
    'commercialUse',
    'noticeRequired',
    'licenseTextRequired',
    'noticeReportRequired',
    'creatorAttributionRequired',
    'outputAttributionRequired',
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
  const { licenseGroupIds, licenseGroupsById } = validateLicenseGroups();
  const policyIds = validatePolicies(licenseGroupIds, licenseGroupsById);
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
