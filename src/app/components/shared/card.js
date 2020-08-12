import PropTypes from 'prop-types';
import React from 'react';

export const CardHeader = ({ children }) => {
  return (
    <div className={'lw-card-header'}>
      {children}
    </div>
  );
};
CardHeader.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
};

export const CardBody = ({ children }) => {
  return (
    <div className={'lw-card-body'}>
      {children}
    </div>
  );
};
CardBody.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
};

export const CardFooter = ({ children }) => {
  return (
    <div className={'lw-card-footer'}>
      {children}
    </div>
  );
};
CardFooter.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
};

export const Card = ({ children, style = {} }) => {
  return (
    <div className={'lw-card-container'} style={style}>
      {children}
    </div>
  );
};
Card.propTypes = {
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)]),
  style: PropTypes.object
};
