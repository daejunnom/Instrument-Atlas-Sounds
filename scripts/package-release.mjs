import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { zipSync } from 'fflate';

const rootDir = process.cwd();

const paths = {
  packageJson: path.join(rootDir, 'package.json'),
  buildScript: path.join(rootDir, 'scripts', 'build.mjs'),
  distRoot: path.join(rootDir, 'dist', 'sounds', 'v1'),
  releaseDir: path.join(rootDir, 'release')
};

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}

function readJson(filePath) {
  const raw = stripBom(fs.readFileSync(filePath, 'utf8'));
  return JSON.parse(raw);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}

function listFilesRecursive(dir) {
  const files = [];

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

function getPackageInfo() {
  if (!fs.existsSync(paths.packageJson)) {
    throw new Error('Missing package.json');
  }

  const pkg = readJson(paths.packageJson);

  if (!pkg.name || typeof pkg.name !== 'string') {
    throw new Error('package.json must contain a string "name".');
  }

  if (!pkg.version || typeof pkg.version !== 'string') {
    throw new Error('package.json must contain a string "version".');
  }

  return {
    name: pkg.name,
    version: pkg.version
  };
}

function shouldSkipBuild() {
  return process.argv.includes('--skip-build');
}

function runBuild() {
  if (!fs.existsSync(paths.buildScript)) {
    throw new Error('Missing scripts/build.mjs. Package requires build first.');
  }

  console.log('Running build...');
  execFileSync(process.execPath, [paths.buildScript], {
    cwd: rootDir,
    stdio: 'inherit'
  });
  console.log('');
}

function assertDistExists() {
  const manifestPath = path.join(paths.distRoot, 'manifest.json');
  const sourcesDir = path.join(paths.distRoot, 'sources');
  const policiesDir = path.join(paths.distRoot, 'policies');
  const licenseGroupsDir = path.join(paths.distRoot, 'license-groups');
  const indexesDir = path.join(paths.distRoot, 'indexes');

  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing dist/sounds/v1/manifest.json. Run npm run build first.');
  }

  if (!fs.existsSync(sourcesDir)) {
    throw new Error('Missing dist/sounds/v1/sources directory. Run npm run build first.');
  }

  if (!fs.existsSync(policiesDir)) {
    throw new Error('Missing dist/sounds/v1/policies directory. Run npm run build first.');
  }

  if (!fs.existsSync(licenseGroupsDir)) {
    throw new Error('Missing dist/sounds/v1/license-groups directory. Run npm run build first.');
  }

  if (!fs.existsSync(indexesDir)) {
    throw new Error('Missing dist/sounds/v1/indexes directory. Run npm run build first.');
  }
}

function createZip(packageName, version) {
  ensureDir(paths.releaseDir);

  const zipFileName = `${packageName}-v${version}.zip`;
  const outputPath = path.join(paths.releaseDir, zipFileName);

  removeFile(outputPath);

  const files = listFilesRecursive(paths.distRoot);
  const zipEntries = {};

  for (const filePath of files) {
    const relativeToDistRoot = path
      .relative(paths.distRoot, filePath)
      .replaceAll(path.sep, '/');

    const archivePath = `sounds/v1/${relativeToDistRoot}`;

    zipEntries[archivePath] = fs.readFileSync(filePath);
  }

  const zipped = zipSync(zipEntries, {
    level: 9
  });

  fs.writeFileSync(outputPath, zipped);

  return {
    outputPath,
    zipFileName,
    fileCount: files.length,
    sizeBytes: fs.statSync(outputPath).size
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function main() {
  const { name, version } = getPackageInfo();

  if (shouldSkipBuild()) {
    console.log('Skipping build because --skip-build was provided.');
    console.log('');
  } else {
    runBuild();
  }

  assertDistExists();

  const result = createZip(name, version);

  console.log('Package OK');
  console.log(`Generated: ${path.relative(rootDir, result.outputPath).replaceAll(path.sep, '/')}`);
  console.log('Archive root: sounds/v1/');
  console.log(`Included files: ${result.fileCount}`);
  console.log(`Size: ${formatBytes(result.sizeBytes)}`);
}

main();