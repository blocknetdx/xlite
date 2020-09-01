import XBridgeInfo from '../types/xbridgeinfo';

/**
 * Configuration controller renderer counterpart.
 */
class ConfController {

  /**
   * Constructor
   * @param api {Object} Context bridge api
   */
  constructor(api) {
    this._api = api;
  }

  /**
   * Get raw manifest data object.
   * @returns {Array<Object>}
   */
  async getManifest() {
    try {
      return await this._api.confController_getManifest();
    } catch (err) {
      return [];
    }
  }

  /**
   * Get the last known manifest hash.
   * @returns {string}
   */
  async getManifestHash() {
    try {
      return await this._api.confController_getManifestHash();
    } catch (err) {
      return '';
    }
  }

  /**
   * Get the xbridge info data provider.
   * @returns {XBridgeInfo[]}
   */
  async getXBridgeInfo() {
    try {
      const objs = await this._api.confController_getXBridgeInfo();
      const r = [];
      for (const o of objs)
        r.push(new XBridgeInfo(o));
      return r;
    } catch (err) {
      return [];
    }
  }
}

export default ConfController;
