// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {localStorageKeys} from '../constants';
import {logger} from './logger-r';
import {
  oneDaySeconds,
  oneHourSeconds,
  oneMonthSeconds,
  oneWeekSeconds,
  halfYearSeconds,
  oneYearSeconds,
  multiplierForCurrency,
  unixTime, timeout, resolveAll
} from '../util';
import Wallet from '../types/wallet-r';

import _ from 'lodash';
import {Map as IMap} from 'immutable';
import moment from 'moment';
import * as appActions from '../actions/app-actions';

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
   * @type {LWDB}
   * @private
   */
  _db = null;

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
   * @type {function}
   * @param loadingTransactions {boolean}
   * @private
   */
    // eslint-disable-next-line no-unused-vars
  _dispatchLoadingTransactions = loadingTransactions => {};

  /**
   * Constructor
   * @param api {Object} Context bridge api
   * @param manifest {TokenManifest}
   * @param domStorage {DOMStorage}
   * @param db {LWDB}
   * @param dispatchLoadingTransactions {function(boolean)}
   */
  constructor(api, manifest, domStorage, db, dispatchLoadingTransactions = null) {
    this._api = api;
    this._manifest = manifest;
    this._domStorage = domStorage;
    this._db = db;
    if(dispatchLoadingTransactions)
      this._dispatchLoadingTransactions = dispatchLoadingTransactions;
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
          r.push(new Wallet(wallet, this._api, this._domStorage, this._db));
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
      return new Wallet(wallet, this._api, this._domStorage, this._db);
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
          r.push(new Wallet(wallet, this._api, this._domStorage, this._db));
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
    const wallets = await this.getWallets();
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
      const balances = [[startTime, runningBalance]]; // include the starting balance
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
   * Notify the store of the latest transactions.
   * @param action
   * @param store
   */
  async dispatchTransactionsStream(action, store) {
    const data = new Map();
    const wallets = await this.getWallets();
    const promises = [];
    for (const wallet of wallets) {
      promises.push(new Promise(resolve => {
        wallet.getTransactions(0, 0)
          .then(transactions => {
            data.set(wallet.ticker, transactions);
            store.dispatch(action(IMap(data)));
            resolve();
          })
          .catch(() => resolve());
      }));
    }
    return Promise.all(promises);
  }

  /**
   * Notify the store of the latest transactions.
   * @param ticker {String}
   * @param action
   * @param store
   */
  async dispatchTransactionsTicker(ticker, action, store) {
    const wallet = await this.getWallet(ticker);
    try {
      const transactions = await wallet.getTransactions(0, 0);
      const txns = store.getState().appState.transactions;
      const data = new Map(!_.isNil(txns) ? txns.entries() : null);
      data.set(wallet.ticker, transactions);
      store.dispatch(action(IMap(data)));
    } catch (e) {
      // fail silently
    }
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
   * Notify the store of updated prices.
   * @param pricingController {Pricing}
   * @param action
   * @param store
   * @param expiry {Number}
   */
  async dispatchPrices(pricingController, action, store, expiry = 600) {
    const prices = await this.updatePrices(pricingController, expiry);
    store.dispatch(action(prices));
  }

  /**
   * Return pricing data from cache.
   * @param pricingController {Pricing}
   * @param expiry {Number}
   * @return {Promise<Map<{string}, {PriceData[]}>>}
   */
  async updatePrices(pricingController, expiry = 600) {
    let prices = new IMap();
    try {
      // Always pull from cache (do not trigger network requests here)
      const tickers = (await this.getWallets()).map(w => w.ticker);
      const priceData = await pricingController.updatePricing(tickers, ['USD'], expiry);
      prices = new IMap(priceData);
    } catch (e) {
      logger.error('failed initial pricing update', e.message);
    }
    return prices;
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
   * @param fromZero {boolean} force a start time of zero
   * @param uiTimeout {number} timeout in ms to allow the ui a minimum time for displaying the loading spinner
   * @return {Promise<void>}
   */
  async updateBalanceInfo(ticker, fromZero = false, uiTimeout = 0) {
    try {
      if (this._dispatchLoadingTransactions)
      this._dispatchLoadingTransactions(true);
      await this._api.walletController_updateBalanceInfo(ticker);
      // Trigger fetch on the latest transactions
      const wallet = await this.getWallet(ticker);
      if (wallet)
        await wallet.updateTransactions(fromZero);
      if(uiTimeout > 0)
        await timeout(uiTimeout);
      if (this._dispatchLoadingTransactions)
      this._dispatchLoadingTransactions(false);
    } catch (err) {
      logger.error(err);
      // TODO fail silently?
      if (this._dispatchLoadingTransactions)
      this._dispatchLoadingTransactions(false);
    }
  }

  /**
   * Fetch the latest balance and transaction info across all wallets.
   * @param fromZero {boolean} force a start time of zero
   * @param uiTimeout {number} timeout in ms to allow the ui a minimum time for displaying loading spinner
   * @return {Promise<void>}
   */
  async updateAllBalances(fromZero=false, uiTimeout=0) {
    const updateRequests = [];
    if (this._dispatchLoadingTransactions)
      this._dispatchLoadingTransactions(true);
    try {
      await this._api.walletController_updateAllBalances();
      // Trigger fetch on the latest transactions
      const wallets = await this.getEnabledWallets();
      for (const wallet of wallets)
        updateRequests.push(wallet.updateTransactions(fromZero));
    } catch (e) {
      logger.error(e);
    }
    return new Promise(resolve => {
      if(uiTimeout > 0)
        updateRequests.push(timeout(uiTimeout));
      resolveAll(updateRequests).then(success => {
        if (this._dispatchLoadingTransactions)
          this._dispatchLoadingTransactions(false);
        resolve();
      });
    });
  }

  /**
   * Fetch the latest balance and transaction info across all wallets.
   * @param fromZero {boolean} force a start time of zero
   * @param updateHandler {function(String)} Handler called as each coin is updated. Ticker is param1.
   * @return {Promise<void>}
   */
  async updateAllBalancesStream(fromZero=false, updateHandler=null) {
    if (this._dispatchLoadingTransactions)
      this._dispatchLoadingTransactions(true);
    // Concurrently ask all wallets to update their balances and transactions
    // and stream these updates to the update handler, which will be called once
    // for each non-error wallet update.
    const promises = [];
    const wallets = await this.getEnabledWallets();
    for (const wallet of wallets) {
      promises.push(new Promise(resolve => {
        Promise.all([
          this._api.walletController_updateBalanceInfo(wallet.ticker),
          wallet.updateTransactions(fromZero)
        ]).then(() => {
          if (updateHandler)
            updateHandler(wallet.ticker);
          resolve();
        }).catch(e => {
          console.log(e);
          resolve();
        });
      }));
    }
    return new Promise(resolve => {
      resolveAll(promises).then(success => {
        if (this._dispatchLoadingTransactions)
          this._dispatchLoadingTransactions(false);
        resolve();
      });
    });
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

  /**
   * Waits for wallet rpc ready states and fetches initial data on valid
   * rpc connections. Any wallets that are not ready in timeOut time will
   * not attempt to fetch initial data.
   * @param timeOut {Number} Milliseconds
   * @param store {Object}
   * @return {Promise<boolean>}
   */
  async waitForRpcAndFetch(timeOut, store) {
    // This code concurrently checks the walletRpcReady status of each enabled
    // wallet.
    const promises = [];
    const wallets = await this.getWallets();
    for (const wallet of wallets) {
      const ticker = wallet.ticker;
      const w = wallet;
      promises.push(new Promise((resolve, reject) => {
        this._api.walletController_walletRpcReady(ticker, timeOut).then(ready => {
          if (!ready) {
            reject(new Error(`wait for rpc timeout ${ticker}`));
            return;
          }
          // Notify UI of existing cached info
          if (w.rpcEnabled()) {
            this.updateBalanceInfo(wallet.ticker).then(() => {
              this.dispatchTransactionsTicker(wallet.ticker, appActions.setTransactions, store);
              this.dispatchBalances(appActions.setBalances, store);
              resolve(ticker);
            });
          } else
            resolve(ticker);
        }).catch(e => {
          reject(e);
        });
      }));
    }
    return resolveAll(promises);
  }
}

export default WalletController;
