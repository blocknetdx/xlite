export default class RPCInfo {

  /**
   * @type {number}
   */
  protocolVersion = 0;

  /**
   * @type {string}
   */
  ticker = '';

  /**
   * @type {number}
   */
  balance = 0;

  /**
   * @type {boolean}
   */
  testnet = false;

  /**
   * @type {number}
   */
  difficulty = 0;

  /**
   * @type {number}
   */
  connections = 0;

  /**
   * @type {number}
   */
  blocks = 0;

  /**
   * @type {number}
   */
  keyPoolSize = 0;

  /**
   * @type {number}
   */
  keyPoolOldest = 0;

  /**
   * @type {number}
   */
  relayFee = 0;

  /**
   * @type {boolean}
   */
  networkActive = false;

  /**
   * @type {number}
   */
  timeOffset = 0;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}
