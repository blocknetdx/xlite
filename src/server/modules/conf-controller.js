import {HTTP_REQUEST_TIMEOUT} from '../../app/constants';
import {logger} from './logger';
import {storageKeys} from '../constants';
import Token from '../../app/types/token';
import XBridgeInfo from '../../app/types/xbridgeinfo';

import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import request from 'superagent';

/**
 * Class for getting manifest and wallet data
 */
class ConfController {

  /**
   * @type {SimpleStorage}
   * @private
   */
  _storage = null;
  /**
   * @type {Set}
   * @private
   */
  _availableWallets = new Set();

  _reFpb = /^\s*feeperbyte\s*=\s*(\d+)\s*$/i;
  _reMtf = /^\s*mintxfee\s*=\s*(\d+)\s*$/i;
  _reCoin = /^\s*coin\s*=\s*(\d+)\s*$/i;
  _rePort = /^\s*port\s*=\s*(\d+)\s*$/i;

  /**
   * Constructor
   * @param storage {SimpleStorage}
   * @param wallets {string[]} Available wallets (tickers)
   */
  constructor(storage, wallets) {
    this._storage = storage;
    this._availableWallets = new Set(wallets);
  }

  /**
   * Initialize the manifest data providers.
   * @param manifestFilesDir {string} Path to the blockchain-configuration-files
   * @return {Promise<boolean>}
   */
  async init(manifestFilesDir) {
    if (this.getManifest().length !== 0 && this.getXBridgeInfo().length !== 0)
      return true; // no init required

    try {
      if (!await fs.pathExists(manifestFilesDir)) {
        logger.error(`configuration error: path not found: ${manifestFilesDir}`);
        return false;
      }
    } catch (e) {
      logger.error('failed to init blockchain config files', e);
      return false; // fatal
    }

    // Read prepackaged manifest
    let manifest = null;
    const manifestFile = path.join(manifestFilesDir, 'manifest-latest.json');
    try {
      manifest = await fs.readJson(manifestFile);
    } catch (e) {
      logger.error(`failed to read blockchain config file ${manifestFile}`, e);
      return false; // fatal
    }

    if (!manifest) {
      logger.error('configuration error: bad manifest file');
      return false; // fatal, valid manifest required to proceed
    }

    // Remove stale entries
    this._filterManifest(manifest);
    this._storage.setItem(storageKeys.MANIFEST, manifest);

    const xbridgeInfos = [];
    const xbconfDir = path.join(manifestFilesDir, 'xbridge-confs');

    // Read prepackaged xbridge confs
    for (const t of manifest) {
      const token = new Token(t);
      if (!this._availableWallets.has(token.ticker))
        continue; // skip unsupported tokens

      let xbtext = '';
      try {
        xbtext = await fs.readFile(path.join(xbconfDir, token.xbridge_conf), 'utf8');
      } catch (e) {
        continue; // skip bad confs
      }
      const xbInfo = this._parseXBridgeConf(xbtext);
      if (xbInfo) {
        xbInfo.ticker = token.ticker;
        xbridgeInfos.push(xbInfo);
      } else
        logger.error(`failed to read xbridge info for ${token.ticker}`);
    }

    // Store xbridge data
    this._storage.setItem(storageKeys.XBRIDGE_INFO, xbridgeInfos);
    return true;
  }

  /**
   * Get raw manifest data object.
   * @returns {Array<Object>}
   */
  getManifest() {
    const manifest = this._storage.getItem(storageKeys.MANIFEST);
    if (!_.isArray(manifest))
      return [];
    return manifest;
  }

  /**
   * Get the last known manifest hash.
   * @returns {string}
   */
  getManifestHash() {
    const hash = this._storage.getItem(storageKeys.MANIFEST_SHA);
    if (!_.isString(hash))
      return '';
    return hash;
  }

