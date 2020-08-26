import {IMAGE_DIR, localStorageKeys} from '../constants';
import {logger, unixTime} from '../util';
import Recipient from './recipient';
import RPCController from '../modules/rpc-controller';
import RPCTransaction from './rpc-transaction';
import Token from './token';
import TransactionBuilder from '../modules/transactionbuilder';

import _ from 'lodash';
import {all, create} from 'mathjs';
import fs from 'fs-extra';
import path from 'path';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});

const { bignumber } = math;

/**
 * Class representing a wallet
 */
class Wallet {

  /**
   * Takes a ticker and returns the coin's image set or a default blank image
   * @param ticker {string}
   * @returns {string}
   */
  static getImage(ticker) {
    const coinImageDir = path.join(IMAGE_DIR, 'coins');
    const tickerLower = ticker.toLowerCase();
    const imagePath1x = path.join(coinImageDir, `icon-${tickerLower}.png`);
    const imagePath2x = path.join(coinImageDir, `icon-${tickerLower}@2x.png`);
    const image1xExists = fs.pathExistsSync(imagePath1x);
    const image2xExists = fs.pathExistsSync(imagePath2x);
    if(image1xExists && image2xExists) {
      return `${imagePath1x}, ${imagePath2x} 2x`;
    } else if(image1xExists) {
      return imagePath1x;
    } else {
      return path.join(IMAGE_DIR, 'blank_icon.png');
    }
  }

  /**
   * RPCController Instance for enabled wallets
   * @type {RPCController}
   */
  rpc = new RPCController(0, '', '');

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
   * Associated cloudchains wallet conf.
   * @type {CCWalletConf}
   */
  _conf = null;

  /**
   * Blocknet token data.
   * @type {Token}
   */
  _token = null;

  /**
   * @type {DOMStorage}
   */
  _domStorage = null;

  /**
   * Stores cached utxos and last time they were fetched.
   * @type {{fetchTime: number, utxos: RPCUnspent[]}}
   * @private
   */
  _cachedUtxos = {fetchTime: 0, utxos: []};

  /**
   * Constructs a wallet
   * @param token {Token}
   * @param conf {CCWalletConf}
   * @param domStorage {DOMStorage}
   */
  constructor(token, conf, domStorage) {
    this._token = token;
    this._conf = conf;
    this._domStorage = domStorage;
    this.ticker = token.ticker;
    this.name = token.blockchain;
    this.imagePath = Wallet.getImage(token.ticker);
    this.initRpcIfEnabled();
  }

  /**
   * Initializes the rpc controller for the wallet only if the rpc
   * is enabled in the conf.
   */
  initRpcIfEnabled() {
    if (!this.rpcEnabled() || _.isNull(this._token.xbinfo) || _.isUndefined(this._token.xbinfo))
      return;
    // Set the default port to the xbridge conf port settings if the
    // cloudchains conf port is invalid.
    const port = this._conf.rpcPort === -1000 ? this._token.xbinfo.rpcport : this._conf.rpcPort;
    this.rpc = new RPCController(port, this._conf.rpcUsername, this._conf.rpcPassword);
  }

  /**
   * RPC enabled. Returns false if config explicitly set rpc to false or
   * if there's no config.
   * @return {boolean}
   */
  rpcEnabled() {
    if (_.isNull(this._conf) || _.isUndefined(this._conf))
      return false;
    return this._conf.rpcEnabled;
  }

  /**
   * Return the blockchain name for the wallet.
   * @return {string}
   */
  blockchain() {
    if (this._token && this._token.blockchain !== '')
      return this._token.blockchain;
    return this.ticker;
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
    if (this.rpc.isNull()) {
      logger.error(`failed to get balance info for ${this.ticker} because rpc is disabled`);
      return null;
    }

    let unspent;
    try {
      unspent = await this.rpc.listUnspent();
    } catch(err) {
      logger.error(`failed to list utxos for ${this.ticker}`, err);
      return null;
    }

    let total = bignumber(0);
    let spendable = bignumber(0);
    for(let { amount, spendable: isSpendable } of unspent) {
      amount = bignumber(amount);
      if (isSpendable)
        spendable = math.add(spendable, amount);
      total = math.add(total, amount);
    }
    return [total.toFixed(8), spendable.toFixed(8)];
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
    if (this.rpc.isNull()) {
      logger.error(`failed to get addresses for ${this.ticker} because rpc is disabled`);
      return null;
    }

    try {
      return await this.rpc.getAddressesByAccount();
    } catch (e) {
      logger.error('', e);
      return null;
    }
  }

