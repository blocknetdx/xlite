/* global describe, it */
import 'should';

import './rtests';
import { generateSalt, pbkdf2, Crypt } from '../src/app/modules/crypt';

const hexPatt = /^[0-9a-fA-F]+$/;

describe('crypt.js util functions', function() {

  it('generateSalt()', function() {
    generateSalt.should.be.a.Function();
    const bytes = 32;
    const salt = generateSalt(bytes);
    // it should be a string
    salt.should.be.a.String();
    // it should only include hex characters
    hexPatt.test(salt).should.be.true();
    // it should be twice the length of the number of bytes because of hex encoding
    salt.length.should.equal(bytes * 2);
  });

  it('pbkdf2()', function() {
    const password = 'somepassword';
    const salt = 'somesalt';
    const hash = pbkdf2(password, salt);
    // it should be a strign
    hash.should.be.a.String();
    // it should only include hex characters
    hexPatt.test(hash).should.be.true();
    // it should be twice the key length of 64 because of hex encoding
    hash.length.should.equal(128);
  });

});

describe('Crypt', () => {

  const password = 'somepassword';
  const salt = 'somesalt';
  const message = 'some secret message here';
  let crypt, encrypted;

  it('Crypt should be a constructor function', function() {
    Crypt.should.be.a.Function();
    crypt = new Crypt(password, salt);
    crypt.should.be.an.instanceOf(Crypt);
  });

  it('Crypt.encrypt()', function() {
    crypt.encrypt.should.be.a.Function();
    encrypted = crypt.encrypt(message);
    encrypted.should.be.a.String();
    // it should be divided into three parts: the message, initialization vector, and tag
    const split = encrypted.split(/\$/g);
    split.length.should.equal(3);
    // all pieces should be hex encoded
    split.every(s => hexPatt.test(s)).should.be.true();
  });

  it('Crypt.decrypt()', function() {
    crypt.decrypt.should.be.a.Function();
    const decrypted = crypt.decrypt(encrypted);
    decrypted.should.be.a.String();
    decrypted.should.equal(message);
  });

});
