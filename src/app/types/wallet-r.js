import {localStorageKeys} from '../constants';
import {logger} from '../modules/logger-r';
import RPCTransaction from './rpc-transaction';
import Token from './token';
import {unixTime} from '../util';

import _ from 'lodash';

/**
 * Class representing a wallet. Do not store any in memory state,
 * this class creates ephemeral instances, any persistent data
 * should be added to dom storage.
 */
class Wallet {

  /**
   * @type {string}
   */
  ticker = '';

  /**
   * @type {string}
   */
  name = '';

  /**
   * Coin logo image path
   * @type {string}
   */
  imagePath = '';

  /**
   * Context bridge api
   * @type {Object}
   * @private
   */
  _api = null;

  /**
   * Blocknet token data.
   * @type {Token}
   */
  _token = null;

  /**
   * @type {DOMStorage}
   * @private
   */
  _storage = null;

  // Do not store any in memory state, this class creates ephemeral
  // instances, any persistent data should be added to dom storage.

  /**
   * Constructs a wallet
   * @param api {Object} Context bridge api
   * @param stor {DOMStorage}
   * @param data {Object} Initialization obj
   */
  constructor(api, stor, data) {
    if (data)
      Object.assign(this, data);
    this._api = api;
    this._storage = stor;
  }

  /**
   * RPC enabled. Returns false if config explicitly set rpc to false or
   * if there's no config.
   * @return {boolean}
   */
  async rpcEnabled() {
    try {
      return await this._api.wallet_rpcEnabled(this.ticker);
    } catch (err) {
      return false;
    }
  }

  /**
   * Return the blockchain name for the wallet.
   * @return {string}
   */
  blockchain() {
    return this.name;
  }

  /**
   * Return the underlying wallet token data.
   * @return {Token}
   */
  token() {
    return new Token(this._token);
  }

  /**
   * Get balance information. Returns null on error.
   * @return {Promise<null|string[]>}
   */
  async getBalance() {
    try {
      return await this._api.wallet_getBalance(this.ticker);
    } catch (err) {
      return null;
    }
  }

  /**
   * Get wallet transactions for the time period.
   * @param startTime {number} Get transactions since this time
   * @param endTime {number} Get transactions to this time
   * @return {RPCTransaction[]}
   */
  getTransactions(startTime=0, endTime=0) {
    return this._getTransactionsFromStorage(startTime, endTime);
  }

  /**
   * Fetches the latest transactions from the server.
   * @return {Promise<boolean>} true if update occurred, otherwise false
   */
  async updateTransactions() {
    if (!this._needsTransactionUpdate())
      return false; // rate limit this request
    await this._fetchTransactions();
    return true;
  }

  /**
   * Get addresses. Returns null on error.
   * @return {Promise<null|string[]>}
   */
  async getAddresses() {
    try {
      return await this._api.wallet_getAddresses(this.ticker);
    } catch (err) {
      return null;
    }
  }

  /**
   * Get new address. Returns empty string on error.
   * @return {Promise<string>}
   */
  async generateNewAddress() {
    try {
      return await this._api.wallet_generateNewAddress(this.ticker);
    } catch (err) {
      return '';
    }
  }

  /**
   * Return cached coins. Fetch if last cache time expired.
   * @param cacheExpirySeconds {number} Number of seconds until cache expires
   * @return {Promise<RPCUnspent[]>}
   */
  async getCachedUnspent(cacheExpirySeconds) {
    try {
      return await this._api.wallet_getCachedUnspent(this.ticker, cacheExpirySeconds);
    } catch (err) {
      return [];
    }
  }

  /**
   * Return the transaction explorer link.
   * @param txid {string}
   * @return {string}
   */
  getExplorerLinkForTx(txid) {
    return `https://chainz.cryptoid.info/${this.ticker.toLowerCase()}/tx.dws?${txid}.htm`;
  }

  /**
   * Sends the amount to the specified address.
   * @param recipients {Recipient[]}
   * @returns {Promise<null|string>} Returns txid on success, null on error
   */
  async send(recipients) {
    try {
      return await this._api.wallet_send(this.ticker, recipients);
    } catch (err) {
      return null;
    }
  }

  /**
   * Returns true if the wait period for transaction fetching has ended.
   * @return {boolean}
   * @private
   */
  _needsTransactionUpdate() {
    return unixTime() - this._getLastTransactionFetchTime() > 10;
  }

