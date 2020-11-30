// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import Wallet from '../../types/wallet-r';
import * as appActions from '../../actions/app-actions';
import {availableWallets, handleError} from '../../util';
import { Button } from './buttons';
import SelectWalletDropdown from './select-wallet-dropdown';
import ReceiveAllAddresses from './modal-receive-all-addresses';
import { AddressInput } from './inputs';

const {api} = window;

const ReceiveModal = ({ activeWallet, wallets, hideReceiveModal }) => {

  const [ selected, setSelected ] = useState('');
  const [ address, setAddress ] = useState('');
  const [ addresses, setAddresses ] = useState([]);
  const [ addressDataUrl, setAddressDataUrl ] = useState('');
  const [ showAddressCopiedConfirmation, setShowAddressCopiedConfirmation] = useState(false);
  const [ showReceiveAllAddresses, setShowReceiveAllAddresses ] = useState(false);

  const availWallets = availableWallets(wallets);
  const wallet = availWallets ? availWallets.find(w => w.ticker === selected) : null;

  useEffect(() => {
    setSelected(activeWallet);
  }, [activeWallet]);

  useEffect(() => {
    if(wallet) {
      wallet.getAddresses()
        .then((res = []) => {
          setAddresses(res);
        });
    } else {
      setAddresses([]);
    }
  }, [activeWallet, wallet]);

  useEffect(() => {
    if(wallet) {
      wallet.getAddresses()
        .then(arr => {
          if (arr && arr.length > 0) { // make sure arr is valid
            setAddress(arr[arr.length - 1]);
            setAddresses(arr);
          }
          else
            setAddress('');
        })
        .catch(handleError);
    }
  }, [wallet]);

  useEffect(() => {
    if(address) {
      api.general_qrCode(address)
        .then(url => {
          setAddressDataUrl(url);
        })
        .catch(handleError);
    } else
      setAddressDataUrl(null); // clear on bad address
  }, [address]);

  if (!wallets || !availWallets) // wait for data
    return <Modal />;

  const disableButtons = !wallet;

  const onGenerateNewAddress = async function(e) {
    try {
      e.preventDefault();
      if(disableButtons)
        return;
      const newAddress = await wallet.generateNewAddress();
      setAddress(newAddress);
    } catch(err) {
      handleError(err);
    }
  };

  const onSelectReceivingAddress = e => {
    if(e)
      e.preventDefault();
    if(disableButtons)
      return;
    setShowReceiveAllAddresses(!showReceiveAllAddresses);
  };

  const onCopyAddress = () => {
    const trimmedAddress = address.trim();
    if(!trimmedAddress)
      return;
    setShowAddressCopiedConfirmation(true);
    try {
      api.general_setClipboard(trimmedAddress);
    } catch(err) {
      handleError(err);
    }
  };

  const copyAddressConfirmation = () => {
    if (showAddressCopiedConfirmation) {
      setTimeout(() => setShowAddressCopiedConfirmation(false), 5000);
    }
    return (
      <div className={`lw-modal-field-label right-end notification ${showAddressCopiedConfirmation ? 'show' : ''}`}>
        <Localize context={'receive-modal'}>Address copied to clipboard</Localize>
      </div>
    );
  };

  const onApplySelectedAddress = address => {
    setAddress(address);
    onSelectReceivingAddress();
  };

  if (showReceiveAllAddresses)
    return <ReceiveAllAddresses addresses={addresses} onApply={onApplySelectedAddress} onBack={onSelectReceivingAddress} onClose={hideReceiveModal} />;

  return (
    <Modal onClose={hideReceiveModal} disableCloseOnOutsideClick={true}>
      <ModalHeader><Localize context={'receive-modal'}>Receive</Localize></ModalHeader>
      <ModalBody>
        <div className={'lw-modal-field-label'}><Localize context={'receive-modal'}>Select currency to receive</Localize>:</div>
        <SelectWalletDropdown wallets={availWallets} style={{marginBottom: 30}} selected={selected} onSelect={ticker => setSelected(ticker) || setAddress('')} />
        <div className={'lw-modal-field-label-container'}>
          <div className={'lw-modal-field-label'}><Localize context={'receive-modal'}>Your address</Localize>:</div>
          {copyAddressConfirmation()}
        </div>
        <AddressInput
          value={address}
          readOnly={true}
          showButton={true}
          buttonIcon={<i className={'fas fa-copy'} />}
          onButtonClick={onCopyAddress}
          onChange={setAddress} />
        <div className={'lw-modal-field-label-container'}>
          <a href={'#'} onClick={onGenerateNewAddress} className={`lw-color-secondary-6 ${disableButtons ? 'inactive' : ''}`}><Localize context={'receive-modal'}>Generate new address</Localize></a>
          <a href={'#'} onClick={onSelectReceivingAddress} className={`lw-modal-field-label right-end ${disableButtons ? 'inactive' : ''}`}><Localize context={'receive-modal'}>Select receiving address</Localize></a>
        </div>
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
