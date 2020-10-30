// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import React from 'react';
import PropTypes from 'prop-types';
import escapeRegExp from 'lodash/escapeRegExp';
import isNumber from 'lodash/isNumber';
import { DEFAULT_LOCALE } from '../../constants';

let selectedLocale;
let selectedLocaleData;
let collator;
let debugging;

export default class Localize extends React.Component {

  static propTypes = {
    type: PropTypes.string,
    context: PropTypes.string,
    replacers: PropTypes.object,
    children: PropTypes.string
  };

  static initialize = ({ locale = '', localeData = {}, debugging: _debugging = false }) => {
    debugging = _debugging;
    if(!locale && !DEFAULT_LOCALE) throw new Error('You must initialize Localize with an object containing a locale or defaultLocale property.');
    if(locale) {
      selectedLocale = locale;
    } else {
      const {language} = navigator || {};
      if(language) {
        if(localeData[language]) {
          selectedLocale = language;
        } else {
          const baseLocale = language.split('-')[0];
          if(localeData[baseLocale]) selectedLocale = baseLocale;
        }
      }
      if(!selectedLocale) selectedLocale = DEFAULT_LOCALE;
    }
    selectedLocaleData = localeData[selectedLocale] || {};
    collator = new Intl.Collator(selectedLocale);
  };

  static initialized = () => selectedLocaleData ? true : false;

  static locale = () => selectedLocale;

  static compare = (a, b) => collator.compare(a, b);

  static text = (key, context, replacers = {}) => {
    let text = selectedLocaleData[key] && selectedLocaleData[key][context] ? selectedLocaleData[key][context].val : '';
    if(!text && debugging) {
      text = '***' + key + '***';
    } else if(!text) {
      text = key;
    }
    text = Object.keys(replacers).reduce((str, k) => {
      const patt = new RegExp(`{{${escapeRegExp(k)}}}`, 'g');
      return str.replace(patt, replacers[k]);
    }, text);
    return text;
  }

  static number = (num, decimalPlaces) => {
    if(isNumber(decimalPlaces) && decimalPlaces > -1)
      num = Number(num.toFixed(decimalPlaces));
    return num.toLocaleString(selectedLocale);
  }

  constructor(props) {
    super(props);
  }

  render() {
    const { type = 'text', context = '', replacers = {}, children: key = '' } = this.props;
    if(type === 'text') {
      const found = selectedLocaleData[key] && selectedLocaleData[key][context] ? true : false;
      const text = Localize.text(key, context, replacers);
      if(!found & debugging) {
        return <span style={{color: '#f00'}}>{text}</span>;
      } else {
        return <span>{text}</span>;
      }
    }
  }

}
