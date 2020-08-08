/**
 * Manifest token
 *
 * Sample data:
 * {
 *   "blockchain": "Blocknet",
 *   "ticker": "BLOCK",
 *   "ver_id": "blocknet--v4.0.1",
 *   "ver_name": "Blocknet v4",
 *   "conf_name": "blocknet.conf",
 *   "dir_name_linux": "blocknet",
 *   "dir_name_mac": "Blocknet",
 *   "dir_name_win": "Blocknet",
 *   "repo_url": "https://github.com/blocknetdx/blocknet",
 *   "versions": [
 *     "v4.3.0"
 *   ],
 *   "xbridge_conf": "blocknet--v4.0.1.conf",
 *   "wallet_conf": "blocknet--v4.0.1.conf"
 * }
 */
class Token {

  blockchain = '';
  ticker = '';
  ver_id = '';
  ver_name = '';
  conf_name = '';
  dir_name_linux = '';
  dir_name_mac = '';
  dir_name_win = '';
  repo_url = '';
  versions = [];
  xbridge_conf = '';
  wallet_conf = '';

  /**
   * Constructor
   * @param data {Object}
   */
  constructor(data) {
    Object.assign(this, data);
  }

}

export default Token;
