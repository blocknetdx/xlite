// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
class RPCSignedRawTransaction {

  /**
   * @type {string}
   */
  hex = '';

  /**
   * @type {boolean}
   */
  complete = false;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCSignedRawTransaction;
