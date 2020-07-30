import { connect } from 'react-redux';
import { Map } from 'immutable';
import React, { useEffect, useState } from 'react';
import request from 'superagent';
import PropTypes from 'prop-types';
import Wallet from '../../types/wallet';
import Localize from './localize';
import { handleError } from '../../util';
import { all, create } from 'mathjs';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

let Balance = ({ activeWallet, wallets, balances }) => {
  const wallet = activeWallet ? wallets.find(w => w.ticker === activeWallet) : null;
  const [ total, spendable ] = wallet ? balances.get(wallet.ticker) : [];

  // ToDo make this dynamic
  const conversionCurrency = 'USD';

  const [ nationalCurrency, setNationalCurrency ] = useState('0.00');
  useEffect(() => {
    if(activeWallet) {
      request.get(`https://min-api.cryptocompare.com/data/price?fsym=${activeWallet}&tsyms=${conversionCurrency}`)
        .then(({ body }) => {
          const multiplier = body[conversionCurrency];
          const num = math.multiply(bignumber(multiplier), bignumber(Number(total)));
          setNationalCurrency(num.toFixed(2));
        })
        .catch(handleError);
    }
    return () => {
      setNationalCurrency('0.00');
    };
  }, [activeWallet, total]);

  if(!wallet) return <div />;

  // ToDo add change over time data

  return (
    <div className={'lw-balance-outer-container'}>
      <div className={'lw-balance-note'}><Localize context={'balance'}>Total wallet balance</Localize></div>
      <div className={'lw-balance-container'}><h2 title={Localize.text('Total spendable:', 'balance') + ' ' + spendable}>{wallet.ticker} {total}</h2> <h4>{conversionCurrency} {nationalCurrency}</h4></div>
    </div>
  );
};
Balance.propTypes = {
  activeWallet: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(Map)
};

Balance = connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    wallets: appState.wallets,
    balances: appState.balances
  })
)(Balance);

export default Balance;
