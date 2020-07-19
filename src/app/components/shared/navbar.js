import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Button } from './buttons';
import Localize from './localize';
import Logo from './logo';
import IconSend from './icon-send';
import IconReceive from './icon-receive';

const Spacer = () => {
  return (
    <div style={{flexGrow: 1}} />
  );
};

let Navbar = ({ windowWidth }) => {

  const showButtonText = windowWidth > 738;

  return (
    <div className={'lw-navbar-container'}>
      <Logo className={'lw-navbar-logo'} />
      <Spacer />
      <Button title={Localize.text('Send', 'navbar')}>{showButtonText ? Localize.text('Send', 'navbar') + ' ' : null}<IconSend className={'navbar-button-svg-icon'} /></Button>
      <Button title={Localize.text('Receive', 'navbar')}>{showButtonText ? Localize.text('Receive', 'navbar') + ' ' : null}<IconReceive className={'navbar-button-svg-icon'} /></Button>
    </div>
  );
};
Navbar.propTypes = {
  windowWidth: PropTypes.number
};
Navbar = connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth
  })
)(Navbar);

export {
  Navbar
};
