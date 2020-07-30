import { connect } from 'react-redux';
import { Map } from 'immutable';
import React, { useEffect, useState } from 'react';
import request from 'superagent';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Localize from './localize';
import { handleError } from '../../util';
import { all, create } from 'mathjs';
import { MAX_DECIMAL_PLACE } from '../../constants';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

let Balance = ({ activeWallet, altCurrency, wallets, balances, currencyMultipliers }) => {
  const wallet = activeWallet ? wallets.find(w => w.ticker === activeWallet) : null;
  const [ total, spendable ] = wallet ? balances.get(wallet.ticker) : [];

  if(!wallet) return <div className={'lw-balance-outer-container'} />;

  const altMultiplier = bignumber(currencyMultipliers[activeWallet] && currencyMultipliers[activeWallet][altCurrency] ? currencyMultipliers[activeWallet][altCurrency] : 0);
  const altAmount = math.multiply(altMultiplier, bignumber(Number(total)));

  // ToDo add change over time data

  return (
    <div className={'lw-balance-outer-container'}>
      <div className={'lw-balance-note'}><Localize context={'balance'}>Total wallet balance</Localize></div>
      <div className={'lw-balance-container'}><h2 title={Localize.text('Total spendable:', 'balance') + ' ' + spendable}>{wallet.ticker} <span className={'text-monospace'}>{Number(total)}</span></h2> <h4>{altCurrency} <span className={'text-monospace'}>{altAmount.toFixed(2)}</span></h4></div>
    </div>
  );
};
Balance.propTypes = {
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(Map),
  currencyMultipliers: PropTypes.object
};

Balance = connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    wallets: appState.wallets,
    balances: appState.balances,
    currencyMultipliers: appState.currencyMultipliers
  })
)(Balance);

export default Balance;
