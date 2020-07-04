export default class RPCBlock {

  /**
   * @type {string}
   */
  hash = '';

  /**
   * @type {number}
   */
  confirmations = 0;

  /**
   * @type {number}
   */
  strippedSize = 0;

  /**
   * @type {number}
   */
  size = 0;

  /**
   * @type {number}
   */
  weight = 0;

  /**
   * @type {number}
   */
  height = 0;

  /**
   * @type {number}
   */
  version = 0;

  /**
   * @type {string}
   */
  versionHex = '';

  /**
   * @type {string}
   */
  merkleRoot = '';

  /**
   * @type {string[]}
   */
  tx = [];

  /**
   * @type {number}
   */
  time = 0;

  /**
   * @type {number}
   */
  medianTime = 0;

  /**
   * @type {number}
   */
  nonce = 0;

  /**
   * @type {string}
   */
  bits = '';

  /**
   * @type {number}
   */
  difficulty = 0;

  /**
   * @type {string}
   */
  chainWork = '';

  /**
   * @type {string}
   */
  previousBlockHash = '';

  /**
   * @type {string}
   */
  nextBlockHash = '';

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}
