// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import {DUST_SATOSHIS,MAX_DECIMAL_PLACE} from '../constants';
import Recipient from '../types/recipient';
import XBridgeInfo from '../types/xbridgeinfo';

import _ from 'lodash';
import {all, create} from 'mathjs';

const math = create(all, { number: 'BigNumber',  precision: 64 });
const { bignumber } = math;

class TransactionBuilder {
  /**
   * @type {Recipient[]}
   * @private
   */
  _recipients = [];
  /**
   * @type {RPCUnspent[]}
   * @private
   */
  _selectedInputs = [];
  /**
   * @type {Recipient[]}
   * @private
   */
  _outputs = [];
  /**
   * @type {XBridgeInfo}
   * @private
   */
  _feeInfo = null;
  /**
   * Track the calculated fees.
   * @type {number}
   * @private
   */
  _fees = 0;

  /**
   * Constructor
   * @param feeInfo {XBridgeInfo}
   */
  constructor(feeInfo) {
    if (_.isNull(feeInfo) || _.isUndefined(feeInfo))
      this._feeInfo = new XBridgeInfo({}); // rely on defaults
    else
      this._feeInfo = feeInfo;
  }

  /**
   * Returns true if the transaction builder is in a valid state. A valid
   * state means all components of the transaction exists.
   * @return {boolean}
   */
  isValid() {
    const r = this._outputs.length > 0 && this._feeInfo && this._selectedInputs.length > 0;
    if (!r)
      return false;
    for (const output of this._outputs) { // validate output amounts
      if (isNaN(output.amount) || output.amount < 0)
        return false;
    }
    return true;
  }

  /**
   * Get a copy of the selected transaction inputs.
   * @return {RPCUnspent[]}
   */
  getInputs() {
    return this._selectedInputs.slice();
  }

  /**
   * Get a copy of the transaction outputs.
   * @return {Recipient[]}
   */
  getOutputs() {
    return this._outputs.slice();
  }

  /**
   * Get a copy of the transaction outputs.
   * @return {{"address": amount}}
   */
  getTxOutputs() {
    const outputs = {};
    for (const output of this._outputs)
      outputs[output.address] = output.amount;
    return outputs;
  }

  /**
   * Get a copy of the user specified transaction recipients.
   * @return {Recipient[]}
   */
  getRecipients() {
    return this._recipients.slice();
  }

  /**
   * Returns the fees.
   * @return {number}
   */
  getFees() {
    return this._fees;
  }

  /**
   * Adds a recipient, this doesn't filter out duplicates. Sending to the same
   * recipient more than once is acceptable.
   * @param recipient {Recipient}
   */
  addRecipient(recipient) {
    // Add a copy
    this._recipients.push(new Recipient(recipient));
  }

