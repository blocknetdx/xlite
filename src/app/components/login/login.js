import path from 'path';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Localize from '../shared/localize';
import { activeViews, IMAGE_DIR } from '../../constants';
import IconArrowRight from '../shared/icon-arrow-right';

const LoginInput = ({ onSubmit }) => {

  const [ focused, setFocused ] = useState(false);
  const [ hidden, setHidden ] = useState(true);
  const [ password, setPassword ] = useState('');

  const onHideShowClick = () => {
    setHidden(!hidden);
    setTimeout(() => {
      const $input = $('#js-login-input').focus();
      const val = $input.val();
      $input[0].setSelectionRange(val.length, val.length);
    }, 0);
  };

  const submitHandler = e => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className={`lw-login-input-container ${focused ? 'active' : ''}`} onSubmit={submitHandler}>
      <input placeholder={Localize.text('Enter password to unlock', 'login')}
             id={'js-login-input'}
             className={'lw-login-input'}
             value={password}
             type={hidden ? 'password' : 'text'}
             autoFocus={true}
             required={true}
             onChange={e => setPassword(e.target.value)}
             onFocus={() => setFocused(true)}
             onBlur={() => setFocused(false)} />
      <button type={'button'} onClick={onHideShowClick}>
        <i className={`far ${hidden ? 'fa-eye' : 'fa-eye-slash'}`}
           title={hidden ? Localize.text('Show password', 'login') : Localize.text('Hide password', 'login')} />
      </button>
      <div className={'lw-login-input-divider'} />
      <button type={'submit'} title={Localize.text('Submit', 'universal')}>
        <IconArrowRight />
      </button>
    </form>
  );
};
LoginInput.propTypes = {
  onSubmit: PropTypes.func
};

const Login = ({ setActiveView }) => {

  const onSubmit = () => {

    // ToDo add password verification functionality

    setActiveView(activeViews.DASHBOARD);
  };

  return (
    <div className={'lw-login-container'}>
      <div className={'lw-login-inner-container'}>
        <div className={'lw-login-image-container'}>
          <img className={'lw-login-image'}
               srcSet={`${path.join(IMAGE_DIR, 'logo.png')}, ${path.join(IMAGE_DIR, 'logo@2x.png')} 2x, ${path.join(IMAGE_DIR, 'logo@3x.png')} 3x`}
               alt={Localize.text('Litewallet logo', 'login')} />
        </div>
        <LoginInput onSubmit={onSubmit} />
      </div>
    </div>
  );
};
Login.propTypes = {
  setActiveView: PropTypes.func
};

export default Login;
