// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
class RPCNetworkInfo {

  /**
   * @type {number}
   */
  protocolVersion = 0;

  /**
   * @type {string}
   */
  ticker = '';

  /**
   * @type {string}
   */
  subversion = '';

  /**
   * @type {number}
   */
  connections = 0;

  /**
   * @type {string}
   */
  localServices = '';

  /**
   * @type {number}
   */
  relayFee = 0;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCNetworkInfo;
