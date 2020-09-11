import {logger} from './logger';
import Recipient from '../../app/types/recipient';
import RPCController from './rpc-controller';
import Token from '../../app/types/token';
import TransactionBuilder from '../../app/modules/transactionbuilder';
import {unixTime} from '../../app/util';

import _ from 'lodash';
import {all, create} from 'mathjs';

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
   * @type {Object} // TODO Integrate wallet db
   */
  _storage = null;

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
   * @param storage {Object}
   */
  constructor(token, conf, storage) {
    this._token = token;
    this._conf = conf;
    this._storage = storage;
    this.ticker = token.ticker;
    this.name = token.blockchain;
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
    if (this.rpc.isNull() || !this.rpcEnabled()) {
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
   * Get wallet transactions from the server for the time frame.
   * @param startTime {number} Get transactions since this time
   * @param endTime {number} Get transactions to this time
   * @return {Promise<RPCTransaction[]>}
   * @throws Error
   */
  async getTransactions(startTime=0, endTime=0) {
    if (this.rpc.isNull() || !this.rpcEnabled()) {
      const msg = `failed to get transactions for ${this.ticker} because rpc is disabled`;
      logger.error(msg);
      throw new Error(msg);
    }

    if (endTime === 0)
      endTime = unixTime();

    try {
      return await this.rpc.listTransactions(startTime, endTime);
    } catch (e) {
      logger.error('', e);
      throw e;
    }
  }

  /**
   * Get addresses. Returns null on error.
   * @return {Promise<null|string[]>}
   */
  async getAddresses() {
    if (this.rpc.isNull() || !this.rpcEnabled()) {
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
    if (this.rpc.isNull() || !this.rpcEnabled()) {
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
    if (this.rpc.isNull() || !this.rpcEnabled()) {
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

    return _.cloneDeep(this._cachedUtxos.utxos);
  }

  /**
   * Sends the amount to the specified address.
   * @param recipients {Recipient[]}
   * @returns {Promise<null|string>} Returns txid on success, null on error
   */
  async send(recipients) {
    if (this.rpc.isNull() || !this.rpcEnabled()) {
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
      logger.info(`sent transaction for ${this.ticker}: ${JSON.stringify(signedRawTransaction)}`);
    } catch (e) {
      logger.error(`failed to send raw transaction for ${this.ticker}: ${JSON.stringify(signedRawTransaction)}`, e);
      return null; // fatal
    }

    return txid;
  }
}

export default Wallet;
