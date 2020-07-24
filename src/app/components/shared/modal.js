import PropTypes from 'prop-types';
import React from 'react';
import $ from 'jquery';

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

export const ModalBody = ({ children }) => {
  return (
    <div className={'lw-modal-body-container'}>
      {children}
    </div>
  );
};
ModalBody.propTypes = {
  children: PropTypes.any
};

export const Modal = ({ children, onClose = () => {} }) => {
  const overlay = React.createRef();
  return (
    <div ref={overlay} className={'lw-modal-overlay'} onClick={e => $(e.target).hasClass('lw-modal-overlay') ? onClose() : null}>
      <div className={'lw-modal-container'}>
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
  children: PropTypes.any,
  onClose: PropTypes.func
};
