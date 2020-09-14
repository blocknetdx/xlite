/*global describe,it*/
/*eslint quotes: 0, key-spacing: 0*/
import should from 'should';

import './rtests';
import {altCurrencies, altCurrencySymbol} from '../src/app/constants';

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
});
