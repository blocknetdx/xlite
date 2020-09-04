import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import * as appActions from '../../actions/app-actions';
import { Dropdown, DropdownItem } from './dropdown';
import { altCurrencies } from '../../constants';

const PreferencesModal = ({ altCurrency, hidePreferencesModal, setAltCurrency }) => {

  const styles = {
    body: {
      paddingLeft: 20,
      paddingRight: 20,
      paddingBottom: 40
    },
    heading: {
      fontSize: 16
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      borderBottomColor: '#c8cdd6',
      marginTop: 30,
      marginBottom: 30
    },
    themeContainer: {
      marginTop: 20,
      fontSize: 14,
      fontWeight: 'bold',
      lineHeight: '40px'
    },
    toggleIcon: {
      fontSize: 22,
      marginLeft: 20,
      marginRight: 20,
      opacity: .45,
      filter: 'blur(1px)',
      cursor: 'default'
    },
    darkLabel: {
      cursor: 'default'
    },
    lightLabel: {
      opacity: .45,
      filter: 'blur(1px)',
      cursor: 'default'
    }
  };

  const fiatItems = [
    new DropdownItem('US Dollar (USD)', altCurrencies.USD)
  ];

  return (
    <Modal onClose={hidePreferencesModal}>
      <ModalHeader><Localize context={'receive-modal'}>Preferences</Localize></ModalHeader>
      <ModalBody style={styles.body}>
        <h5 style={styles.heading}><Localize context={'preferences-modal'}>Wallet theme</Localize>:</h5>
        <div style={styles.themeContainer}>
          <span style={styles.darkLabel}>Dark Theme</span><i className={'fas fa-toggle-off'} style={styles.toggleIcon} /><span style={styles.lightLabel}>Light theme</span>
        </div>
        <div style={styles.divider} />
        <h5 style={styles.heading}><Localize context={'preferences-modal'}>Select base FIAT currency</Localize>:</h5>
        <div>
          <Dropdown items={fiatItems} value={altCurrency} onSelect={setAltCurrency} />
        </div>
      </ModalBody>
    </Modal>
  );
};
PreferencesModal.propTypes = {
  altCurrency: PropTypes.string,
  hidePreferencesModal: PropTypes.func,
  setAltCurrency: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    altCurrency: appState.altCurrency
  }),
  dispatch => ({
    hidePreferencesModal: () => dispatch(appActions.setShowPreferencesModal(false)),
    setAltCurrency: altCurrency => dispatch(appActions.setAltCurrency(altCurrency))
  })
)(PreferencesModal);
