// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';
import Localize from './localize';
import Wallet from '../../types/wallet-r';

const AssetWithImage = ({ shortenName = false, style = {}, wallet }) => {

  const { ticker } = wallet;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center'
    },
    image: {
      display: 'inline-block',
      height: 24,
      width: 'auto',
      marginRight: 10
    }
  };

  return (
    <div style={{...styles.container, ...style}}><img alt={Localize.text('{{coin}} icon', 'universal', {coin: ticker})} style={styles.image} srcSet={wallet.imagePath} />{ shortenName ? ticker : wallet.name}</div>
  );
};
AssetWithImage.propTypes = {
  shortenName: PropTypes.bool,
  style: PropTypes.object,
  wallet: PropTypes.instanceOf(Wallet)
};

export default AssetWithImage;
