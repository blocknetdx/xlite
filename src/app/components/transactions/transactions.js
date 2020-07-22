import PropTypes from 'prop-types';
import React from 'react';
import Balance from '../shared/balance';
import Localize from '../shared/localize';
import { Card, CardBody, CardFooter, CardHeader } from '../shared/card';

const Transactions = () => {
  return (
    <div className={'lw-transactions-container'}>
      <Balance />
      <Card>
        <CardHeader>
          <h1>Latest Transactions</h1>
        </CardHeader>
        <CardBody />
        <CardFooter>
          <a href={'#'}><Localize context={'transactions'}>Load more</Localize> <i className={'fas fa-chevron-down'} /></a>
        </CardFooter>
      </Card>
      {/*<TransactionsTable />*/}
    </div>
  );
};
Transactions.propTypes = {};

export default Transactions;
