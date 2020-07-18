import PropTypes from 'prop-types';
import React from 'react';

const IconArrowRight = ({ className = '' }) => {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path fill="#01FFA0" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" opacity=".8" />
    </svg>
  );
};
IconArrowRight.propTypes = {
  className: PropTypes.string
};

export default IconArrowRight;
