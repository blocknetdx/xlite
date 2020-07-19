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
    'locales'
  ];

  for(const file of filesToCopy) {
    await fs.copy(path.join(baseDir, file), path.join(tempDir, file));
  }

  const packageJson = await fs.readJson(path.join(baseDir, 'package.json'));
  const newPackageJson = omit(packageJson, ['build', 'devDependencies']);

  await fs.writeJson(path.join(tempDir, 'package.json'), newPackageJson, {spaces: 2});

})();
