class RPCSignedRawTransaction {

  /**
   * @type {string}
   */
  hex = '';

  /**
   * @type {boolean}
   */
  complete = false;

  /**
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default RPCSignedRawTransaction;
