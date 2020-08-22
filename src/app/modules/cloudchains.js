import CCWalletConf from '../types/ccwalletconf';
import { isRenderer, logger } from '../util';
import RPCController from './rpc-controller';

import _ from 'lodash';
import electron from 'electron';
import isDev from 'electron-is-dev';
import fs from 'fs-extra';
import path from 'path';
import childProcess from 'child_process';
import { v4 as uuidV4 } from 'uuid';
import {ccBinDirs, ccBinNames, DEFAULT_MASTER_PORT, localStorageKeys} from '../constants';

/**
 * Manage CloudChains litewallet configuration.
 */
class CloudChains {

  /**
   * @type {ChildProcess}
   * @private
   */
  _cli = null;
  /**
   * @type {RPCController}
   * @private
   */
  _rpc = null;

  /**
   * @type {string}
   * @private
   */
  _cloudChainsDir = '';
  /**
   * @type {string}
   * @private
   */
  _cloudChainsSettingsDir = '';
  /**
   * @type {Map<string, CCWalletConf>}
   * @private
   */
  _cloudChainsConfs = new Map();
  /**
   * @param filePath {string}
   * @param args {string[]}
   * @param callback {function}
   * @returns {ChildProcess}
   * @private
   */
  _execFile = childProcess.execFile;
  /**
   * @type {CCWalletConf}
   * @private
   */
  _masterConf = null;
  /**
   * @type {"darwin" | "linux" | "win32"}
   * @private
   */
  _platform = process.platform;
  /**
   * Compiled regex for conf filenames.
   * @type {RegExp}
   * @private
   */
  _reConfFile = /^config-([^\s]+)\.json$/i;
  /**
   * @type {RegExp}
   * @private
   */
  _selectionPatt = /selection/i;
  /**
   * @type {DOMStorage}
   * @private
   */
  _domStorage = null;

  /**
   * Default path function for cloudchains installations.
   * @return {string}
   */
  static defaultPathFunc() {
    const app = isRenderer() ? electron.remote.app : electron.app;
    switch (process.platform) {
      case 'win32':
        return path.join(app.getPath('appData'), 'CloudChains');
      case 'darwin':
        return path.join(app.getPath('appData'), 'CloudChains');
      default: // linux distros
        return path.join(app.getPath('home'), 'CloudChains');
    }
  }

  /**
   * Constructor
   * @param pathFunc {function}
   * @param domStorage {DOMStorage}
   */
  constructor(pathFunc, domStorage) {
    this._cloudChainsDir = pathFunc();
    this._cloudChainsSettingsDir = path.join(this._cloudChainsDir, 'settings');
    this._domStorage = domStorage;
  }

  /**
   * Returns true if cloudchains has been installed (or run for the first time).
   * @return {boolean}
   */
  isInstalled() {
    try {
      return fs.pathExistsSync(this._cloudChainsDir);
    } catch (err) {
      logger.error('is installed check failed', err);
      return false;
    }
  }

  /**
   * Returns true if the settings path exists.
   * @return {boolean}
   */
  hasSettings() {
    try {
      return fs.pathExistsSync(this._cloudChainsSettingsDir);
    } catch (err) {
      logger.error('has settings check failed', err);
      return false;
    }
  }

  /**
   * CloudChains configuration directory.
   * @return {string}
   */
  getCloudChainsDir() {
    return this._cloudChainsDir;
  }

  /**
   * Return CloudChains wallet settings directory.
   * @return {string}
   */
  getSettingsDir() {
    return this._cloudChainsSettingsDir;
  }

  /**
   * Return the wallet conf with the specified ticker. Returns null
   * if no config was found.
   * @param ticker {string}
   * @return {CCWalletConf|null}
   */
  getWalletConf(ticker) {
    if (this._cloudChainsConfs.has(ticker))
      return this._cloudChainsConfs.get(ticker);
    return null;
  }

  /**
   * Return the wallet confs.
   * @return {Array<CCWalletConf>}
   */
  getWalletConfs() {
    return Array.from(this._cloudChainsConfs.values());
  }

  /**
   * Return a copy of the master conf file.
   * @return {CCWalletConf}
   */
  getMasterConf() {
    return this._masterConf;
  }

