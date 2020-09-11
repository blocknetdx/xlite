/*global describe,it*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';
import PriceData from '../src/app/types/pricedata';
import Pricing from '../src/server/modules/pricing';

describe('Pricing Test Suite', function() {
  const defaultReq = async (ticker, currency) => {
    return [
      new PriceData({
        date: "2020-09-07T00:00:00.000Z",
        close: 10375.0,
        high: 10410.9,
        low: 9880.0,
        open: 10258.67,
        volume: 11996.92866276,
        ticker: ticker,
        currency: currency,
      }),
      new PriceData({
        date: "2020-09-08T00:00:00.000Z",
        close: 10125.69,
        high: 10440.91,
        low: 9819.83,
        open: 10375.0,
        volume: 15768.31017626,
        ticker: ticker,
        currency: currency,
      }),
      new PriceData({
        date: "2020-09-09T00:00:00.000Z",
        close: 10239.95,
        high: 10286.9,
        low: 9983.34,
        open: 10126.41,
        volume: 4766.43687842,
        ticker: ticker,
        currency: currency,
      }),
    ];
  };

  it('Pricing()', function() {
    const pricing = new Pricing(defaultReq);
    pricing._req.should.be.eql(defaultReq);
    pricing.getPrice.should.be.a.Function();
    Pricing.defaultPricingApi.should.be.a.Function();
  });
  it('Pricing.getPrice()', async function() {
    const pricing = new Pricing(defaultReq);
    const priceData = await pricing.getPrice('BLOCK', 'USD');
    priceData.should.be.eql(await defaultReq('BLOCK', 'USD'));
  });
  it('Pricing.getPrice() return null on request error', async function() {
    const pricing = new Pricing(function() { throw new Error(); });
    should.doesNotThrow(async () => { await pricing.getPrice('BLOCK', 'USD'); }, Error);
    should.not.exist(await pricing.getPrice('BLOCK', 'USD'));
  });
  it('Pricing.getPrice() return null on bad request not array', async function() {
    const badReq = async (ticker, currency) => {
      return new PriceData({
        date: "2020-09-07T00:00:00.000Z",
        close: 10375.0,
        high: 10410.9,
        low: 9880.0,
        open: 10258.67,
        volume: 11996.92866276,
        ticker: ticker,
        currency: currency,
      });
    };
    const pricing = new Pricing(badReq);
    should.not.exist(await pricing.getPrice('BLOCK', 'USD'));
  });
  it('Pricing.getPrice() return null on bad request not PriceData typed array', async function() {
    const badReq = async (ticker, currency) => {
      return [{
        date: "2020-09-07T00:00:00.000Z",
        close: 10375.0,
        high: 10410.9,
        low: 9880.0,
        open: 10258.67,
        volume: 11996.92866276,
        ticker: ticker,
        currency: currency,
      }];
    };
    const pricing = new Pricing(badReq);
    should.not.exist(await pricing.getPrice('BLOCK', 'USD'));
  });
  it('Pricing.getPrice() return null on empty data []', async function() {
    const badReq = async (ticker, currency) => {
      return [];
    };
    const pricing = new Pricing(badReq);
    should.not.exist(await pricing.getPrice('BLOCK', 'USD'));
  });

});
