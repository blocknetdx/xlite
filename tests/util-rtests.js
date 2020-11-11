/*global describe,it*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';

import './rtests';
import {altCurrencies, altCurrencySymbol} from '../src/app/constants';
import {resolveAll, timeout} from '../src/app/util';

describe('Util Renderer Test Suite', function() {
  it('util.altCurrencies', async function() {
    altCurrencies.USD.should.be.equal('USD');
    altCurrencies.BTC.should.be.equal('BTC');
    altCurrencies.EUR.should.be.equal('EUR');
    altCurrencies.GBP.should.be.equal('GBP');
  });
  it('util.altCurrencySymbol()', async function() {
    altCurrencySymbol('USD').should.be.equal('$');
    altCurrencySymbol('BTC').should.be.equal('BTC ');
    altCurrencySymbol('EUR').should.be.equal('€');
    altCurrencySymbol('GBP').should.be.equal('£');
    altCurrencySymbol('UNKNOWN').should.be.equal('UNKNOWN ');
  });
  it('util.resolveAll()', async function() {
    resolveAll([
      new Promise(resolve => { timeout(100).then(() => resolve(true)); }),
      new Promise(resolve => { timeout(150).then(() => resolve(true)); }),
    ]).should.finally.be.true();
  });
  it('util.resolveAll() should resolve all promises regardless of error', async function() {
    let count = 0;
    await resolveAll([
      new Promise((resolve, reject) => { timeout(50).then(() => reject(new Error('some error'))); }),
      new Promise(resolve => { timeout(150).then(() => { count++; resolve(true); }); }),
      new Promise(resolve => { timeout(170).then(() => { count++; resolve(true); }); }),
      new Promise(resolve => { timeout(190).then(() => { count++; resolve(true); }); }),
    ]).should.finally.be.false();
    count.should.be.equal(3);
  });
  it('util.resolveAll() should return false on error', async function() {
    let count = 0;
    await resolveAll([
      new Promise(resolve => { timeout(100).then(() => { count++; resolve(true); }); }),
      new Promise((resolve, reject) => { timeout(150).then(() => { count++; reject(new Error('some error')); }); }),
    ]).should.finally.be.false();
    count.should.be.equal(2);
  });
});
