import moment from 'moment';

/**
 * Stores price data.
 */
class PriceData {
  /**
   * @type {string}
   */
  ticker = '';

  /**
   * @type {string}
   */
  currency = '';
  /**
   * ISO 8601 date string.
   * @type {string}
   */
  date = '';

  /**
   * @type {number}
   */
  open = 0.0;

  /**
   * @type {number}
   */
  close = 0.0;

  /**
   * @type {number}
   */
  high = 0.0;

  /**
   * @type {number}
   */
  low = 0.0;

  /**
   * Volume is in ticker units (not currency units).
   * @type {number}
   */
  volume = 0.0;

  /**
   * Constructor
   * @param data
   */
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Return unix time.
   * @return {number}
   */
  unix() {
    return moment(this.date).unix();
  }

  /**
   * Returns the best price.
   * @return {number}
   */
  price() {
    return this.close || this.open;
  }
}

export default PriceData;
