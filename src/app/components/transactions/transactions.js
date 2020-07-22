import { Map } from 'immutable';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import Balance from '../shared/balance';
import Localize from '../shared/localize';
import { Card, CardBody, CardFooter, CardHeader } from '../shared/card';
import { Table, TableRow } from '../shared/table';

const Transactions = ({ activeWallet, transactions: transactionsMap }) => {

  const transactions = transactionsMap.get(activeWallet) || [];

  return (
    <div className={'lw-transactions-container'}>
      <Balance />
      <Card>
        <CardHeader>
          <h1>Latest Transactions</h1>
        </CardHeader>
        <CardBody>
          <Table
            columns={[
              [Localize.text('Transaction type', 'transactions'), 3],
              [Localize.text('Asset', 'transactions'), 2],
              [Localize.text('To address', 'transactions'), 5],
              [Localize.text('Amount', 'transactions'), 2],
              [Localize.text('Value', 'transactions'), 3]
            ]}
            rows={
              transactions.map((t, i) => {
                return [
                  <div key={t.txId}>{moment(new Date(t.time * 1000)).format('MMM D YYYY')}</div>,
                  <div key={`${t.txId}-${i}`} />,
                  <div key={`${t.txId}-${i}`} />,
                  <div key={`${t.txId}-${i}`} />,
                  <div key={`${t.txId}-${i}`} />
                ];
              })
            }
          >
          </Table>
        </CardBody>
        <CardFooter>
          <a href={'#'}><Localize context={'transactions'}>Load more</Localize> <i className={'fas fa-chevron-down'} /></a>
        </CardFooter>
      </Card>
    </div>
  );
};
Transactions.propTypes = {
  activeWallet: PropTypes.string,
  transactions: PropTypes.instanceOf(Map)
};

export default Transactions;
