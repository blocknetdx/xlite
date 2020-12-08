const fs = require('fs-extra');
const omit = require('lodash/omit');
const path = require('path');
const rmrf = require('rmrf-promise');

(async function() {

  const baseDir = path.resolve(__dirname, '../');
  const buildDir = path.join(baseDir, 'dist-native');
  const tempDir = path.join(baseDir, 'temp');

  await rmrf(tempDir);

  await fs.ensureDir(tempDir);
  await fs.ensureDir(buildDir);

  const filesToCopy = [
    'dist',
    'locales',
    'static-data',
  ];

  // Copy base directories
  for(const file of filesToCopy) {
    await fs.copy(path.join(baseDir, file), path.join(tempDir, file));
  }

  // Copy platform-specific binary or whole bin directory if platform directory not specified
  const platform = process.argv[process.argv.length - 1].trim();
  const binDir = path.resolve(__dirname, '../bin');
  const platformBinDir = path.join(binDir, platform);
  const tempBinDir = path.join(tempDir, 'bin');
  if(fs.existsSync(platformBinDir)) {
    await fs.ensureDir(tempBinDir);
    await fs.copy(platformBinDir, path.join(tempBinDir, platform));
  } else {
    await fs.copy(binDir, tempBinDir);
  }

  const packageJson = await fs.readJson(path.join(baseDir, 'package.json'));
  const newPackageJson = omit(packageJson, ['build', 'devDependencies']);

  await fs.writeJson(path.join(tempDir, 'package.json'), newPackageJson, {spaces: 2});

})();
