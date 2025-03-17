// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import Localize from './localize';
import Wallet from '../../types/wallet-r';
import { getSrcFromSrcSet } from '../../util';

const SelectWalletDropdown = ({ selected = '', style = {}, wallets, onSelect }) => {
  const wallet = wallets?.find(w => w.ticker === selected) || null;
  const filteredWallets = wallets?.filter(w => w.ticker !== selected) || [];

  return (
    <Dropdown style={style}>
      <Dropdown.Toggle variant="light" className="lw-coin-select">
        {wallet && (
          <img
            alt={Localize.text('Coin icon', 'receive-modal')}
            src={getSrcFromSrcSet(wallet.imagePath)}
            srcSet={wallet.imagePath}
            style={{ marginRight: '8px', width: '24px', height: '24px' }}
          />
        )}
        {wallet ? `${wallet.name} (${wallet.ticker})` : Localize.text('Select Wallet', 'receive-modal')}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {filteredWallets.length > 0 ? (
          filteredWallets.map(w => (
            <Dropdown.Item key={w.ticker} onClick={() => onSelect(w.ticker)}>
              <img
                alt={Localize.text('Coin icon', 'receive-modal')}
                src={getSrcFromSrcSet(w.imagePath)}
                srcSet={w.imagePath}
                style={{ marginRight: '8px', width: '24px', height: '24px' }}
              />
              {`${w.name} (${w.ticker})`}
            </Dropdown.Item>
          ))
        ) : (
          <Dropdown.Item disabled>
            ----
          </Dropdown.Item>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

SelectWalletDropdown.propTypes = {
  selected: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  style: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

export default SelectWalletDropdown;
