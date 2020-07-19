import PropTypes from 'prop-types';
import React from 'react';

const IconSend = ({ className = '' }) => {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="21" height="20" fill="none" viewBox="0 0 21 20">
      <path fill="#fff" d="M7.167 5.833h2.5v8.334h1.666V5.833h2.5L10.5 2.5 7.167 5.833zm-3.334 10V17.5h13.334v-1.667H3.833z" />
    </svg>
  );
};
IconSend.propTypes = {
  className: PropTypes.string
};

export default IconSend;
