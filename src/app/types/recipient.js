/**
 * Wallet recipients manage where coin is sent
 * and to whom.
 */
class Recipient {
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
  description = '';

  /**
   * Constructor
   * @param data {Object}
   */
  constructor(data) {
    if (data)
      Object.assign(this, data);
  }
}

export default Recipient;
