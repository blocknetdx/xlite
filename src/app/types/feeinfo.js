/**
 * Fee info data structure.
 */
class FeeInfo {
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
   * Constructor
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }
}

export default FeeInfo;
