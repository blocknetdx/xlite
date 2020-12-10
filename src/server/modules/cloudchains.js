// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { ccBinDirs, ccBinNames, DEFAULT_MASTER_PORT, UNKNOWN_CC_VERSION } from '../../app/constants';
import CCWalletConf from '../../app/types/ccwalletconf';
import {generateSalt, pbkdf2} from '../../app/modules/crypt';
import {logger} from './logger';
import {storageKeys} from '../constants';
import RPCController from './rpc-controller';
import {timeout, unixTime} from '../../app/util';

import _ from 'lodash';
import electron from 'electron';
import isDev from 'electron-is-dev';
import fs from 'fs-extra';
import path from 'path';
import childProcess from 'child_process';
import { v4 as uuidV4 } from 'uuid';

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
   * @param filePath {string}
   * @param args {string[]}
   * @param callback {function}
   * @returns {ChildProcess}
   * @private
   */
  _spawn = childProcess.spawn;
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
   * @type {RegExp}
   * @private
   */
  _loginPatt = /\[login]/i;
  /**
   * @type {RegExp}
   * @private
   */
  _unableToInitializePatt = /unable\sto\sinitialize/i;
  /**
   * @type {SimpleStorage}
   * @private
   */
  _storage = null;
  /**
   * @type {boolean}
   * @private
   */
  _newInstall = false;
  /**
   * @type {number}
   * @private
   */
  _rpcWaitDelay = 3500;
  /**
   * @type {number}
   * @private
   */
  _rpcStartExpirySeconds = 30;

  /**
   * Default path function for cloudchains installations.
   * @return {string}
   */
  static defaultPathFunc() {
    switch (process.platform) {
      case 'win32':
        return path.join(electron.app.getPath('appData'), 'CloudChains');
      case 'darwin':
        return path.join(electron.app.getPath('appData'), 'CloudChains');
      default: // linux distros
        return path.join(electron.app.getPath('appData'), 'CloudChains');
    }
  }

  /**
   * Constructor
   * @param pathFunc {function}
   * @param storage {SimpleStorage}
   */
  constructor(pathFunc, storage) {
    this._cloudChainsDir = pathFunc();
    this._cloudChainsSettingsDir = path.join(this._cloudChainsDir, 'settings');
    this._storage = storage;
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
      return fs.pathExistsSync(path.join(this._cloudChainsSettingsDir, 'config-master.json'));
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
    const pw = this._storage.getItem(storageKeys.PASSWORD);
    const s = this._storage.getItem(storageKeys.SALT);
    return _.isString(pw) && _.isString(s) && pw.length > 0 && s.length > 0;
  }

  /**
   * Save the cloudchains wallet credentials.
   * @param password {string}
   * @param salt {string|null}
   */
  saveWalletCredentials(password, salt) {
    if (!salt)
      salt = generateSalt(32);

    const hashedPassword = pbkdf2(password, salt);
    this._storage.setItems({
      [storageKeys.PASSWORD]: hashedPassword,
      [storageKeys.SALT]: salt,
    });

    return true;
  }

  /**
   * Return the last known cloudchains wallet password. This is encrypted.
   * @return {string|null}
   */
  getStoredPassword() {
    const pw = this._storage.getItem(storageKeys.PASSWORD);
    if (!pw || !_.isString(pw))
      return null;
    return pw;
  }

  /**
   * Return the password salt.
   * @return {string|null}
   */
  getStoredSalt() {
    const s = this._storage.getItem(storageKeys.SALT);
    if (!s || !_.isString(s))
      return null;
    return s;
  }

  /**
   * Return the last known cloudchains wallet mnemonic. This is encrypted.
   * @param currentPassword {string} Used to decrypt the mnemonic
   * @return {string|null} Returns null if the decryption failed or the mnemonic doesn't exist
   */
  async getDecryptedMnemonic(currentPassword) {
    try {
      const mnemonic = await this.getCCMnemonic(currentPassword);
      if (!mnemonic)
        return null;
      return mnemonic;
    } catch (e) {
      logger.error('failed to get mnemonic', e);
      return null;
    }
  }

  /**
   * Synchronously read all CloudChains token confs from disk. Returns false on error.
   * Fatal error throws. Individual token conf failures do not result in fatal error,
   * however, will return false. Returns true if no errors occurred. If the token
   * manifest is provided this call will overwrite rpc port values for the configs
   * to match those in the manifest.
   * @param manifest {TokenManifest} Override with manifest values if specified
   * @return {boolean}
   * @throws {Error} on fatal error (e.g. failure to read settings dir)
   */
  loadConfs(manifest = null) {
    const settingsDir = this.getSettingsDir();
    let success = true;
    const defaultAddressCount = 40;
    const confs = fs.readdirSync(settingsDir)
      .map(f => {
        if (!this._reConfFile.test(f))
          return null; // ignore files that don't match expected conf filename
        const ticker = f.match(this._reConfFile)[1];
        // Load json data from conf file
        const filePath = path.join(settingsDir, f);
        try {
          const data = fs.readJsonSync(filePath);
          const conf = new CCWalletConf(ticker, data);
          if (ticker === 'master') {
            this._masterConf = this._checkUpdateMasterConf(conf, filePath, fs.writeJsonSync);
            return null;
          } else if (manifest && manifest.getToken(ticker)) { // update with manifest rpc ports
            const token = manifest.getToken(ticker);
            conf.rpcPort = token.xbinfo.rpcport;
            if (conf.addressCount < defaultAddressCount)
              conf.addressCount = defaultAddressCount;
            this._updateConfRpc(conf, filePath, fs.writeJsonSync);
            return conf;
          } else {
            if (conf.addressCount < defaultAddressCount) {
              conf.addressCount = defaultAddressCount;
              this._updateConfRpc(conf, filePath, fs.writeJsonSync);
            }
            return conf;
          }
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
  _checkUpdateMasterConf(conf, filePath, writeJsonSync) {
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
    let closed = false;
    let resolve = () => {};
    const closeHandler = err => {
      if (closed)
        return;
      closed = true;
      if (err) {
        logger.error(err);
        resolve(UNKNOWN_CC_VERSION);
      } else
        resolve(version);
    };
    return new Promise(res => {
      resolve = res;
      const cli = this._execFile(this.getCCSPVFilePath(), ['--version'], {detached: false, windowsHide: true}, closeHandler);
      cli.stdout.on('data', data => {
        const str = data.toString('utf8');
        if(versionPatt.test(str)) {
          version = str.match(versionPatt)[0];
        }
      });
      cli.stdout.on('close', closeHandler);
    });
  }

  /**
   * Gets the wallet mnemonic.
   * @param password {string}
   * @returns {Promise<string>}
   */
  getCCMnemonic(password) {
    let mnemonic = '';
    return new Promise((resolve, reject) => {
      let closed = false;
      const closeHandler = err => {
        if (closed)
          return;
        closed = true;
        if (err || !mnemonic) {
          logger.error(err);
          reject(new Error('failed to get the mnemonic'));
        } else
          resolve(mnemonic);
      };
      const cli = this._execFile(this.getCCSPVFilePath(), ['--getmnemonic', password], {detached: false, windowsHide: true}, closeHandler);
      cli.stdout.on('data', data => {
        mnemonic = data.toString('utf8');
      });
      cli.stdout.on('close', closeHandler);
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
      return !(res instanceof Error);
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
      this.isWalletRPCRunning().then(running => { // success if wallet already running
        if (running) {
          logger.info('CloudChains wallet running');
          resolve(true);
          return;
        }

      if (this.spvIsRunning()) { // first kill the prior process if rpc isn't working
        this._cli.kill('SIGINT');
        this._cli = null;
      }

      logger.info('starting CloudChains daemon');

      let started = false;
      const args = password ? ['--password', password] : [];
      const cli = this._spawn(this.getCCSPVFilePath(), args, {detached: false, windowsHide: true});
      cli.stdout.on('data', data => {
        if (started)
          return;
        const str = data.toString('utf8');
        if(
          (this._loginPatt.test(str) && this._unableToInitializePatt.test(str))
          || (!password && this._selectionPatt.test(str))
        ) {
          started = true;
          resolve(false);
          cli.kill('SIGINT');
        } else if(/master\sRPC\sserver/i.test(str)) {
          started = true;
          // give the master RPC server a second to start
          const expiry = unixTime() + this._rpcStartExpirySeconds;
          this._waitForRpc(expiry, this._rpcWaitDelay).then(available => resolve(available))
            .catch(() => resolve(false));
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error(`startSPV error: ${str}`);
        if (started)
          return;
        started = true;
        resolve(false);
        cli.kill('SIGINT');
      });
      cli.stdout.on('close', code => {
        logger.info(`startSPV child process exited with code ${!code ? '0' : code}`);
      });

      // Watch process
      this._cli = cli;
      });
    });
  }

  /**
   * Stops the CloudChains CLI
   * @returns {Promise<boolean>}
   */
  async stopSPV() {
    let r = false;
    if (await this.isWalletRPCRunning())
      r = await this._rpc.ccStop();
    else {
      if (this._isCLIAvailable())
        return this._cli.kill('SIGINT');
    }
    return r;
  }

  /**
   * Creates a new CloudChains wallet
   * @param password {string}
   * @param mnemonic {string}
   * @returns {Promise<string>}
   */
  createSPVWallet(password, mnemonic = '') {
    return new Promise((resolve, reject) => {
      if (!password) { // fail on bad password
        reject(new Error('failed to create wallet with empty password'));
        return;
      }

      if (this.spvIsRunning()) { // stop existing if running
        this._cli.kill('SIGINT');
        this._cli = null;
      }

      const resolveMnemonic = () => {
        this.getCCMnemonic(password)
          .then(resolve)
          .catch(reject);
      };

      const createHandler = err => {
        if (err)
          reject(err);
        else
          resolveMnemonic();
      };

      let started = false;
      let args;
      if(mnemonic) { // Create a wallet from a previous mnemonic
        args = ['--createwalletmnemonic', password, mnemonic];
      } else { // Create a new wallet
        args = ['--createdefaultwallet', password];
      }
      const cli = this._spawn(this.getCCSPVFilePath(), args, {detached: false, windowsHide: true});
      cli.stdout.on('data', data => {
        if (started)
          return;
        started = true;

        const expiry = unixTime() + this._rpcStartExpirySeconds; // Wait rpc server is ready until this time
        this._waitForRpc(expiry, this._rpcWaitDelay)
          .then(available => {
            if (available)
              createHandler();
            else {
              createHandler(new Error('failed to start rpc server'));
              cli.kill('SIGINT');
            }
          })
          .catch(() => {
            createHandler(new Error('failed to start rpc server'));
            cli.kill('SIGINT');
          });
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error(str);
        if (started)
          return;
        started = true;
        createHandler(new Error('failed to create a new wallet'));
        cli.kill('SIGINT');
      });
      cli.stdout.on('close', code => {
        logger.info(`child process exited with code ${!code ? '0' : code}`);
      });

      // Watch this process
      this._cli = cli;
    });
  }

  /**
   * Enables all wallets using the CloudChains CLI param --enablerpcandconfigure
   * @returns {Promise<boolean>}
   */
  enableAllWallets() {
    return new Promise(resolve => {
      let started = false;
      const cli = this._spawn(this.getCCSPVFilePath(), ['--enablerpcandconfigure'], {detached: false, windowsHide: true});
      cli.stdout.on('data', data => {
        const str = data.toString('utf8');
        if(this._selectionPatt.test(str)) { // kill process when selection screen appears
          if (started)
            return;
          started = true;
          resolve(true);
          cli.kill('SIGINT');
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error('enableAllWallets', str);
        if (started)
          return;
        started = true;
        resolve(false);
        cli.kill('SIGINT');
      });
      cli.stdout.on('close', code => {
        logger.info(`enableAllWallets child process exited with code ${!code ? '0' : code}`);
      });
    });
  }

  /**
   * Changes the password and re-encrypts the stored mnemonic. Fails if the old
   * and new passwords don't match or if there's an error.
   * @param oldPassword
   * @param newPassword
   * @return {boolean}
   */
  changePassword(oldPassword, newPassword) {
    const currentPassword = this.getStoredPassword();
    const currentSalt = this.getStoredSalt();

    const checkOldPassword = pbkdf2(oldPassword, currentSalt);
    if (currentPassword !== checkOldPassword) {
      logger.error('failed to change the password, passwords do not match');
      throw new Error('The old password is incorrect.');
    }

    return this.saveWalletCredentials(newPassword, null);
  }

  /**
   * Returns true if the password matches the stored password.
   * Returns false otherwise.
   * @param password
   * @return {boolean}
   */
  matchesStoredPassword(password) {
    const currentPassword = this.getStoredPassword();
    const currentSalt = this.getStoredSalt();
    const checkPassword = pbkdf2(password, currentSalt);
    return checkPassword === currentPassword;
  }

  /**
   * Sets the new install state.
   */
  setNewInstall() {
    this._newInstall = true;
  }

  /**
   * Returns true if this is a new install.
   * @return {boolean}
   */
  isNewInstall() {
    return this._newInstall;
  }

  /**
   * Returns true if the cli is available.
   * @return {boolean}
   * @private
   */
  _isCLIAvailable() {
    return !!(this._cli);
  }

  /**
   * Checks master conf and updates it if necessary to enable the master RPC server
   * @param conf {CCWalletConf}
   * @param filePath {string}
   * @param writeJsonSync {function}
   * @return {boolean}
   */
  _updateConfRpc(conf, filePath, writeJsonSync) {
    try {
      writeJsonSync(filePath, conf, {spaces: 4});
      return true;
    } catch (e) {
      logger.error(`failed to write conf at path ${filePath}`);
      return false;
    }
  }

  /**
   * Wait for rpc to become available. Returns true if rpc is available
   * otherwise returns false on expiry.
   * @param expiry {number} Unix time
   * @param wait {number} Delay before retry in milliseconds
   * @returns {Promise<boolean>}
   * @private
   */
  async _waitForRpc(expiry, wait = 3500) {
    try {
      const res = await this._rpc.ccHelp();
      if (res && !(res instanceof Error))
        return true;
    } catch (e) {
      // non-fatal
    }
    if (unixTime() >= expiry)
      return false;
    else
      return await new Promise(resolve => {
        setTimeout(() => {
          this._waitForRpc(expiry, wait).then(res => resolve(res));
        }, wait);
      });
  }
}

export default CloudChains;
