// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
class RPCTransactionOutput {

  /**
   * @type {number}
   */
  confirmations = 0;

  /**
   * @type {number}
   */
  value = 0;

  /**
   * @type {{asm: string, hex: string, reqSigs: number, type: string, addresses: string[]}}
   */
  scriptPubKey = {};

  /**
   * @type {boolean}
   */
  coinbase = false;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCTransactionOutput;
