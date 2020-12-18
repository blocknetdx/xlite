// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
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
   * @param ticker {string} Token ticker (e.g. BLOCK, BTC, LTC)
   * @param currency {string} USD, BTC
   * @return {Promise<PriceData[]|null>}
   */
  static async defaultPricingApi(ticker, currency) {

    const res = await Promise.all([
      // 24 hour data
      request
        .get(`https://chainapi-dev-cc.core.cloudchainsinc.com/api/prices_full?from_currencies=${ticker}&to_currencies=${currency}`)
        .set('accept', 'application/json'),
      // historical data
      request
        .get(`https://chainapi-dev-cc.core.cloudchainsinc.com/api/historiesday?from_currencies=${ticker}&to_currency=${currency}`)
        .set('accept', 'application/json'),
    ]);

    let pricingArr = [];
    { // data from the last twenty-four hours
      const { statusCode, body = {} } = res[0];
      const { RAW = {} } = body;
      if(statusCode !== 200) {
        logger.error(`cryptocompare fetch current pricing data call for ${ticker}/${currency} failed with statusCode ${statusCode}`);
      } else if(_.has(RAW, ticker) && _.has(RAW[ticker], currency)) {
        const day = RAW[ticker][currency];
        pricingArr = pricingArr.concat([new PriceData({
          date: new Date(day['LASTUPDATE'] * 1000).toISOString(),
          open: day['OPEN24HOUR'],
          close: day['PRICE'],
          high: day['HIGH24HOUR'],
          low: day['LOW24HOUR'],
          volume: day['VOLUME24HOUR'],
          ticker: ticker,
          currency: currency,
        })]);
      }
    }

    { // historical data for the last week
      const { statusCode, body = {} } = res[1];
      const { Response = '', Message = '', Data = {} } = body;
      const reqField = 'Data';
      if(statusCode !== 200) {
        logger.error(`cryptocompare fetch historical pricing data call for ${ticker}/${currency} failed with statusCode ${statusCode}`);
      } else if(Response === 'Error') {
        logger.error(`cryptocompare fetch historical pricing data for ${ticker}/${currency} failed with error message '${Message}'`);
      } else if(_.has(Data, reqField) && _.isArray(Data[reqField])) {
        const m = new Map();
        for (const day of Data[reqField]) {
          const pd = new PriceData({
            date: new Date(day.time * 1000).toISOString(),
            open: day['open'],
            close: day['close'],
            high: day['high'],
            low: day['low'],
            volume: day['volumefrom'],
            ticker: ticker,
            currency: currency,
          });
          m.set(pd.date, pd);
        }
        pricingArr = pricingArr.concat(Array.from(m.values()));
      }
    }

    return pricingArr.length > 0 ? pricingArr : null;
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
