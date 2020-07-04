export default class RPCUnspent {

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
