import crypto from 'crypto';

/**
 * @param password {string}
 * @param salt {string}
 * @returns {string}
 */
export const pbkdf2 = (password, salt) => crypto
  .pbkdf2Sync(password, salt, 200000, 64, 'sha512')
  .toString('hex');

/**
 * @param size {number}
 * @returns {string}
 */
export const generateSalt = size => crypto
  .randomBytes(size)
  .toString('hex');

/**
 * Constructs a Crypt instance for safely encrypting and decrypting values
 * @param password {string}
 * @param salt {string}
 * @constructor
 */
export const Crypt = function(password, salt) {

  const key = crypto.scryptSync(password, salt, 32);
  const algorithm = 'aes-256-gcm';

  /**
   * @param str {string}
   * @returns {string}
   */
  this.encrypt = str => {
    const iv = crypto.randomBytes(32);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted = encrypted + cipher.final('hex');
    const tag = cipher.getAuthTag();
    return [
      encrypted,
      iv.toString('hex'),
      tag.toString('hex')
    ].join('$');
  };

  /**
   * @param encrypted {string}
   * @returns {string}
   */
  this.decrypt = encrypted => {
    const split = encrypted.split(/\$/g);
    encrypted = split[0];
    const iv = Buffer.from(split[1], 'hex');
    const tag = Buffer.from(split[2], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted = decrypted + decipher.final('utf8');
    return decrypted;
  };

};
