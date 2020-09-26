import {ccBinDirs, ccBinNames, DEFAULT_MASTER_PORT} from '../../app/constants';
import CCWalletConf from '../../app/types/ccwalletconf';
import {Crypt, generateSalt, pbkdf2} from '../../app/modules/crypt';
import {logger} from './logger';
import {storageKeys} from '../constants';
import RPCController from './rpc-controller';

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
    const pw = this._storage.getItem(storageKeys.PASSWORD);
    const s = this._storage.getItem(storageKeys.SALT);
    return _.isString(pw) && _.isString(s) && pw.length > 0 && s.length > 0;
  }

  /**
   * Save the cloudchains wallet credentials.
   * @param password {string}
   * @param salt {string|null}
   * @param mnemonic {string}
   */
  saveWalletCredentials(password, salt, mnemonic) {
    if (!salt)
      salt = generateSalt(32);

    const hashedPassword = pbkdf2(password, salt);
    let encryptedMnemonic;

    try {
      const crypt = new Crypt(password, salt);
      encryptedMnemonic = crypt.encrypt(mnemonic);
    } catch(err) {
      logger.error('failed to encrypt the mnemonic');
      return false;
    }

    this._storage.setItems({
      [storageKeys.PASSWORD]: hashedPassword,
      [storageKeys.SALT]: salt,
      [storageKeys.MNEMONIC]: encryptedMnemonic,
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
   * @return {string|null}
   */
  getStoredMnemonic() {
    const m = this._storage.getItem(storageKeys.MNEMONIC);
    if (!m || !_.isString(m))
      return null;
    return m;
  }

  /**
   * Return the last known cloudchains wallet mnemonic. This is encrypted.
   * @param currentPassword {string} Used to decrypt the mnemonic
   * @return {string|null} Returns null if the decryption failed or the mnemonic doesn't exist
   */
  getDecryptedMnemonic(currentPassword) {
    const m = this._storage.getItem(storageKeys.MNEMONIC);
    if (!m || !_.isString(m))
      return null;

    try {
      const crypt = new Crypt(currentPassword, this.getStoredSalt());
      return crypt.decrypt(m);
    } catch (e) {
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
            this._updateConfRpc(conf, filePath, fs.writeJsonSync);
            return conf;
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
    return new Promise(resolve => {
      const cli = this._execFile(this.getCCSPVFilePath(), ['--version'], err => {
        if (err) {
          logger.error(err);
          resolve('unknown');
        } else
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
      this.isWalletRPCRunning().then(running => { // success if wallet already running
        if (running)
          resolve(true);
    else {
      if (this.spvIsRunning()) // first kill the prior process if rpc isn't working
        this._cli.kill();

      let started = false;
      const args = password ? ['--password', password] : [];
      const cli = this._spawn(this.getCCSPVFilePath(), args, {detached: false, windowsHide: true});
      cli.stdout.on('data', data => {
        if (started)
          return;
        const str = data.toString('utf8');
        if(!password && this._selectionPatt.test(str)) {
          started = true;
          resolve(false);
          cli.kill();
        } else if(/master\sRPC\sserver/i.test(str)) {
          started = true;
          // give the master RPC server a second to start
          setTimeout(() => {
            resolve(true);
          }, 500);
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.info(`startSPV ${str}`);
        if (started)
          return;
        started = true;
        resolve(false);
        cli.kill();
      });
      cli.stdout.on('close', code => {
        logger.info(`startSPV child process exited with code ${!code ? '0' : code}`);
      });

      // Watch process
      this._cli = cli;
    }
        });
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
    return new Promise((resolve, reject) => {
      if (!password) { // fail on bad password
        reject(new Error('failed to create wallet with empty password'));
        return;
      }

      let started = false;
      const cli = this._spawn(this.getCCSPVFilePath(), ['--createdefaultwallet', password], {detached: false, windowsHide: true});
      cli.stdout.on('data', data => {
        if (started)
          return;
        const str = data.toString('utf8');
        if (str.toLowerCase().includes('got relayfee for currency')) { // indicates startup successful
          started = true;
          resolve('unknown'); // TODO Resolve unknown mnemonic from rpc when that endpoint is ready
        }

        // TODO Pull mnemonic from rpc when that endpoint is ready
        // const mnemonicPatt = /mnemonic\s+=\s+(.+)/i;
        // if(mnemonicPatt.test(str)) {
        //   const mnemonic = str.match(mnemonicPatt)[1].trim();
        //   cli.kill();
        //   resolve(mnemonic);
        // }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error(str);
        if (started)
          return;
        started = true;
        reject(new Error('failed to create a new wallet'));
        cli.kill();
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
          cli.kill();
        }
      });
      cli.stderr.on('data', data => {
        const str = data.toString('utf8');
        logger.error('enableAllWallets', str);
        if (started)
          return;
        started = true;
        resolve(false);
        cli.kill();
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
    const storedMnemonic = this.getStoredMnemonic();

    const checkOldPassword = pbkdf2(oldPassword, currentSalt);
    if (currentPassword !== checkOldPassword) {
      logger.error('failed to change the password, passwords do not match');
      throw new Error('The old password is incorrect.');
    }

    let decryptedMnemonic = null;
    try {
      const crypt = new Crypt(oldPassword, currentSalt);
      decryptedMnemonic = crypt.decrypt(storedMnemonic);
    } catch(err) {
      logger.error('failed to decrypt the existing mnemonic', err);
      throw new Error('Failed to decrypt the existing mnemonic.');
    }

    if (decryptedMnemonic === null) {
      logger.error('failed to decrypt the existing mnemonic');
      throw new Error('Failed to decrypt the existing mnemonic (2).');
    }

    return this.saveWalletCredentials(newPassword, null, decryptedMnemonic);
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

}

export default CloudChains;
