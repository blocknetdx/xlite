// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React from 'react';
import PropTypes from 'prop-types';
import Localize from './localize';
import { publicPath } from '../../util/public-path-r';

const Spinner = ({ className = '', doNotSpin = false, style = {} }) => {
  return (
    <img alt={Localize.initialized() ? Localize.text('Loading spinner', 'transactions') : 'Loading spinner'} className={`lw-login-loading-spinner ${doNotSpin ? 'no-spin' : ''} ${className}`} style={style}
         srcSet={`file://${publicPath}/images/icons/icon-loading-grey.png, file://${publicPath}/images/icons/icon-loading-grey@2x.png 2x`} />
  );
};
Spinner.propTypes = {
  className: PropTypes.string,
  doNotSpin: PropTypes.bool,
  style: PropTypes.object
};

export default Spinner;
