const request = require('superagent');
const fs = require('fs-extra');
const path = require('path');
const colors = require('colors/safe');

/**
 * @param port {number}
 * @param username {string}
 * @param password {string}
 * @param method {string}
 * @param params {[any]}
 * @returns {Promise<[any]>}
 */
const makeRequest = async function(port, username, password, method, params = []) {
  try {
    const res = await request
      .post(`http://localhost:${port}`)
      .auth(username, password)
      .accept('application/json')
      .timeout(15000)
      .send(JSON.stringify({
        method,
        params
      }));
    return [null, res];
  } catch(err) {
    return [err];
  }
};

const makeRPCRequest = async function(coin, method, params) {
  const [err, res] = await makeRequest(coin.rpcPort, coin.rpcUsername, coin.rpcPassword, method, params);
  if(err) {
    console.log(colors.red(`${method} for ${coin.ticker} failed with error ${err.message}`));
    return null;
  } else {
    const { result, error } = res.body;
    if(error) {
      console.log(colors.red(`${method} for ${coin.ticker} failed with code ${error.code} and message '${error.message}'`));
      return null;
    } else {
      console.log(colors.green(`${method} for ${coin.ticker} succeeded`));
      return result;
    }
  }
};

const { HOME: homeDir } = process.env;
const appDataDir = process.platform === 'darwin' ? path.join(homeDir, 'Library', 'Application Support') : path.join(homeDir, '.config');
const ccSettingsDir = path.join(appDataDir, 'CloudChains', 'settings');

const coinConfigs = fs.readdirSync(ccSettingsDir)
  .filter(f => path.extname(f) === '.json')
  .filter(f => !/master/.test(f))
  .map(f => ({
    ticker: f.match(/-(\w+)\./)[1],
    ...fs.readJsonSync(path.join(ccSettingsDir, f))
  }));

(async function() {
  for(const coin of coinConfigs) {
    console.log(`\nTesting ${coin.ticker}`);
    await makeRPCRequest(coin, 'getinfo');
    await makeRPCRequest(coin, 'getaddressesbyaccount', ['main']);
    await makeRPCRequest(coin, 'listunspent');
    await makeRPCRequest(coin, 'listtransactions', [0, Number((Date.now() / 1000).toFixed(0))]);
  }
})();
