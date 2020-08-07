import { Map } from 'immutable';
import moment from 'moment';
import path from 'path';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Balance from '../shared/balance';
import Localize from '../shared/localize';
import { Card, CardBody, CardFooter, CardHeader } from '../shared/card';
import { Table, TableColumn, TableData, TableRow } from '../shared/table';
import { all, create } from 'mathjs';
import Wallet from '../../types/wallet';
import { Column, Row } from '../shared/flex';
import AssetWithImage from '../shared/asset-with-image';
import { activeViews, MAX_DECIMAL_PLACE } from '../../constants';
import TransactionDetailModal from '../shared/modal-transaction-detail';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;


const Transactions = ({ activeView, transactions, activeWallet, altCurrency, currencyMultipliers, wallets }) => {

  const altMultiplier = bignumber(currencyMultipliers[activeWallet] && currencyMultipliers[activeWallet][altCurrency] ? currencyMultipliers[activeWallet][altCurrency] : 0);
  const btcMultiplier = bignumber(currencyMultipliers[activeWallet] && currencyMultipliers[activeWallet]['BTC'] ? currencyMultipliers[activeWallet]['BTC'] : 0);

  const coinSpecificTransactions = activeView === activeViews.COIN_TRANSACTIONS;

  const [ selectedTx, setSelectedTx ] = useState(null);

  return (
    <div className={'lw-transactions-container'}>
      <Balance showCoinDetails={coinSpecificTransactions} />
      <Card>
        <CardHeader>
          <h1>Latest Transactions</h1>
        </CardHeader>
        <CardBody>
          <Table>
            <TableColumn size={3}><Localize context={'transactions'}>Transaction Type</Localize></TableColumn>
            <TableColumn size={2}><Localize context={'transactions'}>Asset</Localize></TableColumn>
            <TableColumn size={7}><Localize context={'transactions'}>To address</Localize></TableColumn>
            <TableColumn size={2}><Localize context={'transactions'}>Amount</Localize></TableColumn>
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

                const wallet = wallets.find(w => w.ticker === ticker) || {};

                const sent = t.type === 'send';

                const onRowClick = () => {
                  if(!coinSpecificTransactions) return;
                  setSelectedTx({...t, wallet, type: 'send'});
                };

                return (
                  <TableRow key={t.txId} clickable={coinSpecificTransactions ? true : false} onClick={onRowClick}>
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
                    <TableData className={'text-monospace'}>{t.address}</TableData>
                    <TableData className={'text-monospace'}>{t.amount}</TableData>
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
      </Card>

      {selectedTx ?
        <TransactionDetailModal
          altCurrency={altCurrency}
          altMultiplier={altMultiplier}
          currencyMultipliers={currencyMultipliers}
          selectedTx={selectedTx}
          onClose={() => setSelectedTx(null)} />
        :
        null
      }
    </div>
  );
};
Transactions.propTypes = {
  activeView: PropTypes.string,
  activeWallet: PropTypes.string,
  transactions: PropTypes.instanceOf(Map),
  altCurrency: PropTypes.string,
  currencyMultipliers: PropTypes.object,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet))
};

export default Transactions;
