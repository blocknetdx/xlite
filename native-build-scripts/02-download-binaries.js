const fs = require('fs-extra');
const { https } = require('follow-redirects');
const path = require('path');
const crypto = require('crypto');
const unzip = require('extract-zip');

(async function() {

  const platform = process.argv[process.argv.length - 1].trim();
  const binPath = path.resolve(__dirname, '../bin');
  const binaries = await fs.readJson(path.resolve(__dirname, '../bin.json'));
  const dir = path.join(binPath, platform);
  await fs.emptyDir(dir);

  if(!binaries[platform]) {
    throw new Error(`No binary download path found in bin.json for platform '${platform}'`);
  }

  const downloadPath = binaries[platform]['url'];
  const downloadHash = binaries[platform]['hash'];
  
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

  const buff = fs.readFileSync(zipFilePath);
  const hash = crypto.createHash("sha256").update(buff).digest("hex");
  if (downloadHash != hash) {
    await fs.emptyDir(dir);
    throw new Error(`Hashes don't match '${hash}' (expected: '${downloadHash}')`);
  }

  if(path.extname(zipFileName) === '.zip') {
    console.log(`Unzipping ${zipFilePath}`);
    await unzip(zipFilePath, {dir});
    await fs.remove(zipFilePath);
  }

})();
