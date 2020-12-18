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
        logger.error(`fetch current pricing data call for ${ticker}/${currency} failed with statusCode ${statusCode}`);
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
      // Sample data:
      // {"BCH_USD":{"Data":{"Aggregated":false,"Data":[{"close":265.73,"conversionSymbol":"BTC","conversionType":"multiply","high":269.01,"low":261.53,"open":268.97,"time":1607558400,"volumefrom":140999.48,"volumeto":37467346.71},{"close":259.34,"conversionSymbol":"BTC","conversionType":"multiply","high":263.31,"low":258.62,"open":265.73,"time":1607644800,"volumefrom":186007.19,"volumeto":48239344.01},{"close":267.93,"conversionSymbol":"BTC","conversionType":"multiply","high":274.89,"low":267.74,"open":259.34,"time":1607731200,"volumefrom":152748.78,"volumeto":40925265.03},{"close":275.84,"conversionSymbol":"BTC","conversionType":"multiply","high":279.87,"low":270.86,"open":267.93,"time":1607817600,"volumefrom":152623.21,"volumeto":42099987.57},{"close":276.98,"conversionSymbol":"BTC","conversionType":"multiply","high":279.48,"low":267.92,"open":275.84,"time":1607904000,"volumefrom":169383.22,"volumeto":46915306.14},{"close":288.71,"conversionSymbol":"BTC","conversionType":"multiply","high":299.41,"low":275.88,"open":276.98,"time":1607990400,"volumefrom":314660.83,"volumeto":90846705.57},{"close":312.6,"conversionSymbol":"BTC","conversionType":"multiply","high":319,"low":305.34,"open":288.71,"time":1608076800,"volumefrom":412740.49,"volumeto":129020689.09},{"close":310.84,"conversionSymbol":"BTC","conversionType":"multiply","high":339.59,"low":303.31,"open":312.6,"time":1608163200,"volumefrom":543395.75,"volumeto":168908023.9},{"close":311.81,"conversionSymbol":"","conversionType":"direct","high":319.75,"low":305.17,"open":310.85,"time":1608249600,"volumefrom":20338.26,"volumeto":6369434.62}],"TimeFrom":1607558400,"TimeTo":1608249600},"HasWarning":false,"Message":"","RateLimit":{},"Response":"Success","Type":100}}
      const { statusCode, body = {} } = res[1];
      const { Response = '', Message = '' } = body;
      const dataKey = `${ticker}_${currency}`;
      const reqField = 'Data';
      if (!_.has(body, dataKey) || !_.has(body[dataKey], reqField) || !_.has(body[dataKey][reqField], reqField)) {
        logger.error(`fetch historical pricing data call for ${ticker}/${currency} failed: missing data`);
      } else if(statusCode !== 200) {
        logger.error(`fetch historical pricing data call for ${ticker}/${currency} failed with statusCode ${statusCode}`);
      } else if(Response === 'Error') {
        logger.error(`fetch historical pricing data for ${ticker}/${currency} failed with error message '${Message}'`);
      } else {
        const results = body[dataKey][reqField][reqField];
        const m = new Map();
        const expectedKeys = ['open','close','high','low','volumefrom'];
        for (const day of results) {
          let stop = false;
          for (const key of expectedKeys) {
            if (!_.has(day, key)) {
              stop = true;
              break;
            }
          }
          if (stop) // missing keys
            continue;
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
