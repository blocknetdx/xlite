const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const { argv } = process;

const dir = argv[2];

(async function() {
  try {
    if(!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory())
      console.error('You must pass in a path to a directory as the first argument.');
    const files = fs.readdirSync(dir);
    for(const file of files) {
      const filePath = path.join(dir, file);
      let str = '';
      await new Promise(resolve => {
        const instance = spawn('shasum', ['-a', '256', filePath]);
        instance.on('close', () => {
          resolve();
        });
        instance.stdout.on('data', data => {
          str += data.toString('utf8');
        });
      });
      str = str.match(/\w{64}/)[0];
      console.log(str + '  ' + file);
    }
  } catch(err) {
    console.error(err);
  }
})();
