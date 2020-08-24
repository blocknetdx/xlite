import _ from 'lodash';
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
import { activeViews, MAX_DECIMAL_PLACE } from '../../constants';
import { Map } from 'immutable';
import { all, create } from 'mathjs';
import Wallet from '../../types/wallet';
import TransactionDetailModal from './modal-transaction-detail';
import * as appActions from '../../actions/app-actions';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const TransactionsPanel = ({ selectable = false, coinSpecificTransactions = false, brief = false, activeWallet, altCurrency, currencyMultipliers, transactions, wallets, style = {}, showAllButton = false, setActiveView }) => {

  const [ selectedTx, setSelectedTx ] = useState(null);

  const filteredTxs = [...transactions.entries()]
    .filter(([ ticker ]) => !coinSpecificTransactions ? true : ticker === activeWallet)
    .reduce((arr, [ ticker, txs]) => {
      return arr.concat(txs.map(tx => [ticker, tx]));
    }, [])
    .sort((a, b) => {
      const dateA = a[1].time;
      const dateB = b[1].time;
      return dateA === dateB ? 0 : dateA > dateB ? -1 : 1;
    });

  return (
    <Card style={style}>
      <CardHeader>
        <h1>Latest Transactions</h1>
      </CardHeader>
      <CardBody>
        <Table>
          <TableColumn size={3}><Localize context={'transactions'}>Transaction Type</Localize></TableColumn>
          <TableColumn size={2}><Localize context={'transactions'}>Asset</Localize></TableColumn>
          {!brief ? <TableColumn size={7}><Localize context={'transactions'}>To address</Localize></TableColumn> : null}
          {!brief ? <TableColumn size={2}><Localize context={'transactions'}>Amount</Localize></TableColumn> : null}
          {!brief ? <TableColumn size={2}><Localize context={'transactions'}>Value (BTC)</Localize></TableColumn>
                  : <TableColumn size={2}><Localize context={'transactions'}>Amount</Localize></TableColumn>}
          {filteredTxs.map(([ticker, t]) => {

              const wallet = wallets.find(w => w.ticker === ticker) || new Wallet();

              const sent = t.type === 'send';

              const onRowClick = () => {
                setSelectedTx({...t, wallet});
              };

              let currencyMultiplier = 0;
              let btcMultiplier = 0;
              if (_.has(currencyMultipliers, ticker)) {
                if (_.has(currencyMultipliers[ticker], altCurrency))
                  currencyMultiplier = currencyMultipliers[ticker][altCurrency];
                if (_.has(currencyMultipliers[ticker], 'BTC'))
                  btcMultiplier = currencyMultipliers[ticker]['BTC'];
              }

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
                      {!brief ?
                      <div style={{flexGrow: 1}}>
                        <div className={'lw-table-top-label'}>{moment(new Date(t.time * 1000)).format('MMM D YYYY')}</div>
                        <div className={'lw-table-bottom-label'}>{sent ? Localize.text('Sent', 'transactions') : Localize.text('Received', 'transactions')}</div>
                      </div>
                              :
                      // Brief requires displaying the sent or received state and the time
                      <div style={{flexGrow: 1}}>
                        <div className={'lw-table-top-label'}>{sent ? Localize.text('Sent', 'transactions') : Localize.text('Received', 'transactions')}</div>
                        <div className={'lw-table-bottom-label'}>{moment(new Date(t.time * 1000)).format('MMM D HH:mm')}</div>
                      </div>
                      }
                    </Row>
                  </TableData>
                  <TableData>
                    <AssetWithImage wallet={wallet} />
                  </TableData>
                  {!brief ? <TableData className={'text-monospace'}>{t.address}</TableData> : null}
                  {!brief ? <TableData className={'text-monospace'}>{t.amount}</TableData> : null}
                  {!brief ?
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <div>
                      {sent ? '-' : '+'}{math.multiply(bignumber(t.amount), btcMultiplier).toFixed(MAX_DECIMAL_PLACE)}
                    </div>
                    <div>
                      {sent ? '-' : '+'}{altCurrency+' '}{math.multiply(bignumber(t.amount), currencyMultiplier).toFixed(2)}
                    </div>
                  </TableData>
                  :  // Brief requires displaying the actual amount and currency equivalent
                  <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right'}}>
                    <div className={'lw-table-top-label'}>
                      {sent ? '-' : '+'}{bignumber(t.amount).toFixed(4)}
                    </div>
                    <div className={'lw-table-bottom-label'}>
                    {sent ? '-' : '+'}{altCurrency+' '}{math.multiply(bignumber(t.amount), currencyMultiplier).toFixed(2)}
                    </div>
                  </TableData>
                  }
                </TableRow>
              );
            })
          }
        </Table>
      </CardBody>
      <CardFooter>
        {showAllButton ?
          <a href={'#'} onClick={e => {
            e.preventDefault();
            setActiveView(activeViews.TRANSACTIONS);
          }}><Localize context={'transactions'}>View all transactions</Localize> <i className={'fas fa-chevron-right'} /></a>
          :
          <a href={'#'}><Localize context={'universal'}>Load more</Localize> <i className={'fas fa-chevron-down'} /></a>
        }
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
  brief: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  transactions: PropTypes.instanceOf(Map),
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  style: PropTypes.object,
  showAllButton: PropTypes.bool,
  setActiveView: PropTypes.func
};

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    transactions: appState.transactions,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
    wallets: appState.wallets
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView))
  })
)(TransactionsPanel);
