import {localStorageKeys} from '../constants';
import {logger} from '../modules/logger-r';
import {publicPath} from '../util/public-path-r';
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

  /**
   * @type {LWDB}
   * @private
   */
  _db = null;

  /**
   * @type {number}
   * @private
   */
  _rpcLastFetchTime = 0;

  /**
   * @type {boolean}
   * @private
   */
  _rpcEnabled = false;

  // Do not store any in memory state, this class creates ephemeral
  // instances, any persistent data should be added to dom storage.

  /**
   * Takes a ticker and returns the coin's image set or a default blank image
   * @param ticker {string}
   * @returns {string}
   */
  static getImage(ticker) {
    const coinImageDir = `${publicPath}/images/coins`;
    const tickerLower = ticker.toLowerCase();
    const imagePath1x = `${coinImageDir}/icon-${tickerLower}.png`;
    const imagePath2x = `${coinImageDir}/icon-${tickerLower}@2x.png`;
    return `${imagePath1x}, ${imagePath2x} 2x`;
  }

  /**
   * Constructs a wallet
   * @param data {Object} Initialization obj
   * @param api {Object} Context bridge api
   * @param stor {DOMStorage}
   * @param db {LWDB}
   */
  constructor(data, api, stor, db) {
    if (data)
      Object.assign(this, data);
    this._api = api;
    this._storage = stor;
    this._db = db;
    this.imagePath = Wallet.getImage(this.ticker);
  }

  /**
   * RPC enabled. Returns false if config explicitly set rpc to false or
   * if there's no config. By default this method will pull the
   * rpcEnabled state from the cache.
   * @param expiry {number} Pull from cache up to this expiry time
   * @return {boolean}
   */
  rpcEnabled(expiry = 10) {
    const t = unixTime();
    // Pull from cache
    if (t - this._rpcLastFetchTime < expiry)
      return this._rpcEnabled;

    // Fetch latest from server in background
    this._rpcFetch(t);
    return this._rpcEnabled;
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
   * @return {Promise<RPCTransaction[]>}
   */
  async getTransactions(startTime=0, endTime=0) {
    return this._getTransactionsFromStorage(startTime, endTime);
  }

  /**
   * Fetches the latest transactions from the server.
   * @param fromZero {boolean} force a start time of zero
   * @return {Promise<boolean>} true if update occurred, otherwise false
   */
  async updateTransactions(fromZero) {
    if (!this._needsTransactionUpdate())
      return false; // rate limit this request
    if(fromZero)
      await this._setLastTransactionFetchTime(0);
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
   * @return {Promise<RPCTransaction[]>}
   * @private
   */
  async _getTransactionsFromStorage(startTime=0, endTime=0) {
    if (startTime < 0)
      startTime = 0;
    if (endTime <= 0)
      endTime = unixTime();
    if (endTime < startTime)
      endTime = startTime;

    // filter by token ticker and time range
    const txs = await this._db.transactions.where(['ticker+time'])
      .between([this.ticker, startTime], [this.ticker, endTime], true, true)
      .toArray();

    // Return utxos as deposit transactions if the data is bad
    if (startTime === 0 && (!txs || txs.length === 0)) // TODO Remove this workaround once cc daemon listtransactions rpc is working properly
      return (await this.getCachedUnspent(10000)).map(utxo => new RPCTransaction({
        txId: utxo.txId,
        n: utxo.vOut,
        address: utxo.address,
        amount: utxo.amount,
        time: unixTime() - (utxo.confirmations * 60),
        category: 'receive',
      }, this.ticker));

    return txs;
  }

  /**
   * Add the specified transactions to the storage. Checks for duplicates.
   * @param txs {RPCTransaction[]}
   * @private
   */
  async _addTransactionsToStorage(txs) {
    if (!_.isArray(txs))
      return false; // do not store bad data
    if (txs.length === 0)
      return true; // nothing to add

    try {
      await this._db.transactions.bulkPut(txs);
      return true;
    } catch (e) {
      logger.error('failed to add transactions to storage', e);
      return false;
    }
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
        txs = r.map(tx => new RPCTransaction(tx, this.ticker)); // put raw data into tx class
    } catch (e) {
      logger.error(`${this.ticker}`, e);
      return this._getTransactionsFromStorage(startTime, lastFetchTime); // return known transactions on error
    }

    if (await this._addTransactionsToStorage(txs))
      this._setLastTransactionFetchTime(endTime); // Only set on success

    // Fetch all txs including newly added/updated. The reason we query the
    // full set here again is to ensure that we pull any updated txs as
    // well as to avoid duplicates in the event some records were updated.
    return this._getTransactionsFromStorage(startTime, endTime);
  }

  /**
   * Fetch latest rpc enabled state. This always fetches the latest
   * state bypassing any caching in the renderer.
   * @param fetchTime {number}
   * @private {Promise<void>}
   */
  _rpcFetch(fetchTime) {
    return new Promise(resolve => {
      this._api.wallet_rpcEnabled(this.ticker)
        .then(enabled => {
          this._rpcLastFetchTime = fetchTime;
          this._rpcEnabled = enabled;
          resolve();
        })
        .catch(e => {
          this._rpcEnabled = false; // disable on error
          resolve();
        });
    });
  }
}

export default Wallet;
