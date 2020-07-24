import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';
import { Map } from 'immutable';
import Localize from './localize';
import { walletSorter } from '../../util';
import Wallet from '../../types/wallet';
import { connect } from 'react-redux';

let SelectWalletDropdown = ({ selected = '', showAll = false, wallets, balances, onSelect }) => {

  const wallet = wallets.find(w => w.ticker === selected) || {};

  return (
    <div className={'dropdown'}>
      <a href={'#'} ref={node => node ? $(node).dropdown() : null} className={'lw-coin-select'} data-toggle={'dropdown'}>
        <img alt={Localize.text('Coin icon', 'receive-modal')} srcSet={wallet.imagePath} />
        <div><Localize context={'receive-modal'}>{wallet.name || ''}</Localize></div>
        <i className={'fas fa-caret-down'} />
      </a>
      <div className={'dropdown-menu'}>
        {wallets
          .filter(w => (showAll || w.rpcEnabled) && w.ticker !== selected)
          .sort(walletSorter(balances))
          .map(w => {
            const onClick = e => {
              e.preventDefault();
              onSelect(w.ticker);
            };
            return (
              <button key={w.ticker} className="dropdown-item lw-coin-select-item" type="button" onClick={onClick}>
                <img alt={Localize.text('Coin icon', 'receive-modal')} srcSet={w.imagePath} />
                <div><Localize context={'receive-modal'}>{w.name}</Localize></div>
              </button>
            );
          })
        }
      </div>
    </div>
  );
};
SelectWalletDropdown.propTypes = {
  selected: PropTypes.string,
  showAll: PropTypes.bool,
  balances: PropTypes.instanceOf(Map),
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  onSelect: PropTypes.func
};
SelectWalletDropdown = connect(
  ({ appState }) => ({
    balances: appState.balances,
    wallets: appState.wallets
  })
)(SelectWalletDropdown);

export default SelectWalletDropdown;
