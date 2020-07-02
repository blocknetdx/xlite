const colors = require('colors/safe');
const fs = require('fs-extra');
const path = require('path');

(async function() {

  const srcDir = path.resolve(__dirname, '../src');
  const distDir = path.resolve(__dirname, '../dist');

  await fs.ensureDir(distDir);
  const files = await fs.readdir(srcDir);

  for(const file of files) {

    // ignore the app and scss folders because those get transpiled, not copied
    if(file === 'app') continue;
    if(file === 'scss') continue;

    const initialPath = path.join(srcDir, file);
    const finalPath = path.join(distDir, file);

    await fs.copy(initialPath, finalPath);

    console.log(colors.green(`Copied ${initialPath} -> ${finalPath}`));

  }

})();
