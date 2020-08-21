import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import Localize from '../shared/localize';
import { localStorageKeys } from '../../constants';
import IconArrowRight from '../shared/icon-arrow-right';
import isDev from 'electron-is-dev';
import Logo from '../shared/logo';
import CloudChains from '../../modules/cloudchains';
import { Button } from '../shared/buttons';
import domStorage from '../../modules/dom-storage';
import { Crypt, generateSalt, pbkdf2 } from '../../modules/crypt';
import { handleError, logger } from '../../util';
import Spinner from '../shared/spinner';

const LoginPasswordSubmitInput = ({ hidden, setHidden, password, readOnly = false, setPassword, onSubmit }) => {

  const [ focused, setFocused ] = useState(false);

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
             spellCheck={false}
             readOnly={readOnly}
             onChange={e => setPassword(e.target.value)}
             onFocus={() => setFocused(true)}
             onBlur={() => setFocused(false)} />
      <button type={'button'} onClick={onHideShowClick}>
        <i className={`far ${hidden ? 'fa-eye' : 'fa-eye-slash'}`}
           title={hidden ? Localize.text('Show password', 'login') : Localize.text('Hide password', 'login')} />
      </button>
      <div className={'lw-login-input-divider'} />
      <button type={'submit'} disabled={readOnly} title={Localize.text('Submit', 'universal')}>
        {readOnly ?
          <Spinner />
          :
          <IconArrowRight />
        }
      </button>
    </form>
  );
};
LoginPasswordSubmitInput.propTypes = {
  hidden: PropTypes.bool,
  setHidden: PropTypes.func,
  password: PropTypes.string,
  readOnly: PropTypes.bool,
  setPassword: PropTypes.func,
  onSubmit: PropTypes.func
};

const LoginInput = ({ type, value, placeholder = '', hidden = false, autoFocus = false, setHidden, readOnly = false, onChange }) => {

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
             className={'lw-login-input'}
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
  autoFocus: PropTypes.bool,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func
};

const okIconWidth = 20;
const OkIcon = () => <i className={'fas fa-check lw-color-positive-1'} style={{width: okIconWidth}} />;
const NotOkIcon = () => <i className={'fas fa-times color-negative'} style={{width: okIconWidth}} />;