  /**
   * Return the wallet created state.
   * @return {boolean}
   */
  isWalletCreated() {
    const pw = this._domStorage.getItem(localStorageKeys.PASSWORD);
    const s = this._domStorage.getItem(localStorageKeys.SALT);
    const m = this._domStorage.getItem(localStorageKeys.MNEMONIC);
    return _.isString(pw) && _.isString(s) && _.isString(m)
      && pw.length > 0 && s.length > 0 && m.length > 0;
  }

  /**
   * Save the cloudchains wallet credentials.
   * @param hashedPassword {string}
   * @param salt {string}
   * @param encryptedMnemonic {string}
   */
  saveWalletCredentials(hashedPassword, salt, encryptedMnemonic) {
    this._domStorage.setItems({
      [localStorageKeys.PASSWORD]: hashedPassword,
      [localStorageKeys.SALT]: salt,
      [localStorageKeys.MNEMONIC]: encryptedMnemonic,
    });
  }

  /**
   * Return the last known cloudchains wallet password. This is encrypted.
   * @return {string|null}
   */
  getStoredPassword() {
    const pw = this._domStorage.getItem(localStorageKeys.PASSWORD);
    if (!pw || !_.isString(pw))
      return null;
    return pw;
  }

  /**
   * Return the password salt.
   * @return {string|null}
   */
  getStoredSalt() {
    const s = this._domStorage.getItem(localStorageKeys.SALT);
    if (!s || !_.isString(s))
      return null;
    return s;
  }

  /**
   * Return the last known cloudchains wallet mnemonic. This is encrypted.
   * @return {string|null}
   */
  getStoredMnemonic() {
    const m = this._domStorage.getItem(localStorageKeys.MNEMONIC);
    if (!m || !_.isString(m))
      return null;
    return m;
  }

  /**
   * Synchronously read all CloudChains token confs from disk. Returns false on error.
   * Fatal error throws. Individual token conf failures do not result in fatal error,
   * however, will return false. Returns true if no errors occurred.
   * @return {boolean}
   * @throws {Error} on fatal error (e.g. failure to read settings dir)
   */
  loadConfs() {
    const settingsDir = this.getSettingsDir();
    let success = true;
    const confs = fs.readdirSync(settingsDir)
      .map(f => {
        if (!this._reConfFile.test(f))
          return null; // ignore files that don't match expected conf filename
        const ticker = f.match(this._reConfFile)[1];
        // Load json data from conf file
        const filePath = path.join(settingsDir, f);
        try {
          const data = fs.readJsonSync(filePath);
          let conf = new CCWalletConf(ticker, data);
          if (ticker === 'master') {
            conf = this.checkUpdateMasterConf(conf, filePath, fs.writeJsonSync);
            this._masterConf = conf;
            return null;
          } else
            return conf;
        } catch (err) {
          logger.error(`failed to read token conf: ${f}`, err); // non-fatal
          success = false;
          return null;
        }
      }, this)
      .filter(conf => conf); // remove null

    this._cloudChainsConfs = new Map();
    for (const conf of confs)
      this._cloudChainsConfs.set(conf.ticker(), conf);

    // Create master rpc
    this._rpc = new RPCController(this._masterConf.rpcPort, this._masterConf.rpcUsername, this._masterConf.rpcPassword);

    return success;
  }

  /**
   * Checks master conf and updates it if necessary to enable the master RPC server
   * @param conf
   * @param filePath
   * @param writeJsonSync
   * @returns {*}
   */
  checkUpdateMasterConf(conf, filePath, writeJsonSync) {
    if(!conf.rpcEnabled
      || !conf.rpcUsername
      || !conf.rpcPassword
      || (conf.rpcPort !== DEFAULT_MASTER_PORT && conf.rpcPort <= 1024)) {
      const rpcUsername = uuidV4();
      const rpcPassword = uuidV4();
      const rpcPort = DEFAULT_MASTER_PORT;
      conf = new CCWalletConf('master', {
        ...conf,
        rpcEnabled: true,
        rpcUsername,
        rpcPassword,
        rpcPort
      });
      writeJsonSync(filePath, conf, {spaces: 4});
    }
    return conf;
  }

  /**
   * Gets the working directory of the CC executable
   * @returns {string}
   */
  getCLIDir() {
    const dirname = ccBinDirs[this._platform];
    if(isDev) {
      return path.resolve(__dirname, `../../../bin/${dirname}`);
    } else {
      return path.resolve(__dirname, `../../../bin/${dirname}`).replace('app.asar', 'app.asar.unpacked');
    }
  }

