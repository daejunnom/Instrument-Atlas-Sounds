import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const rootDir = process.cwd();

const paths = {
  sourceRoot: path.join(rootDir, 'manifests', 'v1'),
  sourceManifest: path.join(rootDir, 'manifests', 'v1', 'manifest.json'),
  sourceSources: path.join(rootDir, 'manifests', 'v1', 'sources'),
  sourcePolicies: path.join(rootDir, 'manifests', 'v1', 'policies'),
  sourceLicenseGroups: path.join(rootDir, 'manifests', 'v1', 'license-groups'),
  validateScript: path.join(rootDir, 'scripts', 'validate.mjs'),
  packageJson: path.join(rootDir, 'package.json'),

  distRoot: path.join(rootDir, 'dist', 'sounds', 'v1'),
  distSources: path.join(rootDir, 'dist', 'sounds', 'v1', 'sources'),
  distPolicies: path.join(rootDir, 'dist', 'sounds', 'v1', 'policies'),
  distLicenseGroups: path.join(rootDir, 'dist', 'sounds', 'v1', 'license-groups'),
  distIndexes: path.join(rootDir, 'dist', 'sounds', 'v1', 'indexes')
};

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function copyJsonFile(sourcePath, outputPath) {
  const data = readJson(sourcePath);
  writeJson(outputPath, data);
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing directory: ${path.relative(rootDir, dir)}`);
  }

  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, {
      recursive: true,
      force: true
    });
  }
}

function runValidation() {
  if (!fs.existsSync(paths.validateScript)) {
    throw new Error('Missing scripts/validate.mjs. Build requires validation first.');
  }

  console.log('Running validation...');
  execFileSync(process.execPath, [paths.validateScript], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('');
}

function loadPackageVersion() {
  if (!fs.existsSync(paths.packageJson)) {
    return '0.0.0';
  }

  const pkg = readJson(paths.packageJson);
  return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
}

function loadSourceFiles() {
  const sourceFiles = [];

  for (const fileName of listJsonFiles(paths.sourceSources)) {
    const filePath = path.join(paths.sourceSources, fileName);
    const data = readJson(filePath);

    sourceFiles.push({
      fileName,
      filePath,
      data
    });
  }

  return sourceFiles;
}

function loadPolicyFiles() {
  const policyFiles = [];

  for (const fileName of listJsonFiles(paths.sourcePolicies)) {
    const filePath = path.join(paths.sourcePolicies, fileName);
    const data = readJson(filePath);

    policyFiles.push({
      fileName,
      filePath,
      data
    });
  }

  return policyFiles;
}

function loadLicenseGroupFiles() {
  const licenseGroupFiles = [];

  for (const fileName of listJsonFiles(paths.sourceLicenseGroups)) {
    const filePath = path.join(paths.sourceLicenseGroups, fileName);
    const data = readJson(filePath);

    licenseGroupFiles.push({
      fileName,
      filePath,
      data
    });
  }

  return licenseGroupFiles;
}

function flattenSources(sourceFiles) {
  return sourceFiles
    .flatMap((sourceFile) => {
      return sourceFile.data.items.map((source) => ({
        ...source,
        sourceFile: sourceFile.fileName
      }));
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id.localeCompare(b.id);
    });
}

function ensureArrayMapEntry(map, key) {
  if (!map[key]) {
    map[key] = [];
  }

  return map[key];
}

function summarizeSource(source) {
  return {
    id: source.id,
    title: source.title,
    sourceType: source.sourceType,
    engineType: source.engineType ?? null,
    priority: source.priority,
    status: source.status,
    executionTargets: source.executionTargets,
    license: {
      id: source.license.id,
      category: source.license.category,
      commercialUse: source.license.commercialUse,
      noticeRequired: source.license.noticeRequired,
      licenseTextRequired: source.license.licenseTextRequired,
      noticeReportRequired: source.license.noticeReportRequired,
      creatorAttributionRequired: source.license.creatorAttributionRequired,
      outputAttributionRequired: source.license.outputAttributionRequired,
      clientDistributionAllowed: source.license.clientDistributionAllowed,
      serverUseAllowed: source.license.serverUseAllowed
    },
    instrumentIds: source.instrumentIds,
    capabilities: source.capabilities,
    renderDefaults: source.renderDefaults,
    sourceFile: source.sourceFile
  };
}

function sortIndexObject(indexObject) {
  const sorted = {};

  for (const key of Object.keys(indexObject).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = indexObject[key].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id.localeCompare(b.id);
    });
  }

  return sorted;
}

function buildIndexes(sources, version) {
  const byInstrument = {};
  const byLicense = {};
  const byEngine = {};
  const byExecutionTarget = {};
  const bySourceType = {};

  for (const source of sources) {
    const summary = summarizeSource(source);

    for (const instrumentId of source.instrumentIds) {
      ensureArrayMapEntry(byInstrument, instrumentId).push(summary);
    }

    ensureArrayMapEntry(byLicense, source.license.id).push(summary);
    ensureArrayMapEntry(byLicense, source.license.category).push(summary);

    const engineKey = source.engineType ?? source.sourceType;
    ensureArrayMapEntry(byEngine, engineKey).push(summary);

    for (const target of source.executionTargets) {
      ensureArrayMapEntry(byExecutionTarget, target).push(summary);
    }

    ensureArrayMapEntry(bySourceType, source.sourceType).push(summary);
  }

  const common = {
    schemaVersion: 1,
    soundLibraryVersion: version,
    generatedAt: new Date().toISOString()
  };

  return {
    byInstrument: {
      ...common,
      indexType: 'by-instrument',
      count: Object.keys(byInstrument).length,
      items: sortIndexObject(byInstrument)
    },
    byLicense: {
      ...common,
      indexType: 'by-license',
      count: Object.keys(byLicense).length,
      items: sortIndexObject(byLicense)
    },
    byEngine: {
      ...common,
      indexType: 'by-engine',
      count: Object.keys(byEngine).length,
      items: sortIndexObject(byEngine)
    },
    byExecutionTarget: {
      ...common,
      indexType: 'by-execution-target',
      count: Object.keys(byExecutionTarget).length,
      items: sortIndexObject(byExecutionTarget)
    },
    bySourceType: {
      ...common,
      indexType: 'by-source-type',
      count: Object.keys(bySourceType).length,
      items: sortIndexObject(bySourceType)
    }
  };
}

function buildDistManifest({
  sourceManifest,
  version,
  sourceFiles,
  policyFiles,
  licenseGroupFiles,
  sources
}) {
  const sourceFileEntries = {};
  for (const sourceFile of sourceFiles) {
    const id = sourceFile.fileName.replace(/\.json$/, '');
    sourceFileEntries[id] = `sources/${sourceFile.fileName}`;
  }

  const policyFileEntries = {};
  for (const policyFile of policyFiles) {
    const id = policyFile.fileName.replace(/\.json$/, '');
    policyFileEntries[id] = `policies/${policyFile.fileName}`;
  }

  const licenseGroupFileEntries = {};
  for (const licenseGroupFile of licenseGroupFiles) {
    const id = licenseGroupFile.fileName.replace(/\.json$/, '');
    licenseGroupFileEntries[id] = `license-groups/${licenseGroupFile.fileName}`;
  }

  const countsBySourceType = {};
  const countsByLicenseCategory = {};
  const countsByExecutionTarget = {};

  for (const source of sources) {
    countsBySourceType[source.sourceType] =
      (countsBySourceType[source.sourceType] ?? 0) + 1;

    countsByLicenseCategory[source.license.category] =
      (countsByLicenseCategory[source.license.category] ?? 0) + 1;

    for (const target of source.executionTargets) {
      countsByExecutionTarget[target] =
        (countsByExecutionTarget[target] ?? 0) + 1;
    }
  }

  return {
    schemaVersion: 1,
    soundLibraryVersion: version,
    generatedAt: new Date().toISOString(),
    basePath: sourceManifest.basePath ?? 'sounds/v1',
    atlasCompatibility: sourceManifest.atlasCompatibility ?? null,
    defaults: sourceManifest.defaults ?? {},
    counts: {
      sources: sources.length,
      sourceFiles: sourceFiles.length,
      policies: policyFiles.length,
      licenseGroups: licenseGroupFiles.length,
      bySourceType: countsBySourceType,
      byLicenseCategory: countsByLicenseCategory,
      byExecutionTarget: countsByExecutionTarget
    },
    sourceFiles: sourceFileEntries,
    policyFiles: policyFileEntries,
    licenseGroupFiles: licenseGroupFileEntries,
    indexFiles: {
      byInstrument: 'indexes/by-instrument.json',
      byLicense: 'indexes/by-license.json',
      byEngine: 'indexes/by-engine.json',
      byExecutionTarget: 'indexes/by-execution-target.json',
      bySourceType: 'indexes/by-source-type.json'
    }
  };
}

function copySources(sourceFiles) {
  for (const sourceFile of sourceFiles) {
    copyJsonFile(
      sourceFile.filePath,
      path.join(paths.distSources, sourceFile.fileName)
    );
  }
}

function copyPolicies(policyFiles) {
  for (const policyFile of policyFiles) {
    copyJsonFile(
      policyFile.filePath,
      path.join(paths.distPolicies, policyFile.fileName)
    );
  }
}

function copyLicenseGroups(licenseGroupFiles) {
  for (const licenseGroupFile of licenseGroupFiles) {
    copyJsonFile(
      licenseGroupFile.filePath,
      path.join(paths.distLicenseGroups, licenseGroupFile.fileName)
    );
  }
}

function shouldSkipValidation() {
  return process.argv.includes('--skip-validation');
}

function main() {
  if (shouldSkipValidation()) {
    console.log('Skipping validation because --skip-validation was provided.');
    console.log('');
  } else {
    runValidation();
  }

  const version = loadPackageVersion();
  const sourceManifest = readJson(paths.sourceManifest);
  const sourceFiles = loadSourceFiles();
  const policyFiles = loadPolicyFiles();
  const licenseGroupFiles = loadLicenseGroupFiles();
  const sources = flattenSources(sourceFiles);

  removeDir(paths.distRoot);

  fs.mkdirSync(paths.distSources, { recursive: true });
  fs.mkdirSync(paths.distPolicies, { recursive: true });
  fs.mkdirSync(paths.distLicenseGroups, { recursive: true });
  fs.mkdirSync(paths.distIndexes, { recursive: true });

  copySources(sourceFiles);
  copyPolicies(policyFiles);
  copyLicenseGroups(licenseGroupFiles);

  const indexes = buildIndexes(sources, version);

  writeJson(path.join(paths.distIndexes, 'by-instrument.json'), indexes.byInstrument);
  writeJson(path.join(paths.distIndexes, 'by-license.json'), indexes.byLicense);
  writeJson(path.join(paths.distIndexes, 'by-engine.json'), indexes.byEngine);
  writeJson(path.join(paths.distIndexes, 'by-execution-target.json'), indexes.byExecutionTarget);
  writeJson(path.join(paths.distIndexes, 'by-source-type.json'), indexes.bySourceType);

  const distManifest = buildDistManifest({
    sourceManifest,
    version,
    sourceFiles,
    policyFiles,
    licenseGroupFiles,
    sources
  });

  writeJson(path.join(paths.distRoot, 'manifest.json'), distManifest);

  console.log('Build OK');
  console.log('Generated manifest: dist/sounds/v1/manifest.json');
  console.log(`Copied source files: ${sourceFiles.length}`);
  console.log(`Copied policy files: ${policyFiles.length}`);
  console.log(`Copied license group files: ${licenseGroupFiles.length}`);
  console.log(`Generated indexes: 5`);
  console.log(`Indexed sound sources: ${sources.length}`);
}

main();
