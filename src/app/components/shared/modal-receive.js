import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import Wallet from '../../types/wallet';
import { clipboard } from 'electron';
import * as appActions from '../../actions/app-actions';
import { handleError } from '../../util';
import { Button } from './buttons';
import SelectWalletDropdown from './select-wallet-dropdown';
import { AddressInput } from './inputs';

const ReceiveModal = ({ activeWallet, wallets, hideReceiveModal }) => {

  const [ selected, setSelected ] = useState('');
  const [ address, setAddress ] = useState('');
  const [ addressDataUrl, setAddressDataUrl ] = useState('');

  const wallet = wallets.find(w => w.ticker === selected);

  useEffect(() => {
    setSelected(activeWallet);
  }, [activeWallet]);

  useEffect(() => {
    if(wallet) {
      wallet.getAddresses()
        .then(arr => {
          if(arr.length > 0) setAddress(arr[arr.length - 1]);
        })
        .catch(handleError);
    }
  }, [wallet]);

  useEffect(() => {
    if(address) {
      QRCode.toDataURL(address, (err, url) => {
        if(err) {
          handleError(err);
        } else {
          setAddressDataUrl(url);
        }
      });
    }
  }, [address]);

  if(!selected) return <Modal />;

  const onGenerateNewAddress = async function(e) {
    try {
      e.preventDefault();
      const newAddress = await wallet.generateNewAddress();
      setAddress(newAddress);
    } catch(err) {
      handleError(err);
    }
  };

  const onCopyAddress = () => {
    try {
      clipboard.writeText(address.trim());
    } catch(err) {
      handleError(err);
    }
  };

  return (
    <Modal onClose={hideReceiveModal}>
      <ModalHeader><Localize context={'receive-modal'}>Receive</Localize></ModalHeader>
      <ModalBody>
        <div><Localize context={'receive-modal'}>Select currency to receive</Localize>:</div>
        <SelectWalletDropdown style={{marginBottom: 30}} selected={selected} onSelect={ticker => setSelected(ticker)} />
        <div><Localize context={'receive-modal'}>Your address</Localize>:</div>
        <AddressInput
          value={address}
          readOnly={true}
          showButton={true}
          buttonIcon={<i className={'fas fa-copy'} />}
          onButtonClick={onCopyAddress}
          onChange={setAddress} />
        <div><a href={'#'} onClick={onGenerateNewAddress} className={'lw-color-secondary-6'}><Localize context={'receive-modal'}>Generate new address</Localize></a></div>
        <div className={'lw-modal-receive-qr-code-container'}>
          {addressDataUrl ? <img src={addressDataUrl} alt={Localize.text('Address qr code', 'receive-modal')} style={{}} /> : null}
        </div>
        <div className={'lw-modal-receive-done-btn-container'}>
          <Button onClick={hideReceiveModal}><Localize context={'universal'}>Done</Localize></Button>
        </div>
      </ModalBody>
    </Modal>
  );
};
ReceiveModal.propTypes = {
  activeWallet: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  hideReceiveModal: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    wallets: appState.wallets
  }),
  dispatch => ({
    hideReceiveModal: () => dispatch(appActions.setShowReceiveModal(false))
  })
)(ReceiveModal);
