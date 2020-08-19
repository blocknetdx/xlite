import {altCurrencies} from '../constants';
import {localStorageKeys} from '../constants';
import {logger} from '../util';
import RPCTransaction from '../types/rpc-transaction';
import Wallet from '../types/wallet';

import _ from 'lodash';
import {Map as IMap} from 'immutable';

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
   * Constructs a WalletController instance
   * @param cloudChains {CloudChains}
   * @param manifest {TokenManifest}
   * @param domStorage {DOMStorage}
   */
  constructor(cloudChains, manifest, domStorage) {
    this._cloudChains = cloudChains;
    this._manifest = manifest;
    this._domStorage = domStorage;
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
    return new Map(this._domStorage.getItem(localStorageKeys.BALANCES));
  }

  /**
   * Return transaction data.
   * @return {Map<string, RPCTransaction[]>}
   */
  getTransactions() {
    const data = new Map();
    for (const [ticker, wallet] of this._wallets)
      data.set(ticker, wallet.getTransactions());
    return data;
  }

  /**
   * Get the active wallet. Returns null if no active wallet.
   * @return {string|null}
   */
  getActiveWallet() {
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
   * Loads all available wallets.
   * @throws {Error} on fatal error
   */
  loadWallets() {
    if (!this._cloudChains.loadConfs()) {
      // This indicates some confs failed, but not necessarily all confs
      // i.e. it shouldn't be a fatal error as some wallets could be working.
      // TODO Notify user that some confs failed to load?
    }

    // Create the wallet instances for all valid cloudchains wallets
    this._cloudChains.getWalletConfs().forEach(conf => {
      const token = this._manifest.getToken(conf.ticker());
      if (!token) {
        logger.info(`failed to load wallet for token: ${conf.ticker()}`);
        return;
      }
      this._wallets.set(conf.ticker(), new Wallet(token, conf, this._domStorage));
    }, this);
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
   * Notify the store of the active wallet.
   * @param action
   * @param store
   */
  dispatchActiveWallet(action, store) {
    const wallet = this.getActiveWallet();
    if (wallet)
      store.dispatch(action(wallet));
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
    let multipliers = this._domStorage.getItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS);
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

    this._domStorage.setItem(localStorageKeys.ALT_CURRENCY_MULTIPLIERS, multipliers);
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
      this._domStorage.setItem(localStorageKeys.BALANCES, balances);
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
      if (await this._updateBalanceInfo(wallet.ticker, balances))
        dataChanged = true;
      // Trigger fetch on the latest transactions
      await wallet.updateTransactions();
    }

    // Save to storage
    if (dataChanged)
      this._domStorage.setItem(localStorageKeys.BALANCES, balances);
  }

  /**
   * Start polling for cloudchains wallet updates.
   * @param interval {number}
   */
  pollUpdates(interval) {
    if (this._pollInterval !== null)
      clearTimeout(this._pollInterval);
    this._pollInterval = setTimeout((async function() {
      await this.updateAllBalances();
      this.pollUpdates(interval);
    }).bind(this), interval);
  }

  /**
   * Start polling for cloudchains wallet updates.
   * @param currencyReq {function(string, Array<string>)}
   * @param interval {number}
   */
  pollPriceMultipliers(currencyReq, interval) {
    if (this._pollMultipliersInterval !== null)
      clearTimeout(this._pollMultipliersInterval);
    this._pollMultipliersInterval = setTimeout((async function() {
      await this.updatePriceMultipliers(currencyReq);
      this.pollPriceMultipliers(currencyReq, interval);
    }).bind(this), interval);
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
