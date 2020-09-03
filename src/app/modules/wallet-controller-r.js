import {localStorageKeys} from '../constants';
import RPCTransaction from '../types/rpc-transaction';
import Wallet from '../types/wallet-r';

import _ from 'lodash';
import {Map as IMap} from 'immutable';

/**
 * Wallet controller renderer counterpart.
 */
class WalletController {
  /**
   * Context bridge api
   * @type {Object}
   * @private
   */
  _api = null;

  /**
   * @type {TokenManifest}
   * @private
   */
  _manifest = null;

  /**
   * @type {DOMStorage}
   * @private
   */
  _domStorage = null;

  /**
   * Track wallet polling.
   * @type {Object}
   * @private
   */
  _pollInterval = null;

  /**
   * Track currency polling.
   * @type {Object}
   * @private
   */
  _pollMultipliersInterval = null;

  /**
   * Constructor
   * @param api {Object} Context bridge api
   * @param manifest {TokenManifest}
   * @param domStorage {DOMStorage}
   */
  constructor(api, manifest, domStorage) {
    this._api = api;
    this._manifest = manifest;
    this._domStorage = domStorage;
  }

  /**
   * Return a copy of all wallets.
   * @returns {Array<Wallet>}
   */
  async getWallets() {
    try {
      const wallets = await this._api.walletController_getWallets();
      const r = [];
      for (const wallet of wallets)
        r.push(new Wallet(this._api, wallet));
      return r;
    } catch (err) {
      return [];
    }
  }

  /**
   * Return the wallet with ticker.
   * @param ticker {string}
   * @returns {Wallet|null}
   */
  async getWallet(ticker) {
    try {
      const wallet = await this._api.walletController_getWallet(ticker);
      return new Wallet(this._api, wallet);
    } catch (err) {
      return null;
    }
  }

  /**
   * Return a copy of the enabled wallets.
   * @returns {Array<Wallet>}
   */
  async getEnabledWallets() {
    try {
      const wallets = await this._api.walletController_getEnabledWallets();
      const r = [];
      for (const wallet of wallets)
        r.push(new Wallet(this._api, wallet));
      return r;
    } catch (err) {
      return [];
    }
  }

  /**
   * Return balances data.
   * @return {Map<string, Array<string>>}
   */
  async getBalances() {
    try {
      const balances = await this._api.walletController_getBalances();
      return new Map(balances);
    } catch (err) {
      return new Map();
    }
  }

  /**
   * Return transaction data.
   * @param start Start time in unix epoch
   * @param end End time in unix epoch
   * @return {Map<string, RPCTransaction[]>}
   */
  async getTransactions(start = 0, end = 0) {
    try {
      const data = await this._api.walletController_getTransactions(start, end);
      for (const [ticker, txs] of data)
        data.set(ticker, txs.map(tx => new RPCTransaction(tx)));
      return data;
    } catch (err) {
      return new Map();
    }
  }

  /**
   * Return balance data over time.
   * @param timeframe {string} day|week|month|half-year|year
   * @param currency {string} The currency (USD, BTC)
   * @param currencyMultipliers {Object} {ticker: {...currencies: multiplier}}
   * @return {[{number}, {number}]} [unix_time, balance]
   */
  async getBalanceOverTime(timeframe, currency, currencyMultipliers) {
    try {
      return await this._api.walletController_getBalanceOverTime(timeframe, currency, currencyMultipliers);
    } catch (err) {
      return [0, 0];
    }
  }

  /**
   * Get the active wallet. Returns null if no active wallet.
   * @return {string|null}
   */
  async getActiveWallet() {
    const activeWallet = this._domStorage.getItem(localStorageKeys.ACTIVE_WALLET);
    if (!_.isString(activeWallet) || !this._manifest.getToken(activeWallet))
      return null;
    return activeWallet;
  }

  /**
   * Set the active wallet.
   * @param activeWalletTicker {string}
   */
  setActiveWallet(activeWalletTicker) {
    if (!this._manifest.getToken(activeWalletTicker)) // ignore bad/unknown tickers
      return;
    this._domStorage.setItem(localStorageKeys.ACTIVE_WALLET, activeWalletTicker);
  }

  /**
   * Loads all available wallets. Assumes that cloudchain confs are already
   * loaded.
   * @throws {Error} on fatal error
   */
  async loadWallets() {
    return await this._api.walletController_loadWallets();
  }

  /**
   * Notify the store of the latest wallets.
   * @param action
   * @param store
   */
  async dispatchWallets(action, store) {
    const wallets = await this.getWallets();
    store.dispatch(action(wallets));
  }

  /**
   * Notify the store of the latest balances.
   * @param action
   * @param store
   */
  async dispatchBalances(action, store) {
    const balances = await this.getBalances();
    store.dispatch(action(IMap(balances)));
  }

  /**
   * Notify the store of the latest transactions.
   * @param action
   * @param store
   */
  async dispatchTransactions(action, store) {
    const transactions = await this.getTransactions();
    store.dispatch(action(IMap(transactions)));
  }

  /**
   * Notify the store of price multiplier updates.
   * @param action
   * @param store
   */
  async dispatchPriceMultipliers(action, store) {
    const multipliers = await this._api.walletController_getCurrencyMultipliers();
    store.dispatch(action(multipliers));
  }

  /**
   * Fetch and update the currency multiplier data.
   * @return {Promise<void>}
   */
  async updatePriceMultipliers() {
    try {
      await this._api.walletController_updatePriceMultipliers();
    } catch (err) {
      // TODO fail silently?
    }
  }

  /**
   * Fetch and update the latest balance and transaction info for the wallet
   * with the specified ticker.
   * @param ticker {string}
   * @return {Promise<void>}
   */
  async updateBalanceInfo(ticker) {
    try {
      await this._api.walletController_updateBalanceInfo(ticker);
    } catch (err) {
      // TODO fail silently?
    }
  }

  /**
   * Fetch the latest balance and transaction info across all wallets.
   * @return {Promise<void>}
   */
  async updateAllBalances() {
    try {
      await this._api.walletController_updateAllBalances();
    } catch (err) {
      // TODO fail silently?
    }
  }

  /**
   * Start polling for cloudchains wallet updates.
   * @param interval {number}
   * @param handler {function}
   */
  pollUpdates(interval, handler) {
    if (this._pollInterval !== null)
      clearTimeout(this._pollInterval);
    this._pollInterval = setTimeout((async function() {
      await handler();
      this.pollUpdates(interval, handler);
    }).bind(this), interval);
  }

  /**
   * Start polling for cloudchains wallet updates.
   * @param interval {number}
   * @param handler {function}
   */
  pollPriceMultipliers(interval, handler) {
    if (this._pollMultipliersInterval !== null)
      clearTimeout(this._pollMultipliersInterval);
    this._pollMultipliersInterval = setTimeout((async function() {
      await handler();
      this.pollPriceMultipliers(interval, handler);
    }).bind(this), interval);
  }
}

export default WalletController;
