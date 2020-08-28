import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';

const BackupModal = ({ hideBackupModal }) => {

  return (
    <Modal onClose={hideBackupModal}>
      <ModalHeader><Localize context={'receive-modal'}>Backup</Localize></ModalHeader>
      <ModalBody>
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
