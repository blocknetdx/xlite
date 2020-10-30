// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React from 'react';
import PropTypes from 'prop-types';
import Localize from './localize';
import { publicPath } from '../../util/public-path-r';

const Spinner = ({ className = '', style = {} }) => {
  return (
    <img alt={Localize.initialized() ? Localize.text('Loading spinner', 'transactions') : 'Loading spinner'} className={`lw-login-loading-spinner ${className}`} style={style}
         srcSet={`${publicPath}/images/icons/icon-loading-grey.png, ${publicPath}/images/icons/icon-loading-grey@2x.png 2x`} />
  );
};
Spinner.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object
};

export default Spinner;
