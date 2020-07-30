import PropTypes from 'prop-types';
import React from 'react';

const PercentBar = ({ percent = 0, style = {} }) => {
  return (
    <div className={'lw-percent-bar'} style={style}>
      <div style={{width: percent + '%'}} />
    </div>
  );
};
PercentBar.propTypes = {
  percent: PropTypes.number,
  style: PropTypes.object
};

export default PercentBar;
