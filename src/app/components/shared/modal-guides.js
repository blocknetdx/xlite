// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';
import { CopyableLink } from './copyable-link';

const GuidesModal = ({ hideGuidesModal }) => {

  const styles = {
    paragraph: {
      textAlign: 'center',
    }
  };

  return (
    <Modal onClose={hideGuidesModal}>
      <ModalHeader><Localize context={'guides-modal'}>Setup Guides</Localize></ModalHeader>
      <ModalBody>
        <p style={styles.paragraph}>{Localize.text('Learn more at:', 'guidesModal')} <CopyableLink className={'lw-modal-copyable-link'} href={'https://docs.blocknet.org/'}>{'docs.blocknet.org'}</CopyableLink></p>
      </ModalBody>
    </Modal>
  );
};
GuidesModal.propTypes = {
  hideGuidesModal: PropTypes.func
};

export default connect(
  null,
  dispatch => ({
    hideGuidesModal: () => dispatch(appActions.setShowGuidesModal(false))
  })
)(GuidesModal);
