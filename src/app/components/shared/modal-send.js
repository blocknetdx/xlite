import * as appActions from '../../actions/app-actions';
import { AddressInput, CurrencyInput, Textarea } from './inputs';
import Alert from '../../modules/alert';
import { Button } from './buttons';
import { Column, Row } from './flex';
import {handleError, multiplierForCurrency, currencyLinter} from '../../util';
import Localize from './localize';
import {MAX_DECIMAL_CURRENCY, MAX_DECIMAL_PLACE} from '../../constants';
import {Modal, ModalBody, ModalHeader} from './modal';
import Recipient from '../../types/recipient';
import SelectWalletDropdown from './select-wallet-dropdown';
import TransactionBuilder from '../../modules/transactionbuilder';
import Wallet from '../../types/wallet';

import _ from 'lodash';
import { all, create } from 'mathjs';
import { clipboard, shell } from 'electron';
import { connect } from 'react-redux';
import {Map as IMap} from 'immutable';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const ProgressMarker = ({ progress, total }) => {

  const items = [];
  for(let i = 0; i < total; i++) {
    items.push(<div key={`progress-item=${i}`} className={progress === i ? 'lw-bg-secondary-6' : 'lw-bg-secondary-2'} style={styles.progressMarker} />);
  }

  return (
    <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center'}}>
      {items}
    </div>
  );
};
ProgressMarker.propTypes = {
  progress: PropTypes.number,
  total: PropTypes.number
};

