import PropTypes from 'prop-types';
import React from 'react';

const AddressInput = ({ value, showButton = false, buttonIcon = '', required = false, disabled = false, readOnly = false, onChange, onButtonClick }) => {

  const onClick = e => {
    e.preventDefault();
    onButtonClick();
  };

  return (
    <div className={'lw-address-input-container'}>
      <input readOnly={readOnly} disabled={disabled} required={required} type={'text'} value={value} spellCheck={false} onChange={e => onChange(e.target.value)} />
      {showButton ? <a href={'#'} onClick={onClick} className={'lw-color-secondary-6'} style={{textDecoration: 'none', paddingLeft: 15, paddingRight: 15}}>{buttonIcon}</a> : null}
    </div>
  );
};
AddressInput.propTypes = {
  value: PropTypes.string,
  showButton: PropTypes.bool,
  buttonIcon: PropTypes.element,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onButtonClick: PropTypes.func
};

export default AddressInput;
