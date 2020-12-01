const fs = require('fs-extra');
const https = require('https');
const path = require('path');
const unzip = require('extract-zip');
const invert = require('lodash/invert');
const { getFileHash } = require('../src/server/util/get-file-hash');
const { ccBinDirs, ccBinNames } = require('../src/server/constants/cc-bin');

(async function() {

  const platform = process.argv[process.argv.length - 1].trim();
  const binPath = path.resolve(__dirname, '../bin');
  const binariesJsonPath = path.resolve(__dirname, '../bin.json');
  const binaries = await fs.readJson(binariesJsonPath);
  const dir = path.join(binPath, platform);
  const downloadPath = binaries[platform] ? binaries[platform][0] : '';
  await fs.emptyDir(dir);

  if(!downloadPath) {
    console.log(`No binary download path found in bin.json for platform ${platform}`);
    return;
  }

  const zipFileName = downloadPath.match(/\/([^/]+)$/)[1];
  const zipFilePath = path.join(dir, zipFileName);

  console.log(`Downloading ${downloadPath}`);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(zipFilePath);
    writeStream.on('close', () => {
      resolve();
    });
    https
      .get(downloadPath, res => {
        const { statusCode } = res;
        if(statusCode !== 200) {
          reject(new Error(`Failed with status code ${statusCode}`));
        } else {
          res.pipe(writeStream);
        }
      });
  });

  if(path.extname(zipFileName) === '.zip') {
    console.log(`Unzipping ${zipFilePath}`);
    await unzip(zipFilePath, {dir});
    await fs.remove(zipFilePath);
    const hash = await getFileHash(path.join(dir, ccBinNames[invert(ccBinDirs)[platform]]));
    const prevHash = binaries[platform][1];
    // If the binary has been updated, then update the hash in the json file
    if(prevHash !== hash) {
      binaries[platform][1] = hash;
      await fs.writeJson(binariesJsonPath, binaries, {spaces: 2});
    }

  }

})();
