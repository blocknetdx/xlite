import {logger} from './logger';
import PriceData from '../../app/types/pricedata';

import _ from 'lodash';
import request from 'superagent';

/**
 * Historical pricing manager.
 */
export default class Pricing {

  /**
   * Request handler with signature function(ticker, currency).
   * @type {function({string},{string})}
   * @private
   */
  _req = null;

  /**
   * Fetch pricing data from the api endpoint.
   * Sample data:
   * { "price_currency": "USD",
   *   "token": "BTC",
   *   "price_volume": [
   *     {
   *       "date": "2020-08-11T00:00:00.000Z",
   *       "price_close": 11388.53,
   *       "price_high": 11943.0,
   *       "price_low": 11120.0,
   *       "price_open": 11899.87,
   *       "volume": 20706.60991744
   *     },
   *     {
   *       "date": "2020-08-12T00:00:00.000Z",
   *       "price_close": 11566.45,
   *       "price_high": 11625.0,
   *       "price_low": 11148.54,
   *       "price_open": 11388.88,
   *       "volume": 12809.98917913
   *     }
   *   ]}
   * @param ticker {string} Token ticker (e.g. BLOCK, BTC, LTC)
   * @param currency {string} USD, BTC
   * @return {Promise<PriceData[]|null>}
   */
  static async defaultPricingApi(ticker, currency) {
    const res = await request.post('https://pricing.core.cloudchainsinc.com/')
      .send({ symbol: ticker + '/' + currency })
      .set('content-type', 'application/json')
      .set('accept', 'application/json');

    const reqField = 'price_volume';
    if (res && _.has(res.body, reqField) && _.isArray(res.body[reqField])) {
      const m = new Map();
      for (const day of res.body[reqField]) {
        const pd = new PriceData({
          date: day['date'],
          open: day['price_open'],
          close: day['price_close'],
          high: day['price_high'],
          low: day['price_low'],
          volume: day['volume'],
          ticker: ticker,
          currency: currency,
        });
        m.set(pd.date, pd);
      }
      return Array.from(m.values());
    }

    return null;
  }

  /**
   * Constructor
   * @param req {async function({string}, {string})} Pricing request handler
   */
  constructor(req) {
    this._req = req;
  }

  /**
   * Get the price data. Data is returned from cache if last fetch
   * expiry isn't met.
   * @param ticker {string} Token ticker (e.g. BLOCK, BTC, LTC)
   * @param currency {string} USD/BTC
   * @return {PriceData[]|null} JSON object or null on error
   */
  async getPrice(ticker, currency) {
    let priceData;
    try {
      priceData = await this._req(ticker, currency);
    } catch (e) {
      logger.error(`failed to fetch pricing data for ${ticker}/${currency}`);
      return null;
    }

    // Validate, must be array of PriceData instances
    if (!_.isArray(priceData) || priceData.length === 0 || !(priceData[0] instanceof PriceData))
      return null;

    return priceData;
  }
}
