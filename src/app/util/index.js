// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {MAX_DECIMAL_CURRENCY} from '../constants';
import Localize from '../components/shared/localize';

import _ from 'lodash';
import {all, create} from 'mathjs';
import moment from 'moment';

const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

export const handleError = err => {
  console.error(err);
};

const reParseAPIError = /^(?:.*Error:\s)?(.*?)\s*$/i;
/**
 * The api error message is parsed so that the last
 * error message is used.
 * @param err {Error}
 * @return {Error}
 */
export const parseAPIError = err => {
  if (!err || !err.message)
    return err;
  const matches = err.message.match(reParseAPIError);
  if (!matches)
    return err;
  if (matches.length === 1) {
    err.message = matches[0];
    return err;
  }
  err.message = matches[1] || matches[0];
  return err;
};

/**
 * Wallets array sorting function
 */
export const walletSorter = balances => (a, b) =>  {
  const { ticker: tickerA, name: nameA } = a;
  const totalA = balances.has(tickerA) ? Number(balances.get(tickerA)[0]) : 0;
  const { ticker: tickerB, name: nameB } = b;
  const totalB = balances.has(tickerB) ? Number(balances.get(tickerB)[0]) : 0;
  if(totalA > 0 && totalB <= 0) {
    return -1;
  } else if(totalB > 0 && totalA <= 0) {
    return 1;
  } else {
    return  Localize.compare(nameA, nameB);
  }
};

export const unixTime = () => {
  return moment().unix(); // e.g. 1600391629
};

export const multiplierForCurrency = (ticker, currency, currencyMultipliers) => {
  if (_.has(currencyMultipliers, ticker) && _.has(currencyMultipliers[ticker], currency))
    return currencyMultipliers[ticker][currency];
  return 0;
};

/**
 * Rounds the value up to the next cent.
 * @param val {number|string|bignumber}
 * @return {string} Two decimal places precision
 */
export const currencyLinter = val => {
  if (_.isNull(val) || _.isUndefined(val))
    val = 0;
  if (_.isString(val) && !/^[\d\\.]+$/.test(val)) // if not a string number
    val = 0;
  if (isNaN(Number(val)))
    val = 0;
  const bn = bignumber(val);
  if (bn.toNumber() > 0 && bn.toNumber() < 1/100) // 0.01 is the smallest
    return bignumber(1/100).toFixed(MAX_DECIMAL_CURRENCY);
  return bn.toFixed(MAX_DECIMAL_CURRENCY);
};

/**
 * @param length {number}
 * @returns {Promise<void>}
 */
export const timeout = (length = 0) => new Promise(resolve => setTimeout(resolve, length));

export const oneHourSeconds = 3600;
export const oneDaySeconds = 86400;
export const oneWeekSeconds = 604800;
export const oneMonthSeconds = 2592000;
export const halfYearSeconds = 15768000;
export const oneYearSeconds = 31536000;

export const oneSat = 1 / 100000000;

export const passwordValidator = {
  checkLength: password => password.length >= 8,
  checkLowercase: password => password.toUpperCase() !== password,
  checkUppercase: password => password.toLowerCase() !== password,
  checkNumber: password => /\d/.test(password),
  checkSpecial: password => /[^\s\w\d]/.test(password)
};

export const checkPassword = password => {
  let totalScore = 0;
  let goodLength = false, hasLower = false, hasUpper = false, hasNumber = false, hasSpecial = false;
  if(password.length >= 10) {
    totalScore += 2;
    goodLength = true;
  } else if(password.length > 7) {
    totalScore += 1;
    goodLength = true;
  }
  if(/[0-9]/.test(password)) {
    totalScore += 2;
    hasNumber = true;
  }
  if(/[a-z]/.test(password)) {
    totalScore += 2;
    hasLower = true;
  }
  if(/[A-Z]/.test(password)) {
    totalScore += 2;
    hasUpper = true;
  }
  if(/[~!@#$%^&*()_-]/.test(password)) {
    totalScore += 2;
    hasSpecial = true;
  }
  return [
    totalScore,
    goodLength,
    hasLower,
    hasUpper,
    hasNumber,
    hasSpecial,
  ];
};

/**
 * Return only enabled wallets.
 * @param wallets {Wallet[]}
 * @return {Wallet[]}
 */
export const availableWallets = wallets => {
  if (!wallets || wallets.length === 0)
    return [];
  const m = new Map(); // <ticker, rpcEnabled>
  for (const w of wallets)
    m.set(w.ticker, w.rpcEnabled());
  return wallets.filter(w => m.get(w.ticker));
};

/**
 * @param target {any}
 * @param toggle {boolean}
 */
export const selectAllInElement = (target, toggle = false) => {
  const selection = window.getSelection();
  if(toggle && selection.anchorNode === target) {
    selection.removeAllRanges();
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(target);
  selection.removeAllRanges();
  selection.addRange(range);
};

/**
 * @param numStr {string}
 * @returns {string}
 */
export const removeTrailingZeroes = numStr => {
  const trailingZeroPatt = /^(\d+[.,]\d*?)0+$/;
  if(trailingZeroPatt.test(numStr)) {
    const trimmed = numStr.match(trailingZeroPatt)[1];
    return /[.,]$/.test(trimmed) ? trimmed + '0' : trimmed;
  }
  return numStr;
};

/**
 * Waits for all promises to resolve (or catch). Resolves true if
 * all promises resolved without error, otherwise resolves false.
 * @param promises
 * @return {Promise<boolean>}
 */
export const resolveAll = promises => {
  let resolved = promises.length;
  let done = false;
  let success = true;
  // Only resolve the promise once all wallet promises have resolved
  const resolveHandler = resolve => {
    if (done)
      return; // prevent race conditions
    resolved--;
    if (resolved <= 0) {
      done = true;
      resolve(success);
    }
  };
  return new Promise(resolve => {
    for (const p of promises)
      p.then(() => resolveHandler(resolve))
        .catch(() => {
          success = false;
          resolveHandler(resolve);
        });
  });
};

/**
 * @param num {number}
 * @param decimalPlaces {number}
 * @param = removeTrailing {boolean}
 * @returns {string}
 */
export const truncate = (num = 0, decimalPlaces = 0, removeTrailing = false) => {
  let multiplier = 1;
  for(let i = 0; i < decimalPlaces; i++) {
    multiplier = multiplier * 10;
  }
  const truncated = Math.trunc(math.multiply(bignumber(num), bignumber(multiplier)).toNumber()) / multiplier;
  const fixed = truncated.toFixed(decimalPlaces);
  return removeTrailing ? removeTrailingZeroes(fixed) : fixed;
};

/**
 * @param srcSet {string}
 * @returns {string}
 */
export const getSrcFromSrcSet = (srcSet = '') => {
  const src = srcSet.split(/\s+/)[0] || '';
  return src.replace(/,$/, '');
};
