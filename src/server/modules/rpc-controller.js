// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {HTTP_REQUEST_TIMEOUT} from '../../app/constants';
import {logger} from './logger';
import RPCInfo from '../../app/types/rpc-info';
import RPCNetworkInfo from '../../app/types/rpc-network-info';
import RPCBlockchainInfo from '../../app/types/rpc-blockchain-info';
import RPCBlock from '../../app/types/rpc-block';
import RPCUnspent from '../../app/types/rpc-unspent';
import RPCTransactionOutput from '../../app/types/rpc-transaction-output';
import RPCTransaction from '../../app/types/rpc-transaction';
import RPCSignedRawTransaction from '../../app/types/rpc-signed-raw-transaction';
import {unixTime} from '../../app/util';

import _ from 'lodash';
import request from 'superagent';

/**
 * Class for making RPC calls
 */
class RPCController {

  /**
   * @type {number}
   * @private
   */
  _port = 0;

  /**
   * @type {string}
   * @private
   */
  _username = '';

  /**
   * @type {string}
   * @private
   */
  _password = '';

  /**
   * @type {boolean}
   * @private
   */
  _debugMode = false;

  /**
   * @param port {number}
   * @param username {string}
   * @param password {string}
   * @param debugMode {boolean}
   */
  constructor(port, username, password, debugMode = false) {
    this._port = port;
    this._username = username;
    this._password = password;
    this._debugMode = debugMode;
  }

  /**
   * Returns true if the rpc connection is undefined.
   * @return {boolean}
   */
  isNull() {
    return !_.isNumber(this._port) || this._port <= 1024;
  }

