import Localize from './localize';
import {publicPath} from '../../util/public-path-r';

import PropTypes from 'prop-types';
import React from 'react';

const Logo = ({ className = '' }) => {
  return (
    <img className={className}
         srcSet={`${publicPath}/images/logo.png, ${publicPath}/images/logo@2x.png 2x, ${publicPath}/images/logo@3x.png 3x`}
         alt={Localize.text('XLite logo', 'login')} />
  );
};
Logo.propTypes = {
  className: PropTypes.string
};

export default Logo;
