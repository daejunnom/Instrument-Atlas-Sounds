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
  console.log(`Allowed statuses: ${result.request.runtime.allowStatuses.join(', ')}`);
  console.log(`Allow metadata only: ${result.request.runtime.allowMetadataOnly ? 'yes' : 'no'}`);
  console.log(`Accepted candidates: ${result.counts.accepted}`);
  console.log(`Rejected candidates: ${result.counts.rejected}`);

  if (Object.keys(result.rejectionReasons ?? {}).length > 0) {
    console.log(`Rejection reasons: ${JSON.stringify(result.rejectionReasons)}`);
  }

  if (!result.selectedSource) {
    console.log('');
    console.log('No compatible sound source selected.');

    if (result.rejectedSources.length > 0) {
      console.log('');
      console.log('Rejected sources:');
      for (const rejected of result.rejectedSources) {
        const groups = (rejected.licenseGroups ?? []).join(', ') || 'none';
        console.log(`- ${rejected.id}: ${rejected.reason} [groups: ${groups}]`);
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
  console.log(`- licenseGroups: ${(result.selectedSource.licenseGroups ?? []).join(', ') || 'none'}`);
  console.log(`- noticeReportRequired: ${result.noticeReportRequired ? 'yes' : 'no'}`);
  console.log(`- attributionReportRequired: ${result.attributionReportRequired ? 'yes' : 'no'}`);
  console.log(`- resolverScore: ${result.selectedSource.resolverScore}`);

  if (result.complianceRequirements) {
    const requirements = result.complianceRequirements;

    console.log('');
    console.log('Compliance requirements:');
    console.log(`- source.noticeRequired: ${requirements.source.noticeRequired ? 'yes' : 'no'}`);
    console.log(`- source.licenseTextRequired: ${requirements.source.licenseTextRequired ? 'yes' : 'no'}`);
    console.log(`- source.creatorAttributionRequired: ${requirements.source.creatorAttributionRequired ? 'yes' : 'no'}`);
    console.log(`- source.outputAttributionRequired: ${requirements.source.outputAttributionRequired ? 'yes' : 'no'}`);
    console.log(`- policy.requiresNoticeReport: ${requirements.policy.requiresNoticeReport ? 'yes' : 'no'}`);
    console.log(`- policy.requiresAttributionReport: ${requirements.policy.requiresAttributionReport ? 'yes' : 'no'}`);
    console.log(`- effective.noticeReportRequired: ${requirements.effective.noticeReportRequired ? 'yes' : 'no'}`);
    console.log(`- effective.attributionReportRequired: ${requirements.effective.attributionReportRequired ? 'yes' : 'no'}`);
  }

  if (result.compliancePlan) {
    const plan = result.compliancePlan;

    console.log('');
    console.log('Compliance plan:');
    console.log(`- canRender: ${plan.canRender ? 'yes' : 'no'}`);
    console.log(`- canDistributeToClient: ${plan.canDistributeToClient ? 'yes' : 'no'}`);
    console.log(`- canUseInSaaS: ${plan.canUseInSaaS ? 'yes' : 'no'}`);
    console.log(`- requiresUserConsent: ${plan.requiresUserConsent ? 'yes' : 'no'}`);
    console.log(`- requiresLicenseNotice: ${plan.requiresLicenseNotice ? 'yes' : 'no'}`);
    console.log(`- requiresLicenseText: ${plan.requiresLicenseText ? 'yes' : 'no'}`);
    console.log(`- requiresNoticeReport: ${plan.requiresNoticeReport ? 'yes' : 'no'}`);
    console.log(`- requiresAttributionReport: ${plan.requiresAttributionReport ? 'yes' : 'no'}`);
    console.log(`- requiresCreatorAttribution: ${plan.requiresCreatorAttribution ? 'yes' : 'no'}`);
    console.log(`- requiresOutputAttribution: ${plan.requiresOutputAttribution ? 'yes' : 'no'}`);
    console.log(`- requiresSourceDisclosureReview: ${plan.requiresSourceDisclosureReview ? 'yes' : 'no'}`);
    console.log(`- requiresNetworkDisclosureReview: ${plan.requiresNetworkDisclosureReview ? 'yes' : 'no'}`);
    console.log(`- shouldBlockDownload: ${plan.shouldBlockDownload ? 'yes' : 'no'}`);
    console.log(`- shouldShowWarning: ${plan.shouldShowWarning ? 'yes' : 'no'}`);
    console.log(`- warningLevel: ${plan.warningLevel}`);
  }

  if (result.complianceDiagnostics) {
    const diagnostics = result.complianceDiagnostics;

    console.log('');
    console.log('Compliance diagnostics:');
    console.log(`- policyId: ${diagnostics.policyId}`);
    console.log(`- sourceLicenseGroups: ${(diagnostics.sourceLicenseGroups ?? []).join(', ') || 'none'}`);
    console.log(`- reasons: ${(diagnostics.reasons ?? []).join(', ') || 'none'}`);

    console.log('- matchedPolicyRules:');
    for (const [field, values] of Object.entries(diagnostics.matchedPolicyRules ?? {})) {
      console.log(`  - ${field}: ${(values ?? []).join(', ') || 'none'}`);
    }
  }

  if (result.rejectedSources.length > 0) {
    console.log('');
    console.log('Rejected sources:');
    for (const rejected of result.rejectedSources) {
      const groups = (rejected.licenseGroups ?? []).join(', ') || 'none';
      console.log(`- ${rejected.id}: ${rejected.reason} [groups: ${groups}]`);
    }
  }
}

main();