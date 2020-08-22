/**
 * XBridge info data structure.
 */
class XBridgeInfo {
  /**
   * @type {string}
   */
  ticker = '';
  /**
   * @type {number}
   */
  feeperbyte = 100;
  /**
   * @type {number}
   */
  mintxfee = 10000;
  /**
   * @type {number}
   */
  coin = 100000000; // default 100 million
  /**
   * @type {number}
   */
  rpcport = -1000;

  /**
   * Constructor
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }
}

export default XBridgeInfo;
