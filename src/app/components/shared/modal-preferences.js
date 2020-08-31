import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';

const PreferencesModal = ({ hidePreferencesModal }) => {

  return (
    <Modal onClose={hidePreferencesModal}>
      <ModalHeader><Localize context={'receive-modal'}>Preferences</Localize></ModalHeader>
      <ModalBody>
      </ModalBody>
    </Modal>
  );
};
PreferencesModal.propTypes = {
  hidePreferencesModal: PropTypes.func
};

export default connect(
  null,
  dispatch => ({
    hidePreferencesModal: () => dispatch(appActions.setShowPreferencesModal(false))
  })
)(PreferencesModal);
