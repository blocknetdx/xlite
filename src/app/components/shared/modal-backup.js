import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';
import { Button } from './buttons';

const BackupModal = ({ hideBackupModal }) => {

  const onDownloadFileClick = e => {
    e.preventDefault();

    // ToDo add download backup file functionality

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
    }
  };

  return (
    <Modal onClose={hideBackupModal}>
      <ModalHeader><Localize context={'backup-modal'}>Backup</Localize></ModalHeader>
      <ModalBody style={styles.body}>
        <p><Localize context={'backup-modal'}>The following downloaded file can be used to recover your funds. Make sure to download and store it in a safe and secure place.</Localize></p>
        <p><strong><Localize context={'backup-modal'}>Do not share this file with anyone as it provides access to your wallet and therefore your funds.</Localize></strong></p>
        <div style={styles.spacer} />
        <div style={styles.buttonContainer}><Button onClick={onDownloadFileClick}><Localize context={'backup-modal'}>Download backup file</Localize> <i className={'fas fa-download'} /></Button></div>
      </ModalBody>
    </Modal>
  );
};
BackupModal.propTypes = {
  hideBackupModal: PropTypes.func
};

export default connect(
  null,
  dispatch => ({
    hideBackupModal: () => dispatch(appActions.setShowBackupModal(false))
  })
)(BackupModal);
