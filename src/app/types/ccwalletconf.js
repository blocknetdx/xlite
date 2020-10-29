// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
/**
 * CloudChains wallet config
 *
 * Sample data:
 * {
 *   "rpcPassword": "test",
 *   "fee": 1.0E-4,
 *   "rpcUsername": "testUser",
 *   "rpcPort": 41414,
 *   "feeFlat": true,
 *   "rpcEnabled": true,
 *   "addressCount": 20
 * }
 */
class CCWalletConf {

  rpcPassword = '';
  fee = 0;
  rpcUsername = '';
  rpcPort = 0;
  feeFlat = true;
  rpcEnabled = false;
  addressCount = 0;

  /**
   * @type {string}
   * @private
   */
  _ticker = '';

  /**
   * Constructor
   * @param ticker {string}
   * @param data {Object}
   */
  constructor(ticker, data) {
    this._ticker = ticker;
    Object.assign(this, data);
  }

  /**
   * Return the conf ticker.
   * @return {string}
   */
  ticker() {
    return this._ticker;
  }

}

export default CCWalletConf;
