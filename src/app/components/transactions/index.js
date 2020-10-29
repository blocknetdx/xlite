// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { connect } from 'react-redux';
import Transactions from './transactions';

export default connect(
  ({ appState }) => ({
    activeView: appState.activeView,
    activeWallet: appState.activeWallet,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers
  })
)(Transactions);
