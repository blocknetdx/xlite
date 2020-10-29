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

const WindowsDownloadLibraryModal = ({ hideModal }) => {

  const styles = {
    paragraph: {
      textAlign: 'center',
    }
  };

  const downloadLink = 'https://www.microsoft.com/en-us/download/details.aspx?id=14632';

  return (
    <Modal disableCloseOnOutsideClick={true} onClose={hideModal}>
      <ModalHeader><Localize context={'windowsLibraryDownloadModal'}>Windows</Localize></ModalHeader>
      <ModalBody>
        <p style={styles.paragraph}>{Localize.text('In order to use XLite on windows please download the Microsoft Visual C++ 2010 Redistributable Package:', 'windowsLibraryDownloadModal')}</p>
        <p style={styles.paragraph}><CopyableLink className={'lw-modal-copyable-link'} href={downloadLink}>{downloadLink}</CopyableLink></p>
      </ModalBody>
    </Modal>
  );
};
WindowsDownloadLibraryModal.propTypes = {
  hideModal: PropTypes.func
};

export default connect(
  null,
  dispatch => ({
    hideModal: () => dispatch(appActions.setShowWindowsLibraryDownloadModal(false))
  })
)(WindowsDownloadLibraryModal);
