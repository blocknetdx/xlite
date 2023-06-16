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

const AboutModal = ({ xVaultVersion, ccVersion, hideAboutModal }) => {

  const styles = {
    paragraph: {
      textAlign: 'center',
    }
  };

  return (
    <Modal onClose={hideAboutModal}>
      <ModalHeader><Localize context={'receive-modal'}>About</Localize></ModalHeader>
      <ModalBody>
        <p style={styles.paragraph}>{Localize.text('XLite v{{version}}', 'aboutModal', {version: xVaultVersion})}</p>
        <p style={styles.paragraph}>{Localize.text('XLite Daemon {{version}}', 'aboutModal', {version: ccVersion})}</p>
        <p style={styles.paragraph}>{Localize.text('Copyright © 2020-{{year}} The Blocknet Developers', 'aboutModal', {year: new Date().getFullYear()})}</p>
        <p style={styles.paragraph}>{Localize.text('Learn more at:', 'aboutModal')} <CopyableLink className={'lw-modal-copyable-link'} href={'https://blocknet.org'}>{'blocknet.org'}</CopyableLink></p>
      </ModalBody>
    </Modal>
  );
};
AboutModal.propTypes = {
  xVaultVersion: PropTypes.string,
  ccVersion: PropTypes.string,
  hideAboutModal: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    xVaultVersion: appState.xVaultVersion,
    ccVersion: appState.ccVersion
  }),
  dispatch => ({
    hideAboutModal: () => dispatch(appActions.setShowAboutModal(false))
  })
)(AboutModal);
