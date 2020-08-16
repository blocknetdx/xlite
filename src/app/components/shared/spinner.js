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
