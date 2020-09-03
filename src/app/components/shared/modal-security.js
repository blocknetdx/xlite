import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';
import { Button } from './buttons';
import { LoginInput } from './inputs';
import { passwordValidator } from '../../util';

const SecurityModal = ({ hideSecurityModal }) => {

  const [ hidden, setHidden ] = useState(true);
  const [ password, setPassword ] = useState('');
  const [ passwordRepeat, setPasswordRepeat ] = useState('');
  const [ processing, setProcessing ] = useState(false);

  const passwordLengthGood = passwordValidator.checkLength(password);
  const passwordContainsLowercase = passwordValidator.checkLowercase(password);
  const passwordContainsUppercase = passwordValidator.checkUppercase(password);
  const passwordContainsNumber = passwordValidator.checkNumber(password);
  const passwordContainsSpecial = passwordValidator.checkSpecial(password);
  const passwordsMatch = password && password === passwordRepeat;

  const passwordsGood = passwordLengthGood && passwordContainsLowercase && passwordContainsUppercase && passwordContainsNumber && passwordContainsSpecial && passwordsMatch;

  const onSubmit = e => {
    e.preventDefault();

    // ToDo add update password functionality

  };

  const styles = {
    body: {
      paddingLeft: 20,
      paddingRight: 20
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 50,
      marginBottom: 40
    },
    label: {
      marginTop: 30
    }
  };

  return (
    <Modal onClose={hideSecurityModal}>
      <ModalHeader><Localize context={'security-modal'}>Security</Localize></ModalHeader>
      <ModalBody style={styles.body}>
        <form onSubmit={onSubmit}>
          <p><Localize context={'security-modal'}>Below, you can update your password. Your new password must include an uppercase character, a lowercase character, a number, a special character, and be at least eight characters long.</Localize></p>
          <label style={styles.label} className={'lw-color-secondary-6'}><Localize context={'security-modal'}>Set new wallet password</Localize>:</label>
          <LoginInput placeholder={Localize.text('Enter password', 'login')}
                      className={'lw-color-secondary-10'}
                      autoFocus={true}
                      value={password}
                      type={'password'}
                      hidden={hidden}
                      setHidden={setHidden}
                      readOnly={processing}
                      onChange={setPassword} />
          <label style={styles.label} className={'lw-color-secondary-6'}><Localize context={'security-modal'}>Confirm new password</Localize>:</label>
          <LoginInput placeholder={Localize.text('Repeat password', 'login')}
                      className={'lw-color-secondary-10'}
                      value={passwordRepeat}
                      type={'password'}
                      hidden={hidden}
                      readOnly={processing}
                      onChange={setPasswordRepeat} />
          <div style={styles.buttonContainer}>
            <Button disabled={!passwordsGood} type={'submit'}><Localize context={'backup-modal'}>Save changes</Localize></Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
};
SecurityModal.propTypes = {
  hideSecurityModal: PropTypes.func
};

export default connect(
  null,
  dispatch => ({
    hideSecurityModal: () => dispatch(appActions.setShowSecurityModal(false))
  })
)(SecurityModal);
