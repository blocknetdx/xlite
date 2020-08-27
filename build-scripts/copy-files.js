const colors = require('colors/safe');
const fs = require('fs-extra');
const path = require('path');

const copyDir = async (srcDir, distDir, ignores) => {
  await fs.ensureDir(distDir);
  const files = await fs.readdir(srcDir);
  for (const file of files) {
    // ignore the app and scss folders because those get transpiled, not copied
    if(ignores.has(file))
      continue;
    const initialPath = path.join(srcDir, file);
    const finalPath = path.join(distDir, file);
    await fs.copy(initialPath, finalPath);
    console.log(colors.green(`Copied ${initialPath} -> ${finalPath}`));
  }
};
(async function() {
  await copyDir(path.resolve(__dirname, '../src'), path.resolve(__dirname, '../dist'), new Set(['app', 'scss']));
  await copyDir(path.resolve(__dirname, '../blockchain-configuration-files'), path.resolve(__dirname, '../dist/blockchain-configuration-files'), new Set());
})();
