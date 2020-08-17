import {IMAGE_DIR} from '../constants';
import {logger} from '../util';
import Recipient from './recipient';
import RPCController from '../modules/rpc-controller';
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
    const image1xExists = fs.existsSync(imagePath1x);
    const image2xExists = fs.existsSync(imagePath2x);
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
   * Constructs a wallet
   * @param token {Token}
   * @param conf {CCWalletConf}
   */
  constructor(token, conf) {
    this._token = token;
    this._conf = conf;
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
    if (!this.rpcEnabled())
      return;
    this.rpc = new RPCController(this._conf.rpcPort, this._conf.rpcUsername, this._conf.rpcPassword);
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
   * Get wallet transactions. Returns null on error.
   * @return {Promise<null|RPCTransaction[]>}
   */
  async getTransactions() {
    if (this.rpc.isNull()) {
      logger.error(`failed to get transactions for ${this.ticker} because rpc is disabled`);
      return null;
    }

    try {
      return await this.rpc.listTransactions();
    } catch (e) {
      logger.error('', e);
      return null;
    }
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
      if (!(r instanceof Recipient)) {
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
    const builder = new TransactionBuilder(this._token.feeinfo);
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
      logger.error(`failed to sign raw transaction for ${this.ticker}`, e);
      return null; // fatal
    }
    let txid = null;
    try {
      txid = await this.rpc.sendRawTransaction(signedRawTransaction);
    } catch (e) {
      logger.error(`failed to send raw transaction for ${this.ticker}`, e);
      return null; // fatal
    }

    return txid;
  }

}

export default Wallet;
