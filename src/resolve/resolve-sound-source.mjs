import fs from 'fs';
import path from 'path';

const DEFAULT_DIST_ROOT = path.join(process.cwd(), 'dist', 'sounds', 'v1');

const STATUS_RANK = new Map([
  ['production', 500],
  ['production_candidate', 400],
  ['prototype', 300],
  ['experimental', 200],
  ['planned', 100],
  ['disabled', 0]
]);

const DEFAULT_PREFERRED_SOURCE_TYPES = [
  'physical_model',
  'sample_instrument',
  'one_shot_sample',
  'synth_patch'
];

const DEFAULT_ALLOWED_RUNTIME_STATUSES = [
  'production',
  'production_candidate',
  'prototype'
];

const METADATA_ONLY_STATUSES = new Set([
  'planned'
]);

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function toPosixPath(filePath) {
  return filePath.replaceAll(path.sep, '/');
}

function licenseMatches(actualLicenseId, ruleLicenseId) {
  if (actualLicenseId === ruleLicenseId) {
    return true;
  }

  if (typeof actualLicenseId !== 'string' || typeof ruleLicenseId !== 'string') {
    return false;
  }

  const legacyPrefixes = [
    'CC-BY-NC',
    'CC-BY-ND',
    'CC-BY-SA',
    'GPL',
    'AGPL',
    'LGPL'
  ];

  for (const prefix of legacyPrefixes) {
    if (ruleLicenseId === prefix && actualLicenseId.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

function licenseListMatches(actualLicenseId, ruleLicenseIds = []) {
  return ruleLicenseIds.some((ruleLicenseId) => licenseMatches(actualLicenseId, ruleLicenseId));
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string'))];
}

function getRuntimePolicy(request = {}) {
  const runtime = isPlainObject(request.runtime) ? request.runtime : {};

  const allowStatuses = isStringArray(runtime.allowStatuses) && runtime.allowStatuses.length > 0
    ? runtime.allowStatuses
    : DEFAULT_ALLOWED_RUNTIME_STATUSES;

  return {
    allowStatuses,
    allowMetadataOnly: runtime.allowMetadataOnly === true
  };
}

function getPolicyPathFromManifest(manifest, policyId) {
  if (!isPlainObject(manifest.policyFiles)) {
    return null;
  }

  if (typeof manifest.policyFiles[policyId] === 'string') {
    return manifest.policyFiles[policyId];
  }

  const camelAlias = policyId.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  if (typeof manifest.policyFiles[camelAlias] === 'string') {
    return manifest.policyFiles[camelAlias];
  }

  return null;
}

export function loadSoundCatalog(options = {}) {
  const distRoot = options.distRoot ?? DEFAULT_DIST_ROOT;

  const manifestPath = path.join(distRoot, 'manifest.json');
  const byInstrumentPath = path.join(distRoot, 'indexes', 'by-instrument.json');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing runtime manifest: ${toPosixPath(manifestPath)}`);
  }

  if (!fs.existsSync(byInstrumentPath)) {
    throw new Error(`Missing by-instrument index: ${toPosixPath(byInstrumentPath)}`);
  }

  const manifest = readJson(manifestPath);
  const byInstrument = readJson(byInstrumentPath);

  const sourceById = new Map();

  if (isPlainObject(manifest.sourceFiles)) {
    for (const sourceFilePath of Object.values(manifest.sourceFiles)) {
      const fullPath = path.join(distRoot, sourceFilePath);
      const sourceFile = readJson(fullPath);

      if (!Array.isArray(sourceFile.items)) {
        continue;
      }

      for (const source of sourceFile.items) {
        sourceById.set(source.id, {
          ...source,
          sourceFile: path.basename(sourceFilePath)
        });
      }
    }
  }

  return {
    distRoot,
    manifest,
    byInstrument,
    sourceById
  };
}

export function loadPolicy(catalog, policyIdOrPolicy) {
  if (isPlainObject(policyIdOrPolicy)) {
    return {
      id: policyIdOrPolicy.id ?? 'inline-policy',
      ...policyIdOrPolicy
    };
  }

  const policyId =
    typeof policyIdOrPolicy === 'string' && policyIdOrPolicy.trim()
      ? policyIdOrPolicy
      : catalog.manifest.defaults?.defaultPolicy;

  if (typeof policyId !== 'string' || !policyId.trim()) {
    throw new Error('A policyId or inline licensePolicy is required.');
  }

  const policyPath = getPolicyPathFromManifest(catalog.manifest, policyId);

  if (!policyPath) {
    throw new Error(`Policy "${policyId}" is not listed in manifest.policyFiles.`);
  }

  const fullPath = path.join(catalog.distRoot, policyPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing policy file for "${policyId}": ${toPosixPath(fullPath)}`);
  }

  return readJson(fullPath);
}

function collectSourceRestrictions(source) {
  const license = source.license ?? {};
  const values = [];

  if (Array.isArray(source.restrictions)) {
    values.push(...source.restrictions);
  }

  if (Array.isArray(license.restrictions)) {
    values.push(...license.restrictions);
  }

  return uniqueStrings(values);
}

function reject(reason, details = {}) {
  return {
    accepted: false,
    reason,
    details
  };
}

function accept() {
  return {
    accepted: true,
    reason: null,
    details: {}
  };
}

export function evaluateSourceAgainstPolicy(source, request, policy) {
  const license = source.license ?? {};
  const licenseId = license.id;
  const category = license.category;
  const restrictions = collectSourceRestrictions(source);

  const executionTarget = request.executionTarget;

  if (source.status === 'disabled') {
    return reject('source_disabled');
  }

  const runtimePolicy = getRuntimePolicy(request);

  if (
    !runtimePolicy.allowStatuses.includes(source.status) &&
    runtimePolicy.allowMetadataOnly !== true
  ) {
    return reject('runtime_status_not_allowed', {
      status: source.status,
      allowedStatuses: runtimePolicy.allowStatuses
    });
  }

  if (
    METADATA_ONLY_STATUSES.has(source.status) &&
    runtimePolicy.allowMetadataOnly !== true
  ) {
    return reject('source_is_metadata_only', {
      status: source.status
    });
  }

  if (
    typeof executionTarget === 'string' &&
    executionTarget.length > 0 &&
    !source.executionTargets?.includes(executionTarget)
  ) {
    return reject('execution_target_not_supported', {
      requested: executionTarget,
      available: source.executionTargets ?? []
    });
  }

  if (
    executionTarget === 'client' &&
    license.clientDistributionAllowed !== true
  ) {
    return reject('client_distribution_not_allowed');
  }

  if (
    executionTarget === 'server' &&
    license.serverUseAllowed !== true
  ) {
    return reject('server_use_not_allowed');
  }

  if (
    isStringArray(policy.allowCategories) &&
    policy.allowCategories.length > 0 &&
    !policy.allowCategories.includes(category)
  ) {
    return reject('license_category_not_allowed', {
      category,
      allowCategories: policy.allowCategories
    });
  }

  if (
    isStringArray(policy.denyCategories) &&
    policy.denyCategories.includes(category)
  ) {
    return reject('license_category_denied', {
      category
    });
  }

  if (
    isStringArray(policy.allowLicenses) &&
    policy.allowLicenses.length > 0 &&
    !licenseListMatches(licenseId, policy.allowLicenses)
  ) {
    return reject('license_id_not_allowed', {
      licenseId,
      allowLicenses: policy.allowLicenses
    });
  }

  if (
    isStringArray(policy.denyLicenses) &&
    licenseListMatches(licenseId, policy.denyLicenses)
  ) {
    return reject('license_id_denied', {
      licenseId
    });
  }

  if (policy.allowCommercialUseOnly === true && license.commercialUse !== true) {
    return reject('commercial_use_not_allowed');
  }

  if (policy.allowAttributionRequired === false && license.attributionRequired === true) {
    return reject('attribution_required_but_policy_disallows_it');
  }

  if (policy.allowServerOnlyCopyleft === false) {
    const blockedCopyleftCategories = new Set([
      'server_only_copyleft',
      'strong_copyleft',
      'network_copyleft'
    ]);

    if (blockedCopyleftCategories.has(category)) {
      return reject('server_only_copyleft_not_allowed', {
        category
      });
    }
  }

  if (isStringArray(policy.denyRestrictions) && policy.denyRestrictions.length > 0) {
    const denied = restrictions.filter((restriction) => policy.denyRestrictions.includes(restriction));

    if (denied.length > 0) {
      return reject('restriction_denied', {
        deniedRestrictions: denied
      });
    }
  }

  return accept();
}

function getSourceTypePreferenceRank(sourceType, preferredSourceTypes) {
  const index = preferredSourceTypes.indexOf(sourceType);

  if (index === -1) {
    return 0;
  }

  return preferredSourceTypes.length - index;
}

function scoreSource(source, request, policy, preferredSourceTypes) {
  const statusScore = STATUS_RANK.get(source.status) ?? 0;
  const sourceTypeScore = getSourceTypePreferenceRank(source.sourceType, preferredSourceTypes) * 1000;
  const priorityScore = typeof source.priority === 'number' ? source.priority : 0;
  const realtimeScore =
    request.enginePreference?.preferRealtime === true && source.capabilities?.realtime === true
      ? 50
      : 0;
  const publicDomainScore =
    policy.preferPublicDomain === true && source.license?.category === 'public_domain'
      ? 25
      : 0;

  return sourceTypeScore + statusScore + priorityScore + realtimeScore + publicDomainScore;
}

function getCandidatesForInstrument(catalog, instrumentId) {
  const summaries = catalog.byInstrument.items?.[instrumentId];

  if (!Array.isArray(summaries)) {
    return [];
  }

  return summaries.map((summary) => {
    const fullSource = catalog.sourceById.get(summary.id);

    return {
      ...summary,
      ...(fullSource ?? {})
    };
  });
}

export function resolveSoundSource(request = {}, options = {}) {
  if (!isPlainObject(request)) {
    throw new TypeError('resolveSoundSource request must be an object.');
  }

  if (typeof request.instrumentId !== 'string' || !request.instrumentId.trim()) {
    throw new Error('resolveSoundSource request.instrumentId must be a non-empty string.');
  }

  const catalog = options.catalog ?? loadSoundCatalog(options);
  const policy = loadPolicy(catalog, request.licensePolicy ?? request.policyId);

  const preferredSourceTypes =
    request.enginePreference?.preferSourceTypes ??
    catalog.manifest.defaults?.preferredSourceTypes ??
    DEFAULT_PREFERRED_SOURCE_TYPES;

  const runtimePolicy = getRuntimePolicy(request);

  const rawCandidates = getCandidatesForInstrument(catalog, request.instrumentId);

  const accepted = [];
  const rejected = [];

  for (const source of rawCandidates) {
    const evaluation = evaluateSourceAgainstPolicy(source, request, policy);

    if (evaluation.accepted) {
      accepted.push({
        source,
        score: scoreSource(source, request, policy, preferredSourceTypes)
      });
    } else {
      rejected.push({
        source,
        reason: evaluation.reason,
        details: evaluation.details
      });
    }
  }

  accepted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.source.priority ?? 0) !== (a.source.priority ?? 0)) {
      return (b.source.priority ?? 0) - (a.source.priority ?? 0);
    }
    return a.source.id.localeCompare(b.source.id);
  });

  const candidates = accepted.map((item) => ({
    ...item.source,
    resolverScore: item.score
  }));

  const selectedSource = candidates[0] ?? null;

  const attributionRequired = Boolean(
    selectedSource?.license?.attributionRequired ||
    policy.requiresAttributionReport
  );

  return {
    schemaVersion: 1,
    request: {
      instrumentId: request.instrumentId,
      executionTarget: request.executionTarget ?? null,
      policyId: policy.id,
      preferSourceTypes: preferredSourceTypes,
      runtime: runtimePolicy
    },
    selectedSource,
    candidates,
    rejectedSources: rejected.map((item) => ({
      id: item.source.id,
      title: item.source.title,
      sourceType: item.source.sourceType,
      engineType: item.source.engineType ?? null,
      status: item.source.status,
      executionTargets: item.source.executionTargets ?? [],
      license: item.source.license ?? null,
      reason: item.reason,
      details: item.details
    })),
    counts: {
      total: rawCandidates.length,
      accepted: candidates.length,
      rejected: rejected.length
    },
    attributionRequired
  };
}