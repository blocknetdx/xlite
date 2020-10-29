// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import _ from 'lodash';
import {Map as IMap} from 'immutable';

/**
 * Default list of whitelisted fields (included in api results)
 * @type {string[]}
 */
export const Whitelist = ['_token', '_rpcEnabled'];

/**
 * Default list of blacklisted fields (omitted from api results)
 * @type {string[]}
 */
export const Blacklist = ['rpc', 'rpcPassword', 'rpcUsername', 'rpcPort', 'rpcport'];

/**
 * Removes all private fields (those starting with _) and supports
 * whitelisting any fields. Blacklisted fields take precedence over
 * whitelisted fields.
 * @param o {Object}
 * @param blacklist {Array<string>} Remove all these fields
 * @param whitelist {Array<string>} Do not remove any of these fields
 * @return {*}
 */
export const sanitize = (o, blacklist=[], whitelist=[]) => {
  if (_.isNil(o))
    return o;
  const b = new Set(blacklist);
  const w = new Set(whitelist);
  sanitizeObj(o, b, w);
  return o;
};

/**
 * Sanitizes a non-array object by removing private fields beginning
 * with an underscore _ and optionally blacklisting and whitelisting
 * the specified fields. Blacklisting takes precedence over
 * whitelisting.
 * @param o {*}
 * @param blacklist {Set}
 * @param whitelist {Set}
 */
export const sanitizeObj = (o, blacklist, whitelist) => {
  if (_.isNull(o) || _.isString(o) || _.isNumber(o) || _.isFunction(o) || _.isBoolean(o))
    return;

  if (_.isArray(o) || typeof o[Symbol.iterator] === 'function' || o instanceof Set) {
    for (const item of o)
      sanitizeObj(item, blacklist, whitelist);
  } else if (o instanceof Map || o instanceof IMap) {
    for (const [key, value] of o)
      sanitizeObj(value, blacklist, whitelist);
  } else {
    for (const key in o) {
      if ({}.hasOwnProperty.call(o, key)) {
        if (blacklist.has(key) || (key.startsWith('_') && !whitelist.has(key)))
          delete o[key];
        else
          sanitizeObj(o[key], blacklist, whitelist);
      }
    }
  }
};
