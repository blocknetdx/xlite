import { Map } from 'immutable';
import moment from 'moment';
import path from 'path';
import PropTypes from 'prop-types';
import React from 'react';
import Balance from '../shared/balance';
import Localize from '../shared/localize';
import { Card, CardBody, CardFooter, CardHeader } from '../shared/card';
import { Table, TableColumn, TableData, TableRow } from '../shared/table';
import { all, create } from 'mathjs';
import Wallet from '../../types/wallet';
import { Column, Row } from '../shared/flex';
import { walletSorter } from '../../util';
import AssetWithImage from '../shared/asset-with-image';
import { MAX_DECIMAL_PLACE } from '../../constants';
import PercentBar from '../shared/percent-bar';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

const Portfolio = ({ activeWallet, altCurrency, balances, currencyMultipliers, wallets }) => {

  const filteredWallets = wallets
    .filter(w => w.rpcEnabled)
    .sort(walletSorter(balances));

  const altBalances = {};
  let totalAltBalance = bignumber(0);

  for(const w of filteredWallets) {
    const { ticker } = w;
    const [ totalBalance ] = balances.get(ticker);
    const altMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker][altCurrency] ? currencyMultipliers[ticker][altCurrency] : 0);
    const balance = math.multiply(bignumber(Number(totalBalance)), altMultiplier);
    altBalances[ticker] = balance;
    totalAltBalance = math.add(totalAltBalance, balance);
  }

  return (
    <div className={'lw-portfolio-container'}>
      <Balance />
      <Card>
        <CardHeader>
          <h1><Localize context={'portfolio'}>Assets Overview</Localize></h1>
        </CardHeader>
        <CardBody>
          <Table>
            <TableColumn size={1}><Localize context={'portfolio'}>Asset</Localize></TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Ticker</Localize></TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Price</Localize> ({altCurrency})</TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Price graph (7d)</Localize></TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Volume (24hr)</Localize></TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Portfolio %</Localize></TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Amount</Localize></TableColumn>
            <TableColumn size={1}><Localize context={'portfolio'}>Value</Localize> (BTC)</TableColumn>
            {filteredWallets
              .map(w => {

                const { ticker } = w;

                const altMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker][altCurrency] ? currencyMultipliers[ticker][altCurrency] : 0);
                const btcMultiplier = bignumber(currencyMultipliers[ticker] && currencyMultipliers[ticker]['BTC'] ? currencyMultipliers[ticker]['BTC'] : 0);

                const [ totalBalance ] = balances.get(ticker);

                const percent = Number(math.multiply(math.divide(altBalances[ticker], totalAltBalance), bignumber(100)).toFixed(2));

                return (
                  <TableRow key={ticker}>
                    <TableData>
                      <AssetWithImage wallet={w} />
                    </TableData>
                    <TableData>{ticker}</TableData>
                    <TableData className={'text-monospace'}>{Number(altMultiplier.toFixed(MAX_DECIMAL_PLACE))}</TableData>
                    <TableData></TableData>
                    <TableData></TableData>
                    <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0}}>
                      <Column justify={'center'} style={{marginTop: -14}}>
                        <div style={{marginBottom: 3, textAlign: 'left'}}>{percent}</div>
                        <PercentBar percent={percent} />
                      </Column>
                    </TableData>
                    <TableData className={'text-monospace'}>{Number(totalBalance)}</TableData>
                    <TableData className={'text-monospace'} style={{paddingTop: 0, paddingBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                      <div>
                        {Number(math.multiply(bignumber(Number(totalBalance)), btcMultiplier).toFixed(MAX_DECIMAL_PLACE))}
                      </div>
                      <div className={'lw-color-secondary-3'}>
                        {`$${altBalances[ticker].toFixed(2)}`}
                      </div>
                    </TableData>
                  </TableRow>
                );
              })
            }
          </Table>
        </CardBody>
        <CardFooter>
          <a style={{color: '#c8cdd6'}}><Localize context={'universal'}>Nothing more to load</Localize></a>
        </CardFooter>
      </Card>
    </div>
  );
};
Portfolio.propTypes = {
  activeWallet: PropTypes.string,
  altCurrency: PropTypes.string,
  balances: PropTypes.instanceOf(Map),
  currencyMultipliers: PropTypes.object,
  wallets: PropTypes.arrayOf(PropTypes.instanceOf(Wallet))
};

export default Portfolio;
