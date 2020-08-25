import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';
import Localize from './localize';
import Wallet from '../../types/wallet';

const SelectWalletDropdown = ({ selected = '', style = {}, wallets, onSelect }) => {

  const wallet = wallets && wallets.find(w => w.ticker === selected) || null;

  return (
    <div className={'dropdown'} style={style}>
      <a href={'#'} ref={node => node ? $(node).dropdown() : null} className={'lw-coin-select'} data-toggle={'dropdown'}>
        {wallet && <img alt={Localize.text('Coin icon', 'receive-modal')} srcSet={wallet.imagePath} />}
        <div><Localize context={'receive-modal'}>{wallet && wallet.ticker}</Localize></div>
        <i className={'fas fa-caret-down'} />
      </a>
      <div className={'dropdown-menu'}>
        {wallets && wallets
          .filter(w => w.ticker !== selected)
          .map(w => {
            const onClick = e => {
              e.preventDefault();
              onSelect(w.ticker);
            };
            return (
              <button key={w.ticker} className="dropdown-item lw-coin-select-item" type="button" onClick={onClick}>
                <img alt={Localize.text('Coin icon', 'receive-modal')} srcSet={w.imagePath} />
                <div><Localize context={'receive-modal'}>{w.ticker}</Localize></div>
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
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  style: PropTypes.object,
  onSelect: PropTypes.func
};

export default SelectWalletDropdown;