  /**
   * Return the time of the last transaction fetch.
   * @return {number}
   * @private
   */
  _getLastTransactionFetchTime() {
    const fetchTime = this._storage.getItem(this._getTransactionFetchTimeStorageKey());
    if (!_.isNumber(fetchTime) || fetchTime < 0)
      return 0;
    return fetchTime;
  }

  /**
   * Set the time of the last transaction fetch.
   * @param fetchTime
   * @private
   */
  _setLastTransactionFetchTime(fetchTime) {
    if (fetchTime < 0)
      fetchTime = 0;
    this._storage.setItem(this._getTransactionFetchTimeStorageKey(), fetchTime);
  }

  /**
   * Get the transaction storage key.
   * @private
   * @return {string}
   */
  _getTransactionStorageKey() {
    return localStorageKeys.TRANSACTIONS + '_' + this.ticker;
  }

  /**
   * Get the transaction fetch time storage key.
   * @private
   * @return {string}
   */
  _getTransactionFetchTimeStorageKey() {
    return localStorageKeys.TX_LAST_FETCH_TIME + '_' + this.ticker;
  }

  /**
   * Returns the transactions from persistent storage.
   * @param startTime {number}
   * @param endTime {number}
   * @return {RPCTransaction[]}
   * @private
   */
  _getTransactionsFromStorage(startTime=0, endTime=0) {
    if (startTime < 0)
      startTime = 0;
    if (endTime <= 0)
      endTime = unixTime();
    if (endTime < startTime)
      endTime = startTime;

    const data = this._storage.getItem(this._getTransactionStorageKey());
    if (!_.isArray(data))
      return [];
    return data.map(t => new RPCTransaction(t))
      .filter(t => t.time >= startTime && t.time <= endTime);
  }

  /**
   * Add the specified transactions to the storage. Checks for duplicates.
   * @param txs {RPCTransaction[]}
   * @private
   */
  _addTransactionsToStorage(txs) {
    if (!_.isArray(txs) || txs.length === 0)
      return false; // do not store bad data

    // Only store unique transactions where the latest transactions
    // replace any old ones.
    const data = this._getTransactionsFromStorage(); // fetch all
    const unique = new Map();
    for (const t of data)
      unique.set(t.key(), t);
    for (const t of txs) // new transaction overwrites old
      unique.set(t.key(), t);

    const newData = Array.from(unique.values());
    this._storage.setItem(this._getTransactionStorageKey(), newData);
    return true;
  }

  /**
   * Fetch wallet transactions from the server and save to persistent
   * storage. Returns all known transactions for the period if rpc is
   * disabled. The wallet rpc will only be called for more transaction
   * data if the timeframe specified is outside the last known fetch
   * time.
   * @param startTime {number} Get transactions since this time
   * @param endTime {number} Get transactions to this time
   * @return {Promise<RPCTransaction[]>}
   */
  async _fetchTransactions(startTime=0, endTime=0) {
    if (endTime === 0)
      endTime = unixTime();

    // If we don't need to fetch from rpc then return what we know
    const lastFetchTime = this._getLastTransactionFetchTime();
    if (endTime < lastFetchTime)
      return this._getTransactionsFromStorage(startTime, endTime);

    // All transactions that we know from start time to last fetch time
    const existingTxs = this._getTransactionsFromStorage(startTime, lastFetchTime);
    let txs = [];
    try {
      // Fetch all transactions from last fetch time minus forgiveness seconds
      // to user specified end time.
      const forgivenessTimeSeconds = 3600; // Accounting for CC Daemon delays
      let fetchStartTime = lastFetchTime - forgivenessTimeSeconds;
      if (fetchStartTime < 0)
        fetchStartTime = 0;
      const r = await this._api.wallet_getTransactions(this.ticker, fetchStartTime, endTime);
      if (r && r.length > 0)
        txs = r.map(tx => new RPCTransaction(tx)); // put raw data into tx class
    } catch (e) {
      logger.error('', e);
      return existingTxs; // return known transactions on error
    }

    this._addTransactionsToStorage(txs);
    this._setLastTransactionFetchTime(endTime);
    return existingTxs.concat(txs); // return all local and network transactions
  }
}

export default Wallet;
