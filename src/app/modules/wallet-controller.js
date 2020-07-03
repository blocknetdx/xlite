import fs from 'fs-extra';
import { Map } from 'immutable';
import path from 'path';
import RPCController from './rpc-controller';

export default class WalletController {

  /**
   * CloudChains settings directory
   * @type {string}
   * @private
   */
  _cloudChainsSettingsDir = '';

  /**
   * @type {Map<string, Object>}
   * @private
   */
  _manifest = Map();

  /**
   * @type {boolean}
   * @private
   */
  _initialized = false;

  /**
   *
   * @type {Map<string, Object>}
   */
  wallets = Map();

  /**
   * Constructs a WalletController instance
   * @param ccSettingsDir {string}
   * @param manifest {Map<string, Object>}
   */
  constructor(cloudChainsSettingsDir, manifest) {
    this._cloudChainsSettingsDir = cloudChainsSettingsDir;
    this._manifest = manifest;
  }

  /**
   * @returns {Promise<void>}
   */
  async initialize() {
    const manifest = this._manifest;
    const settingsDir= this._cloudChainsSettingsDir;
    const configFilePatt = /^config-(.+)\.json$/i;
    const files = await fs.readdirSync(settingsDir)
    const wallets = files
      .filter(f => configFilePatt.test(f))
      .map(f => {
        const filePath = path.join(settingsDir, f);
        try {
          const data = fs.readJsonSync(filePath);
          const matches = f.match(configFilePatt);
          const ticker = matches[1];
          const manifestData = manifest.get(ticker);
          if(!manifestData) return null;
          return {
            ...data,
            ticker,
            name: manifestData.blockchain,
            filePath,
            rpc: data.rpcEnabled ? new RPCController(data.rpcPort, data.rpcUsername, data.rpcPassword) : null
          };
        } catch(err) {
          return null;
        }
      })
      .filter(data => data);

    // ToDo Create a Wallet class

    for(const wallet of wallets) {
      this.wallets = this.wallets.set(wallet.ticker, wallet);
    }
    this._initialized = true;
  }

  /**
   * @returns {Object[]}
   */
  getWallets() {
    return [...this.wallets.values()];
  }

  /**
   * @returns {Object[]}
   */
  getEnabledWallets() {
    return [...this.wallets.values()]
      .filter(w => w.rpcEnabled);
  }

}
