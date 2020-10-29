// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';

const IconReceive = ({ className = '' }) => {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20">
      <path fill="#fff" d="M13.333 10.833h-2.5V2.5H9.167v8.333h-2.5L10 14.167l3.333-3.334zm-10 5V17.5h13.334v-1.667H3.333z" />
    </svg>
  );
};
IconReceive.propTypes = {
  className: PropTypes.string
};

export default IconReceive;
