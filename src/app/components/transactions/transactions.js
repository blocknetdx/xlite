// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import PropTypes from 'prop-types';
import React from 'react';
import Balance from '../shared/balance';
import { activeViews } from '../../constants';
import TransactionsPanel from '../shared/transactions-panel';
import {Column, Row} from '../shared/flex';

const Transactions = ({ activeView }) => {

  const coinSpecificTransactions = activeView === activeViews.COIN_TRANSACTIONS;

  return (
    <div className={'lw-transactions-container'}>
      <Row style={{height: 115, minHeight: 115, maxHeight: 150}}>
        <Column style={{width: '100%'}}>
          <Balance showCoinDetails={coinSpecificTransactions} style={{position: 'relative'}} />
        </Column>
      </Row>
      <TransactionsPanel selectable={true} coinSpecificTransactions={coinSpecificTransactions} brief={false} />
    </div>
  );
};
Transactions.propTypes = {
  activeView: PropTypes.string
};

export default Transactions;
