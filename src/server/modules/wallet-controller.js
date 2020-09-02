import {altCurrencies} from '../../app/constants';
import {logger} from './logger';
import {oneDaySeconds, oneMonthSeconds, oneWeekSeconds, halfYearSeconds,
        oneYearSeconds, multiplierForCurrency, unixTime, oneHourSeconds} from '../../app/util';
import {storageKeys} from '../constants';
import Wallet from './wallet';

import _ from 'lodash';
import {Map as IMap} from 'immutable';
import moment from 'moment';
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
   */
  constructor(cloudChains, manifest, storage) {
    this._cloudChains = cloudChains;
    this._manifest = manifest;
    this._storage = storage;
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
   * Return transaction data.
   * @param start Start time in unix epoch
   * @param end End time in unix epoch
   * @return {Map<string, RPCTransaction[]>}
   */
  getTransactions(start = 0, end = 0) {
    const data = new Map();
    for (const [ticker, wallet] of this._wallets)
      data.set(ticker, wallet.getTransactions(start, end));
    return data;
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
   * Return balance data over time.
   * @param timeframe {string} day|week|month|half-year|year
   * @param currency {string} The currency (USD, BTC)
   * @param currencyMultipliers {Object} {ticker: {...currencies: multiplier}}
   * @return {[{Number}, {Number}]} [unix_time, balance]
   */
  getBalanceOverTime(timeframe, currency, currencyMultipliers) {
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
    const data = this.getTransactions();
    for (const [ticker, transactions] of data) {
      if (transactions.length === 0)
        continue; // skip, no transactions

      // Currency multiplier for ticker
      const multiplier = multiplierForCurrency(ticker, currency, currencyMultipliers);

      // Sort by tx time ascending
      transactions.sort((a,b) => a.time - b.time);
      // TODO Need to cache the running balance on disk to prevent expensive lookups here
      // Determine the running balance
      let runningBalance = 0;
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (tx.time >= startTime) {
          // remove all items up to index
          transactions.splice(0, i);
          break; // done, sorted array ensures nothing missing
        }
        if (tx.isSend())
          runningBalance -= Math.abs(tx.amount) * multiplier;
        if (tx.isReceive())
          runningBalance += Math.abs(tx.amount) * multiplier;
      }

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
   * Loads all available wallets. Assumes that cloudchain confs are already
   * loaded.
   * @throws {Error} on fatal error
   */
  loadWallets() {
    // Create the wallet instances for all valid cloudchains wallets
    for (const conf of this._cloudChains.getWalletConfs()) {
      const token = this._manifest.getToken(conf.ticker());
      if (!token) {
        logger.info(`failed to load wallet for token: ${conf.ticker()}`);
        continue;
      }
      this._wallets.set(conf.ticker(), new Wallet(token, conf, this._storage));
    }
  }

  /**
   * Notify the store of the latest wallets.
   * @param action
   * @param store
   */
  dispatchWallets(action, store) {
    if (this._wallets)
      store.dispatch(action(Array.from(this._wallets.values())));
  }

  /**
   * Notify the store of the latest balances.
   * @param action
   * @param store
   */
  dispatchBalances(action, store) {
    store.dispatch(action(IMap(this.getBalances())));
  }

  /**
   * Notify the store of the latest transactions.
   * @param action
   * @param store
   */
  dispatchTransactions(action, store) {
    store.dispatch(action(IMap(this.getTransactions())));
  }

  /**
   * Notify the store of price multiplier updates.
   * @param action
   * @param store
   */
  dispatchPriceMultipliers(action, store) {
    let multipliers = this._storage.getItem(storageKeys.ALT_CURRENCY_MULTIPLIERS);
    if (!_.isPlainObject(multipliers))
      multipliers = {}; // default
      store.dispatch(action(multipliers));
  }

  /**
   * Fetch and update the currency multiplier data.
   * // TODO Put sample data structure here required by the request
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
   * Fetch and update the latest balance and transaction info for the wallet
   * with the specified ticker.
   * @param ticker {string}
   * @return {Promise<void>}
   */
  async updateBalanceInfo(ticker) {
    const balances = this.getBalances();
    if (await this._updateBalanceInfo(ticker, balances))
      this._storage.setItem(storageKeys.BALANCES, balances);
    // Trigger fetch on the latest transactions
    const wallet = this.getWallet(ticker);
    if (wallet)
      await wallet.updateTransactions();
  }

  /**
   * Fetch the latest balance and transaction info across all wallets.
   * @return {Promise<void>}
   */
  async updateAllBalances() {
    // Start with existing balance data and only persist new data if change
    // was detected.
    const balances = this.getBalances();
    let dataChanged = false;
    for (const wallet of this.getWallets()) {
      if (!wallet.rpcEnabled()) // Only query wallets that have rpc
        continue;
      if (await this._updateBalanceInfo(wallet.ticker, balances))
        dataChanged = true;
      // Trigger fetch on the latest transactions
      await wallet.updateTransactions();
    }

    // Save to storage
    if (dataChanged)
      this._storage.setItem(storageKeys.BALANCES, balances);
  }

  /**
   * Fetch and update the latest balance info for the wallet with the
   * specified ticker. Mutates the balances data provider passed into
   * the func but does not update the underlying data storage directly.
   * Returns true if the data providers were mutated.
   * @param ticker {string}
   * @param balances {Map<string, Array<string>>}
   * @return {Promise<boolean>}
   */
  async _updateBalanceInfo(ticker, balances) {
    // Start with existing balance data and only persist new data if no errors.
    const wallet = this.getWallet(ticker);
    if (!wallet)
      return false; // no wallet found

    let balanceUpdated = false;

    try {
      const balanceInfo = await wallet.getBalance();
      if (balanceInfo) { // ensure not null
        balances.set(wallet.ticker, balanceInfo);
        balanceUpdated = true;
      }
    } catch (err) {
      logger.error(`failed to get balance info for ${wallet.ticker}`, err);
    }

    return balanceUpdated;
  }
}

export default WalletController;
