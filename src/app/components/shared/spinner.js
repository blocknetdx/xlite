// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React from 'react';
import PropTypes from 'prop-types';

const Spinner = ({ className = '', style = {} }) => {
  return (
    <i className={`fas fa-spinner fa-spin ${className}`} style={style} />
  );
};
Spinner.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object
};

export default Spinner;