const SendModal = ({ activeWallet, wallets, altCurrency, currencyMultipliers, balances, hideSendModal }) => {

  const [ progress, setProgress ] = useState(0);
  const [ selected, setSelected ] = useState('');
  const [ address, setAddress ] = useState('');
  const [ description, setDescription ] = useState('');
  const [ maxSelected, setMaxSelected ] = useState(false);
  const [ inputAmount, setInputAmount ] = useState('');
  const [ altInputAmount, setAltInputAmount ] = useState('');
  const [ confirmTimer, setConfirmTimer ] = useState(0);
  const [ txid, setTXID ] = useState('');
  const [ fees, setFees ] = useState(0);
  const [ total, setTotal ] = useState(0);

  const availableBalance = selected && balances.has(selected) ? balances.get(selected)[1] : 0;
  const noWallets = !wallets || wallets.length === 0 || !balances || balances.size === 0;

  // Wallets with valid coin
  const availableWallets = [];
  if (!noWallets) {
    for (const w of wallets) {
      if (!w.rpcEnabled())
        continue;
      if (!balances.has(w.ticker))
        continue;
      const tb = new TransactionBuilder(w.token().xbinfo);
      const balance = balances.get(w.ticker);
      // balance[1] is spendable coin
      const spendable = bignumber(balance[1]).toNumber();
      if (isNaN(spendable))
        continue;
      const dust = tb.isDust(spendable);
      if (!dust)
        availableWallets.push(w);
    }
  }

  useEffect(() => {
    let sel = '';
    // If no wallet is selected and there's only one wallet available then
    // automatically select that wallet.
    if ((activeWallet === '') && availableWallets.length === 1) {
      sel = availableWallets[0].ticker;
      setSelected(sel);
    }
    else { // select the active wallet
      sel = activeWallet;
      setSelected(sel);
    }
    // Display an alert if the user is attempting to select a wallet
    // that's not available (i.e. has no coin).
    const wallet = availableWallets.find(w => w.ticker === sel);
    if (!wallet && sel !== '')
      Alert.alert(Localize.text('Issue'), Localize.text('No {{coin}} is available.', 'sendModal', {coin: sel}));
  }, [activeWallet, availableWallets]);

  // Use the blank modal on missing data or other errors
  const blankModal = <div />;

  // No wallets or balance info available don't display anything
  if (noWallets)
    return blankModal;

  // No wallets or balance info available, display alert
  if (noWallets) {
    Alert.alert(Localize.text('Issue'), Localize.text('No coin available.'));
    return blankModal;
  }

  const wallet = availableWallets.find(w => w.ticker === selected);
  const { ticker = '' } = wallet || {};
  const defaultMarginBottom = 20;

  // Fetch coins for this session
  let coins = [];
  if (wallet) {
    (async () => {
      coins = await wallet.getCachedUnspent(60);
    })();
  }

  // Updates the total amounts at the bottom of the form (sent total and fees)
  const updateTotals = (amount) => {
    if (!wallet) { // if wallet is invalid
      setFees(0);
      setTotal(0);
      setMaxSelected(false);
      return;
    }
    if (_.isNull(amount) || _.isUndefined(amount))
      amount = 0;
    if (_.isString(amount) && !/^[\d\\.]+$/.test(amount)) // if not a string number
      amount = 0;
    let bn = bignumber(amount);
    if (isNaN(bn.toNumber()) || bn.toNumber() < 0)
      bn = bignumber(0);

    // Use transaction builder to determine fees
    const tb = new TransactionBuilder(wallet.token().xbinfo);
    tb.addRecipient(new Recipient({address, amount: bn.toNumber(), description }));
    try {
      tb.fundTransaction(coins);
    } catch (e) {
      setFees(0);
      setTotal(bn.toNumber());
      setMaxSelected(false);
      return;
    }

    const nfees = tb.getFees();
    const ntotal = math.add(bn, bignumber(tb.getFees())).toNumber();
    setFees(nfees);
    setTotal(ntotal);
    setMaxSelected(availableBalance <= ntotal);
  };

  const onInputAmountChange = val => {
    try {
      const multiplier = multiplierForCurrency(ticker, altCurrency, currencyMultipliers);
      if (multiplier > 0) {
        const alt = math.multiply(bignumber(multiplier), bignumber(Number(val)));
        if (!isNaN(alt.toNumber()))
          setAltInputAmount(currencyLinter(alt.toNumber()));
      }
      setInputAmount(val);
      updateTotals(val);
    } catch(err) {
      handleError(err);
    }
  };

  const onAltInputAmountChange = val => {
    try {
      const multiplier = multiplierForCurrency(ticker, altCurrency, currencyMultipliers);
      if (multiplier > 0) {
        const amount = math.divide(bignumber(Number(val)), bignumber(multiplier));
        if (!isNaN(amount.toNumber()))
          setInputAmount(amount.toFixed(MAX_DECIMAL_PLACE));
        updateTotals(amount.toNumber());
      }
      setAltInputAmount(currencyLinter(val));
    } catch(err) {
      handleError(err);
    }
  };

  const onInputAmountBlur = e => {
    try {
      e.preventDefault();
      const inputAmountNum = Number(inputAmount);
      const inputAmountStr = inputAmountNum.toFixed(MAX_DECIMAL_PLACE);
      if(inputAmountStr !== inputAmount) setInputAmount(inputAmountStr);
      if(maxSelected) setMaxSelected(false);
      updateTotals(inputAmountStr);
    } catch(err) {
      handleError(err);
    }
  };

  const onAltInputAmountBlur = e => {
    try {
      e.preventDefault();
      const altInputAmountNum = Number(altInputAmount);
      const altInputAmountStr = altInputAmountNum.toFixed(MAX_DECIMAL_CURRENCY);
      if(altInputAmountStr !== altInputAmount)
        setAltInputAmount(currencyLinter(altInputAmountNum));
      if(maxSelected) setMaxSelected(false);
      updateTotals();
    } catch(err) {
      handleError(err);
    }
  };

  const onMaxClick = e => {
    try {
      e.preventDefault();
      if(!maxSelected) { // maximum was previously not selected
        try {
          let fe = 0;
          let avail = _.isNumber(Number(availableBalance)) ? bignumber(availableBalance).toNumber() : 0;
          if (avail === 0)
            throw new Error('No coin');
          const tb = new TransactionBuilder(wallet.token().xbinfo);
          tb.addRecipient(new Recipient({address, amount: avail, description }));
          tb.fundTransaction(coins);
          fe = tb.getFees();
          avail -= fe;
          const multiplier = multiplierForCurrency(ticker, altCurrency, currencyMultipliers);
          const alt = math.multiply(bignumber(avail), bignumber(multiplier));
          setInputAmount(avail.toFixed(MAX_DECIMAL_PLACE));
          setAltInputAmount(currencyLinter(alt));
          updateTotals(avail);
        } catch {
          setInputAmount('0');
          setAltInputAmount(currencyLinter('0'));
          updateTotals(0);
        }
      }
      setMaxSelected(!maxSelected);
    } catch(err) {
      handleError(err);
    }
  };

  const insufficient = math.compare(bignumber(total), bignumber(availableBalance)) > 0;

  const onContinue = e => {
    e.preventDefault();
    setProgress(1);
  };

  let title;
  switch(progress) {
    case 0:
      title = Localize.text('Send', 'sendModal');
      break;
    case 1:
      title = `${Localize.text('Send', 'sendModal')} ${ticker}`;
      break;
    case 2:
      title = `${Localize.text('Send', 'sendModal')} ${ticker}`;
      break;
    case 3:
      title = `${Localize.text('Sent', 'sendModal')} ${ticker}`;
      break;
    default:
      title = '';
  }

  const onBack = () => {
    setProgress(progress === 1 ? progress - 1 : progress - 2);
  };

  const onConfirm = async function(e) {
    e.preventDefault();
    for(let i = 3; i > 0; i--) {
      setConfirmTimer(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setProgress(2);
    setConfirmTimer(0);
  };

  const onSend = async function(e) {
    e.preventDefault();
    const bn = bignumber(inputAmount);
    if (bn.toNumber() <= 0 || isNaN(bn.toNumber()))
      return; // TODO Warn user about problem with input amount

    try {
      const recipient = new Recipient({ address, amount: bn.toNumber(), description });
      const res = await wallet.send([recipient]);
      if (!res)
        throw new Error('Failed to send wallet transaction');

      setTXID(res);
      setProgress(3);

    } catch(err) {
      handleError(err);
    }
  };

  const onViewOnExplorer = e => {
    e.preventDefault();
    shell.openExternal(wallet.getExplorerLinkForTx(txid));
  };

  const minHeight = 538;
  const fontSize = 14;

  return (
    <Modal disableCloseOnOutsideClick={true} onClose={hideSendModal} showBackButton={progress > 0 && progress < 3} onBack={onBack}>
      <ModalHeader>{title}</ModalHeader>
      {progress === 0 ?
        <ModalBody>

          <div className={'lw-modal-field-label'}><Localize context={'sendModal'}>Select currency to send</Localize>:</div>
          <SelectWalletDropdown wallets={availableWallets} style={{marginBottom: defaultMarginBottom}} selected={selected} onSelect={t => setSelected(t)} />

          <Row justify={'space-between'}>
            <span className={'lw-modal-field-label'}><Localize context={'sendModal'}>Send to address</Localize>:</span>
            <span className={'color-negative'}><Localize context={'sendModal'}>Required field</Localize></span>
          </Row>
          <AddressInput
            placeholder={wallet ? Localize.text('Enter {{name}} receiving address', 'sendModal', {name: wallet.name}) : ''}
            style={{marginBottom: defaultMarginBottom}}
            value={address}
            showButton={true}
            buttonIcon={<i className={'fas fa-paste'} />}
            onButtonClick={() => setAddress(clipboard.readText('selection'))}
            onChange={setAddress} />

          <div className={'lw-modal-field-label'}><Localize context={'sendModal'}>Description (optional)</Localize>:</div>
          <Textarea style={{marginBottom: defaultMarginBottom}} value={description} onChange={setDescription} />

          <Row>
            <Row style={{flexGrow: 1, flexBasis: 1}} justify={'space-between'}>
              <div className={'lw-modal-field-label'}><Localize context={'sendModal'}>Amount</Localize>:</div>
              <a href={'#'} className={'lw-send-max-toggle'} onClick={onMaxClick}><Localize context={'sendModal'}>Send max</Localize> {maxSelected ? <i className={'fas fa-toggle-on'} /> : <i className={'fas fa-toggle-off'} />}</a>
            </Row>
            <div style={{width: 40, minWidth: 40}} />
            <Row style={{flexGrow: 1, flexBasis: 1}} justify={'flex-end'}>
              {insufficient ? <span className={'color-negative'}><Localize context={'sendModal'}>Insufficient funds</Localize></span> : null}
            </Row>
          </Row>

          <Row style={{marginBottom: 2 * defaultMarginBottom}}>
            <Row style={{minWidth: 50, minHeight: 40, flexGrow: 1, flexBasis: 1}} justify={'space-between'}>
              <CurrencyInput
                inputStyle={{minWidth: 50}}
                value={inputAmount}
                placeholder={'0.00000000'}
                currency={wallet ? wallet.ticker : ''}
                onChange={e => onInputAmountChange(e.target.value)}
                onBlur={onInputAmountBlur}
                required={true} />
            </Row>
            <Column className={'lw-color-secondary-6'} style={{minWidth: 40, width: 40, fontSize: 16, textAlign: 'center'}} justify={'center'}><i className={'fas fa-exchange-alt'} /></Column>
            <Row style={{minWidth: 50, height: 40, flexGrow: 1, flexBasis: 1}} justify={'flex-end'}>
              <CurrencyInput
                inputStyle={{minWidth: 50}}
                value={altInputAmount}
                placeholder={'0.00'}
                currency={altCurrency}
                onChange={e => onAltInputAmountChange(e.target.value)}
                onBlur={onAltInputAmountBlur}
                required={true} />
            </Row>
          </Row>

          <Row style={{fontSize, marginBottom: defaultMarginBottom * 2}}>
            <div style={{flexGrow: 1, minHeight: 10}}>
              <div><span className={'lw-modal-description-label'}><Localize context={'sendModal'}>Network fee</Localize>:</span> <span className={'lw-modal-description-value'}>{fees} {ticker}</span></div>
              <div><span className={'lw-modal-description-label'}><Localize context={'sendModal'}>Total to send</Localize>:</span> <span className={'lw-modal-description-value-bold'}>{total.toFixed(MAX_DECIMAL_PLACE)} {ticker}</span></div>
            </div>
            <Button type={'button'} onClick={onContinue} disabled={!address || insufficient}><Localize context={'sendModal'}>Continue</Localize></Button>
          </Row>

          <ProgressMarker progress={progress} total={4} />

        </ModalBody>
        :
        progress === 1 || progress === 2 ?
          <ModalBody style={{fontSize, minHeight}}>

            <h2 style={{fontSize: 18, fontWeight: 500, marginBottom: defaultMarginBottom}}><Localize context={'sendModal'}>Transaction Summary</Localize>:</h2>

            <div style={{marginBottom: defaultMarginBottom}}><span dangerouslySetInnerHTML={{__html: Localize.text('You are about to send <strong>{{amount}} {{ticker}}</strong> ({{altAmount}}) to', 'sendModal', {amount: Number(inputAmount) || '0', ticker, altAmount: '$' + (altInputAmount || '0')})}} />:</div>

            <div style={{marginBottom: defaultMarginBottom}}><strong>{address}</strong></div>

            <div style={{marginBottom: defaultMarginBottom}}><Localize context={'sendModal'}>with the following description</Localize>:</div>

            <div style={{marginBottom: defaultMarginBottom}}>{description}</div>

            <div style={{marginBottom: defaultMarginBottom * 2, borderBottomStyle: 'solid', borderBottomWidth: 1, opacity: .2}} />

            <Row style={{marginBottom: defaultMarginBottom}}>
              <div style={{flexGrow: 1, flexBasis: 1}}>
                <div><Localize context={'sendModal'}>Recipient receives</Localize>:</div>
                <div style={{marginBottom: defaultMarginBottom}}><Localize context={'sendModal'}>Plus network fee</Localize>:</div>
                <div><Localize context={'sendModal'}>Total sent</Localize>:</div>
              </div>
              <div style={{flexGrow: 1, flexBasis: 1}}>
                <div><strong>{inputAmount} {ticker}</strong></div>
                <div style={{marginBottom: defaultMarginBottom}}><strong>{Number(fees).toFixed(MAX_DECIMAL_PLACE)} {ticker}</strong></div>
                <div><strong>{total.toFixed(MAX_DECIMAL_PLACE)} {ticker}</strong></div>
              </div>
            </Row>

            <div style={{flexGrow: 1}} />

            <Row style={{fontSize, marginBottom: defaultMarginBottom * 2}} justify={'flex-end'}>
              <Button type={'button'} onClick={progress === 1 ? onConfirm : onSend} disabled={!address || insufficient || (progress === 1 && confirmTimer > 0)}>
                {progress === 1 && confirmTimer ?
                  Localize.text('Wait {{time}}', 'sendModal', {time: confirmTimer})
                  :
                  progress === 1 ?
                    <Localize context={'sendModal'}>Confirm</Localize>
                    :
                    <Localize context={'sendModal'}>Send now</Localize>
                }
              </Button>
            </Row>

            <ProgressMarker progress={progress} total={4} />

          </ModalBody>
          :
            progress === 3 ?
              <ModalBody style={{fontSize, minHeight}}>
                <h2 style={{fontSize: 18, fontWeight: 500, marginBottom: 2 * defaultMarginBottom}}><Localize context={'sendModal'}>Transaction Completed.</Localize> <i className={'lw-color-positive-1 fas fa-check'} /></h2>

                <div style={{marginBottom: defaultMarginBottom}}><span dangerouslySetInnerHTML={{__html: Localize.text('You sent <strong>{{amount}} {{ticker}}</strong> to the following address', 'sendModal', {amount: Number(inputAmount) || '0', ticker})}} />:</div>

                <div style={{marginBottom: defaultMarginBottom}}><strong>{address}</strong></div>

                <div style={{flexGrow: 1}} />

                <Row style={{fontSize, marginBottom: defaultMarginBottom * 2}} justify={'flex-end'}>
                  <Button type={'button'} onClick={onViewOnExplorer}><Localize context={'sendModal'}>View on explorer</Localize> <i className={'fas fa-long-arrow-alt-right'} /></Button>
                </Row>

                <ProgressMarker progress={progress} total={4} />

              </ModalBody>
              :
              <ModalBody />
      }
    </Modal>
  );
};
SendModal.propTypes = {
  activeWallet: PropTypes.string,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  balances: PropTypes.instanceOf(IMap),
  hideSendModal: PropTypes.func
};

const styles = {
  progressMarker: {
    marginLeft: 5,
    marginRight: 5,
    width: 40,
    height: 5
  }
};

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    wallets: appState.wallets,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
    balances: appState.balances
  }),
  dispatch => ({
    hideSendModal: () => dispatch(appActions.setShowSendModal(false))
  })
)(SendModal);
