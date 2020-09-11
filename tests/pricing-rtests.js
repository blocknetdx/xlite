/*global describe,it,beforeEach,after*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';

import './rtests';
import domStorage from '../src/app/modules/dom-storage';
import FakeApi from './fake-api';
import PriceData from '../src/app/types/pricedata';
import Pricing from '../src/app/modules/pricing-r';

describe('Pricing Renderer Test Suite', function() {
  const fakeApi = window.api;
  const storage = domStorage;
  const ticker = 'BLOCK';
  const currency = 'USD';

  beforeEach(async function() {
    storage.clear();
    Object.assign(fakeApi, FakeApi(fakeApi));
  });

  it('Pricing()', function() {
    const pricing = new Pricing(fakeApi, storage);
    pricing._api.should.be.eql(fakeApi);
    pricing._storage.should.be.eql(storage);
    pricing.getPrice.should.be.a.Function();
  });
  it('Pricing.getPrice()', async function() {
    const pricing = new Pricing(fakeApi, storage);
    const priceData1 = await pricing.getPrice(ticker, currency);
    priceData1.should.be.eql(await fakeApi.pricing_getPrice(ticker, currency));
    const priceData2 = await pricing.getPrice('BTC', currency);
    priceData2.should.be.eql(await fakeApi.pricing_getPrice('BTC', currency));
  });
  it('Pricing.getPrice() preload all tokens', async function() {
    const pricing = new Pricing(fakeApi, storage);
    const priceData1 = await pricing.getPrice(ticker, currency);
    const priceData2 = await pricing.getPrice('BTC', currency);
    priceData1.should.be.eql(await fakeApi.pricing_getPrice(ticker, currency));
    priceData2.should.be.eql(await fakeApi.pricing_getPrice('BTC', currency));
  });
  it('Pricing.getPrice() return last data on null req', async function() {
    const pricing = new Pricing(fakeApi, storage);
    const priceData1 = await pricing.getPrice(ticker, currency);
    fakeApi.pricing_getPrice = async () => null;
    const priceData2 = await pricing.getPrice(ticker, currency, 0);
    priceData1.should.be.eql(priceData2);
  });
  it('Pricing.getPrice() return cache on subsequent calls (no expiry)', async function() {
    const pricing = new Pricing(fakeApi, storage);
    const priceData1 = await pricing.getPrice(ticker, currency);
    const newData = new PriceData({date: "2020-09-20T00:00:00.000Z", close: 1.0, high: 1.0, low: 1.0, open: 1.0, volume: 1000.0, ticker: ticker, currency: currency});
    fakeApi.pricing_getPrice = async () => [newData];
    const priceData2 = await pricing.getPrice(ticker, currency, 60);
    priceData1.should.be.eql(priceData2);
  });
  it('Pricing.getPrice() request new data on subsequent calls when expired', async function() {
    const pricing = new Pricing(fakeApi, storage);
    const priceData1 = await pricing.getPrice(ticker, currency);
    const newData = new PriceData({date: "2020-09-20T00:00:00.000Z", close: 1.0, high: 1.0, low: 1.0, open: 1.0, volume: 1000.0, ticker: ticker, currency: currency});
    fakeApi.pricing_getPrice = async () => [newData];
    const priceData2 = await pricing.getPrice(ticker, currency, 0); // expire immediately
    priceData1.should.not.be.eql(priceData2);
    priceData2.find(pd => pd.date === newData.date).should.be.eql(newData);
  });
  it('Pricing.getPriceChange()', async function() {
    const pricing = new Pricing(fakeApi, storage);
    await pricing.updatePricing([ticker], [currency], 0);
    const fakePrices = (await fakeApi.pricing_getPrice(ticker, currency)).sort((a,b) => b.unix() - a.unix()); // descending, recent date first
    const expectedPriceChange = (fakePrices[0].price() - fakePrices[1].price()) / fakePrices[1].price();
    pricing.getPriceChange(ticker, currency).toFixed(2).should.be.equal(expectedPriceChange.toFixed(2));
  });
  it('Pricing.getPriceChange() with bad data should be 0', async function() {
    const pricing = new Pricing(fakeApi, storage);
    fakeApi.pricing_getPrice = async () => [];
    pricing.getPriceChange(ticker, currency).should.be.equal(0);
    fakeApi.pricing_getPrice = async () => null;
    pricing.getPriceChange(ticker, currency).should.be.equal(0);
  });
  it('Pricing.getVolume()', async function() {
    const pricing = new Pricing(fakeApi, storage);
    await pricing.updatePricing([ticker], [currency], 0);
    const fakePrices = (await fakeApi.pricing_getPrice(ticker, currency)).sort((a,b) => b.unix() - a.unix()); // descending, recent date first
    const expectedVolume = fakePrices[0].volume;
    pricing.getVolume(ticker, currency).toFixed(2).should.be.equal(expectedVolume.toFixed(2));
  });
  it('Pricing.getVolume() with bad data should be 0', async function() {
    const pricing = new Pricing(fakeApi, storage);
    fakeApi.pricing_getPrice = async () => [];
    pricing.getVolume(ticker, currency).should.be.equal(0);
    fakeApi.pricing_getPrice = async () => null;
    pricing.getVolume(ticker, currency).should.be.equal(0);
  });
  it('Pricing.updatePricing()', async function() {
    const pricing = new Pricing(fakeApi, storage);
    storage.setItem(pricing._pricingFetchTimeKey(ticker, currency), 0);
    const priceData1 = await pricing.getPrice(ticker, currency, Number.MAX_SAFE_INTEGER);
    should.not.exist(priceData1);
    const priceData2 = await pricing.getPrice(ticker, currency);
    priceData2.should.not.be.eql(priceData1);
    priceData2.should.be.eql(await fakeApi.pricing_getPrice(ticker, currency));
  });

  after(function() {
    storage.clear();
  });
});
