import React from 'react';
import PropTypes from 'prop-types';

const IconInput = ({ icon, placeholder = '', type = 'text', value, onChange }) => {
  return (
    <div className={'lw-icon-input-container'}>
      <i className={icon} />
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
};
IconInput.propTypes = {
  icon: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func
};

export {
  IconInput
};
