import PropTypes from 'prop-types';
import React, {useEffect} from 'react';
import $ from 'jquery';
import Localize from './localize';
import {ESC_KEY_CODE} from '../../constants';

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

export const ModalBody = ({ children, style = {}, className = '' }) => {
  return (
    <div style={style} className={`lw-modal-body-container ${className}`}>
      {children}
    </div>
  );
};
ModalBody.propTypes = {
  style: PropTypes.object,
  children: PropTypes.any,
  className: PropTypes.string
};

export const Modal = ({ children, showBackButton = false, disableCloseOnOutsideClick = false, onBack = () => {}, onClose = () => {} }) => {
  const overlay = React.createRef();
  const onEscKey = event => {
    if (event.keyCode === ESC_KEY_CODE) {
      onClose();
    }
  };
  useEffect( () => {
    document.addEventListener('keydown', onEscKey, false);
    return () => {
      document.removeEventListener('keydown', onEscKey, false);
    };
  }, []);
  return (
    <div ref={overlay} className={'lw-modal-overlay'} onClick={e => $(e.target).hasClass('lw-modal-overlay') && !disableCloseOnOutsideClick ? onClose() : null}>
      <div className={'lw-modal-container'}>
        {showBackButton ?
          <a className={'lw-back-btn'} href={'#'} onClick={e => {
            e.preventDefault();
            onBack();
          }}><i className={'fas fa-long-arrow-alt-left'} /> <Localize context={'universal'}>back</Localize></a>
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
  disableCloseOnOutsideClick: PropTypes.bool,
  children: PropTypes.any,
  onClose: PropTypes.func,
  onBack: PropTypes.func
};
