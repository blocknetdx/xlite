// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {Modal, ModalBody} from './modal';
import Localize from './localize';
import {Button} from './buttons';
import {publicPath} from '../../util/public-path-r';
import {SelectRadioTable, TableColumn, TableData, TableRow} from './table';
import {RadioInput} from './inputs';

const ReceiveAllAddresses = ({ addresses = [], onBack, onClose, onApply }) => {
  const [selectedAddress, setSelectedAddress] = useState(undefined);
  return (
    <Modal disableCloseOnOutsideClick={true} onClose={onClose}>
      <ModalBody>
        <div className={'lw-modal-addresses-back'} onClick={onBack}>
          <img alt={Localize.text('Dashboard icon', 'all-addresses')} src={`${publicPath}/images/icons/icon-back.png`} srcSet={`${publicPath}/images/icons/icon-back.png, ${publicPath}/images/icons/icon-back@2x.png 2x`} />
          <Localize context={'universal'}>back</Localize>
        </div>
        <div className={'lw-modal-addresses-header'}>Select address to receive funds</div>
        <SelectRadioTable>
          <TableColumn size={1}><Localize context={'portfolio'}>Select</Localize></TableColumn>
          <TableColumn size={3}><Localize context={'portfolio'}>Address</Localize></TableColumn>
          {addresses.map((address, index) => {
            return (
              <TableRow key={index}>
                <TableData><RadioInput onChange={() => setSelectedAddress(address)} /></TableData>
                <TableData>{address}</TableData>
              </TableRow>
            );
          })}
        </SelectRadioTable>
        <div className={'lw-modal-receive-done-btn-container'}>
          <Button onClick={() => onApply(selectedAddress)}><Localize context={'universal'}>Apply</Localize></Button>
        </div>
      </ModalBody>
    </Modal>
  );
};
ReceiveAllAddresses.propTypes = {
  addresses: PropTypes.array,
  onBack: PropTypes.func,
  onClose: PropTypes.func,
  onApply: PropTypes.func
};

export default ReceiveAllAddresses;