  /**
   * Get new address. Returns empty string on error.
   * @return {Promise<string>}
   */
  async generateNewAddress() {
    if (this.rpc.isNull()) {
      logger.error(`failed to generate address for ${this.ticker} because rpc is disabled`);
      return '';
    }

    try {
      return await this.rpc.getNewAddress();
    } catch (e) {
      logger.error('', e);
      return '';
    }
  }

  /**
   * Return cached coins. Fetch if last cache time expired.
   * @param cacheExpirySeconds {number} Number of seconds until cache expires
   * @return {Promise<RPCUnspent[]>}
   */
  async getCachedUnspent(cacheExpirySeconds) {
    if (this.rpc.isNull()) {
      logger.error(`failed to get balance info for ${this.ticker} because rpc is disabled`);
      return this._cachedUtxos.utxos;
    }

    const t = this._cachedUtxos.fetchTime;
    const now = unixTime();
    if (now - t >= cacheExpirySeconds) {
      try {
        const utxos = await this.rpc.listUnspent();
        this._cachedUtxos.fetchTime = unixTime();
        this._cachedUtxos.utxos = utxos;
      } catch(err) {
        logger.error(`failed to list utxos for ${this.ticker}`, err);
      }
    }

    return this._cachedUtxos.utxos;
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
    if (this.rpc.isNull()) {
      logger.error(`failed to send ${this.ticker} because rpc is disabled`);
      return null;
    }
    if (!_.isArray(recipients) || recipients.length < 1) {
      logger.error(`failed to send ${this.ticker} because no recipient was specified`);
      return null;
    }
    // Validate recipients
    for (const r of recipients) {
      if (!(r instanceof Recipient) || !r.isValid()) {
        logger.error(`failed to send ${this.ticker} because bad recipient ${r}`);
        return null;
      }
    }

    // TODO Check that recipient addresses are valid

    let unspent;
    try {
      unspent = await this.rpc.listUnspent();
    } catch (e) {
      logger.error(`failed to get rpc utxos for ${this.ticker}`, e);
      return null; // fatal
    }
    const builder = new TransactionBuilder(this._token.xbinfo);
    for (const r of recipients)
      builder.addRecipient(r);
    try {
      builder.fundTransaction(unspent);
    } catch (e) {
      logger.error(`failed on transaction builder for ${this.ticker}`, e);
      return null; // fatal
    }
    if (!builder.isValid()) {
      logger.error(`failed to create the transaction for ${this.ticker}`);
      return null; // fatal
    }

    // Create, sign, and send the transaction. Return null on rpc errors.
    let rawTransaction;
    try {
      rawTransaction = await this.rpc.createRawTransaction(builder.getInputs(), builder.getTxOutputs());
    } catch (e) {
      logger.error(`failed to create raw transaction for ${this.ticker}`, e);
      return null; // fatal
    }
    let signedRawTransaction;
    try {
      signedRawTransaction = await this.rpc.signRawTransaction(rawTransaction);
    } catch (e) {
      logger.error(`failed to sign raw transaction for ${this.ticker}: ${JSON.stringify(rawTransaction)}`, e);
      return null; // fatal
    }
    let txid = null;
    try {
      txid = await this.rpc.sendRawTransaction(signedRawTransaction);
      logger.info(`sent transaction for ${this.ticker}: ${signedRawTransaction}`);
    } catch (e) {
      logger.error(`failed to send raw transaction for ${this.ticker}: ${JSON.stringify(signedRawTransaction)}`, e);
      return null; // fatal
    }

    return txid;
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
    const fetchTime = this._domStorage.getItem(this._getTransactionFetchTimeStorageKey());
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
    this._domStorage.setItem(this._getTransactionFetchTimeStorageKey(), fetchTime);
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

    const data = this._domStorage.getItem(this._getTransactionStorageKey());
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
    this._domStorage.setItem(this._getTransactionStorageKey(), newData);
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

    if (this.rpc.isNull()) {
      logger.error(`failed to get transactions for ${this.ticker} because rpc is disabled`);
      return this._getTransactionsFromStorage(startTime, endTime);
    }

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
      const forgivenessTimeSeconds = 120;
      txs = await this.rpc.listTransactions(lastFetchTime-forgivenessTimeSeconds, endTime); // Accounting for CC Daemon delays
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
