import Token from '../types/token';

class TokenManifest {
  /**
   * @type {Array<Object>}
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
   * Constructor
   * @param manifest {Array<Object>}
   */
  constructor(manifest) {
    this._manifest = manifest;
    this._manifest.forEach(t => {
      const token = new Token(t);
      this._tokens.set(token.ticker, token);
    });
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
