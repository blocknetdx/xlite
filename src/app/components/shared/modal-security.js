import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';

const SecurityModal = ({ hideSecurityModal }) => {

  return (
    <Modal onClose={hideSecurityModal}>
      <ModalHeader><Localize context={'receive-modal'}>Security</Localize></ModalHeader>
      <ModalBody>
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
