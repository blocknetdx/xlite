import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';
import Localize from './localize';

export const ModalHeader = ({ children }) => {
  return (
    <div className={'lw-modal-header-container'}>
      <h4>{children}</h4>
    </div>
  );
};
ModalHeader.propTypes = {
  children: PropTypes.any
};

export const ModalBody = ({ children, style = {} }) => {
  return (
    <div style={style} className={'lw-modal-body-container'}>
      {children}
    </div>
  );
};
ModalBody.propTypes = {
  style: PropTypes.object,
  children: PropTypes.any
};

export const Modal = ({ children, showBackButton = false, onBack = () => {}, onClose = () => {} }) => {
  const overlay = React.createRef();
  return (
    <div ref={overlay} className={'lw-modal-overlay'} onClick={e => $(e.target).hasClass('lw-modal-overlay') ? onClose() : null}>
      <div className={'lw-modal-container'}>
        {showBackButton ?
          <a className={'lw-back-btn'} href={'#'} onClick={e => {
            e.preventDefault();
            onBack();
          }}><i className={'fas fa-long-arrow-alt-left'} /> <Localize context={'universal'}>Back</Localize></a>
          :
          null
        }
        <a className={'lw-close-btn'} href={'#'} onClick={e => {
          e.preventDefault();
          onClose();
        }}><i className={'fas fa-times'} /></a>
        {children}
      </div>
    </div>
  );
};
Modal.propTypes = {
  showBackButton: PropTypes.bool,
  children: PropTypes.any,
  onClose: PropTypes.func,
  onBack: PropTypes.func
};
