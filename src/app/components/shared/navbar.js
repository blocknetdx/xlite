import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Button } from './buttons';
import Localize from './localize';
import { Dropdown, DropdownButton, DropdownDivider, DropdownItem } from './dropdown';

const NavbarText = ({ children }) => {
  return (
    <div className={'lw-navbar-text'}>{children}</div>
  );
};
NavbarText.propTypes = {
  children: PropTypes.any
};

const Spacer = () => {
  return (
    <div style={{flexGrow: 1}} />
  );
};

let Navbar = ({ windowWidth }) => {

  const showButtonText = windowWidth > 738;

  return (
    <div className={'lw-navbar-container'}>
      <NavbarText>Litewallet</NavbarText>
      <Spacer />
      <Button title={Localize.text('Send', 'navbar')}>{showButtonText ? Localize.text('Send', 'navbar') + ' ' : null}<i className={'fas fa-arrow-up'} /></Button>
      <Button title={Localize.text('Receive', 'navbar')}>{showButtonText ? Localize.text('Receive', 'navbar') + ' ' : null}<i className={'fas fa-arrow-down'} /></Button>
      <Button title={Localize.text('Exchange', 'navbar')} disabled={true}>{showButtonText ? Localize.text('Exchange', 'navbar') + ' ' : null}<i className={'fas fa-exchange-alt'} /></Button>
      <Button transparent={true}><i className={'fas fa-eye'} /></Button>
      <Dropdown right={true}>
        <DropdownButton title={Localize.text('Help', 'navbar')} transparent={true}><i className={'fas fa-question-circle'} /></DropdownButton>
        <DropdownItem><i className={'fas fa-file-alt'} /> <Localize context={'navbar'}>Setup Guides</Localize></DropdownItem>
        <DropdownItem><i className={'fab fa-discord'} /> <Localize context={'navbar'}>Join Discord</Localize></DropdownItem>
      </Dropdown>
      <Dropdown right={true}>
        <DropdownButton title={Localize.text('Menu', 'navbar')} transparent={true}><i className={'fas fa-bars'} /></DropdownButton>
        <DropdownItem><i className={'fas fa-cog'} /> <Localize context={'navbar'}>Preferences</Localize></DropdownItem>
        <DropdownItem><i className={'fas fa-shield-alt'} /> <Localize context={'navbar'}>Security</Localize></DropdownItem>
        <DropdownItem><i className={'fas fa-cloud-upload-alt'} /> <Localize context={'navbar'}>Backup</Localize></DropdownItem>
        <DropdownDivider />
        <DropdownItem><i className={'fas fa-info-circle'} /> <Localize context={'navbar'}>About</Localize></DropdownItem>
        <DropdownItem><i className={'fas fa-power-off'} /> <Localize context={'navbar'}>Logout</Localize></DropdownItem>
      </Dropdown>
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
