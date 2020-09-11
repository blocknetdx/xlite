import {localStorageKeys} from '../constants';
import {logger} from './logger-r';
import PriceData from '../types/pricedata';
import {unixTime} from '../util';

import _ from 'lodash';

/**
 * Historical pricing manager in renderer process.
 */
export default class Pricing {

  /**
   * Context bridge api.
   * @type {Object}
   * @private
   */
  _api = null;
  /**
   * @type {DOMStorage}
   * @private
   */
  _storage = null;

  /**
   * Constructor
   * @param api {Object} Context bridge api
   * @param storage {DOMStorage}
   */
  constructor(api, storage) {
    this._api = api;
    this._storage = storage;
  }

  /**
   * Get the price data. Data is returned from cache if last fetch
   * expiry isn't met. Returns last known data on error.
   * @param ticker {string} Token ticker (e.g. BLOCK, BTC, LTC)
   * @param currency {string} USD, BTC, GBP, EUR
   * @param expiry {number} Max time to wait in seconds prior to fetching latest from api.
   * @return {PriceData[]|null} JSON object or null on error
   */
  async getPrice(ticker, currency, expiry = 600) {
    const latestData = this._pricingData(ticker, currency);
    // return from cache if not expired or no request func is provided
    if (!this._pricingNeedsUpdate(ticker, currency, expiry))
      return latestData;

    let priceData;
    const ct = unixTime();
    try {
      priceData = await this._api.pricing_getPrice(ticker, currency);
      if (!_.isArray(priceData) || priceData.length === 0)
        return latestData; // last known data on error
    } catch (e) {
      logger.error(`failed to fetch pricing data for ${ticker}/${currency}`);
      return latestData; // last known data on error
    }

    // Transform into PriceData instances
    priceData = priceData.map(pd => new PriceData(pd));

    // New data overwrites old data
    this._pricingAddToStorage(ticker, currency, priceData);
    // Update fetch time on storage
    this._storage.setItem(this._pricingFetchTimeKey(ticker, currency), ct);
    return priceData;
  }

  /**
   * Return the percent change from the last 2 days.
   * @param ticker {string} Token ticker (e.g. BLOCK, BTC, LTC)
   * @param currency {string} USD, BTC, GBP, EUR
   * @return {number}
   */
  getPriceChange(ticker, currency) {
    const latestData = this._pricingData(ticker, currency);
    if (!latestData || latestData.length < 2)
      return 0;
    // sort descending and compare first two entries (last 2 days)
    const sorted = latestData.map(pd => new PriceData(pd))
      .sort((a,b) => b.unix() - a.unix());
    const day1 = sorted[0];
    const day2 = sorted[1];
    return (day1.price() - day2.price()) / day2.price();
  }

  /**
   * Return the most recent volume.
   * @param ticker {string} Token ticker (e.g. BLOCK, BTC, LTC)
   * @param currency {string} USD, BTC, GBP, EUR
   * @return {number}
   */
  getVolume(ticker, currency) {
    const latestData = this._pricingData(ticker, currency);
    if (!latestData || latestData.length === 0)
      return 0;
    // sort descending and compare first two entries (last 2 days)
    const sorted = latestData.map(pd => new PriceData(pd))
      .sort((a,b) => b.unix() - a.unix());
    return sorted[0].volume;
  }

  /**
   * Updates price data for tokens and currencies.
   * @param tickers {string[]}
   * @param currencies {string[]}
   * @param expiry {number} expired time in seconds
   * @return {Promise<Map<{string}, {PriceData[]}>>}
   */
  async updatePricing(tickers, currencies, expiry = 600) {
    const allPrices = [];
    for (const ticker of tickers) {
      for (const currency of currencies)
        allPrices.push(this.getPrice(ticker, currency, expiry));
    }
    const resolved = await Promise.all(allPrices);
    const m = new Map();
    for (let i = 0; i < resolved.length; i++) {
      if (i < tickers.length)
        m.set(tickers[i], resolved[i]);
    }
    return m;
  }

  /**
   * Storage key for pricing data.
   * @param ticker {string} BLOCK, BTC, LTC
   * @param currency {string} USD, BTC, GBP, EUR
   * @return {string}
   * @private
   */
  _pricingDataKey(ticker, currency) {
    return localStorageKeys.PRICING_DATA + '_' + ticker + '_' + currency;
  }

  /**
   * Storage key for pricing last fetch time.
   * @param ticker {string} BLOCK, BTC, LTC
   * @param currency {string} USD, BTC, GBP, EUR
   * @return {string}
   * @private
   */
  _pricingFetchTimeKey(ticker, currency) {
    return localStorageKeys.PRICING_FETCH_TIME + '_' + ticker + '_' + currency;
  }

  /**
   * Get pricing data from storage.
   * @param ticker {string}
   * @param currency {string}
   * @return {PriceData[]|null}
   * @private
   */
  _pricingData(ticker, currency) {
    const data = this._storage.getItem(this._pricingDataKey(ticker, currency));
    if (!data)
      return null;
    return data.map(pd => new PriceData(pd));
  }

  /**
   * Appends price data to storage.
   * @param ticker {string}
   * @param currency {string}
   * @param newData {PriceData[]}
   * @private
   * @return {boolean}
   */
  _pricingAddToStorage(ticker, currency, newData) {
    if (!_.isArray(newData) || newData.length === 0 || !(newData[0] instanceof PriceData))
      return false;
    let latestData = this._pricingData(ticker, currency);
    if (!latestData)
      latestData = [];
    const m = new Map(latestData.map(d => [d.date, d]));
    for (const d of newData)
      m.set(d.date, d);
    this._storage.setItem(this._pricingDataKey(ticker, currency), Array.from(m.values()));
    return true;
  }

  /**
   * Returns true if the pricing data needs to be updated.
   * @param ticker {string} BLOCK, BTC, LTC
   * @param currency {string} USD, BTC, GBP, EUR
   * @param expireTime {number} Default is 60 seconds
   * @return {boolean}
   * @private
   */
  _pricingNeedsUpdate(ticker, currency, expireTime) {
    const lastFetch = this._storage.getItem(this._pricingFetchTimeKey(ticker, currency));
    const t = unixTime();
    return _.isNil(lastFetch) || t - lastFetch >= expireTime;
  }
}
