import fs from 'fs';
import path from 'path';
import { resolveSoundSource } from '../src/resolve/resolve-sound-source.mjs';

const rootDir = process.cwd();
const errors = [];

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(relativePath) {
  const filePath = path.join(rootDir, relativePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file: ${relativePath}`);
  }

  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    errors.push(`${message}. Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
  }
}

function assertArrayIncludes(values, expectedValue, message) {
  if (!Array.isArray(values) || !values.includes(expectedValue)) {
    errors.push(`${message}. Expected array to include ${JSON.stringify(expectedValue)}.`);
  }
}

function assertArrayExcludes(values, unexpectedValue, message) {
  if (Array.isArray(values) && values.includes(unexpectedValue)) {
    errors.push(`${message}. Expected array not to include ${JSON.stringify(unexpectedValue)}.`);
  }
}

function assertPlainObject(value, message) {
  const valid = value !== null && typeof value === 'object' && !Array.isArray(value);

  if (!valid) {
    errors.push(`${message}. Expected plain object.`);
  }
}

function resolveExample(relativePath) {
  return resolveSoundSource(readJson(relativePath));
}

function checkSuccessfulSaasResolution() {
  const result = resolveExample('examples/saas-safe-success-request.json');

  assertEqual(
    result.selectedSource?.id,
    'src_custom_karplus_strong_pluck',
    'saas-safe success request should select the custom Karplus-Strong source'
  );

  assertPlainObject(result.complianceRequirements, 'result.complianceRequirements');
  assertPlainObject(result.complianceRequirements?.source, 'result.complianceRequirements.source');
  assertPlainObject(result.complianceRequirements?.policy, 'result.complianceRequirements.policy');
  assertPlainObject(result.complianceRequirements?.effective, 'result.complianceRequirements.effective');

  assertEqual(
    result.complianceRequirements?.source.creatorAttributionRequired,
    false,
    'MIT source should not require creator attribution'
  );

  assertEqual(
    result.complianceRequirements?.source.outputAttributionRequired,
    false,
    'MIT source should not require output attribution'
  );

  assertEqual(
    result.complianceRequirements?.source.noticeRequired,
    true,
    'MIT source should require notice preservation'
  );

  assertEqual(
    result.complianceRequirements?.policy.requiresAttributionReport,
    true,
    'saas-safe legacy policy field should remain true during migration'
  );

  assertEqual(
    result.complianceRequirements?.policy.requiresComplianceReportCapability,
    true,
    'saas-safe policy should require compliance report capability'
  );

  assertEqual(
    result.complianceRequirements?.policy.requiresAttributionReportCapability,
    true,
    'saas-safe policy should require attribution report capability'
  );

  assertEqual(
    result.complianceRequirements?.effective.noticeReportRequired,
    true,
    'effective notice report requirement should be true'
  );

  assertEqual(
    result.complianceRequirements?.effective.attributionReportRequired,
    false,
    'MIT source should not require effective creator/output attribution report'
  );

  assertEqual(
    result.complianceRequirements?.effective.complianceReportRequired,
    true,
    'effective compliance report requirement should be true'
  );

  assertEqual(
    result.noticeReportRequired,
    true,
    'top-level noticeReportRequired should be true'
  );

  assertEqual(
    result.attributionReportRequired,
    false,
    'top-level attributionReportRequired should be false for MIT source'
  );

  assertEqual(
    result.complianceReportRequired,
    true,
    'top-level complianceReportRequired should be true'
  );

  assertPlainObject(result.compliancePlan, 'result.compliancePlan');

  assertEqual(
    result.compliancePlan?.canRender,
    true,
    'saas-safe success source should be renderable'
  );

  assertEqual(
    result.compliancePlan?.canUseInSaaS,
    true,
    'saas-safe success source should be usable in SaaS'
  );

  assertEqual(
    result.compliancePlan?.requiresNoticeReport,
    true,
    'saas-safe MIT source should require notice report handling'
  );

  assertEqual(
    result.compliancePlan?.requiresAttributionReport,
    false,
    'saas-safe MIT source should not require creator/output attribution report'
  );

  assertEqual(
    result.compliancePlan?.requiresComplianceReport,
    true,
    'saas-safe MIT source should require compliance report handling'
  );

  assertEqual(
    result.compliancePlan?.requiresCreatorAttribution,
    false,
    'saas-safe MIT source should not require creator attribution'
  );

  assertEqual(
    result.compliancePlan?.requiresOutputAttribution,
    false,
    'saas-safe MIT source should not require output attribution'
  );

  assertEqual(
    result.compliancePlan?.warningLevel,
    'notice',
    'saas-safe MIT source should produce notice-level warning'
  );

  assertPlainObject(result.complianceDiagnostics, 'result.complianceDiagnostics');

  assertEqual(
    result.complianceDiagnostics?.policyId,
    'saas-safe',
    'diagnostics should preserve selected policy id'
  );

  assertArrayIncludes(
    result.complianceDiagnostics?.sourceLicenseGroups,
    'permissive',
    'diagnostics should include permissive license group'
  );

  assertArrayIncludes(
    result.complianceDiagnostics?.matchedPolicyRules?.allowCategories,
    'permissive_code',
    'diagnostics should show matched allow category'
  );

  assertArrayIncludes(
    result.complianceDiagnostics?.matchedPolicyRules?.allowLicenseGroups,
    'permissive',
    'diagnostics should show matched allow license group'
  );

  assertEqual(
    result.selectedSource?.license?.id,
    'MIT',
    'saas-safe success source should preserve the selected MIT license id'
  );

  assertArrayExcludes(
    result.complianceDiagnostics?.matchedPolicyRules?.denyLicenses,
    'MIT',
    'diagnostics should not treat MIT as a denied license'
  );
}