  /**
   * Gets the CloudChains CLI file path
   * @returns {string}
   */
  getCCSPVFilePath() {
    const platform = this._platform;
    return path.join(this.getCLIDir(), ccBinNames[platform]);
  }

  /**
   * Gets the version of the CC CLI and returns an empty string on failure
   * @returns {Promise<string>}
   */
  getCCSPVVersion() {
    const versionPatt = /\d+\.\d+\.\d+/;
    let version = '';
    return new Promise(resolve => {
      const cli = this._execFile(this.getCCSPVFilePath(), ['--version'], err => {
        if(err)
          logger.error(err);
        resolve(version);
      });
      cli.stdout.on('data', data => {
        const str = data.toString('utf8');
        if(versionPatt.test(str)) {
          version = str.match(versionPatt)[0];
        }
      });
    });
  }

  /**
   * Returns true if the wallet rpc is accepting connections. Calls the rpc
   * "help" method.
   * @return {boolean}
   */
  async isWalletRPCRunning() {
    if (!this._masterConf || !this._masterConf.rpcEnabled || !this._rpc)
      return false;
    try {
      const res = await this._rpc.ccHelp();
      return _.isString(res);
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns whether or not the cli is currently running
   * @returns {boolean}
   */
  spvIsRunning() {
    if (this._isCLIAvailable())
      return this._cli && !_.isNumber(this._cli.exitCode);
    return false;
  }

  /**
   * Starts the CloudChains CLI
   * @param password {string}
   * @returns {Promise<boolean>}
   */
  startSPV(password = '') {
    return new Promise(resolve => {
      const args = password ? ['--password', password] : [];
      const cli = this._execFile(this.getCCSPVFilePath(), args, err => {
        if(err) {
          logger.error(err);
          resolve(false);
        }
      });
      cli.stdout.on('data', data => {
        const str = data.toString('utf8');
        // console.log(str);
        if(!password && this._selectionPatt.test(str)) {
          resolve(true);
        } else if(/master\sRPC\sserver/i.test(str)) {
          // give the master RPC server a second to start
          setTimeout(() => {
            resolve(true);
          }, 500);
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error(str);
      });
      cli.stdout.on('close', code => {
        logger.info(`child process exited with code ${code}`);
        resolve(false);
      });
      this._cli = cli;
    });
  }

  /**
   * Stops the CloudChains CLI
   * @returns {boolean}
   */
  stopSPV() {
    if (this._isCLIAvailable())
      return this._cli.kill();
    return false;
  }

  /**
   * Creates a new CloudChains wallet
   * @param password {string}
   * @returns {Promise<string>}
   */
  createSPVWallet(password) {
    return new Promise(resolve => {
      const mnemonicPatt = /mnemonic\s+=\s+(.+)/i;
      const cli = this._execFile(this.getCCSPVFilePath(), ['--enablerpcandconfigure', '--createdefaultwallet', password], err => {
        if(err) logger.error(err);
        resolve('');
      });
      cli.stdout.on('data', data => {
        const str = data.toString('utf8');
        // console.log(str);
        if(mnemonicPatt.test(str)) {
          const mnemonic = str.match(mnemonicPatt)[1].trim();
          cli.kill();
          resolve(mnemonic);
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error(str);
      });
      cli.stdout.on('close', code => {
        logger.info(`child process exited with code ${code}`);
        resolve('');
      });
    });
  }

  /**
   * Enables all wallets using the CloudChains CLI param --enablerpcandconfigure
   * @returns {Promise<boolean>}
   */
  enableAllWallets() {
    return new Promise(resolve => {
      const cli = this._execFile(this.getCCSPVFilePath(), ['--enablerpcandconfigure'], err => {
        if(err) {
          logger.error(err);
          resolve(false);
        }
      });
      cli.stdout.on('data', data => {
        const str = data.toString('utf8');
        // console.log(str);
        if(this._selectionPatt.test(str)) {
          resolve(true);
          cli.kill();
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error(str);
        cli.kill();
      });
      cli.stdout.on('close', code => {
        logger.info(`child process exited with code ${code}`);
        resolve(false);
      });
    });
  }

  /**
   * Returns true if the cli is available.
   * @return {boolean}
   * @private
   */
  _isCLIAvailable() {
    return !!(this._cli);
  }

}

export default CloudChains;
