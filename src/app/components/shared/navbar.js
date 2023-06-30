// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Button } from './buttons';
import Localize from './localize';
import Logo from './logo';
import IconSend from './icon-send';
import IconReceive from './icon-receive';
import BetaBadge from './beta-badge';
import * as appActions from '../../actions/app-actions';

const Spacer = () => {
  return (
    <div style={{flexGrow: 1}} />
  );
};

let Navbar = ({ windowWidth, showReceiveModal, showSendModal }) => {

  const showButtonText = windowWidth > 738;

  const styles = {
    button: {
      paddingLeft: 10,
      paddingRight: 10
    }
  };

  return (
    <div className={'lw-navbar-container'}>
      <div className='logo-badge-container'>
        <Logo className={'lw-navbar-logo'} />
        <BetaBadge />
      </div>
        <Spacer />
        <Button style={styles.button} title={Localize.text('Send', 'navbar')} onClick={showSendModal}>{showButtonText ? Localize.text('Send', 'navbar') + ' ' : null}<IconSend className={'navbar-button-svg-icon'} /></Button>
        <Button style={styles.button} title={Localize.text('Receive', 'navbar')} onClick={showReceiveModal}>{showButtonText ? Localize.text('Receive', 'navbar') + ' ' : null}<IconReceive className={'navbar-button-svg-icon'} /></Button>
    </div>
  );
};
Navbar.propTypes = {
  windowWidth: PropTypes.number,
  showReceiveModal: PropTypes.func,
  showSendModal: PropTypes.func
};
Navbar = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth
  }),
  dispatch => ({
    showReceiveModal: () => dispatch(appActions.setShowReceiveModal(true)),
    showSendModal: () => dispatch(appActions.setShowSendModal(true)),
  })
)(Navbar);

export {
  Navbar
};
