import {localStorageKeys} from '../constants';
import {
  oneDaySeconds,
  oneHourSeconds,
  oneMonthSeconds,
  oneWeekSeconds,
  halfYearSeconds,
  oneYearSeconds,
  multiplierForCurrency,
  unixTime} from '../util';
import Wallet from '../types/wallet-r';

import _ from 'lodash';
import {logger} from './logger-r';
import {Map as IMap} from 'immutable';
import moment from 'moment';

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
   * Stores a cache of balance values.
   * @type {Map<string, [number, number]>} Map<timeframe, [unix_time, currency_val]>
   * @private
   */
  _balanceOverTimeCache = new Map();

  /**
   * Stores a cache of balance values.
   * @type {Map<string, number>} Map<timeframe, last_fetch_time>
   * @private
   */
  _balanceOverTimeFetchCache = new Map();

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
      for (const wallet of wallets) {
        if (wallet)
          r.push(new Wallet(this._api, this._domStorage, wallet));
      }
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
      if (!wallet)
        return null;
      return new Wallet(this._api, this._domStorage, wallet);
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
      for (const wallet of wallets) {
        if (wallet)
          r.push(new Wallet(this._api, this._domStorage, wallet));
      }
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
    const data = new Map();
    const wallets = await this.getEnabledWallets();
    for (const wallet of wallets)
      data.set(wallet.ticker, (await wallet.getTransactions(start, end)));
    return data;
  }

  /**
   * Return balance data over time.
   * @param timeframe {string} day|week|month|half-year|year
   * @param currency {string} The currency (USD, BTC)
   * @param currencyMultipliers {Object} {ticker: {...currencies: multiplier}}
   * @return {[{number}, {number}]} [unix_time, balance]
   */
  async getBalanceOverTime(timeframe, currency, currencyMultipliers) {
    const endTime = unixTime();
    let startTime = endTime;

    // Check cache first
    if (this._balanceOverTimeFetchCache.has(timeframe)
      && endTime - this._balanceOverTimeFetchCache.get(timeframe) <= 120) // 2 mins
      return this._balanceOverTimeCache.get(timeframe);

    let period;
    switch (timeframe) {
      case 'day':
        startTime -= oneDaySeconds;
        period = oneHourSeconds;
        break;
      case 'week':
        startTime -= oneWeekSeconds;
        period = oneHourSeconds;
        break;
      case 'month':
        startTime -= oneMonthSeconds;
        period = oneDaySeconds;
        break;
      case 'year':
        startTime -= oneYearSeconds;
        period = oneDaySeconds;
        break;
      case 'half-year': // default to half-year
      default:
        startTime -= halfYearSeconds;
        period = oneDaySeconds;
    }

    // Round down to start of day
    let m = moment.unix(startTime);
    m = m.startOf('day');
    startTime = m.unix();

    // Create a list of balances over a total timeframe group in time periods
    // based on user's timeframe filter.
    const coinBalances = new Map();
    const data = await this.getTransactions();
    for (let [ticker, transactions] of data) {
      if (transactions.length === 0)
        continue; // skip, no transactions

      // Currency multiplier for ticker
      const multiplier = multiplierForCurrency(ticker, currency, currencyMultipliers);

      // Sort by tx time ascending
      transactions.sort((a,b) => a.time - b.time);
      // TODO Need to cache the running balance on disk to prevent expensive lookups here
      // Determine the running balance
      let runningBalance = 0;
      let txRemaining = false;
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (tx.time >= startTime) {
          // remove all items up to index
          transactions.splice(0, i);
          txRemaining = true;
          break; // done, sorted array ensures nothing missing
        }
        if (tx.isSend())
          runningBalance -= Math.abs(tx.amount) * multiplier;
        if (tx.isReceive())
          runningBalance += Math.abs(tx.amount) * multiplier;
      }
      if (!txRemaining)
        transactions = []; // remove because all txs have been processed

      // Only advance the search index if a transaction falls within the time period
      const balances = [];
      let tx_idx = 0;
      for (let i = startTime; i <= endTime; i += period) {
        for (let j = tx_idx; j < transactions.length; j++, tx_idx++) {
          const tx = transactions[tx_idx];
          if (tx.time >= i + period)
            break;
          if (tx.isSend())
            runningBalance -= Math.abs(tx.amount) * multiplier;
          if (tx.isReceive())
            runningBalance += Math.abs(tx.amount) * multiplier;
        }
        if (runningBalance < 0)
          runningBalance = 0;
        balances.push([i, runningBalance]);
      }
      coinBalances.set(ticker, balances);
    }

    if (coinBalances.size === 0)
      return [[startTime, 0]];

    const allBalances = [];
    const periods = coinBalances.get(coinBalances.keys().next().value).length;
    for (let i = 0; i < periods; i++) {
      let runningBalance = 0;
      for (const [ticker, balances] of coinBalances)
        runningBalance += balances[i][1]; // [1] = balance in currency
      allBalances.push([startTime + i * period, runningBalance]);
    }

    // cache
    this._balanceOverTimeCache.set(timeframe, allBalances);
    this._balanceOverTimeFetchCache.set(timeframe, unixTime());
    return allBalances;
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
   * @return {Promise<void>}
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
      // Trigger fetch on the latest transactions
      const wallet = this.getWallet(ticker);
      if (wallet)
        await wallet.updateTransactions();
    } catch (err) {
      logger.error(err);
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
      // Trigger fetch on the latest transactions
      const wallets = await this.getEnabledWallets();
      const updateRequests = [];
      for (const wallet of wallets)
        updateRequests.push(wallet.updateTransactions());
      await Promise.all(updateRequests);
    } catch (err) {
      logger.error(err);
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
