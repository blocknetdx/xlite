// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import Alert from './modules/alert';
import Localize from './components/shared/localize';

import React from 'react';
import ReactDOM from 'react-dom';

// Context bridge api
const {api} = window;

// Display error msg
(async () => {
  let locale = await api.general_userLocale();
  if (!locale)
    locale = 'en';
  const localeData = await api.general_getLocaleData(locale);
  Localize.initialize({
    locale,
    localeData: localeData
  });

  const errObj = await api.general_getError();
  await Alert.error(errObj.title, errObj.msg);
  await api.general_requestClose('fatal error ' + errObj.msg);
})();

ReactDOM.render(
  <div />,
  document.getElementById('js-main')
);
