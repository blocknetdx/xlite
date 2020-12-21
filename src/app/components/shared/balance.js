// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { currencyLinter, multiplierForCurrency, truncate } from '../../util';
import Localize from './localize';
import {MAX_DECIMAL_PLACE, altCurrencies} from '../../constants';
import {oneSat} from '../../util';
import Wallet from '../../types/wallet-r';
import Pricing from '../../modules/pricing-r';
import IconTrend from './icon-trend';

import {all, create} from 'mathjs';
import { connect } from 'react-redux';
import {Map as IMap} from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';
import { CopyableLink } from './copyable-link';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const {api} = window;

let Balance = ({ showCoinDetails = false, activeWallet, altCurrency, wallets, balances, currencyMultipliers, style = {}, pricing }) => {

  if(showCoinDetails) { // coin details
  const wallet = activeWallet ? wallets.find(w => w.ticker === activeWallet) : null;
  const [ total, spendable ] = wallet && balances.has(wallet.ticker) ? balances.get(wallet.ticker) : ['0', '0'];

  if(!wallet) return <div className={'lw-balance-outer-container'} />;

    const altMultiplier = multiplierForCurrency(activeWallet, altCurrency, currencyMultipliers);
  const altAmount = math.multiply(altMultiplier, bignumber(Number(total)));

  // ToDo get website data from somewhere
  const website = wallet.getWebsiteLink();
  const explorerLink = wallet.getExplorerLink();

  // ToDo add change over time data

    return (
      <div className={'lw-balance-outer-container'} style={style}>
        <div style={{display: 'inline-block'}}>
          <div>
            <div style={{float: 'left'}}>
              <img alt={Localize.text('{{coin}} image', 'balance', {coin: wallet.ticker})} srcSet={wallet.imagePath} style={{width: 32, height: 32}} />
            </div>
            <div style={{display: 'inline-block', paddingLeft: 10, clear: 'left'}}>
              <h3 style={{fontSize: 24, lineHeight: '32px'}}>{wallet.name}</h3>
            </div>
          </div>
          <div className={'lw-balance-container'}>
            <div style={{fontSize: 14}} className={'lw-color-secondary-2'}>{Localize.text('Total {{coin}} balance', 'balance', {coin: wallet.ticker})}:</div>
            <div className={'lw-balance-coindetails'}><h2>{truncate(total, MAX_DECIMAL_PLACE, true)} {activeWallet}</h2> <h4>{altCurrency} {currencyLinter(altAmount)}</h4></div>
          </div>
          <div className={'lw-color-secondary-3'} style={{display: 'inline-block', fontSize: 14, textAlign: 'right', position: 'absolute', float: 'right', bottom: 0, right: 0, paddingBottom: 12}}>
            <div><Localize context={'balance'}>Website</Localize>: {website ? <CopyableLink href={website}>{website}</CopyableLink> : <span className={'lw-text-primary'}>{Localize.text('n/a', 'balance')}</span>}</div>
            <div><Localize context={'balance'}>Explorer</Localize>: <CopyableLink href={explorerLink}>{explorerLink}</CopyableLink></div>
          </div>
        </div>
      </div>
    );
  } else { // btc balance from all coins combined (not the specific coin details)
    const BTC = altCurrencies.BTC;
    let allCoinBtc = bignumber(0);
    for (const wallet of wallets) {
      const currencyMultiplier = multiplierForCurrency(wallet.ticker, BTC, currencyMultipliers);
      const [ total, spendable ] = balances.has(wallet.ticker) ? balances.get(wallet.ticker) : ['0', '0'];
      const coinBtc = math.multiply(bignumber(total), bignumber(currencyMultiplier));
      allCoinBtc = math.add(allCoinBtc, coinBtc);
    }
    const totalBalance = truncate(allCoinBtc, MAX_DECIMAL_PLACE);
    const btcMultiplier = multiplierForCurrency(BTC, altCurrency, currencyMultipliers);
    const totalAltCurrency = truncate(math.multiply(allCoinBtc, bignumber(btcMultiplier)).toNumber(), 2);
    const priceChange = pricing.getPriceChange(BTC, altCurrency);
    const btcPriceChange = math.multiply(allCoinBtc, bignumber(priceChange));
    const currencyPriceChange = math.multiply(btcPriceChange, bignumber(btcMultiplier)).toFixed(2);
    const n = math.multiply(100, bignumber(priceChange)).toFixed(2);
    const negativeValue = btcPriceChange < 0 ? -1 : 1;
    const btcPriceChangeFinal = Math.abs(btcPriceChange) < oneSat
      ? math.multiply(oneSat, negativeValue).toFixed(MAX_DECIMAL_PLACE)
      : btcPriceChange.toFixed(MAX_DECIMAL_PLACE);
    return (
      <div className={'lw-balance-outer-container'} style={style}>
        <div className={'lw-balance-note'}><Localize context={'balance'}>Total wallet balance</Localize></div>
        <div className={'lw-balance-container'}>
          <h2 className={'lw-balance-current-balance'}>{BTC + ' ' + totalBalance}<span className={'lw-balance-alt-currency-note'}>{altCurrency} {totalAltCurrency}</span></h2>
        </div>
        <div className={'lw-balance-volume'}>
          <IconTrend negative={n < 0} />
          <div className={'lw-balance-volume-text'}>
            {`${n}% (BTC ${btcPriceChangeFinal} / USD ${currencyPriceChange})`}
          </div>
        </div>
      </div>
    );
  }
};
Balance.propTypes = {
  showCoinDetails: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(IMap),
  currencyMultipliers: PropTypes.object,
  style: PropTypes.object,
  pricing: PropTypes.instanceOf(Pricing)
};

Balance = connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    wallets: appState.wallets,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers,
    pricing: appState.pricingController
  })
)(Balance);

export default Balance;
