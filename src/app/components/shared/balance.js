import {currencyLinter, multiplierForCurrency} from '../../util';
import Localize from './localize';
import {MAX_DECIMAL_PLACE} from '../../constants';
import {oneSat} from '../../util';
import Wallet from '../../types/wallet-r';
import Pricing from '../../modules/pricing-r';
import IconTrend from './icon-trend';

import {all, create} from 'mathjs';
import { connect } from 'react-redux';
import {Map as IMap} from 'immutable';
import PropTypes from 'prop-types';
import React from 'react';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const {api} = window;

let Balance = ({ showCoinDetails = false, activeWallet, altCurrency, wallets, balances, currencyMultipliers, pricing }) => {

  if(showCoinDetails) { // coin details
  const wallet = activeWallet ? wallets.find(w => w.ticker === activeWallet) : null;
  const [ total, spendable ] = wallet && balances.has(wallet.ticker) ? balances.get(wallet.ticker) : ['0', '0'];

  if(!wallet) return <div className={'lw-balance-outer-container'} />;

    const altMultiplier = multiplierForCurrency(activeWallet, altCurrency, currencyMultipliers);
  const altAmount = math.multiply(altMultiplier, bignumber(Number(total)));

  // ToDo get website data from somewhere
    const website = wallet.ticker === 'BLOCK' ? 'blocknet.co' : 'n/a';
  const explorerLink = `https://chainz.cryptoid.info/${wallet.ticker.toLowerCase()}/`;

  // ToDo add change over time data

  const onExplorerClick = e => {
    e.preventDefault();
    api.general_openUrl(explorerLink);
  };
    const onWebsiteClick = e => {
      e.preventDefault();
      if (website !== 'n/a')
        api.general_openUrl(`https://${website}`);
    };

    return (
      <div className={'lw-balance-outer-container d-flex flex-column justify-content-center'}>
        <div className={'d-flex flex-row justify-content-start'}>
          <img alt={Localize.text('{{coin}} image', 'balance', {coin: wallet.ticker})} srcSet={wallet.imagePath} style={{width: 32, height: 32}} />
          <h3 style={{fontSize: 24, lineHeight: '32px', marginLeft: 10}}>{wallet.name}</h3>
        </div>
        <div className={'d-flex flex-row justify-content-between'}>
          <div className={'d-flex flex-column justify-content-start'}>
            <div style={{fontSize: 14}} className={'lw-color-secondary-2'}>{Localize.text('Total {{coin}} balance', 'balance', {coin: wallet.ticker})}:</div>
            <div className={'lw-balance-coindetails'}><h2>{total} {activeWallet}</h2> <h4>{altCurrency} {currencyLinter(altAmount)}</h4></div>
          </div>
          <div className={'d-flex flex-column justify-content-start lw-color-secondary-3'} style={{fontSize: 14, textAlign: 'right'}}>
            <div><Localize context={'balance'}>Website</Localize>: {website ? <a onClick={onWebsiteClick} className={'lw-text-primary'} href={'#'}>{website}</a> : <span className={'lw-text-primary'}>{Localize.text('n/a', 'balance')}</span>}</div>
            <div><Localize context={'balance'}>Explorer</Localize>: <a onClick={onExplorerClick} className={'lw-text-primary'} href={'#'}>{explorerLink}</a></div>
          </div>
        </div>
      </div>
    );
  } else { // btc balance from all coins combined (not the specific coin details)
    const BTC = 'BTC';
    let allCoinBtc = bignumber(0);
    for (const wallet of wallets) {
      const currencyMultiplier = currencyMultipliers[wallet.ticker] && currencyMultipliers[wallet.ticker][BTC] ? currencyMultipliers[wallet.ticker][BTC] : 0;
      const [ total, spendable ] = balances.has(wallet.ticker) ? balances.get(wallet.ticker) : ['0', '0'];
      const coinBtc = math.multiply(bignumber(total), bignumber(currencyMultiplier));
      allCoinBtc = math.add(allCoinBtc, coinBtc);
    }
    const totalBalance = allCoinBtc.toFixed(MAX_DECIMAL_PLACE);
    const btcMultiplier = currencyMultipliers[BTC] && currencyMultipliers[BTC][altCurrency] ? currencyMultipliers[BTC][altCurrency] : 0;
    const totalAltCurrency = math.multiply(allCoinBtc, bignumber(btcMultiplier)).toFixed(2);
    const priceChange = pricing.getPriceChange(BTC, altCurrency);
    const btcPriceChange = math.multiply(allCoinBtc, bignumber(priceChange));
    const currencyPriceChange = math.multiply(btcPriceChange, bignumber(btcMultiplier)).toFixed(2);
    const n = math.multiply(100, bignumber(priceChange)).toFixed(2);
    const negativeValue = btcPriceChange < 0 ? -1 : 1;
    const btcPriceChangeFinal = Math.abs(btcPriceChange) < oneSat
      ? math.multiply(oneSat, negativeValue).toFixed(MAX_DECIMAL_PLACE)
      : btcPriceChange.toFixed(MAX_DECIMAL_PLACE);
    return (
      <div className={'lw-balance-outer-container'}>
        <div className={'lw-balance-note'}><Localize context={'balance'}>Total wallet balance</Localize></div>
        <div className={'lw-balance-container'}>
          <h2>{BTC + ' ' + totalBalance}</h2> <h4>{altCurrency} {totalAltCurrency}</h4>
        </div>
        <div className={'lw-balance-volume'}>
          <IconTrend negative={n < 0} />
          <div className={'lw-balance-volume-text'}>
            {`${n}% (+BTC ${btcPriceChangeFinal} USD ${currencyPriceChange})`}
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
