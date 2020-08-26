class RPCTransaction {

  /**
   * @type {string}
   */
  txId = '';

  /**
   * The prevout index position.
   * @type {number}
   */
  n = -1;

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
   * @type {string}
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

  /**
   * Return a unique string identifier or key for the transaction.
   * txid + vout
   * @return {string}
   */
  key() {
    return this.txId + ':' + this.n;
  }

  /**
   * Return true if this is a "send" transaction.
   * @return {boolean}
   */
  isSend() {
    return this.category === 'send';
  }

  /**
   * Return true if this is a "receive" transaction.
   * @return {boolean}
   */
  isReceive() {
    return this.category === 'receive';
  }
}

export default RPCTransaction;
