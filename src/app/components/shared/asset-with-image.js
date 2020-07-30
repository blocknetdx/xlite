import PropTypes from 'prop-types';
import React from 'react';
import Localize from './localize';
import Wallet from '../../types/wallet';

const AssetWithImage = ({ wallet }) => {

  const { ticker } = wallet;

  const styles = {
    image: {
      display: 'inline-block',
      height: 24,
      width: 'auto',
      marginTop: -4,
      marginRight: 10
    }
  };

  return (
    <div><img alt={Localize.text('{{coin}} icon', 'universal', {coin: ticker})} style={styles.image} srcSet={wallet.imagePath} />{ticker}</div>
  );
};
AssetWithImage.propTypes = {
  wallet: PropTypes.instanceOf(Wallet)
};

export default AssetWithImage;
