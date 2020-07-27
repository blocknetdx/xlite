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

const AddressInput = ({ value, placeholder = '', showButton = false, buttonIcon = '', required = false, disabled = false, readOnly = false, style = {}, onChange, onButtonClick }) => {

  const onClick = e => {
    e.preventDefault();
    onButtonClick();
  };

  return (
    <div className={'lw-address-input-container'} style={style}>
      <input placeholder={placeholder} readOnly={readOnly} disabled={disabled} required={required} type={'text'} value={value} spellCheck={false} onChange={e => onChange(e.target.value)} />
      {showButton ? <a href={'#'} onClick={onClick} className={'lw-color-secondary-6'} style={{textDecoration: 'none', paddingLeft: 15, paddingRight: 15}}>{buttonIcon}</a> : null}
    </div>
  );
};
AddressInput.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  showButton: PropTypes.bool,
  buttonIcon: PropTypes.element,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  onChange: PropTypes.func,
  onButtonClick: PropTypes.func
};

const CurrencyInput = ({ value, placeholder = '', required = false, disabled = false, readOnly = false, currency = '', style = {}, inputStyle = {}, onChange, onBlur }) => {
  return (
    <div className={'lw-address-input-container'} style={style}>
      <input style={inputStyle} placeholder={placeholder} readOnly={readOnly} disabled={disabled} required={required} type={'text'} value={value} spellCheck={false} onChange={onChange} onBlur={onBlur} />
      <div style={{paddingLeft: 10, paddingRight: 10}}>{currency.toUpperCase()}</div>
    </div>
  );
};
CurrencyInput.propTypes = {
  value: PropTypes.string,
  placeholder: PropTypes.string,
  currency: PropTypes.string,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  inputStyle: PropTypes.object,
  onChange: PropTypes.func,
  onBlur: PropTypes.func
};

const Textarea = ({ value, onChange, disabled, required, readOnly, style = {} }) => {
  return (
    <textarea style={style} className={'lw-textarea'} value={value} required={required} disabled={disabled} readOnly={readOnly} onChange={e => {
      e.preventDefault();
      onChange(e.target.value);
    }} />
  );
};
Textarea.propTypes = {
  value: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  style: PropTypes.object,
  onChange: PropTypes.func
};

export {
  IconInput,
  AddressInput,
  CurrencyInput,
  Textarea
};
