import {logger, requireRenderer} from '../util';
import {localStorageKeys} from '../constants';
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
   * Constructor
   * @param domStorage {DOMStorage}
   */
  constructor(domStorage) {
    requireRenderer();
    this._domStorage = domStorage;
  }

  /**
   * Get raw manifest data object.
   * @returns {Object}
   */
  getManifest() {
    return this._domStorage.getItem(localStorageKeys.MANIFEST);
  }

  /**
   * Get the last known manifest hash.
   * @returns {string}
   */
  getManifestHash() {
    return this._domStorage.getItem(localStorageKeys.MANIFEST_SHA);
  }

  /**
   * Fetches the latest manifest hash from the endpoint and checks
   * if it matches the hash we currently have. Updates the datastore
   * with the latest manifest hash.
   * @param req {Function}
   * @returns {Promise<boolean>}
   */
  async needsUpdate(req) {
    const currentHash = this.getManifestHash();
    const manifestHash = await this.fetchManifestHash(req);
    return currentHash !== manifestHash;
  }

  /**
   * Fetch the latest manifest hash.
   * @param req {Function}
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
   * @param manifestHash {string}
   * @param manifestKey {string}
   * @param req {Function} Manifest data request func
   * @returns {Promise<boolean>}
   */
  async updateLatest(manifestUrl, manifestHash, manifestKey, req) {
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
      this._domStorage.setItem(localStorageKeys.MANIFEST_SHA, manifestHash);
      this._domStorage.setItem(localStorageKeys.MANIFEST, manifest);
      return true;
    }

    return false;
  }

}

export default ConfController;
