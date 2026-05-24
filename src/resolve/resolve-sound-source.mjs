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

function normalizeLicenseFamily(license = {}) {
  if (typeof license.family === 'string' && license.family.trim()) {
    return license.family;
  }

  if (typeof license.category === 'string') {
    return LICENSE_CATEGORY_TO_LICENSE_FAMILY.get(license.category) ?? license.category;
  }

  return null;
}

function getPolicyStringArray(policy, field) {
  return isStringArray(policy[field]) ? policy[field] : [];
}

function getLicenseGroupsForSource(source, catalog) {
  if (isStringArray(source.licenseGroups)) {
    return uniqueStrings(source.licenseGroups).sort((a, b) => a.localeCompare(b));
  }

  const license = source.license ?? {};
  const licenseId = license.id;
  const licenseFamily = normalizeLicenseFamily(license);
  const matchedGroupIds = [];

  for (const group of catalog?.licenseGroups ?? []) {
    const groupLicenseIds = isStringArray(group.licenseIds) ? group.licenseIds : [];
    const groupLicenseFamilies = isStringArray(group.licenseFamilies) ? group.licenseFamilies : [];

    if (typeof licenseId === 'string' && groupLicenseIds.includes(licenseId)) {
      matchedGroupIds.push(group.id);
      continue;
    }

    if (typeof licenseFamily === 'string' && groupLicenseFamilies.includes(licenseFamily)) {
      matchedGroupIds.push(group.id);
    }
  }

  return uniqueStrings(matchedGroupIds).sort((a, b) => a.localeCompare(b));
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

  const licenseGroups = [];

  if (isPlainObject(manifest.licenseGroupFiles)) {
    for (const licenseGroupFilePath of Object.values(manifest.licenseGroupFiles)) {
      const fullPath = path.join(distRoot, licenseGroupFilePath);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Missing license group file: ${toPosixPath(fullPath)}`);
      }

      licenseGroups.push(readJson(fullPath));
    }
  }

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
    licenseGroups,
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

export function evaluateSourceAgainstPolicy(source, request, policy, catalog = null) {
  const license = source.license ?? {};
  const licenseId = license.id;
  const category = license.category;
  const licenseGroups = getLicenseGroupsForSource(source, catalog);
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

  const denyLicenseGroups = getPolicyStringArray(policy, 'denyLicenseGroups');
  if (denyLicenseGroups.length > 0) {
    const deniedGroups = licenseGroups.filter((licenseGroup) => denyLicenseGroups.includes(licenseGroup));

    if (deniedGroups.length > 0) {
      return reject('license_group_denied', {
        licenseGroups,
        deniedGroups
      });
    }
  }

  const allowLicenseGroups = getPolicyStringArray(policy, 'allowLicenseGroups');
  if (
    allowLicenseGroups.length > 0 &&
    !licenseGroups.some((licenseGroup) => allowLicenseGroups.includes(licenseGroup))
  ) {
    return reject('license_group_not_allowed', {
      licenseGroups,
      allowLicenseGroups
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

  if (policy.allowNoticeRequired === false && license.noticeRequired === true) {
    return reject('notice_required_but_policy_disallows_it');
  }

  if (
    policy.allowCreatorAttributionRequired === false &&
    license.creatorAttributionRequired === true
  ) {
    return reject('creator_attribution_required_but_policy_disallows_it');
  }

  if (
    policy.allowOutputAttributionRequired === false &&
    license.outputAttributionRequired === true
  ) {
    return reject('output_attribution_required_but_policy_disallows_it');
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

function summarizeRejectionReasons(rejectedSources) {
  const summary = {};

  for (const rejected of rejectedSources) {
    const reason = rejected.reason ?? 'unknown';

    summary[reason] = (summary[reason] ?? 0) + 1;
  }

  return Object.fromEntries(
    Object.entries(summary).sort(([left], [right]) => left.localeCompare(right))
  );
}

function isTrue(value) {
  return value === true;
}

function buildSourceComplianceRequirements(source) {
  const license = source?.license ?? {};

  return {
    noticeRequired: isTrue(license.noticeRequired),
    licenseTextRequired: isTrue(license.licenseTextRequired),
    noticeReportRequired: isTrue(license.noticeReportRequired),
    creatorAttributionRequired: isTrue(license.creatorAttributionRequired),
    outputAttributionRequired: isTrue(license.outputAttributionRequired),
    sourceDisclosureRequired: isTrue(license.sourceDisclosureRequired) || isTrue(license.sourceRequiredOnDistribution),
    networkSourceDisclosureRequired: isTrue(license.networkSourceDisclosureRequired) || isTrue(license.networkSourceRequired)
  };
}

function buildPolicyComplianceRequirements(policy = {}) {
  const requiresAttributionReportCapability = Boolean(
    policy.requiresAttributionReportCapability
  );

  const requiresComplianceReportCapability = Boolean(
    policy.requiresComplianceReportCapability ||
    policy.requiresNoticeReport ||
    requiresAttributionReportCapability ||
    policy.requiresExplicitConsent ||
    policy.requiresSourceDisclosureReview ||
    policy.requiresNetworkSourceDisclosureReview
  );

  return {
    requiresNoticeReport: Boolean(policy.requiresNoticeReport),
    requiresComplianceReportCapability,
    requiresAttributionReportCapability,

    requiresExplicitConsent: Boolean(policy.requiresExplicitConsent),
    requiresSourceDisclosureReview: Boolean(policy.requiresSourceDisclosureReview),
    requiresNetworkSourceDisclosureReview: Boolean(policy.requiresNetworkSourceDisclosureReview)
  };
}

function buildEffectiveComplianceRequirements(sourceRequirements, policyRequirements) {
  const noticeReportRequired = Boolean(
    sourceRequirements.noticeReportRequired ||
    policyRequirements.requiresNoticeReport
  );

  const attributionReportRequired = Boolean(
    sourceRequirements.creatorAttributionRequired ||
    sourceRequirements.outputAttributionRequired
  );

  const explicitConsentRequired = Boolean(
    policyRequirements.requiresExplicitConsent
  );

  const sourceDisclosureReviewRequired = Boolean(
    sourceRequirements.sourceDisclosureRequired ||
    policyRequirements.requiresSourceDisclosureReview
  );

  const networkSourceDisclosureReviewRequired = Boolean(
    sourceRequirements.networkSourceDisclosureRequired ||
    policyRequirements.requiresNetworkSourceDisclosureReview
  );

  const complianceReportRequired = Boolean(
    noticeReportRequired ||
    attributionReportRequired ||
    explicitConsentRequired ||
    sourceDisclosureReviewRequired ||
    networkSourceDisclosureReviewRequired ||
    policyRequirements.requiresComplianceReportCapability
  );

  return {
    noticeReportRequired,
    attributionReportRequired,
    complianceReportRequired,
    explicitConsentRequired,
    sourceDisclosureReviewRequired,
    networkSourceDisclosureReviewRequired
  };
}

function buildComplianceRequirements(selectedSource, policy) {
  if (!selectedSource) {
    return null;
  }

  const source = buildSourceComplianceRequirements(selectedSource);
  const policyRequirements = buildPolicyComplianceRequirements(policy);
  const effective = buildEffectiveComplianceRequirements(source, policyRequirements);

  return {
    source,
    policy: policyRequirements,
    effective
  };
}

function resolveComplianceWarningLevel(plan) {
  if (!plan.canRender || plan.requiresNetworkDisclosureReview) {
    return 'blocked';
  }

  if (
    plan.requiresUserConsent ||
    plan.requiresSourceDisclosureReview ||
    plan.shouldBlockDownload
  ) {
    return 'warning';
  }

  if (
    plan.requiresLicenseNotice ||
    plan.requiresLicenseText ||
    plan.requiresNoticeReport ||
    plan.requiresAttributionReport ||
    plan.requiresComplianceReport ||
    plan.requiresCreatorAttribution ||
    plan.requiresOutputAttribution
  ) {
    return 'notice';
  }

  return 'none';
}

function buildCompliancePlan(selectedSource, request, complianceRequirements) {
  if (!selectedSource || !complianceRequirements) {
    return null;
  }

  const license = selectedSource.license ?? {};
  const executionTargets = isStringArray(selectedSource.executionTargets)
    ? selectedSource.executionTargets
    : [];

  const requestedTarget =
    typeof request.executionTarget === 'string' && request.executionTarget.trim()
      ? request.executionTarget
      : null;

  const runtimeReady =
    selectedSource.status !== 'disabled' &&
    !METADATA_ONLY_STATUSES.has(selectedSource.status);

  const executionTargetAllowed = requestedTarget
    ? executionTargets.includes(requestedTarget)
    : executionTargets.length > 0;

  const effective = complianceRequirements.effective;
  const source = complianceRequirements.source;

  const canRender = Boolean(runtimeReady && executionTargetAllowed);

  const canDistributeToClient = Boolean(
    executionTargets.includes('client') &&
    license.clientDistributionAllowed === true &&
    !effective.sourceDisclosureReviewRequired &&
    !effective.networkSourceDisclosureReviewRequired
  );

  const canUseInSaaS = Boolean(
    executionTargets.includes('server') &&
    license.serverUseAllowed === true &&
    !effective.explicitConsentRequired &&
    !effective.networkSourceDisclosureReviewRequired
  );

  const requiresUserConsent = Boolean(effective.explicitConsentRequired);
  const requiresSourceDisclosureReview = Boolean(effective.sourceDisclosureReviewRequired);
  const requiresNetworkDisclosureReview = Boolean(effective.networkSourceDisclosureReviewRequired);

  const shouldBlockDownload = Boolean(
    !canRender ||
    requiresUserConsent ||
    requiresSourceDisclosureReview ||
    requiresNetworkDisclosureReview ||
    (requestedTarget === 'client' && !canDistributeToClient)
  );

  const plan = {
    canRender,
    canDistributeToClient,
    canUseInSaaS,
    requiresUserConsent,
    requiresLicenseNotice: Boolean(source.noticeRequired),
    requiresLicenseText: Boolean(source.licenseTextRequired),
    requiresNoticeReport: Boolean(effective.noticeReportRequired),
    requiresAttributionReport: Boolean(effective.attributionReportRequired),
    requiresComplianceReport: Boolean(effective.complianceReportRequired),
    requiresCreatorAttribution: Boolean(source.creatorAttributionRequired),
    requiresOutputAttribution: Boolean(source.outputAttributionRequired),
    requiresSourceDisclosureReview,
    requiresNetworkDisclosureReview,
    shouldBlockDownload,
    shouldShowWarning: false,
    warningLevel: 'none'
  };

  plan.warningLevel = resolveComplianceWarningLevel(plan);
  plan.shouldShowWarning = plan.warningLevel !== 'none';

  return plan;
}

function getMatchedValues(left = [], right = []) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function getMatchedLicenseRules(licenseId, ruleLicenseIds = []) {
  if (typeof licenseId !== 'string' || !isStringArray(ruleLicenseIds)) {
    return [];
  }

  return ruleLicenseIds.filter((ruleLicenseId) => {
    return licenseMatches(licenseId, ruleLicenseId);
  });
}

function getMatchedPolicyRules(source, policy) {
  const license = source?.license ?? {};
  const licenseId = license.id;
  const category = license.category;
  const licenseGroups = isStringArray(source?.licenseGroups) ? source.licenseGroups : [];
  const restrictions = collectSourceRestrictions(source ?? {});

  return {
    allowCategories:
      typeof category === 'string' && getPolicyStringArray(policy, 'allowCategories').includes(category)
        ? [category]
        : [],
    denyCategories:
      typeof category === 'string' && getPolicyStringArray(policy, 'denyCategories').includes(category)
        ? [category]
        : [],
    allowLicenseGroups: getMatchedValues(
      licenseGroups,
      getPolicyStringArray(policy, 'allowLicenseGroups')
    ),
    denyLicenseGroups: getMatchedValues(
      licenseGroups,
      getPolicyStringArray(policy, 'denyLicenseGroups')
    ),
    allowLicenses: getMatchedLicenseRules(
      licenseId,
      getPolicyStringArray(policy, 'allowLicenses')
    ),
    denyLicenses: getMatchedLicenseRules(
      licenseId,
      getPolicyStringArray(policy, 'denyLicenses')
    ),
    allowRestrictions: getMatchedValues(
      restrictions,
      getPolicyStringArray(policy, 'allowRestrictions')
    ),
    denyRestrictions: getMatchedValues(
      restrictions,
      getPolicyStringArray(policy, 'denyRestrictions')
    )
  };
}

function collectComplianceDiagnosticReasons(complianceRequirements, compliancePlan) {
  const reasons = [];

  if (!complianceRequirements || !compliancePlan) {
    return reasons;
  }

  const { source, policy, effective } = complianceRequirements;

  if (source.noticeRequired) reasons.push('source_notice_required');
  if (source.licenseTextRequired) reasons.push('source_license_text_required');
  if (source.noticeReportRequired) reasons.push('source_notice_report_required');
  if (source.creatorAttributionRequired) reasons.push('source_creator_attribution_required');
  if (source.outputAttributionRequired) reasons.push('source_output_attribution_required');
  if (source.sourceDisclosureRequired) reasons.push('source_disclosure_required');
  if (source.networkSourceDisclosureRequired) reasons.push('source_network_disclosure_required');

  if (policy.requiresNoticeReport) reasons.push('policy_requires_notice_report');
  if (policy.requiresComplianceReportCapability) {
    reasons.push('policy_requires_compliance_report_capability');
  }
  if (policy.requiresAttributionReportCapability) {
    reasons.push('policy_requires_attribution_report_capability');
  }
  if (policy.requiresExplicitConsent) reasons.push('policy_requires_explicit_consent');
  if (policy.requiresSourceDisclosureReview) reasons.push('policy_requires_source_disclosure_review');
  if (policy.requiresNetworkSourceDisclosureReview) {
    reasons.push('policy_requires_network_source_disclosure_review');
  }

  if (effective.noticeReportRequired) reasons.push('effective_notice_report_required');
  if (effective.attributionReportRequired) reasons.push('effective_attribution_report_required');
  if (effective.complianceReportRequired) reasons.push('effective_compliance_report_required');
  if (effective.explicitConsentRequired) reasons.push('effective_explicit_consent_required');
  if (effective.sourceDisclosureReviewRequired) reasons.push('effective_source_disclosure_review_required');
  if (effective.networkSourceDisclosureReviewRequired) {
    reasons.push('effective_network_disclosure_review_required');
  }

  if (!compliancePlan.canRender) reasons.push('plan_cannot_render');
  if (!compliancePlan.canDistributeToClient) reasons.push('plan_cannot_distribute_to_client');
  if (!compliancePlan.canUseInSaaS) reasons.push('plan_cannot_use_in_saas');
  if (compliancePlan.shouldBlockDownload) reasons.push('plan_blocks_download');
  if (compliancePlan.shouldShowWarning) reasons.push(`warning_level_${compliancePlan.warningLevel}`);

  return uniqueStrings(reasons).sort((a, b) => a.localeCompare(b));
}

function buildComplianceDiagnostics(selectedSource, policy, complianceRequirements, compliancePlan) {
  if (!selectedSource || !complianceRequirements || !compliancePlan) {
    return null;
  }

  return {
    policyId: policy.id ?? 'inline-policy',
    sourceLicenseGroups: selectedSource.licenseGroups ?? [],
    reasons: collectComplianceDiagnosticReasons(complianceRequirements, compliancePlan),
    matchedPolicyRules: getMatchedPolicyRules(selectedSource, policy)
  };
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
    const sourceWithLicenseGroups = {
      ...source,
      licenseGroups: getLicenseGroupsForSource(source, catalog)
    };

    const evaluation = evaluateSourceAgainstPolicy(
      sourceWithLicenseGroups,
      request,
      policy,
      catalog
    );

    if (evaluation.accepted) {
      accepted.push({
        source: sourceWithLicenseGroups,
        score: scoreSource(sourceWithLicenseGroups, request, policy, preferredSourceTypes)
      });
    } else {
      rejected.push({
        source: sourceWithLicenseGroups,
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
  const complianceRequirements = buildComplianceRequirements(selectedSource, policy);
  const compliancePlan = buildCompliancePlan(selectedSource, request, complianceRequirements);
  const complianceDiagnostics = buildComplianceDiagnostics(
    selectedSource,
    policy,
    complianceRequirements,
    compliancePlan
  );

  const noticeReportRequired = Boolean(
    complianceRequirements?.effective.noticeReportRequired
  );

  const attributionReportRequired = Boolean(
    complianceRequirements?.effective.attributionReportRequired
  );

  const complianceReportRequired = Boolean(
    complianceRequirements?.effective.complianceReportRequired
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
      licenseGroups: item.source.licenseGroups ?? [],
      reason: item.reason,
      details: item.details
    })),
    rejectionReasons: summarizeRejectionReasons(rejected),
    counts: {
      total: rawCandidates.length,
      accepted: candidates.length,
      rejected: rejected.length
    },
    complianceRequirements,
    compliancePlan,
    complianceDiagnostics,
    noticeReportRequired,
    attributionReportRequired,
    complianceReportRequired
  };
}