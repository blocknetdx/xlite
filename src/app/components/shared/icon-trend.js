// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React from 'react';
import PropTypes from 'prop-types';
import { publicPath } from '../../util/public-path-r';

const IconTrend = ({ negative = false }) => {

  const icon = negative ? 'down' : 'up';
  const style = {
    container: {
      width: '24px',
      height: '24px',
      objectFit: 'contain',
      display: 'inline-block',
    }
  };
  return (
    <img src={`${publicPath}/images/icons/icon-trend-${icon}.svg`}  style={style.container} />
  );
};
IconTrend.propTypes = {
  negative: PropTypes.bool
};

export default IconTrend;
