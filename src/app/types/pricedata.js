// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
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

  /**
   * Returns if the record is relative price data or historical price data
   * @returns {boolean}
   */
  isHistoricalData() {
    const date = moment(this.date).toDate();
    // historical data is from UTC time 00:00:00 for each day
    return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCMilliseconds()].every(num => num === 0);
  }

}

export default PriceData;
