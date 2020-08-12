import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Card, CardBody, CardFooter, CardHeader } from './card';
import { Table, TableColumn, TableData, TableRow } from './table';
import Localize from './localize';
import { Column, Row } from './flex';
import path from 'path';
import moment from 'moment';
import AssetWithImage from './asset-with-image';
import { MAX_DECIMAL_PLACE } from '../../constants';
import { Map } from 'immutable';
import { all, create } from 'mathjs';
import Wallet from '../../types/wallet';
import TransactionDetailModal from './modal-transaction-detail';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const TransactionsPanel = ({ selectable = false, activeWallet, altCurrency, coinSpecificTransactions = false, hideAddress = false, hideAmount = false, currencyMultipliers, transactions, wallets, style = {} }) => {

  const [ selectedTx, setSelectedTx ] = useState(null);

  const altMultiplier = bignumber(currencyMultipliers[activeWallet] && currencyMultipliers[activeWallet][altCurrency] ? currencyMultipliers[activeWallet][altCurrency] : 0);
  const btcMultiplier = bignumber(currencyMultipliers[activeWallet] && currencyMultipliers[activeWallet]['BTC'] ? currencyMultipliers[activeWallet]['BTC'] : 0);

  return (
    <Card style={style}>
      <CardHeader>
        <h1>Latest Transactions</h1>
      </CardHeader>
      <CardBody>
        <Table>
          <TableColumn size={3}><Localize context={'transactions'}>Transaction Type</Localize></TableColumn>
          <TableColumn size={2}><Localize context={'transactions'}>Asset</Localize></TableColumn>
          {!hideAddress ? <TableColumn size={7}><Localize context={'transactions'}>To address</Localize></TableColumn> : null}
          {!hideAmount ? <TableColumn size={2}><Localize context={'transactions'}>Amount</Localize></TableColumn> : null}
          <TableColumn size={2}><Localize context={'transactions'}>Value</Localize> (BTC)</TableColumn>
          {[...transactions.entries()]
            .filter(([ ticker ]) => !coinSpecificTransactions ? true : ticker === activeWallet)
            .reduce((arr, [ ticker, txs]) => {
              return arr.concat(txs.map(tx => [ticker, tx]));
            }, [])
            .sort((a, b) => {
              const dateA = a[1].time;
              const dateB = b[1].time;
              return dateA === dateB ? 0 : dateA > dateB ? -1 : 1;
            })
            .map(([ticker, t]) => {

              const wallet = wallets.find(w => w.ticker === ticker) || new Wallet();

              const sent = t.type === 'send';

              const onRowClick = () => {
                setSelectedTx({...t, wallet});
              };

              return (
                <TableRow key={t.txId} clickable={selectable} onClick={onRowClick}>
                  <TableData style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <Row>
                      <Column justify={'center'}>
                        <img alt={Localize.text('Received icon', 'transactions')}
                             style={{marginRight: 10, height: 24, width: 'auto'}}
                             srcSet={(t.type === 'send' ?
                                 [
                                   path.resolve(__dirname, '../../../images/icons/icon-sent.png'),
                                   path.resolve(__dirname, '../../../images/icons/icon-sent@2x.png') + ' 2x',
                                   path.resolve(__dirname, '../../../images/icons/icon-sent@3x.png') + ' 3x'
                                 ]
                                 :
                                 [
                                   path.resolve(__dirname, '../../../images/icons/icon-received.png'),
                                   path.resolve(__dirname, '../../../images/icons/icon-received@2x.png') + ' 2x',
                                   path.resolve(__dirname, '../../../images/icons/icon-received@3x.png') + ' 3x'
                                 ]
                             ).join(', ')} />
                      </Column>
                      <div style={{flexGrow: 1}}>
                        <div>{moment(new Date(t.time * 1000)).format('MMM D YYYY')}</div>
                        <div>{sent ? Localize.text('Sent', 'transactions') : Localize.text('Received', 'transactions')}</div>
                      </div>
                    </Row>
                  </TableData>
                  <TableData>
                    <AssetWithImage wallet={wallet} />
                  </TableData>
                  {!hideAddress ? <TableData className={'text-monospace'}>{t.address}</TableData> : null}
                  {!hideAmount ? <TableData className={'text-monospace'}>{t.amount}</TableData> : null}
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <div>
                      {sent ? '-' : '+'}{Number(math.multiply(bignumber(t.amount), btcMultiplier).toFixed(MAX_DECIMAL_PLACE))}
                    </div>
                    <div>
                      {sent ? '-' : '+'}${math.multiply(bignumber(t.amount), altMultiplier).toFixed(2)}
                    </div>
                  </TableData>
                </TableRow>
              );
            })
          }
        </Table>
      </CardBody>
      <CardFooter>
        <a href={'#'}><Localize context={'universal'}>Load more</Localize> <i className={'fas fa-chevron-down'} /></a>
      </CardFooter>

      {selectedTx ?
        <TransactionDetailModal
          altCurrency={altCurrency}
          currencyMultipliers={currencyMultipliers}
          selectedTx={selectedTx}
          onClose={() => setSelectedTx(null)} />
        :
        null
      }

    </Card>
  );
};
TransactionsPanel.propTypes = {
  selectable: PropTypes.bool,
  coinSpecificTransactions: PropTypes.bool,
  hideAddress: PropTypes.bool,
  hideAmount: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  transactions: PropTypes.instanceOf(Map),
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  style: PropTypes.object,
  onSelect: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    transactions: appState.transactions,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
    wallets: appState.wallets
  })
)(TransactionsPanel);
