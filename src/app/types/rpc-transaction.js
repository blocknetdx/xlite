export default class RPCTransaction {

  /**
   * @type {string}
   */
  txId = '';

  /**
   * @type {string}
   */
  hash = '';

  /**
   * @type {number}
   */
  version = 0;

  /**
   * @type {number}
   */
  size = 0;

  /**
   * @type {number}
   */
  vSize = 0;

  /**
   * @type {number}
   */
  lockTime = 0;

  /**
   * @type {{coinbase: string, sequence: number}[]}
   */
  vIn = [];

  /**
   * @type {{value: number, n: number, scriptPubKey: {asm: string, hex: string, reqSigs: number, type: string, addresses: string[]}}[]}
   */
  vOut = [];

  /**
   * @type {string}
   */
  hex = '';

  /**
   * @type {string}
   */
  blockHash = '';

  /**
   * @type {number}
   */
  confirmations = 0;

  /**
   * @type {number}
   */
  time = 0;

  /**
   * @type {number}
   */
  blockTime = 0;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}
