// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import Localize from './localize';
import {publicPath} from '../../util/public-path-r';

import PropTypes from 'prop-types';
import React from 'react';

const Logo = ({ className = '' }) => {
  return (
    <img className={className}
         srcSet={`file://${publicPath}/images/logo.png, file://${publicPath}/images/logo@2x.png 2x, file://${publicPath}/images/logo@3x.png 3x`}
         alt={Localize.text('XLite logo', 'login')} />
  );
};
Logo.propTypes = {
  className: PropTypes.string
};

export default Logo;
