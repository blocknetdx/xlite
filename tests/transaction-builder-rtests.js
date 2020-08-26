import 'should';
import {all, create} from 'mathjs';
const math = create(all, {
  number: 'BigNumber',
  precision: 64
});
const { bignumber } = math;

import {DUST_SATOSHIS} from '../src/app/constants'
import Recipient from '../src/app/types/recipient';
import RPCUnspent from '../src/app/types/rpc-unspent';
import TransactionBuilder from '../src/app/modules/transactionbuilder';
import XBridgeInfo from '../src/app/types/xbridgeinfo';

describe('Transaction Builder Test Suite', function() {
  const defaultFeeInfo = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000 });
  const defaultRecipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
  const defaultUtxos = [
    new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 1.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
    new RPCUnspent({ txId: '698fd974b4dbe3cc5092646da9d7d4cb02755f7c84968a1b6086e8a4656a4eba', vOut: 0, address: 'yH4uQ3L7jb4Pp3eHQemR6dftyaQrPMXbKz', amount: 1.00000000, scriptPubKey: '76a914dc578b8f1a2e7f73be7dc4845c1d255a9d4d795c88ac', spendable: true, confirmations: 2560 }),
  ];

  it('TransactionBuilder()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    builder._feeInfo.should.be.eql(defaultFeeInfo);
  });
  it('TransactionBuilder.isValid()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    builder.fundTransaction(defaultUtxos);
    builder.isValid().should.be.true();
  });
  it('TransactionBuilder.isValid() should fail without funding the transaction', async function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    builder.isValid().should.be.false();
  });
  it('TransactionBuilder.getInputs()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    builder.fundTransaction(defaultUtxos);
    builder.isValid().should.be.true();
    builder.getInputs().should.be.an.Array();
    builder.getInputs()[0].should.be.instanceof(RPCUnspent);
  });
  it('TransactionBuilder.getOutputs()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    builder.fundTransaction(defaultUtxos);
    builder.isValid().should.be.true();
    builder.getOutputs().should.be.an.Array();
    builder.getOutputs()[0].should.be.instanceof(Recipient);
  });
  it('TransactionBuilder.getTxOutputs()', function() {
    const addresses = [];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients) {
      builder.addRecipient(r);
      addresses.push(r.address);
    }
    builder.fundTransaction(defaultUtxos);
    builder.isValid().should.be.true();
    builder.getTxOutputs().should.be.an.Object();
    builder.getTxOutputs().should.have.properties(addresses);
  });
  it('TransactionBuilder.getRecipients() TransactionBuilder.addRecipient()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    builder.fundTransaction(defaultUtxos);
    builder.isValid().should.be.true();
    builder.getRecipients().should.be.eql(defaultRecipients);
  });
  it('TransactionBuilder.getFees()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    builder.getFees().should.be.equal(0);
    builder.fundTransaction(defaultUtxos);
    builder.getFees().should.be.greaterThan(0);
  });
  it('TransactionBuilder.getFees() single utxo', function() {
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const recipients = [
      new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: utxos[0].amount - 1, description: '' })
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    builder.getFees().should.be.equal(0);
    builder.fundTransaction(utxos);
    builder.getFees().should.be.greaterThan(0);
  });
  it('TransactionBuilder.getFees() exact utxo subtract fees', function() {
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const recipients = [
      new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: utxos[0].amount, description: '' })
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    builder.getFees().should.be.equal(0);
    builder.fundTransaction(utxos, true);
    builder.getFees().should.be.greaterThan(0);
    builder.getOutputs().length.should.be.equal(1);
    builder.getOutputs()[0].amount.should.be.equal(recipients[0].amount - builder.getFees());
  });
  it('TransactionBuilder.fundTransaction()', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(defaultUtxos); }, Error);
    builder.isValid().should.be.true();
  });
  it('TransactionBuilder.fundTransaction() single input', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.true();
    builder.getInputs().should.be.eql([utxos[0]]); // expecting the larger input to be selected
  });
  it('TransactionBuilder.fundTransaction() multiple inputs', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 1.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.true();
    builder.getInputs().should.be.eql([utxos[0]]); // expecting the larger input to be selected
  });
  it('TransactionBuilder.fundTransaction() subtract fees from recipients single utxo', function() {
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const totalAmount = utxos.map(utxo => utxo.amount).reduce((total, cur) => total + cur);
    const recipient1 = new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: totalAmount/2, description: '' });
    const recipient2 = new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: totalAmount/2, description: '' });
    recipient1.isValid().should.be.true();
    recipient2.isValid().should.be.true();
    const builder = new TransactionBuilder(defaultFeeInfo);
    builder.addRecipient(recipient1);
    builder.addRecipient(recipient2);
    should.doesNotThrow(() => { builder.fundTransaction(utxos, true); }, Error);
    builder.isValid().should.be.true();
    const fees = builder.getFees();
    const feesPerRecipient = fees/2;
    const outputs = builder.getOutputs();
    outputs.length.should.be.equal(2);
    for (const output of outputs)
      output.amount.should.be.equal(totalAmount/2 - feesPerRecipient); // make sure each recipient shares in fees
  });
  it('TransactionBuilder.fundTransaction() subtract fees from recipients multiple utxos', function() {
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 15.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 1.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
    ];
    const totalAmount = utxos.map(utxo => utxo.amount).reduce((total, cur) => total + cur);
    const recipient1 = new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: totalAmount/2, description: '' });
    const recipient2 = new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: totalAmount/2, description: '' });
    recipient1.isValid().should.be.true();
    recipient2.isValid().should.be.true();
    const builder = new TransactionBuilder(defaultFeeInfo);
    builder.addRecipient(recipient1);
    builder.addRecipient(recipient2);
    should.doesNotThrow(() => { builder.fundTransaction(utxos, true); }, Error);
    builder.isValid().should.be.true();
    const fees = builder.getFees();
    const feesPerRecipient = fees/2;
    const outputs = builder.getOutputs();
    outputs.length.should.be.equal(2);
    for (const output of outputs)
      output.amount.should.be.equal(totalAmount/2 - feesPerRecipient); // make sure each recipient shares in fees
  });
  it('TransactionBuilder.fundTransaction() Algo A', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 1.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 5.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 2, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 5.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.true();
    const sortfn = (a,b) => {
      if (a.txId !== b.txId)
        return a.txId.localeCompare(b.txId);
      return a.vOut < b.vOut ? -1 : (a.vOut > b.vOut ? 1 : 0);
    };
    const inputs = builder.getInputs().sort(sortfn);
    const expected = utxos.sort(sortfn);
    inputs.should.be.eql(expected); // expecting all to be selected
  });
  it('TransactionBuilder.fundTransaction() Algo B', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 100.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 90.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: false, confirmations: 30 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 2, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 50.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 3, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 9.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 4, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 5.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.true();
    builder.getInputs().should.be.eql([utxos[2]]); // expecting the largest utxo above recipient amount
  });
  it('TransactionBuilder.fundTransaction() should fail on bad inputs', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    should.throws(() => { builder.fundTransaction(null); }, Error);
    should.throws(() => { builder.fundTransaction(undefined); }, Error);
    should.throws(() => { builder.fundTransaction({}); }, Error);
    should.throws(() => { builder.fundTransaction(''); }, Error);
  });
  it('TransactionBuilder.fundTransaction() should fail on no inputs', function() {
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of defaultRecipients)
      builder.addRecipient(r);
    should.throws(() => { builder.fundTransaction([]); }, Error);
  });
  it('TransactionBuilder.fundTransaction() should fail on not enough inputs', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 1.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 2.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
      new RPCUnspent({ txId: 'bcc2478da7e340fe9a80c1230ec5d4fad84b2cd10e1077a6f3573977acc56611', vOut: 2, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 3.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 30 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.throws(() => { builder.fundTransaction(utxos); }, Error);
  });
  it('TransactionBuilder.fundTransaction() should succeed on exact match', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 10.00010000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.true();
    builder.getInputs().should.eql(utxos);
    builder.getOutputs().should.eql(recipients);
  });
  it('TransactionBuilder.fundTransaction() should succeed on only 1 utxo with change', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 11.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.doesNotThrow(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.true();
    builder.getInputs().should.eql(utxos);
    const fee = builder.feeEstimate(utxos.length, recipients.length + 1); // +1 for change
    builder._addChangeIfNecessary(utxos[0].amount, recipients[0].amount + fee, 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', recipients);
    builder.getOutputs().should.eql(recipients);
  });
  it('TransactionBuilder.fundTransaction() should fail on non-spendable inputs', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 11.00000000, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: false, confirmations: 525 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.throws(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.false();
  });
  it('TransactionBuilder.fundTransaction() should fail on dust inputs', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const utxos = [
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 0, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: DUST_SATOSHIS/defaultFeeInfo.coin, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
      new RPCUnspent({ txId: 'a8f44288f3a99972db939185deabfc2c716ba7e78cd99624657ba061d19600a0', vOut: 1, address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: DUST_SATOSHIS/defaultFeeInfo.coin, scriptPubKey: '76a914fef1b70a09539048b384163e2724c6bd1d2402ea88ac', spendable: true, confirmations: 525 }),
    ];
    const builder = new TransactionBuilder(defaultFeeInfo);
    for (const r of recipients)
      builder.addRecipient(r);
    should.throws(() => { builder.fundTransaction(utxos); }, Error);
    builder.isValid().should.be.false();
  });
  it('TransactionBuilder.feeEstimate()', function() {
    const feeInfo = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 1000, coin: 100000000 });
    const builder = new TransactionBuilder(feeInfo);
    builder.feeEstimate(1, 1).should.be.equal(4520/feeInfo.coin); // 192 * inputCount + 34 * outputCount * feePerByte
    builder.feeEstimate(1, 2).should.be.equal(5200/feeInfo.coin);
    builder.feeEstimate(2, 2).should.be.equal(9040/feeInfo.coin);
  });
  it('TransactionBuilder.feeEstimate() default xbridge info', function() {
    const feeInfo = new XBridgeInfo({});
    const builder = new TransactionBuilder(null);
    builder.feeEstimate(1, 1).should.be.equal(22600/feeInfo.coin);
    builder.feeEstimate(1, 2).should.be.equal(26000/feeInfo.coin);
    builder.feeEstimate(2, 2).should.be.equal(45200/feeInfo.coin);
  });
  it('TransactionBuilder.isDust()', function() {
    const feeInfo = new XBridgeInfo({ ticker: 'BLOCK', feeperbyte: 20, mintxfee: 10000, coin: 100000000 });
    const builder = new TransactionBuilder(feeInfo);
    builder.isDust(100/feeInfo.coin).should.be.true();
    builder.isDust(DUST_SATOSHIS/feeInfo.coin).should.be.true();
    builder.isDust((DUST_SATOSHIS+1)/feeInfo.coin).should.be.false();
    builder.isDust(10000/feeInfo.coin).should.be.false();
  });
  it('TransactionBuilder._addChangeIfNecessary()', function() {
    const recipients = [new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' })];
    const builder = new TransactionBuilder(defaultFeeInfo);
    const recipientsPlusChange = recipients.concat([new Recipient({ address: 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', amount: 20, description: '' })]);
    builder._addChangeIfNecessary(120, 100, 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', recipients);
    recipients.should.eql(recipientsPlusChange);
  });
  it('TransactionBuilder._addChangeIfNecessary() should fail if change is dust', function() {
    const recipient = new Recipient({ address: 'yKjhThbgKHNh9iQYL2agreSAvw5tmJGkNW', amount: 10, description: '' });
    const recipients = [recipient];
    const recipientsCopy = recipients;
    const builder = new TransactionBuilder(defaultFeeInfo);
    builder._addChangeIfNecessary(100, 120, 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', recipients);
    recipients.should.eql(recipientsCopy);
    builder._addChangeIfNecessary(100, 100, 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', recipients);
    recipients.should.eql(recipientsCopy);
    builder._addChangeIfNecessary(100, 100-(DUST_SATOSHIS/defaultFeeInfo.coin), 'yLDs4UKRQm7yeZXAGdQFLFcoouw3aAddYt', recipients);
    recipients.should.eql(recipientsCopy);
  });
});
