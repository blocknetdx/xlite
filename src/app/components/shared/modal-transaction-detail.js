// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';
import { Modal, ModalBody, ModalHeader } from './modal';
import Localize from './localize';
import {publicPath} from '../../util/public-path-r';
import { Column, Row } from './flex';
import { currencyLinter, multiplierForCurrency, truncate } from '../../util';
import { all, create } from 'mathjs';
import { connect } from 'react-redux';
import { MAX_DECIMAL_PLACE } from '../../constants';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const {api} = window;

const Divider = () => <div style={{flexGrow: 1, height: 1, backgroundColor: 'rgba(0, 0, 0, 0.2)'}} />;

const TransactionDetailModal = ({ altCurrency, currencyMultipliers, openExternalLinks, selectedTx, onClose }) => {
  const { ticker } = selectedTx.wallet;
  const selectedAltMultiplier = multiplierForCurrency(ticker, altCurrency, currencyMultipliers);
  const selectedBTCMultiplier = multiplierForCurrency(ticker, 'BTC', currencyMultipliers);

  const onViewOnExplorer = e => {
    e.preventDefault();
    const explorerLink = selectedTx.wallet.getExplorerLinkForTx(selectedTx.tx.txId);
    if(openExternalLinks) {
      api.general_openUrl(explorerLink);
    } else {
      api.general_setClipboard(explorerLink);
    }
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader>{selectedTx.tx.isSend() ?
        Localize.text('Sent {{coin}}', 'transactions', {coin: selectedTx.wallet.ticker})
        :
        Localize.text('Received {{coin}}', 'transactions', {coin: selectedTx.wallet.ticker})
      }</ModalHeader>
      <ModalBody className={'lw-modal-transaction-body'}>
        <Row justify={'center'}>
          <img alt={Localize.text('Transaction icon', 'transactions')}
               srcSet={(selectedTx.tx.isSend() ?
                 `${publicPath}/images/icons/icon-sent-large.png, ${publicPath}/images/icons/icon-sent-large@2x.png 2x, ${publicPath}/images/icons/icon-sent-large@3x.png 3x`
                 :
                 `${publicPath}/images/icons/icon-received-large.png, ${publicPath}/images/icons/icon-received-large@2x.png 2x, ${publicPath}/images/icons/icon-received-large@3x.png 3x`
               )}
               className={'lw-modal-transaction-image'} />
        </Row>
        <Row justify={'center'}>
          <div className={'lw-modal-transaction-total-container'}>
                <span className={'lw-color-secondary-6'}>{selectedTx.tx.isSend() ?
                  Localize.text('Total sent', 'transactions')
                  :
                  Localize.text('Total Received', 'transactions')
                }</span>: <span className={'lw-color-secondary-10'}><span className={'text-monospace'}>{truncate(selectedTx.tx.amountWithFees(), MAX_DECIMAL_PLACE, true)}</span> {selectedTx.wallet.ticker}</span>
          </div>
        </Row>
        <Row justify={'center'}>
          <div style={{color: '#777', marginBottom: 36}}>{altCurrency} <span className={'text-monospace'}>{currencyLinter(math.multiply(bignumber(selectedTx.tx.amountWithFees()), bignumber(selectedAltMultiplier)))}</span></div>
        </Row>
        <Row>
          <Divider />
        </Row>
        <Row justify={'space-between'} style={{paddingTop: 5, paddingBottom: 5}}>
          <Column justify={'center'}>
            <div className={'lw-color-secondary-6'}><Localize context={'transactions'}>Price per coin/token</Localize>:</div>
          </Column>
          <Column justify={'center'}>
            <div>
              <div className={'lw-color-secondary-10'}>BTC <span className={'text-monospace'}>{truncate(selectedBTCMultiplier, MAX_DECIMAL_PLACE, true)}</span></div>
              <div className={'lw-color-secondary-6'}>{altCurrency} <span className={'text-monospace'}>{truncate(selectedAltMultiplier, MAX_DECIMAL_PLACE, true)}</span></div>
            </div>
          </Column>
        </Row>
        <Row>
          <Divider />
        </Row>
        <Row justify={'space-between'} style={{fontSize: 14, paddingTop: 16, paddingBottom: 16}}>
          <div className={'lw-color-secondary-6'}>{selectedTx.tx.isSend() ? Localize.text('To address', 'transactions') : Localize.text('From address', 'transactions')}:</div>
          <div className={'lw-color-secondary-10 text-monospace'}>{selectedTx.tx.address}</div>
        </Row>
        <Row>
          <Divider />
        </Row>
        <Row justify={'space-between'} style={{fontSize: 14, paddingTop: 16, paddingBottom: 48}}>
          <div className={'lw-color-secondary-6'}><Localize context={'transactions'}>Transaction details</Localize></div>
          <div className={'lw-color-secondary-10'} style={{fontSize: 15, fontWeight: 'bold'}}>
            {openExternalLinks ?
              <a className={'lw-color-secondary-10'} href={'#'} onClick={onViewOnExplorer}><span style={{marginRight: 8}}><Localize context={'transactions'}>View on explorer</Localize></span><i className={'fas fa-long-arrow-alt-right'} /></a>
              :
              <a className={'lw-color-secondary-10'} href={'#'} onClick={onViewOnExplorer}><span style={{marginRight: 8}}><Localize context={'transactions'}>Copy explorer link</Localize></span><i className={'fas fa-copy'} /></a>
            }
          </div>
        </Row>
      </ModalBody>
    </Modal>
  );
};
TransactionDetailModal.propTypes = {
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  openExternalLinks: PropTypes.bool,
  selectedTx: PropTypes.object, // { tx: RPCTransaction, wallet: Wallet }
  onClose: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    openExternalLinks: appState.openExternalLinks
  })
)(TransactionDetailModal);
