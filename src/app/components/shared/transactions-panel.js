// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import { Card, CardBody, CardFooter, CardHeader } from './card';
import { Table, TableColumn, TableData, TableRow } from './table';
import Localize from './localize';
import { Column, Row } from './flex';
import moment from 'moment';
import AssetWithImage from './asset-with-image';
import { activeViews, MAX_DECIMAL_PLACE, altCurrencies, altCurrencySymbol } from '../../constants';
import {Map as IMap} from 'immutable';
import {multiplierForCurrency, currencyLinter} from '../../util';
import {publicPath} from '../../util/public-path-r';
import { all, create } from 'mathjs';
import Wallet from '../../types/wallet-r';
import TransactionDetailModal from './modal-transaction-detail';
import TransactionsHeader from './transactions-panel-header';
import TransactionsPanelUnspentTable from './transactions-panel-table';
import { transactionFilters } from '../../constants';
import * as appActions from '../../actions/app-actions';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const TransactionsPanel = ({ selectable = false, coinSpecificTransactions = false, brief = false, activeWallet, altCurrency, currencyMultipliers, transactions, wallets, style = {}, showAllButton = false, windowWidth, setActiveView, balances }) => {

  const [ selectedTx, setSelectedTx ] = useState(null);
  const [ transactionFilter, setTransactionFilter ] = useState(transactionFilters.all);

  if (transactionFilter === transactionFilters.unspent) {
    return (
      <TransactionsPanelUnspentTable
        style={style}
        transactionFilter={transactionFilter}
        onTransactionFilter={setTransactionFilter}
        wallets={wallets}
        balances={balances}
        activeWallet={activeWallet}
      />
    );
  } else {
    const walletLookup = new Map(wallets.map(t => [t.ticker, t]));
    const filteredTxs = [...transactions.entries()]
      .filter(([ ticker ]) => {
        if (!walletLookup.has(ticker))
          return false;
        if (!coinSpecificTransactions)
          return true;
        else
          return ticker === activeWallet;
      })
      .reduce((arr, [ ticker, txs]) => {
        return arr.concat(txs.map(tx => [ticker, tx]));
      }, [])
      .filter(([ticker, t]) => {
        if (transactionFilter !== transactionFilters.all) {
          if (
            transactionFilter === transactionFilters.sent &&
            !t.isSend()
          )
            return false;
          else if (
            transactionFilter === transactionFilters.received &&
            !t.isReceive()
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => { // descending
        const dateA = a[1].time;
        const dateB = b[1].time;
        return dateB - dateA;
      });

    const hideAddress = windowWidth < 1070;

    return (
      <Card style={style}>
        <CardHeader>
          {brief
            ? <h1>Latest Transactions</h1>
            : <TransactionsHeader selectedFilter={transactionFilter} onTransactionFilter={setTransactionFilter} />
          }
        </CardHeader>
        <CardBody>
          <Table small={brief}>
            <TableColumn size={hideAddress ? 2 : 3}><Localize context={'transactions'}>Transaction</Localize></TableColumn>
            <TableColumn size={2}><Localize context={'transactions'}>Asset</Localize></TableColumn>
            {!brief && !hideAddress ? <TableColumn size={7}><Localize context={'transactions'}>To address</Localize></TableColumn> : null}
            {!brief ? <TableColumn size={2}><Localize context={'transactions'}>Amount</Localize></TableColumn> : null}
            {!brief ? <TableColumn size={2}>{Localize.text('Value ({{value}})', 'transactions', {value: altCurrencies.BTC})}</TableColumn>
              : <TableColumn size={2}><Localize context={'transactions'}>Amount</Localize></TableColumn>}
            {filteredTxs.map(([ticker, t]) => {
              const wallet = walletLookup.get(ticker);
              const sent = t.isSend();

              const onRowClick = () => {
                setSelectedTx({tx: t, wallet});
              };

              const currencyMultiplier = multiplierForCurrency(ticker, altCurrency, currencyMultipliers);
              const btcMultiplier = multiplierForCurrency(ticker, altCurrencies.BTC, currencyMultipliers);

              return (
                <TableRow key={t.key()} clickable={selectable} onClick={onRowClick}>
                  <TableData className={'dual-line'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                    <Row>
                      <Column justify={'center'}>
                        <img alt={Localize.text('Received icon', 'transactions')}
                             style={{marginRight: 10, height: 24, width: 'auto'}}
                             srcSet={(t.type === 'send' ?
                                 [
                                   `${publicPath}/images/icons/icon-sent.png`,
                                   `${publicPath}/images/icons/icon-sent@2x.png 2x`,
                                   `${publicPath}/images/icons/icon-sent@3x.png 3x`,
                                 ]
                                 :
                                 [
                                   `${publicPath}/images/icons/icon-received.png`,
                                   `${publicPath}/images/icons/icon-received@2x.png 2x`,
                                   `${publicPath}/images/icons/icon-received@3x.png 3x`,
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
                  <TableData className={'lw-transactions-asset-image'}>
                    <AssetWithImage wallet={wallet} />
                  </TableData>
                  {!brief && !hideAddress ? <TableData className={'text-monospace'}>{t.address}</TableData> : null}
                  {!brief ? <TableData className={'text-monospace'}>{t.amountWithFees()}</TableData> : null}
                  {!brief ?
                    <TableData className={'text-monospace dual-line'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                      <div className={'lw-table-top-label'}>
                        {sent ? '-' : '+'}{math.multiply(bignumber(t.amountWithFees()), btcMultiplier).toFixed(MAX_DECIMAL_PLACE)}
                      </div>
                      <div className={'lw-table-bottom-label'}>
                        {sent ? '-' : '+'}{altCurrencySymbol(altCurrency)}{currencyLinter(math.multiply(bignumber(t.amountWithFees()), currencyMultiplier))}
                      </div>
                    </TableData>
                    :  // Brief requires displaying the actual amount and currency equivalent
                    <TableData className={'text-monospace dual-line'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right'}}>
                      <div className={'lw-table-top-label'}>
                        {sent ? '-' : '+'}{bignumber(t.amountWithFees()).toFixed(4)}
                      </div>
                      <div className={'lw-table-bottom-label'}>
                        {sent ? '-' : '+'}{altCurrencySymbol(altCurrency)}{currencyLinter(math.multiply(bignumber(t.amountWithFees()), currencyMultiplier))}
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
            null
            // <a href={'#'}><Localize context={'universal'}>Load more</Localize> <i className={'fas fa-chevron-down'} /></a>
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
  }
};
TransactionsPanel.propTypes = {
  selectable: PropTypes.bool,
  coinSpecificTransactions: PropTypes.bool,
  brief: PropTypes.bool,
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  transactions: PropTypes.instanceOf(IMap),
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  style: PropTypes.object,
  showAllButton: PropTypes.bool,
  windowWidth: PropTypes.number,
  setActiveView: PropTypes.func,
  balances: PropTypes.instanceOf(IMap)
};

export default connect(
  ({ appState }) => ({
    activeWallet: appState.activeWallet,
    transactions: appState.transactions,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
    wallets: appState.wallets,
    windowWidth: appState.windowWidth,
    balances: appState.balances
  }),
  dispatch => ({
    setActiveView: activeView => dispatch(appActions.setActiveView(activeView))
  })
)(TransactionsPanel);
