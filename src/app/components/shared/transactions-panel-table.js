// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, CardFooter, CardHeader} from './card';
import TransactionsHeader from './transactions-panel-header';
import {Table, TableColumn, TableData, TableRow} from './table';
import {Checkbox} from './inputs';
import Localize from './localize';
import AssetWithImage from './asset-with-image';
import Wallet from '../../types/wallet-r';
import {walletSorter} from '../../util';
import {Map as IMap} from 'immutable';
import RPCTransaction from '../../types/rpc-transaction';

const TransactionsPanelTable = ({
    style,
    transactionFilter,
    onTransactionFilter,
    wallets,
    balances,
    activeWallet
  }) => {

  const [transactions, setTransactions] = useState([]);
  const walletLookup = new Map(wallets.map(t => [t.ticker, t]));
  const sortedWallets = activeWallet ? [wallets.find(w => w.ticker === activeWallet)] : wallets.sort(walletSorter(balances));

  // ToDo: enable Select, Label, and Date columns when available
  const hiddenFeature = true;

  const getCachedUnspent = async (wallet) => {
    const txs = await wallet.getCachedUnspent(60);
    return [wallet.ticker, txs];
  };

  useEffect(() => {
    // Map to RPCTransaction type
    Promise.all(sortedWallets.map(wallet => getCachedUnspent(wallet)))
      .then(response => setTransactions(response
        .filter(([ticker, txs]) => txs.length > 0)
        .reduce((arr, [ticker, txs]) => arr.concat(txs.map(tx => [ticker, new RPCTransaction(tx, ticker)])), [])
      ));
  }, [activeWallet, sortedWallets]);

  const styles = {
    text: {
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center'
    }
  };
  return (
    <Card style={style}>
      <CardHeader>
        <TransactionsHeader selectedFilter={transactionFilter} onTransactionFilter={onTransactionFilter} />
      </CardHeader>
      <CardBody>
        <Table>
          {hiddenFeature ? null : <TableColumn size={2} style={styles.text}><Localize context={'transactions'}>Select</Localize></TableColumn>}
          <TableColumn size={2} style={styles.text}><Localize context={'transactions'}>Asset</Localize></TableColumn>
          <TableColumn size={2} style={styles.text}><Localize context={'transactions'}>Amount</Localize></TableColumn>
          {hiddenFeature ? null : <TableColumn size={2} style={styles.text}><Localize context={'transactions'}>Label</Localize></TableColumn>}
          <TableColumn size={7} style={styles.text}><Localize context={'transactions'}>Address</Localize></TableColumn>
          {hiddenFeature ? null : <TableColumn size={3} style={styles.text}><Localize context={'transactions'}>Date</Localize></TableColumn>}
          <TableColumn size={2} style={styles.text}><Localize context={'transactions'}>Confirmations</Localize></TableColumn>
          {transactions.map(([ticker, t], index) => {
            const wallet = walletLookup.get(ticker);
            return (
              <TableRow key={index}>
                {hiddenFeature ? null : <TableData style={styles.text}><Checkbox/></TableData>}
                <TableData className={'lw-transactions-asset-image'} style={styles.text}>
                  <AssetWithImage wallet={wallet} />
                </TableData>
                <TableData className={'text-monospace'} style={styles.text}>{t.amountWithFees()}</TableData>
                {hiddenFeature ? null : <TableData className={'text-monospace'} style={styles.text}>No. Label</TableData>}
                <TableData className={'text-monospace'} style={styles.text}>{t.address}</TableData>
                {hiddenFeature ? null : <TableData className={'text-monospace'} style={styles.text}>June 30 2020</TableData>}
                <TableData className={'text-monospace'} style={styles.text}>{t.confirmations}</TableData>
              </TableRow>
            );
          })}
        </Table>
      </CardBody>
      <CardFooter>
      </CardFooter>
    </Card>
  );
};

TransactionsPanelTable.propTypes = {
  style: PropTypes.object,
  transactionFilter: PropTypes.string.isRequired,
  onTransactionFilter: PropTypes.func.isRequired,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet)),
  balances: PropTypes.instanceOf(IMap),
  activeWallet: PropTypes.string
};

export default TransactionsPanelTable;