const LoginRegister = ({ cloudChains, ccWalletCreated, setCCWalletStarted }) => {

  const [ hidden, setHidden ] = useState(true);
  const [ password, setPassword ] = useState('');
  const [ passwordRepeat, setPasswordRepeat ] = useState('');
  const [ errorMessage, setErrorMessage ] = useState('');
  const [ processing, setProcessing ] = useState(false);
  const [ mnemonic, setMnemonic ] = useState('');

  const passwordLengthGood = password.length >= 8;
  const passwordContainsLowercase = password.toUpperCase() !== password;
  const passwordContainsUppercase = password.toLowerCase() !== password;
  const passwordContainsNumber = /\d/.test(password);
  const passwordContainsSpecial = /[^\s\w\d]/.test(password);
  const passwordsMatch = password && password === passwordRepeat;

  // In dev mode you can set a CC_WALLET_PASS environmental variable to automatically populate your password on login
  // and if you also have a CC_WALLET_AUTOLOGIN environmental variable set to true, then the wallet will autologin
  useEffect(() => {
    const { CC_WALLET_PASS = '', CC_WALLET_AUTOLOGIN } = process.env;
    if(isDev && CC_WALLET_PASS && ccWalletCreated) {
      setPassword(CC_WALLET_PASS);
      if(CC_WALLET_AUTOLOGIN === 'true') {
        setTimeout(() => {
          onLoginSubmit();
        }, 100);
      }
    }
  }, [process.env.CC_WALLET_PASS]);

  const onLoginSubmit = async function() {

    setProcessing(true);

    const storedPassword = domStorage.getItem(localStorageKeys.PASSWORD);

    const rpcRunning = await cloudChains.isWalletRPCRunning();
    if (!rpcRunning) {
      const started = await cloudChains.startSPV(password);
      if(!started) {
        setErrorMessage(Localize.text('Invalid password.', 'login'));
        setProcessing(false);
        return;
      }
    } else if (storedPassword) {
      const storedSalt = domStorage.getItem(localStorageKeys.SALT);
      const hashedPassword = pbkdf2(password, storedSalt);
      if (hashedPassword !== storedPassword) {
        setErrorMessage(Localize.text('Invalid password.', 'login'));
        setProcessing(false);
        return;
      }
    }

    // Save hashed password to db
    if (!storedPassword) {
      const salt = generateSalt(32);
      const hashedPassword = pbkdf2(password, salt);
      domStorage.setItems({
        [localStorageKeys.PASSWORD]: hashedPassword,
        [localStorageKeys.SALT]: salt
      });
    }

    setCCWalletStarted(true);

  };

  const onRegisterSubmit = async function(e) {
    e.preventDefault();

    setProcessing(true);

    const m = await cloudChains.createSPVWallet(password);
    if(!m) {
      setErrorMessage(Localize.text('There was a problem creating the wallet.', 'login'));
      setProcessing(false);
      return;
    }

    const salt = generateSalt(32);
    const hashedPassword = pbkdf2(password, salt);

    let crypt, encryptedMnemonic;
    try {
      crypt = new Crypt(password, salt);
      encryptedMnemonic = crypt.encrypt(m);
    } catch(err) {
      logger.error('Problem encrypting the mnemonic');
      handleError(err);
      setErrorMessage(Localize.text('Oops! There was a problem encrypting the mnemonic.', 'login'));
      setProcessing(false);
      return;
    }

    domStorage.setItems({
      [localStorageKeys.MNEMONIC]: encryptedMnemonic,
      [localStorageKeys.PASSWORD]: hashedPassword,
      [localStorageKeys.SALT]: salt
    });

    try {
      cloudChains.loadConfs(); // load all confs and update the master conf if necessary
    } catch(err) {
      logger.error('Problem enabling master config.');
      handleError(err);
      setErrorMessage(Localize.text('Oops! There was a problem enabling the master config.', 'login'));
      setProcessing(false);
      return;
    }

    const started = await cloudChains.startSPV(password);
    if(!started) {
      setErrorMessage(Localize.text('Oops! There was a problem unlocking the wallet.', 'login'));
      setProcessing(false);
      return;
    }

    setMnemonic(m);
  };

  const onMnemonicContinueClick = e => {
    e.preventDefault();
    setCCWalletStarted(true);
  };

  let textareaNode;

  const onTextareaFocus = () => {
    if(textareaNode) textareaNode.select();
  };

  const styles = {
    bodyContainer: {
      marginTop: 50
    }
  };

  return (
    <div className={'lw-login-container'}>
      <div className={'lw-login-inner-container'}>
        <div className={'lw-login-image-container'}>
          <Logo className={'lw-login-image'} />
        </div>
        {mnemonic ?
          <div style={styles.bodyContainer}>

            <div className={'lw-color-secondary-3'} style={{marginBottom: 20, fontSize: 14}}><Localize context={'login'}>Below is the mnemonic seed for your wallet. Please save it securely for your records. If you forget your password or otherwise lose your wallet, you will be able to restore your wallet using these words.</Localize></div>
            <textarea ref={node => node ? textareaNode = node : null} className={'lw-login-textarea text-center text-monospace'} rows={4} value={mnemonic} readOnly={true} onFocus={onTextareaFocus} />

            <Button
              type={'button'}
              className={'w-100'}
              onClick={onMnemonicContinueClick}
              style={{marginTop: 25, height: 50}}><Localize context={'login'}>Continue</Localize></Button>
          </div>
          :
          ccWalletCreated ?
            <div style={styles.bodyContainer}>
              <LoginPasswordSubmitInput
                hidden={hidden}
                setHidden={setHidden}
                password={password}
                setPassword={setPassword}
                readOnly={processing}
                onSubmit={onLoginSubmit} />
            </div>
            :
            <div style={styles.bodyContainer}>
              <form onSubmit={onRegisterSubmit}>
                <LoginInput placeholder={Localize.text('Enter password', 'login')}
                            autoFocus={true}
                            value={password}
                            type={'password'}
                            hidden={hidden}
                            setHidden={setHidden}
                            readOnly={processing}
                            onChange={setPassword} />
                <LoginInput placeholder={Localize.text('Repeat password', 'login')}
                            value={passwordRepeat}
                            type={'password'}
                            hidden={hidden}
                            readOnly={processing}
                            onChange={setPasswordRepeat} />
                <div style={{marginBottom: 10}}>
                  <div className={'lw-color-secondary-5'} style={{fontSize: 13}}>
                    <div>{passwordContainsLowercase ? <OkIcon /> : <NotOkIcon />} {Localize.text('Password must contain a lowercase character.')}</div>
                    <div>{passwordContainsUppercase ? <OkIcon /> : <NotOkIcon />} {Localize.text('Password must contain an uppercase character.')}</div>
                    <div>{passwordContainsNumber ? <OkIcon /> : <NotOkIcon />} {Localize.text('Password must contain a number.')}</div>
                    <div>{passwordContainsSpecial ? <OkIcon /> : <NotOkIcon />} {Localize.text('Password must contain a special character.')}</div>
                    <div>{passwordLengthGood ? <OkIcon /> : <NotOkIcon />} {Localize.text('Password must contain at least 8 characters.')}</div>
                    <div>{passwordsMatch ? <OkIcon /> : <NotOkIcon />} {Localize.text('Passwords must match.')}</div>
                  </div>
                </div>

                <Button
                  type={'submit'}
                  className={'w-100'}
                  disabled={processing || !passwordContainsLowercase || !passwordContainsUppercase || !passwordContainsNumber || !passwordContainsSpecial || !passwordLengthGood || !passwordsMatch}
                  style={{height: 50}}>{processing ? <Spinner /> : <Localize context={'login'}>Create Wallet</Localize>}</Button>

              </form>
            </div>
        }
        {errorMessage ?
          <div className={'color-negative'} style={{marginTop: 10, fontSize: 13}}>
            {errorMessage}</div>
          :
          null
        }
      </div>
    </div>
  );
};
LoginRegister.propTypes = {
  cloudChains: PropTypes.instanceOf(CloudChains),
  ccWalletCreated: PropTypes.bool,
  setActiveView: PropTypes.func,
  setCCWalletStarted: PropTypes.func
};

export default LoginRegister;
