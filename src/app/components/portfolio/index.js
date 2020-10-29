// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import { connect } from 'react-redux';
import Portfolio from './portfolio';

export default connect(
  ({ appState }) => ({
    windowWidth: appState.windowWidth,
    altCurrency: appState.altCurrency,
    currencyMultipliers: appState.currencyMultipliers,
  })
)(Portfolio);
