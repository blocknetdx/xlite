const crypto = require('crypto');
const fs = require('fs');

module.exports.getFileHash = filePath => new Promise((resolve, reject) => {
  const hash = crypto.createHash('sha256');
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', reject);
  fileStream.on('data', data => {
    hash.update(data);
  });
  fileStream.on('close', () => {
    resolve(hash.digest('hex'));
  });
});
