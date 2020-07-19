import { IMAGE_DIR } from '../../constants';
import Localize from './localize';
import path from 'path';
import PropTypes from 'prop-types';
import React from 'react';

const Logo = ({ className = '' }) => {
  return (
    <img className={className}
         srcSet={`${path.join(IMAGE_DIR, 'logo.png')}, ${path.join(IMAGE_DIR, 'logo@2x.png')} 2x, ${path.join(IMAGE_DIR, 'logo@3x.png')} 3x`}
         alt={Localize.text('Xvault logo', 'login')} />
  );
};
Logo.propTypes = {
  className: PropTypes.string
};

export default Logo;
