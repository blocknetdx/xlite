class RPCTransaction {

  /**
   * @type {string}
   */
  txId = '';

  /**
   * @type {string}
   */
  address = '';

  /**
   * @type {string}
   */
  amount = '';

  /**
   * @type {string}
   */
  blockHash = '';

  /**
   * @type {number}
   */
  blockTime = 0;

  /**
   * @type {number}
   */
  category = '';

  /**
   * @type {number}
   */
  confirmations = 0;

  /**
   * @type {number}
   */
  time = 0;

  /**
   * @type {boolean}
   */
  trusted = false;

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
  blockTime = 0;

  /**
   * @type {Array<{coinbase: string, sequence: number}>}
   */
  vIn = [];

  /**
   * @type {Array<{value: number, n: number, scriptPubKey: {asm: string, hex: string, reqSigs: number, type: string, addresses: string[]}}>}
   */
  vOut = [];

  /**
   * @type {string}
   */
  hex = '';

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCTransaction;
