// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import CCWalletConf from '../types/ccwalletconf';
import {parseAPIError} from '../util';

/**
 * CloudChains renderer counterpart.
 */
class CloudChains {
  /**
   * @type {Object}
   * @private
   */
  _api = null;

  /**
   * @type {LWDB}
   * @private
   */
  _db = null;

  /**
   * @type {DOMStorage}
   * @private
   */
  _storage = null;

  /**
   * Constructor
   * @param api {Object} Context bridge api
   * @param db {LWDB}
   * @param storage {DOMStorage}
   */
  constructor(api, db, storage) {
    this._api = api;
    this._db = db;
    this._storage = storage;
  }

  /**
   * Returns true if cloudchains has been installed (or run for the first time).
   * @return {boolean}
   */
  async isInstalled() {
    try {
      return await this._api.cloudChains_isInstalled();
    } catch (err) {
      return false;
    }
  }

  /**
   * Returns true if the settings path exists.
   * @return {boolean}
   */
  async hasSettings() {
    try {
      return await this._api.cloudChains_hasSettings();
    } catch (err) {
      return false;
    }
  }

  /**
   * Return the wallet conf with the specified ticker. Returns null
   * if no config was found.
   * @param ticker {string}
   * @return {CCWalletConf|null}
   */
  async getWalletConf(ticker) {
    try {
      const conf = await this._api.cloudChains_getWalletConf(ticker);
      return new CCWalletConf(ticker, conf);
    } catch (err) {
      return null;
    }
  }

  /**
   * Return the wallet confs.
   * @return {Array<CCWalletConf>}
   */
  async getWalletConfs() {
    try {
      const confs = await this._api.cloudChains_getWalletConfs();
      const r = [];
      for (const conf of confs)
        r.push(new CCWalletConf('', conf)); // empty ticker because it's set by Object.assign(conf)
      return r;
    } catch (err) {
      return [];
    }
  }

  /**
   * Return a copy of the master conf file.
   * @return {CCWalletConf}
   */
  async getMasterConf() {
    try {
      const conf = await this._api.cloudChains_getMasterConf();
      return new CCWalletConf('', conf); // empty ticker because it's set by Object.assign(conf)
    } catch (err) {
      return null;
    }
  }

  /**
   * Return the wallet created state.
   * @return {boolean}
   */
  async isWalletCreated() {
    try {
      return await this._api.cloudChains_isWalletCreated();
    } catch (err) {
      return null;
    }
  }

  /**
   * Save the cloudchains wallet credentials.
   * @param password {string}
   * @param salt {string|null} If null the salt is created
   */
  async saveWalletCredentials(password, salt) {
    try {
      return await this._api.cloudChains_saveWalletCredentials(password, salt);
    } catch (err) {
      return false;
    }
  }

  /**
   * Return the last known cloudchains wallet password. This is encrypted.
   * @return {string|null}
   */
  async getStoredPassword() {
    try {
      return await this._api.cloudChains_getStoredPassword();
    } catch (err) {
      return null;
    }
  }

  /**
   * Return the password salt.
   * @return {string|null}
   */
  async getStoredSalt() {
    try {
      return await this._api.cloudChains_getStoredSalt();
    } catch (err) {
      return null;
    }
  }

  /**
   * Return the last known cloudchains wallet mnemonic. This is decrypted.
   * @param password {string}
   * @return {string|null}
   */
  async getDecryptedMnemonic(password) {
    try {
      return await this._api.cloudChains_getDecryptedMnemonic(password);
    } catch (err) {
      return null;
    }
  }

  /**
   * Read all CloudChains token confs from disk. Returns false on error.
   * Fatal error throws. Individual token conf failures do not result in fatal error,
   * however, will return false. Returns true if no errors occurred.
   * @return {Promise<boolean>}
   * @throws {Error} on fatal error (e.g. failure to read settings dir)
   */
  async loadConfs() {
    try {
      return await this._api.cloudChains_loadConfs();
    } catch (e) {
      return false;
    }
  }

  /**
   * Gets the version of the CC CLI and returns an empty string on failure
   * @returns {Promise<string>}
   */
  async getCCSPVVersion() {
    try {
      return await this._api.cloudChains_getCCSPVVersion();
    } catch (e) {
      return '';
    }
  }

  /**
   * Returns true if the wallet rpc is accepting connections. Calls the rpc
   * "help" method.
   * @return {boolean}
   */
  async isWalletRPCRunning() {
    try {
      return await this._api.cloudChains_isWalletRPCRunning();
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns whether or not the cli is currently running
   * @returns {boolean}
   */
  async spvIsRunning() {
    try {
      return await this._api.cloudChains_spvIsRunning();
    } catch (e) {
      return false;
    }
  }

  /**
   * Starts the CloudChains CLI
   * @param password {string}
   * @returns {Promise<boolean>}
   */
  async startSPV(password = '') {
    try {
      return await this._api.cloudChains_startSPV(password);
    } catch (e) {
      return false;
    }
  }

  /**
   * Stops the CloudChains CLI
   * @returns {boolean}
   */
  async stopSPV() {
    try {
      return await this._api.cloudChains_stopSPV();
    } catch (e) {
      return false;
    }
  }

  /**
   * Creates a new CloudChains wallet
   * @param password {string}
   * @param mnemonic {string}
   * @returns {string}
   */
  async createSPVWallet(password, mnemonic = '') {
    try {
      if (password)
        await this._clearWalletStorage();
      return await this._api.cloudChains_createSPVWallet(password, mnemonic);
    } catch (e) {
      return '';
    }
  }

  /**
   * Enables all wallets using the CloudChains CLI param --enablerpcandconfigure
   * @returns {boolean}
   */
  async enableAllWallets() {
    try {
      return await this._api.cloudChains_enableAllWallets();
    } catch (e) {
      return false;
    }
  }

  /**
   * Changes the password and re-encrypts the stored mnemonic. Fails if the old
   * and new passwords don't match or if there's an error.
   * @param oldPassword
   * @param newPassword
   * @return {Promise<boolean>}
   * @throws {Error}
   */
  async changePassword(oldPassword, newPassword) {
    try {
      return await this._api.cloudChains_changePassword(oldPassword, newPassword);
    } catch (e) {
      parseAPIError(e);
      throw e; // bubble up
    }
  }

  /**
   * Returns true if password matches stored password.
   * Returns false otherwise.
   * @param password
   * @return {Promise<boolean>}
   * @throws {Error}
   */
  async matchesStoredPassword(password) {
    try {
      return await this._api.cloudChains_matchesStoredPassword(password);
    } catch (e) {
      parseAPIError(e);
      throw e; // bubble up
    }
  }

  /**
   * Returns true if this is a new install.
   * @return {Promise<boolean>}
   */
  async isNewInstall() {
    try {
      return await this._api.cloudChains_isNewInstall();
    } catch (e) {
      return false;
    }
  }

  /**
   * Clear wallet dbs.
   * @return {Promise<void>}
   * @private
   */
  async _clearWalletStorage() {
    await this._db.clear(); // <- clear all indexeddb data
    this._storage.clear(); // <- clear all stored data
  }
}

export default CloudChains;
