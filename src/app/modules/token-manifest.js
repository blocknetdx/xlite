import Token from '../types/token';

class TokenManifest {
  /**
   * @type {Object[]}
   * @private
   */
  _manifest = [];

  /**
   * Manifest tokens. Key is the token's ticker symbol.
   * @type {Map<string,Token>}
   * @private
   */
  _tokens = new Map();

  /**
   * Constructor. Fee info is required to associate fee data
   * with the token manifest data.
   * @param manifest {Object[]}
   * @param feeInfo {FeeInfo[]}
   */
  constructor(manifest, feeInfo) {
    this._manifest = manifest;
    const fees = new Map();
    for (const info of feeInfo)
      fees.set(info.ticker, info);
    for (const t of this._manifest) {
      const token = new Token(t);
      token.feeinfo = fees.get(token.ticker);
      this._tokens.set(token.ticker, token);
    }
  }

  /**
   * Returns the token for the specified ticker.
   * @param ticker {string}
   * @return Token
   */
  getToken(ticker) {
    if (!this._tokens.has(ticker))
      return null;
    return this._tokens.get(ticker);
  }

}

export default TokenManifest;
