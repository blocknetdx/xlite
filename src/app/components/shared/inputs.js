// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Localize from './localize';
import {publicPath} from '../../util/public-path-r';

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
      <input style={inputStyle} placeholder={placeholder} readOnly={readOnly} disabled={disabled} required={required} type={'number'} value={value} spellCheck={false} onChange={onChange} onBlur={onBlur} />
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

const LoginInput = ({ type, className =  '', value, placeholder = '', hidden = false, autoFocus = false, setHidden, readOnly = false, onChange }) => {

  const [ focused, setFocused ] = useState(false);

  let node;

  const onHideShowClick = () => {
    setHidden(!hidden);
    setTimeout(() => {
      const $input = $(node).focus();
      const val = $input.val();
      $input[0].setSelectionRange(val.length, val.length);
    }, 0);
  };

  return (
    <div className={`lw-login-input-container ${focused ? 'active' : ''}`} style={{marginBottom: 10}}>
      <input placeholder={placeholder}
             ref={n => n ? node = n : null}
             className={`lw-login-input ${className}`}
             value={value}
             type={type === 'password' && hidden ? 'password' : type === 'password' ? 'text' : type}
             autoFocus={autoFocus}
             required={true}
             spellCheck={false}
             onChange={e => onChange(e.target.value)}
             onFocus={() => setFocused(true)}
             readOnly={readOnly}
             onBlur={() => setFocused(false)} />
      {setHidden ?
        <button type={'button'} tabIndex={-1} onClick={onHideShowClick}>
          <i className={`far ${hidden ? 'fa-eye' : 'fa-eye-slash'}`}
             title={hidden ? Localize.text('Show password', 'login') : Localize.text('Hide password', 'login')} />
        </button>
        :
        null
      }
    </div>
  );
};
LoginInput.propTypes = {
  hidden: PropTypes.bool,
  setHidden: PropTypes.func,
  value: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  autoFocus: PropTypes.bool,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func
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

const Checkbox = ({ onChange }) => {

  const [checked, setChecked] = useState(false);
  const checkboxImage = checked ? 'check-box-outline' : 'checkbox-blank-outline';
  const onInputChange = () => {
    setChecked(!checked);
  };

  return (
    <div className={'lw-checkbox'}>
      <img src={`${publicPath}/images/icons/${checkboxImage}.svg`} onClick={onInputChange} />
    </div>
  );
};
Checkbox.propTypes = {
  onChange: PropTypes.func
};

const RadioInput = ({ onChange }) => {
  return (
    <label className={'lw-radio'}>
      <input type="radio" name="radio" onChange={onChange} />
      <span className={'lw-radio-checkmark'} />
    </label>
  );
};
RadioInput.propTypes = {
  onChange: PropTypes.func
};

export {
  IconInput,
  AddressInput,
  CurrencyInput,
  LoginInput,
  Textarea,
  Checkbox,
  RadioInput
};
