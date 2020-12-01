// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';
import Localize from './localize';
import Wallet from '../../types/wallet-r';

const SelectWalletDropdown = ({ selected = '', style = {}, wallets, onSelect }) => {

  const wallet = wallets && wallets.find(w => w.ticker === selected) || null;

  const filteredWallets = !wallets ? [] : wallets
    .filter(w => w.ticker !== selected);

  return (
    <div className={'dropdown'} style={style}>
      <a href={'#'} ref={node => node ? $(node).dropdown() : null} className={'lw-coin-select'} data-toggle={'dropdown'}>
        {wallet && <img alt={Localize.text('Coin icon', 'receive-modal')} srcSet={wallet.imagePath} />}
        <div>{wallet && `${wallet.name} (${wallet.ticker})`}</div>
        <i className={'fas fa-caret-down'} />
      </a>
      <div className={'dropdown-menu'}>
        {wallets && filteredWallets.length > 0 ?
          filteredWallets
            .map(w => {
              const onClick = e => {
                e.preventDefault();
                onSelect(w.ticker);
              };
              return (
                <button key={w.ticker} className="dropdown-item lw-coin-select-item" type="button" onClick={onClick}>
                  <img alt={Localize.text('Coin icon', 'receive-modal')} srcSet={w.imagePath} />
                  <div>{`${w.name} (${w.ticker})`}</div>
                </button>
              );
            })
          :
          wallets && filteredWallets.length === 0 ?
            [
              <button key={'empty-list-item'} className="dropdown-item lw-coin-select-item disabled" type="button">
                <div>----</div>
              </button>
            ]
            :
            null
        }
      </div>
    </div>
  );
};
SelectWalletDropdown.propTypes = {
  selected: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  style: PropTypes.object,
  onSelect: PropTypes.func
};

export default SelectWalletDropdown;