  /**
   * Makes an RPC server request
   * @param method {string}
   * @param params {Object}
   * @param options {Object}
   * @returns {any}
   * @private
   */
  async _makeRequest(method, params = [], options = {timeout: HTTP_REQUEST_TIMEOUT}) {
    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({
        method,
        params
      });
      if(this._debugMode)
        logger.info(`${method} request to port ${this._port} with body: ${requestBody}`);
      request
        .post(`http://127.0.0.1:${this._port}`)
        .auth(this._username, this._password)
        .send(requestBody)
        .timeout(options.timeout)
        .then(res => {
          const { statusCode } = res;
          if(statusCode === 200) {
            const { result, error } = res.body;
            if(error) {
              const { code, message } = error;
              reject(new Error(`RPC server ${method} at port ${this._port} request returned with error code ${code} and message "${message}"`));
            } else {
              resolve(result);
            }
          } else {
            reject(new Error(`RPC server ${method} at port ${this._port} request failed with HTTP status code ${statusCode}.`));
          }
        })
        .catch(err => {
          if(err.timeout) {
            reject(new Error(`RPC server ${method} at port ${this._port} request timed out.`));
          } else if (_.has(err, 'status')) {
            reject(new Error(`RPC server ${method} at port ${this._port} request failed with HTTP status code ${err.status} and message "${err.message}"`));
          } else {
            reject(new Error(`RPC server ${method} at port ${this._port} request failed with message "${err.message}"`));
          }
        });
    });
  }

  /**
   * Get info about an unspent transaction output
   * @param txId {string}
   * @param vOut {number}
   * @returns {Promise<RPCTransactionOutput>}
   */
  async getTxOut(txId, vOut) {
    const res = await this._makeRequest('gettxout', [txId, vOut]);
    return new RPCTransactionOutput({
      confirmations: res.confirmations,
      value: res.value,
      scriptPubKey: res.scriptPubKey,
      coinbase: res.coinbase
    });
  }

  /**
   * Get information such as balances, protocol version, and more
   * @params options {Object} options.timeout to set the timeout on the request.
   * @returns {Promise<RPCInfo>}
   */
  async getInfo(options) {
    const res = await this._makeRequest('getinfo', [], options);
    return new RPCInfo({
      protocolVersion: res.protocolversion,
      ticker: res.ticker,
      balance: res.balance,
      testnet: res.testnet,
      difficulty: res.difficulty,
      connections: res.connections,
      blocks: res.blocks,
      keyPoolSize: res.keypoolsize,
      keyPoolOldest: res.keypoololdest,
      relayFee: res.relayfee,
      networkActive: res.networkactive,
      timeOffest: res.timeoffest,
      rpcready: res.rpcready,
    });
  }

  /**
   * Get network information
   * @returns {Promise<RPCNetworkInfo>}
   */
  async getNetworkInfo() {
    const res = await this._makeRequest('getnetworkinfo');
    return new RPCNetworkInfo({
      protocolVersion: res.protocolversion,
      ticker: res.ticker,
      subversion: res.subversion,
      connections: res.connections,
      localServices: res.localservices,
      relayFee: res.relayfee
    });
  }

  /**
   * Get raw mempool
   * @returns {Promise<string[]>}
   */
  async getRawMempool() {
    const res = await this._makeRequest('getrawmempool');
    return res;
  }

  /**
   * Get blockchain info
   * @returns {Promise<RPCBlockchainInfo>}
   */
  async getBlockchainInfo() {
    const res = await this._makeRequest('getblockchaininfo');
    return new RPCBlockchainInfo({
      chain: res.chain,
      blocks: res.blocks,
      headers: res.headers,
      verificationProgress: res.verificationprogress,
      difficulty: res.difficulty,
      initialBlockDownload: res.initialblockdownload,
      pruned: res.pruned
    });
  }

  /**
   * Get the hash of a block at a given height
   * @param height {number}
   * @returns {Promise<string>}
   */
  async getBlockHash(height) {
    const res = await this._makeRequest('getblockhash', [height]);
    return res;
  }

  /**
   * Get a block's JSON representation given its hash
   * @param hash {string}
   * @returns {Promise<RPCBlock>}
   */
  async getBlock(hash) {
    const res = await this._makeRequest('getblock', [hash]);
    return new RPCBlock({
      hash: res.hash,
      confirmations: res.confirmations,
      strippedSize: res.strippedsize,
      size: res.size,
      weight: res.weight,
      height: res.height,
      version: res.version,
      versionHex: res.versionHex,
      merkleRoot: res.merkleroot,
      tx: res.tx,
      time: res.time,
      medianTime: res.mediantime,
      nonce: res.nonce,
      bits: res.bits,
      difficulty: res.difficulty,
      chainWork: res.chainwork,
      previousBlockHash: res.previousblockhash,
      nextBlockHash: res.nextblockhash
    });
  }

  /**
   * Get all UTXOs in the wallet
   * @returns {Promise<RPCUnspent[]>}
   */
  async listUnspent() {
    let res = await this._makeRequest('listunspent');
    if (!res) {
      logger.warn(`listunspent is null for port ${this._port}`);
      res = [];
    }
    return res.map(obj => new RPCUnspent({
      txId: obj.txid,
      vOut: obj.vout,
      address: obj.address,
      amount: obj.amount,
      scriptPubKey: obj.scriptPubKey,
      spendable: obj.spendable,
      confirmations: obj.confirmations
    }));
  }

  /**
   * Generate a new address
   * @returns {Promise<string>}
   */
  async getNewAddress() {
    const res = await this._makeRequest('getnewaddress');
    return res;
  }

  /**
   * Get a transaction given its TXID
   * @param txId {string}
   * @returns {Promise<RPCTransaction>}
   */
  async getTransaction(txId) {
    const res = await this._makeRequest('gettransaction', [txId]);
    return new RPCTransaction({
      txId: res.txid,
      hash: res.hash,
      version: res.version,
      size: res.size,
      vSize: res.vsize,
      lockTime: res.locktime,
      vIn: res.vin,
      vOut: res.vout,
      hex: res.hex,
      blockHash: res.blockhash,
      confirmations: res.confirmations,
      time: res.time,
      blockTime: res.blocktime
    });
  }

  /**
   * Get addresses belonging to a given account
   * @param account {string}
   * @returns {Promise<string[]>}
   */
  async getAddressesByAccount(account = 'main') {
    const res = await this._makeRequest('getaddressesbyaccount', [account]);
    return res;
  }

  /**
   * Import an address given it's privkey
   * @param privKey {string}
   * @returns {Promise<string>}
   */
  async importPrivKey(privKey) {
    const res = await this._makeRequest('importprivkey', [privKey]);
    return res;
  }

  /**
   * Dump an addresse's private key
   * @param address {string}
   * @returns {Promise<string>}
   */
  async dumpPrivKey(address) {
    const res = await this._makeRequest('dumpprivkey', [address]);
    return res;
  }

  /**
   * Sign a message with a given address' private key
   * @param address {string}
   * @param message {string}
   * @returns {Promise<string>}
   */
  async signMessage(address, message) {
    const res = await this._makeRequest('signmessage', [address, message]);
    return res;
  }

  /**
   * Verify a signature for a message signed by a given address
   * @param address {string}
   * @param signature {string}
   * @param message {string}
   * @returns {Promise<boolean>}
   */
  async verifyMessage(address, signature, message) {
    const res = await this._makeRequest('verifymessage', [address, signature, message]);
    return res;
  }

  /**
   * Create a raw transaction given inputs and outputs in JSON format
   * @param inputs {RPCUnspent[]}
   * @param outputs {Object}
   * @returns {Promise<string>}
   */
  async createRawTransaction(inputs, outputs = {}) {
    const preppedInputs = inputs
      .map(t => ({
        txid: t.txId,
        vout: t.vOut
      }));
    const res = await this._makeRequest(
      'createrawtransaction',
      [preppedInputs, outputs]
    );
    return res;
  }

  /**
   * Decode a raw transaction
   * @param rawTx {string}
   * @returns {Promise<RPCTransaction>}
   */
  async decodeRawTransaction(rawTx) {
    const res = await this._makeRequest('decoderawtransaction', [rawTx]);
    return new RPCTransaction({
      txId: res.txid,
      version: res.version,
      lockTime: res.locktime,
      vIn: res.vin,
      vOut: res.vout
    });
  }

  /**
   * Sign a raw transaction
   * @param rawTx {string}
   * @returns {Promise<RPCSignedRawTransaction>}
   */
  async signRawTransaction(rawTx) {
    const res = await this._makeRequest('signrawtransaction', [rawTx]);
    return new RPCSignedRawTransaction({
      hex: res.hex,
      complete: res.complete
    });
  }

  /**
   * Broadcast a signed raw transaction to the network
   * @param signedRawTransaction {RPCSignedRawTransaction}
   * @returns {Promise<string>}
   */
  async sendRawTransaction(signedRawTransaction) {
    const { hex } = signedRawTransaction;
    const res = await this._makeRequest('sendrawtransaction', [hex]);
    return res;
  }

  /**
   * Lists wallet transactions
   * @param startTime {number} Get transactions since this time
   * @param endTime {number} Get transactions to this time
   * @returns {Promise<RPCTransaction[]>}
   */
  async listTransactions(startTime, endTime) {
    if (!_.isNumber(startTime))
      startTime = 0;
    if (!_.isNumber(endTime) || endTime === 0)
      endTime = unixTime();
    const res = await this._makeRequest('listtransactions', [startTime, endTime], {timeout: 60000});
    if (!res) {
      const emsg = `listtransactions is null for port ${this._port} start ${startTime} end ${endTime}`;
      logger.warn(emsg);
      throw new Error(emsg);
    }
    return res.map(t => new RPCTransaction({
      txId: t.txid,
      n: t.vout,
      address: t.address,
      amount: Math.abs(t.amount),
      fee: Math.abs(t.fee),
      blockHash: t.blockhash,
      blockTime: t.blocktime,
      category: t.category,
      confirmations: t.confirmations,
      time: t.time,
      trusted: t.trusted
    }));
  }

  async ccReloadConfig(token) {
    try {
      await this._makeRequest('reloadconfig', [token], {timeout: 3000});
      return true;
    } catch(err) {
      logger.error(`ccReloadConfigError for ${token}: ${err.message}` + '\n' + err.stack);
      return false;
    }
  }

  /**
   * Call the CloudChains RPC help method.
   * @return {Promise<Object>}
   */
  async ccHelp() {
    try {
      return await this._makeRequest('help', []);
    } catch (e) {
      return e;
    }
  }

  /**
   * Stop the CloudChains server daemon.
   * @return {Promise<boolean>}
   */
  async ccStop() {
    try {
      await this._makeRequest('stop', []);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default RPCController;
