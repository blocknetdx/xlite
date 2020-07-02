const colors = require('colors/safe');
const fs = require('fs-extra');
const path = require('path');
const rmrf = require('rmrf-promise');

(async function() {

  const distDir = path.resolve(__dirname, '../dist');

  await rmrf(distDir);
  await fs.ensureDir(distDir);

  console.log(colors.yellow('Build directory cleared.'));

})();
