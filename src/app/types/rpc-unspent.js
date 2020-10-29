// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
class RPCUnspent {

  /**
   * @type {string}
   */
  txId = '';

  /**
   * @type {number}
   */
  vOut = 0;

  /**
   * @type {string}
   */
  address = '';

  /**
   * @type {number}
   */
  amount = 0;

  /**
   * @type {string}
   */
  scriptPubKey = '';

  /**
   * @type {boolean}
   */
  spendable = false;

  /**
   * @type {number}
   */
  confirmations = 0;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCUnspent;
