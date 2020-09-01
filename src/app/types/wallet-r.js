import RPCTransaction from './rpc-transaction';
import Token from './token';

/**
 * Class representing a wallet
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
   * Constructs a wallet
   * @param api {Object} Context bridge api
   * @param data {Object} Initialization obj
   */
  constructor(api, data) {
    Object.assign(this, data);
    this._api = api;
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
  async getTransactions(startTime=0, endTime=0) {
    try {
      const txs = await this._api.wallet_getTransactions(this.ticker, startTime, endTime);
      const r = [];
      for (const tx of txs)
        r.push(new RPCTransaction(tx));
      return r;
    } catch (err) {
      return [];
    }
  }

  /**
   * Fetches the latest transactions from the server.
   * @return {Promise<boolean>} true if update occurred, otherwise false
   */
  async updateTransactions() {
    try {
      return await this._api.wallet_updateTransactions(this.ticker);
    } catch (err) {
      return false;
    }
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
}

export default Wallet;
