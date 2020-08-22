import {logger, requireRenderer} from '../util';
import {localStorageKeys} from '../constants';
import Token from '../types/token';
import XBridgeInfo from '../types/xbridgeinfo';

import _ from 'lodash';

/**
 * Class for getting manifest and wallet data
 */
class ConfController {

  /**
   * @type {DOMStorage}
   * @private
   */
  _domStorage = null;
  /**
   * @type {Set}
   * @private
   */
  _availableWallets = new Set();

  /**
   * Constructor
   * @param domStorage {DOMStorage}
   * @param wallets {string[]} Available wallets (tickers)
   */
  constructor(domStorage, wallets) {
    requireRenderer();
    this._domStorage = domStorage;
    this._availableWallets = new Set(wallets);
  }

  /**
   * Get raw manifest data object.
   * @returns {Array<Object>}
   */
  getManifest() {
    const manifest = this._domStorage.getItem(localStorageKeys.MANIFEST);
    if (!_.isArray(manifest))
      return [];
    return manifest;
  }

  /**
   * Get the last known manifest hash.
   * @returns {string}
   */
  getManifestHash() {
    const hash = this._domStorage.getItem(localStorageKeys.MANIFEST_SHA);
    if (!_.isString(hash))
      return '';
    return hash;
  }

  /**
   * Get the xbridge info data provider.
   * @returns {XBridgeInfo[]}
   */
  getXBridgeInfo() {
    const xbinfo = this._domStorage.getItem(localStorageKeys.XBRIDGE_INFO);
    const infos = [];
    if (!_.isArray(xbinfo)) // do not process bad data
      return infos;
    for (const info of xbinfo)
      infos.push(new XBridgeInfo(info));
    return infos;
  }

  /**
   * Fetches the latest manifest hash from the endpoint and checks
   * if it matches the hash we currently have. Updates the datastore
   * with the latest manifest hash.
   * @param req {function}
   * @returns {Promise<boolean>}
   */
  async needsUpdate(req) {
    const currentHash = this.getManifestHash();
    const manifestHash = await this.fetchManifestHash(req);
    return currentHash !== manifestHash;
  }

  /**
   * Fetch the latest manifest hash.
   * @param req {function}
   * @returns {Promise<string>}
   */
  async fetchManifestHash(req) {
    let manifestHash = '';
    try {
      const res = await req();
      manifestHash = res.headers['x-amz-meta-x-manifest-hash'];
    } catch (err) {
      logger.error('', err);
    }
    return manifestHash;
  }

  /**
   * Downloads and caches the latest token manifest.
   * @param manifestUrl {string}
   * @param manifestConfPrefix {string}
   * @param manifestHash {string}
   * @param manifestKey {string}
   * @param req {function} Manifest data request func
   * @returns {Promise<boolean>}
   */
  async updateLatest(manifestUrl, manifestConfPrefix, manifestHash, manifestKey, req) {
    let manifestData = null;
    try {
      // Get manifest
      const res = await req(manifestUrl);
      manifestData = JSON.parse(res.body.toString());
    } catch (err) {
      logger.error('failed to download latest manifest hash', err);
      return false;
    }

    let manifest = null;
    try {
      // Download manifest data (array of token objects)
      const manifestDataUrl = manifestData[manifestKey][1];
      const res = await req(manifestDataUrl);
      manifest = JSON.parse(res.body.toString());
    } catch (err) {
      logger.error('failed to download latest manifest json', err);
      return false;
    }

    // Store manifest and hash only on successful response
    if (!_.isNull(manifest) && !_.isUndefined(manifest)) {
      // Filter latest from manifest, only keep the latest conf versions
      manifest.sort((a,b) => a.xbridge_conf.localeCompare(b.xbridge_conf, 'en', { numeric: true }));
      const have = new Set();
      for (let i = manifest.length - 1; i >= 0; i--) {
        const token = manifest[i];
        if (have.has(token.ticker)) {
          manifest.splice(i, 1); // remove this conf, it's not the latest
          continue;
        }
        have.add(token.ticker);
      }

      this._domStorage.setItem(localStorageKeys.MANIFEST_SHA, manifestHash);
      this._domStorage.setItem(localStorageKeys.MANIFEST, manifest);

      // Pull the wallet confs for available wallets and get fee information.
      const fees = [];
      const reFpb = /^\s*feeperbyte\s*=\s*(\d+)\s*$/i;
      const reMtf = /^\s*mintxfee\s*=\s*(\d+)\s*$/i;
      const reCoin = /^\s*coin\s*=\s*(\d+)\s*$/i;
      const rePort = /^\s*port\s*=\s*(\d+)\s*$/i;
      for (const t of manifest) {
        const token = new Token(t);
        if (this._availableWallets.has(token.ticker)) {
          try {
            // Sample data (without //):
            // [BLOCK]
            // Title=Blocknet
            // Address=
            // Ip=127.0.0.1
            // Port=41414
            // Username=
            // Password=
            // AddressPrefix=26
            // ScriptPrefix=28
            // SecretPrefix=154
            // COIN=100000000
            // MinimumAmount=0
            // TxVersion=1
            // DustAmount=0
            // CreateTxMethod=BTC
            // GetNewKeySupported=true
            // ImportWithNoScanSupported=true
            // MinTxFee=10000
            // BlockTime=60
            // FeePerByte=20
            // Confirmations=0
            const res = await req(manifestConfPrefix + token.xbridge_conf);
            // const xbconf = res.body.toString().split(/(?:\\r)?\\n/gm); // issues
            const xbconf = [];
            let l = '';
            let p = '';
            for (const ch of res.body.toString()) {
              const l1 = /\s/.test(ch);
              const l2 = p+ch === '\\n' || p+ch === '\\r';
              if (l1 || l2) {
                if (l2) // remove the last char if it's l2 whitespace
                  l = l.slice(0, l.length-1);
                if (!/^\s*$/.test(l)) // if not empty/whitespace
                  xbconf.push(l);
                l = '';
                p = '';
                continue;
              }
              l += ch;
              p = ch;
            }
            let matchfpb = null;
            let matchminfee = null;
            let matchcoin = null;
            let matchport = null;
            for (const line of xbconf) {
              if (!matchfpb)
                matchfpb = line.match(reFpb);
              if (!matchminfee)
                matchminfee = line.match(reMtf);
              if (!matchcoin)
                matchcoin = line.match(reCoin);
              if (!matchport)
                matchport = line.match(rePort);
            }
            if (matchfpb && matchminfee && matchcoin && matchport) {
              const feeInfo = new XBridgeInfo({
                ticker: token.ticker,
                feeperbyte: Number(matchfpb[1]),
                mintxfee: Number(matchminfee[1]),
                coin: Number(matchcoin[1]),
                rpcport: Number(matchport[1]),
              });
              fees.push(feeInfo);
            } else {
              logger.error(`failed to read xbridge info for ${token.ticker}`);
              return false;
            }
          } catch (e) {
            logger.error(`failed to download xbridge info for ${token.ticker}`, e);
            return false;
          }
        }
      }
      // Store fee data
      this._domStorage.setItem(localStorageKeys.XBRIDGE_INFO, fees);

      return true;
    }

    return false;
  }

}

export default ConfController;
