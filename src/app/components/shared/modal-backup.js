import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';
import { Button } from './buttons';
import { LoginInput } from './inputs';
import Alert from '../../modules/alert';
import CloudChains from '../../modules/cloudchains-r';

const BackupModal = ({ hideBackupModal, cloudChains }) => {

  const [ hiddenPassword, setHiddenPassword ] = useState(true);
  const [ password, setPassword ] = useState('');
  const [ processing, setProcessing ] = useState(false);

  const onDownloadFileClick = async e => {
    e.preventDefault();
    if (password.length === 0) {
      const title = Localize.text('Issue', 'backup modal');
      const msg = Localize.text('Please enter your password', 'backup modal');
      await Alert.error(title, msg);
      return;
    }
    if (!cloudChains) {
      const title = Localize.text('Issue', 'backup modal');
      const msg = Localize.text('The CloudChains daemon is not ready', 'backup modal');
      await Alert.error(title, msg);
      return;
    }
    try {
      if (!await cloudChains.matchesStoredPassword(password)) {
        const title = Localize.text('Issue', 'backup modal');
        const msg = Localize.text('Incorrect Password', 'backup modal');
        await Alert.error(title, msg);
        return;
      }
    } catch (err) {
      await Alert.error(Localize.text('Issue', 'backup modal'), Localize.text(err.message, 'backup modal'));
      return;
    }
    // ToDo add download backup file functionality
    setProcessing(true);
  };

  const styles = {
    body: {
      paddingLeft: 20,
      paddingRight: 20
    },
    spacer: {
      height: 200
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 40
    },
    label: {
      marginTop: 10
    }
  };

  return (
    <Modal onClose={hideBackupModal}>
      <ModalHeader><Localize context={'backup-modal'}>Backup</Localize></ModalHeader>
      <ModalBody style={styles.body}>
        <p><Localize context={'backup-modal'}>The following downloaded file can be used to recover your funds. Make sure to download and store it in a safe and secure place.</Localize></p>
        <p><strong><Localize context={'backup-modal'}>Do not share this file with anyone as it provides access to your wallet and therefore your funds.</Localize></strong></p>
        <label style={styles.label} className={'lw-color-secondary-6'}><Localize context={'backup-modal'}>Please specify your password</Localize>:</label>
        <LoginInput placeholder={Localize.text('Password', 'login')}
                    className={'lw-color-secondary-10'}
                    autoFocus={true}
                    value={password}
                    type={'password'}
                    hidden={hiddenPassword}
                    setHidden={setHiddenPassword}
                    readOnly={processing}
                    onChange={setPassword} />
        <div style={styles.spacer} />
        <div style={styles.buttonContainer}><Button onClick={onDownloadFileClick}><Localize context={'backup-modal'}>Download backup file</Localize> <i className={'fas fa-download'} /></Button></div>
      </ModalBody>
    </Modal>
  );
};
BackupModal.propTypes = {
  hideBackupModal: PropTypes.func,
  cloudChains: PropTypes.instanceOf(CloudChains)
};

export default connect(
  ({ appState }) => ({
    cloudChains: appState.cloudChains,
  }),
  dispatch => ({
    hideBackupModal: () => dispatch(appActions.setShowBackupModal(false))
  })
)(BackupModal);