function checkMetadataResolution() {
  const result = resolveExample('examples/metadata-resolve-request.json');

  assertEqual(
    result.selectedSource?.id,
    'src_chowkick_kick_model',
    'metadata request should select planned ChowKick source'
  );

  assertEqual(
    result.selectedSource?.status,
    'planned',
    'metadata request should select a planned source'
  );

  assertPlainObject(result.complianceRequirements, 'metadata result.complianceRequirements');
  assertPlainObject(result.compliancePlan, 'metadata result.compliancePlan');
  assertPlainObject(result.complianceDiagnostics, 'metadata result.complianceDiagnostics');

  assertEqual(
    result.compliancePlan?.canRender,
    false,
    'metadata-only planned source should not be renderable'
  );

  assertEqual(
    result.compliancePlan?.shouldBlockDownload,
    true,
    'metadata-only planned source should block download or automatic use'
  );

  assertEqual(
    result.compliancePlan?.warningLevel,
    'blocked',
    'metadata-only planned source should produce blocked warning level'
  );

  assertArrayIncludes(
    result.complianceDiagnostics?.sourceLicenseGroups,
    'permissive',
    'metadata diagnostics should include permissive license group'
  );
}

function checkExpectedRejectionShape() {
  const requestWithExpectation = readJson('examples/saas-safe-expected-rejection-request.json');
  const { expectedRejection, ...request } = requestWithExpectation;
  const result = resolveSoundSource(request);

  assertEqual(
    result.selectedSource,
    null,
    'expected rejection request should not select a source'
  );

  assertEqual(
    result.complianceRequirements,
    null,
    'expected rejection request should not include complianceRequirements'
  );

  assertEqual(
    result.compliancePlan,
    null,
    'expected rejection request should not include compliancePlan'
  );

  assertEqual(
    result.complianceDiagnostics,
    null,
    'expected rejection request should not include complianceDiagnostics'
  );

  const matchingRejectedSource = result.rejectedSources.find((rejected) => {
    return rejected.id === expectedRejection.sourceId &&
      rejected.reason === expectedRejection.reason;
  });

  assert(
    Boolean(matchingRejectedSource),
    `expected rejection should contain ${expectedRejection.sourceId}:${expectedRejection.reason}`
  );

  assertEqual(
    result.rejectionReasons?.[expectedRejection.reason],
    1,
    'expected rejection reason summary should count runtime_status_not_allowed'
  );
}

function main() {
  checkSuccessfulSaasResolution();
  checkMetadataResolution();
  checkExpectedRejectionShape();

  if (errors.length > 0) {
    console.error(`Resolver output check failed with ${errors.length} error(s):`);

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exit(1);
  }

  console.log('Resolver output check OK');
  console.log('Checked complianceRequirements, compliancePlan, complianceDiagnostics, report booleans, and expected rejection shape.'); 
}

main();