import request from 'superagent';
import { requireRenderer } from '../util';
import { HTTP_REQUEST_TIMEOUT, localStorageKeys } from '../constants';
import domStorage from './dom-storage';

const atATime = (max, promiseFuncs) => new Promise((resolve, reject) => {
  promiseFuncs = [...promiseFuncs];
  const resultsObj = {};
  const promises = [];
  for(let i = 0; i < max; i++) {
    promises.push((async function() {
      while(promiseFuncs.length > 0) {
        const idx = promiseFuncs.length - 1;
        const func = promiseFuncs.pop();
        const res = await func();
        resultsObj[idx] = res;
      }
    })());
  }
  Promise
    .all(promises)
    .then(() => {
      resolve(Object
        .keys(resultsObj)
        .sort((a, b) => {
          a = Number(a);
          b = Number(b);
          return a === b ? 0 : a > b ? 1 : -1;
        })
        .map(key => resultsObj[key])
      );
    })
    .catch(reject);
});

/**
 * Class for getting manifest and wallet data
 */
export default class ConfController {

  _walletConfPatt = /^wallet-confs\/(.+\.conf$)/;
  _xbridgeConfPatt = /^xbridge-confs\/(.+\.conf$)/;
  _manifestPath = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/blockchainconfigfilehashmap.json';

  constructor() {
    requireRenderer();
  }

  /**
   * Gets the latest manifest and conf data
   * @returns {Promise<{manifestData: Object, xbridgeConfs: Object, manifest: Object[], walletConfs: Object, manifestSha: string}>}
   */
  async getLatest() {

    const manifestPath = this._manifestPath;

    // Compare hashes
    const prevSha = domStorage.getItem(localStorageKeys.MANIFEST_SHA) || '';
    const newSha = await this.getSha();
    if(prevSha === newSha) return;

    // Get manifest
    const res = await request
      .get(manifestPath)
      .timeout(HTTP_REQUEST_TIMEOUT)
      .responseType('blob');
    const manifestData = JSON.parse(res.body.toString('utf8'));
    const manifestKey = 'manifest-latest.json';
    const res1 = await request
      .get(manifestData[manifestKey][1])
      .timeout(HTTP_REQUEST_TIMEOUT)
      .responseType('blob');
    const manifest = JSON.parse(res1.body.toString('utf8'));

    const keys = Object.keys(manifestData);
    const prevManifestData = domStorage.getItem(localStorageKeys.MANIFEST_DATA) || {};

    // Get xbridge confs
    const xbridgeConfPatt = this._xbridgeConfPatt;
    const xbridgeConfKeys = keys.filter(key => xbridgeConfPatt.test(key));
    const prevXbridgeConfs = domStorage.getItem(localStorageKeys.XBRIDGE_CONFS) || {};
    const xbridgeConfs = await this._getConfs(xbridgeConfKeys, manifestData, prevManifestData, xbridgeConfPatt, prevXbridgeConfs);

    // Get wallet confs
    const walletConfPatt = this._walletConfPatt;
    const walletConfKeys = keys.filter(key => walletConfPatt.test(key));
    const prevWalletConfs = domStorage.getItem(localStorageKeys.WALLET_CONFS) || {};
    const walletConfs = await this._getConfs(walletConfKeys, manifestData, prevManifestData, walletConfPatt, prevWalletConfs);

    return {
      manifestSha: newSha,
      manifestData,
      manifest,
      walletConfs,
      xbridgeConfs
    };

  }

  /**
   * @returns {Promise<string>}
   */
  async getSha() {
    const res = await request
      .head(this._manifestPath)
      .timeout(HTTP_REQUEST_TIMEOUT);
    return res.headers['x-amz-meta-x-manifest-hash'];
  }

  /**
   * @param confKeys
   * @param newData
   * @param prevData
   * @param confPatt
   * @param prevConfs
   * @returns {Promise<*>}
   * @private
   */
  async _getConfs(confKeys, newData, prevData, confPatt, prevConfs) {

    const keyToFilename = confKeys
      .reduce((obj, key) => Object.assign({}, obj, {[key]: key.match(confPatt)[1]}), {});

    const newConfs = {};

    const promiseFuncs = confKeys
      .filter(key => {
        const newHash = newData[key][0];
        const prevHash = prevData[key] ? prevData[key][0] : '';
        return newHash !== prevHash || !prevConfs[keyToFilename[key]];
      })
      .map(key => async function() {
        const res = await request
          .get(newData[key][1])
          .timeout(HTTP_REQUEST_TIMEOUT)
          .responseType('blob');
        const text = res.body.toString('utf8');
        const fileName = keyToFilename[key];
        newConfs[fileName] = text;
      });

    // Limit downloads to only so many at a time in order to not choke internet connections
    await atATime(40, promiseFuncs);

    // Merge unchanged confs with new confs
    const confs = confKeys
      .reduce((obj, key) => {
        const fileName = keyToFilename[key];
        if(newConfs[fileName]) {
          return Object.assign({}, obj, {[fileName]: newConfs[fileName]});
        } else {
          return Object.assign({}, obj, {[fileName]: prevConfs[fileName]});
        }
      }, {});

    return confs;

  }

}
