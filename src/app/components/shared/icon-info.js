// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';

const IconInfo = ({ className = '', publicPath = '' }) => {
  return (
    <img
      className={className}
      alt="Info Icon"
      src={`${publicPath}/images/icons/icon-info.png`}
      srcSet={`${publicPath}/images/icons/icon-info-red.png, ${publicPath}/images/icons/icon-info-red@2x.png 2x`}
    />
  );
};

IconInfo.propTypes = {
  className: PropTypes.string,
  publicPath: PropTypes.string,
};

export default IconInfo;
