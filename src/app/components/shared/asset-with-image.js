import PropTypes from 'prop-types';
import React from 'react';
import Localize from './localize';
import Wallet from '../../types/wallet-r';

const AssetWithImage = ({ shortenName = false, wallet }) => {

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
    <div style={styles.container}><img alt={Localize.text('{{coin}} icon', 'universal', {coin: ticker})} style={styles.image} srcSet={wallet.imagePath} />{ shortenName ? ticker : wallet.name}</div>
  );
};
AssetWithImage.propTypes = {
  shortenName: PropTypes.bool,
  wallet: PropTypes.instanceOf(Wallet)
};

export default AssetWithImage;
