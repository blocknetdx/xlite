// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';

const PercentBar = ({ percent = 0, style = {} }) => {
  return (
    <div className={'lw-percent-bar'} style={style}>
      <div style={{width: percent + '%'}} />
    </div>
  );
};
PercentBar.propTypes = {
  percent: PropTypes.number,
  style: PropTypes.object
};

export default PercentBar;
