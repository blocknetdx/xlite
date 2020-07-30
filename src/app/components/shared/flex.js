import PropTypes from 'prop-types';
import React from 'react';

export const Column = ({ children, className = '', justify = 'flex-start', style = {} }) => {

  const styles = {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: justify,
    ...style
  };

  return (
    <div className={className} style={styles}>{children}</div>
  );
};
Column.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  style: PropTypes.object,
  wrap: PropTypes.oneOf(['nowrap', 'wrap']),
  justify: PropTypes.oneOf(['flex-start', 'center', 'flex-end', 'space-between', 'space-around'])
};

export const Row = ({ children, className = '', wrap = 'nowrap', justify = 'flex-start', style = {} }) => {

  const styles = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: wrap,
    justifyContent: justify,
    ...style
  };

  return (
    <div className={className} style={styles}>{children}</div>
  );
};
Row.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  style: PropTypes.object,
  wrap: PropTypes.oneOf(['nowrap', 'wrap']),
  justify: PropTypes.oneOf(['flex-start', 'center', 'flex-end', 'space-between', 'space-around'])
};