  /**
   * Creates a raw transaction from utxos.
   * @param inputs {RPCUnspent[]} Available utxos
   * @param subtractFees {boolean}
   * @throws {Error}
   */
  fundTransaction(inputs, subtractFees = false) {
    if (!_.isArray(inputs))
      throw new Error('No coin was found');

    // Filter out non-spendable and dust inputs and sort by amount ascending
    const utxos = inputs
      .filter(u => u.spendable && !this.isDust(u.amount))
      .sort((a, b) => {
        return a.amount < b.amount ? -1 : (a.amount > b.amount ? 1 : 0);
      });

    if (utxos.length === 0)
      throw new Error('Not enough coin to fund the transaction');

    let amountNotIncludingFees = bignumber(0);
    for (const recipient of this._recipients) {
      if (!recipient.isValid())
        throw new Error(`Bad recipient ${recipient.address} ${recipient.amount}`);
      amountNotIncludingFees = math.add(amountNotIncludingFees, bignumber(recipient.amount));
    }
    const amountNotIncludingFeesStr = amountNotIncludingFees.toNumber().toString(10);

    // Stores utxos by amount in a lookup. Allows us to look
    // for exact match utxos.
    const mapUtxos = new Map();

    let totalAvailable = bignumber(0);
    for (const utxo of utxos) {
      const amount = utxo.amount;
      totalAvailable = math.add(totalAvailable, bignumber(amount));
      mapUtxos.set(amount.toString(10), utxo); // populate utxo lookup
    }

    if ((!subtractFees && math.smallerEq(totalAvailable, amountNotIncludingFees)) // not enough for fees, subtract fees is not requested
      || (subtractFees && math.smaller(totalAvailable, amountNotIncludingFees))) // not enough for fees, subtract fees is requested
      throw new Error('Not enough funds');

    // Copy of recipients
    const outputs = this._recipients.slice();

    // Defaults fees include 1 input and recipient outputs
    let fees = bignumber(this.feeEstimate(1, outputs.length));

    // Exact utxo match (no change required)
    if (subtractFees && mapUtxos.get(amountNotIncludingFeesStr)) {
      this._selectedInputs.push(mapUtxos.get(amountNotIncludingFeesStr));
      const reduceOutputAmountsBy = math.divide(fees, bignumber(outputs.length));
      for (const output of outputs) {
        output.amount = math.subtract(bignumber(output.amount), reduceOutputAmountsBy).toNumber();
      }
      this._outputs = outputs;
      this._fees = fees.toNumber();
      return; // done
    }

    const amountFeesSum = math.add(amountNotIncludingFees, fees).toNumber().toString(10);
    if (mapUtxos.get(amountFeesSum)) {
      this._selectedInputs.push(mapUtxos.get(amountFeesSum));
      this._outputs = outputs;
      this._fees = fees.toNumber();
      return; // done
    }

    fees = bignumber(this.feeEstimate(1, outputs.length + 1)); // +1 for change

    // If there's only 1 utxo available and it's enough to cover the
    // transaction + fees then use it. Note, that if subtract fees
    // is specified it should never get in this code path because
    // the exact match will happen above.
    if (utxos.length === 1) {
      const utxo = utxos[0];
      const amount = bignumber(utxo.amount);
      const required = math.add(amountNotIncludingFees, fees);
      if (math.equal(amount, required))
        throw new Error(`Not enough funds: have ${amount.toNumber().toFixed(MAX_DECIMAL_PLACE)} but require ${required.toNumber().toFixed(MAX_DECIMAL_PLACE)}`);
      this._selectedInputs.push(utxo);
      this._addChangeIfNecessary(amount.toNumber(), required.toNumber(), utxo.address, outputs);
      this._outputs = outputs;
      this._fees = fees.toNumber();
      return; // done
    }

    // Algo A: If largest utxo is smaller than required amount
    // Select utxo if selected amount less than required amount until
    // we've select all utxos required to cover send amount plus fees.
    //
    // Algo B: If largest utxo is larger than required amount
    // Find the smallest utxo that covers send amount + fees. Reverse iterate
    // over utxos until we find a utxo that is less than required. Move
    // iterator backward by 1 and select this input. Assumes utxos.length >= 2

    const selInputs = [];
    const largestUtxo = utxos[utxos.length - 1];
    let changeAddress = largestUtxo.address;
    let totalSelectedAmount = bignumber(0);
    for (let i = utxos.length - 1; i >= 0; i--) {
      fees = bignumber(this.feeEstimate(selInputs.length === 0 ? 1 : selInputs.length, outputs.length + 1)); // +1 for change
      const requiredAmount = math.add(amountNotIncludingFees, fees);
      const utxo = utxos[i];
      // Algo A
      if (largestUtxo.amount < requiredAmount) { // if largest utxo less than required amount
        if (math.smaller(totalSelectedAmount, requiredAmount)) {
          if (totalSelectedAmount.toNumber() === 0)
            changeAddress = utxo.address; // change address set to address of largest selected utxo
          totalSelectedAmount = math.add(totalSelectedAmount, bignumber(utxo.amount));
          selInputs.push(utxo);
          continue; // iterate to ensure all fees incorporated
        } else
          break; // done with Algo A
      }
      // Algo B (assumes that utxos.length >= 2)
      else {
        if (i === 0 || math.smaller(bignumber(utxo.amount), requiredAmount)) {
          const prevUtxo = utxos[i+1]; // select the previous utxo
          if (totalSelectedAmount === 0)
            changeAddress = prevUtxo.address; // change address set to address of largest selected utxo
          totalSelectedAmount = math.add(totalSelectedAmount, bignumber(prevUtxo.amount));
          selInputs.push(prevUtxo);
          break; // done with Algo B
        }
      }
    }

    // Check subtract fees
    let totalSendAmount = math.add(amountNotIncludingFees, fees);
    if (math.smaller(totalAvailable, totalSendAmount)) {
      if (subtractFees) {
        totalSendAmount = fees; // re-calc below with reduced send amounts
        const reduceOutputAmountsBy = math.divide(fees, bignumber(outputs.length));
        for (const output of outputs) {
          const amount = bignumber(output.amount);
          output.amount = math.subtract(amount, reduceOutputAmountsBy).toNumber();
          totalSendAmount = math.add(totalSendAmount, amount);
        }
      } else
        throw new Error('Not enough funds (2)');
    }

    this._addChangeIfNecessary(totalSelectedAmount.toNumber(), totalSendAmount.toNumber(), changeAddress, outputs);
    this._selectedInputs = selInputs;
    this._outputs = outputs;
    this._fees = fees.toNumber();
  }

  /**
   * Returns the estimated fee. If the fee info is undefined 0 fee will be used.
   * @param inputCount {number}
   * @param outputCount {number}
   * @return {number}
   */
  feeEstimate(inputCount, outputCount) {
    const magicBytes = 192 * inputCount + 34 * outputCount;
    let fees = this._feeInfo.feeperbyte * magicBytes;
    if (fees < this._feeInfo.mintxfee)
      fees = this._feeInfo.mintxfee;
    return math.divide(bignumber(fees), bignumber(this._feeInfo.coin)).toNumber();
  }

  /**
   * Returns true if amount is dust.
   * @param amount {number}
   * @return {boolean}
   */
  isDust(amount) {
    // TODO Potentially pull dust amount from xbridge conf
    return math
      .smallerEq(
        bignumber(amount),
        math.divide(bignumber(DUST_SATOSHIS), bignumber(this._feeInfo.coin))
      );
  }

  /**
   * Add change output if change amount is not dust.
   * @param inputAmount {number}
   * @param requiredAmount {number}
   * @param address {string}
   * @param outputs {Recipient[]}
   * @private
   */
  _addChangeIfNecessary(inputAmount, requiredAmount, address, outputs) {
    const change = math.subtract(bignumber(inputAmount), bignumber(requiredAmount)).toNumber();
    if (!this.isDust(change)) {
      const data = { address: address, amount: change, description: ''};
      outputs.push(new Recipient(data));
    }
  }
}

export default TransactionBuilder;
