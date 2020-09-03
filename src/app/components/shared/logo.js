import Localize from './localize';

import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

const {api} = window;

const Logo = ({ className = '' }) => {
  const [ imageDir, setImageDir ] = useState('');

  useEffect(() => {
    api.general_getImageDir('').then(dir => {
      setImageDir(dir);
    });
  });

  return (
    <img className={className}
         srcSet={imageDir ? `${imageDir}/logo.png, ${imageDir}/logo@2x.png 2x, ${imageDir}/logo@3x.png 3x` : null}
         alt={Localize.text('XLite logo', 'login')} />
  );
};
Logo.propTypes = {
  className: PropTypes.string
};

export default Logo;