  /**
   * Get the xbridge info data provider.
   * @returns {XBridgeInfo[]}
   */
  getXBridgeInfo() {
    const xbinfo = this._storage.getItem(storageKeys.XBRIDGE_INFO);
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
   * Update the manifest to the latest.
   * @return {Promise<void>}
   */
  async updateManifest() {
    const manifestUrl = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/blockchainconfigfilehashmap.json';
    const manifestConfPrefix = 'https://s3.amazonaws.com/blockdxbuilds/blockchainconfig/files/xbridge-confs/';
    const manifestHeadReq = async () => { return await request.head(manifestUrl).timeout(30000); };
    if (await this.needsUpdate(manifestHeadReq)) {
      const confRequest = async (url) => { return await request.get(url).accept('text/plain').timeout(HTTP_REQUEST_TIMEOUT); };
      await this.updateLatest(manifestUrl, manifestConfPrefix, this.getManifestHash(), 'manifest-latest.json', confRequest);
    }
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
      manifestData = JSON.parse(res.text);
    } catch (err) {
      logger.error('failed to download latest manifest hash', err);
      return false;
    }

    let manifest = null;
    try {
      // Download manifest data (array of token objects)
      const manifestDataUrl = manifestData[manifestKey][1];
      const res = await req(manifestDataUrl);
      manifest = JSON.parse(res.text);
    } catch (err) {
      logger.error('failed to download latest manifest json', err);
      return false;
    }

    // Store manifest and hash only on successful response
    if (_.isArray(manifest) && manifest.length > 0) {
      this._filterManifest(manifest);

      // Pull the wallet confs for available wallets and get fee information.
      const xbridgeInfos = [];
      for (const t of manifest) {
        const token = new Token(t);
        if (!this._availableWallets.has(token.ticker))
          continue; // skip unknown tokens

        let res;
        try {
          res = await req(manifestConfPrefix + token.xbridge_conf);
        } catch (e) {
          logger.error(`failed to download xbridge info for ${token.ticker}`, e);
          continue;
        }
        const xbInfo = this._parseXBridgeConf(res.text);
        if (xbInfo) {
          xbInfo.ticker = token.ticker;
          xbridgeInfos.push(xbInfo);
        } else
          logger.error(`failed to read xbridge info for ${token.ticker}`);
      }

      // Store xbridge data
      this._storage.setItem(storageKeys.MANIFEST_SHA, manifestHash);
      this._storage.setItem(storageKeys.MANIFEST, manifest);
      const existing = this.getXBridgeInfo();
      const unique = new Map(existing.map(xb => [xb.ticker, xb]));
      for (const xbinfo of xbridgeInfos) // overwrite existing, add new
        unique.set(xbinfo.ticker, xbinfo);
      this._storage.setItem(storageKeys.XBRIDGE_INFO, Array.from(unique.values()));

      return true;
    }

    return false;
  }

  /**
   * Read and parse the xbridge conf.
   * Sample data:
   * [BLOCK]
   * Title=Blocknet
   * Address=
   * Ip=127.0.0.1
   * Port=41414
   * Username=
   * Password=
   * AddressPrefix=26
   * ScriptPrefix=28
   * SecretPrefix=154
   * COIN=100000000
   * MinimumAmount=0
   * TxVersion=1
   * DustAmount=0
   * CreateTxMethod=BTC
   * GetNewKeySupported=true
   * ImportWithNoScanSupported=true
   * MinTxFee=10000
   * BlockTime=60
   * FeePerByte=20
   * Confirmations=0
   *
   * @param data
   * @return {XBridgeInfo|null}
   * @private
   */
  _parseXBridgeConf(data) {
    const xbconf = [];
    let l = '';
    let p = '';
    for (const ch of data) {
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
        matchfpb = line.match(this._reFpb);
      if (!matchminfee)
        matchminfee = line.match(this._reMtf);
      if (!matchcoin)
        matchcoin = line.match(this._reCoin);
      if (!matchport)
        matchport = line.match(this._rePort);
    }
    if (matchfpb && matchminfee && matchcoin && matchport) {
      return new XBridgeInfo({
        feeperbyte: Number(matchfpb[1]),
        mintxfee: Number(matchminfee[1]),
        coin: Number(matchcoin[1]),
        rpcport: Number(matchport[1]),
      });
    }

    return null;
  }

  /**
   * Removes all non-latest manifest entries.
   * @param manifest
   * @private
   */
  _filterManifest(manifest) {
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
  }
}

export default ConfController;
