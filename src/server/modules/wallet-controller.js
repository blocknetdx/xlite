// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {altCurrencies} from '../../app/constants';
import {logger} from './logger';
import {storageKeys} from '../constants';
import Wallet from './wallet';

import _ from 'lodash';
import request from 'superagent';

/**
 * Manages wallets
 */
class WalletController {

  /**
   * @type {Map<string, Wallet>}
   */
  _wallets = new Map();

  /**
   * @type {CloudChains}
   * @private
   */
  _cloudChains = null;

  /**
   * @type {TokenManifest}
   * @private
   */
  _manifest = null;

  /**
   * @type {SimpleStorage}
   * @private
   */
  _storage = null;

  /**
   * @type {boolean}
   * @private
   */
  _debugMode = false;

  /**
   * Default request for currency pricing information.
   * @param ticker
   * @param currencies
   * @return {Promise<*>}
   */
  static async defaultRequest(ticker, currencies) {
    return await request.get(`https://min-api.cryptocompare.com/data/price?fsym=${ticker}&tsyms=${currencies.join(',')}`);
  }

  /**
   * Constructs a WalletController instance
   * @param cloudChains {CloudChains}
   * @param manifest {TokenManifest}
   * @param storage {SimpleStorage}
   * @param debugMode {boolean}
   */
  constructor(cloudChains, manifest, storage, debugMode = false) {
    this._cloudChains = cloudChains;
    this._manifest = manifest;
    this._storage = storage;
    this._debugMode = debugMode;
  }

  /**
   * Return a copy of all wallets.
   * @returns {Array<Wallet>}
   */
  getWallets() {
    return Array.from(this._wallets.values());
  }

  /**
   * Return the wallet with ticker.
   * @param ticker {string}
   * @returns {Wallet|null}
   */
  getWallet(ticker) {
    return this._wallets.get(ticker) || null;
  }

  /**
   * Return a copy of the enabled wallets.
   * @returns {Array<Wallet>}
   */
  getEnabledWallets() {
    return Array.from(this._wallets.values())
      .filter(w => w.rpcEnabled());
  }

  /**
   * Return balances data.
   * @return {Map<string, Array<string>>}
   */
  getBalances() {
    const data = this._storage.getItem(storageKeys.BALANCES);
    if (!_.isArray(data))
      return new Map();
    return new Map(data);
  }

  /**
   * Return the currency multipliers.
   * @return {Object}
   */
  getCurrencyMultipliers() {
    let multipliers = this._storage.getItem(storageKeys.ALT_CURRENCY_MULTIPLIERS);
    if (!_.isPlainObject(multipliers))
      multipliers = {}; // default
    return multipliers;
  }

  /**
   * Loads all available wallets. Assumes that cloudchain confs are already
   * loaded.
   * @throws {Error} on fatal error
   */
  loadWallets() {
    const disabledWallets = new Set(['DGB', 'BCH', 'RVN', 'PHORE', 'BAY', 'TBLOCK', 'TZC', 'XLQ', 'null']); // TODO Enable wallets when supported
    // Create the wallet instances for all valid cloudchains wallets
    for (const conf of this._cloudChains.getWalletConfs()) {
      if (disabledWallets.has(conf.ticker()))
        continue;
      const token = this._manifest.getToken(conf.ticker());
      if (!token) {
        logger.info(`failed to load wallet for token: ${conf.ticker()}`);
        continue;
      }
      this._wallets.set(conf.ticker(), new Wallet(token, conf, this._storage, this._debugMode));
    }
  }

  /**
   * Fetch and update the currency multiplier data.
   * Sample data for BLOCK:
   * {"USD":1.044,"BTC":0.00009999,"EUR":0.8827,"GBP":0.7893}
   * @param currencyReq {function(string, Array<string>)}
   * @return {Promise<void>}
   */
  async updatePriceMultipliers(currencyReq) {
    const currencies = new Set(); // no duplicates
    for (const currency of Object.keys(altCurrencies))
      currencies.add(currency);

    const multipliers = {};
    for (const wallet of this.getWallets()) {
      try {
        const { body } = await currencyReq(wallet.ticker, Array.from(currencies));
        for (const [currency, multiplier] of Object.entries(body)) {
          const o = multipliers[wallet.ticker];
          if (!o)
            multipliers[wallet.ticker] = {};
          multipliers[wallet.ticker][currency] = multiplier;
        }
      } catch (err) {
        logger.error(`failed to update currency data for ${wallet.ticker}`, err); // non-fatal
        multipliers[wallet.ticker] = {};
      }
    }

    this._storage.setItem(storageKeys.ALT_CURRENCY_MULTIPLIERS, multipliers);
  }

  /**
   * Fetch and update the latest balance info for the wallet
   * with the specified ticker.
   * @param ticker {string}
   * @return {Promise<void>}
   */
  async updateBalanceInfo(ticker) {
    const balance = await this._updateBalanceInfo(ticker);
    if (!balance)
      return;
    const balances = this.getBalances();
    balances.set(ticker, balance);
    this._storage.setItem(storageKeys.BALANCES, balances);
  }

  /**
   * Fetch the latest balance and transaction info across all wallets.
   * @return {Promise<void>}
   */
  async updateAllBalances() {
    // Start with existing balance data and only persist new data if change
    // was detected.
    const balances = new Map();
    for (const wallet of this.getWallets()) {
      if (!wallet.rpcEnabled()) // Only query wallets that have rpc
        continue;
      const balance = await this._updateBalanceInfo(wallet.ticker);
      if (balance)
        balances.set(wallet.ticker, balance);
    }

    // Save to storage
    if (balances.size > 0) {
      const currentBalances = this.getBalances();
      for (const [ticker, balance] of balances)
        currentBalances.set(ticker, balance);
      this._storage.setItem(storageKeys.BALANCES, currentBalances);
    }
  }

  /**
   * Fetch and update the latest balance info for the wallet with the
   * specified ticker. Mutates the balances data provider passed into
   * the func but does not update the underlying data storage directly.
   * Returns true if the data providers were mutated.
   * @param ticker {string}
   * @return {Promise<Array>}
   */
  async _updateBalanceInfo(ticker) {
    // Start with existing balance data and only persist new data if no errors.
    const wallet = this.getWallet(ticker);
    if (!wallet)
      return null; // no wallet found

    try {
      return await wallet.getBalance();
    } catch (err) {
      logger.error(`failed to get balance info for ${wallet.ticker}`, err);
      return null;
    }
  }
}

export default WalletController;
