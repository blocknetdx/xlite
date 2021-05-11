// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import path from 'path';
import { prepPath } from './index';

export const publicPath = prepPath(path.join(__dirname, '../../static'));
