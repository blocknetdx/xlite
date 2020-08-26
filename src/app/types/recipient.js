import _ from 'lodash';

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

  /**
   * Returns true if the recipient has valid data.
   * @return {boolean}
   */
  isValid() {
    return /^[a-zA-Z0-9]+$/.test(this.address) && _.isNumber(this.amount)
      && this.amount > 0 && _.isString(this.description);
  }
}

export default Recipient;
