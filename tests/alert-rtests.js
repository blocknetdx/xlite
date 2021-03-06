/* global describe, it */
import 'should';

import './rtests';
import Alert from '../src/app/modules/alert';
import { swalConfirmed, swalCanceled, setFakePromptInput } from './fake-swal';
import Localize from '../src/app/components/shared/localize';

describe('Alert static methods', function() {

  Localize.initialize('en', {});

  it('Alert._defaultConfirmText()', function() {
    Alert._defaultConfirmText.should.be.a.Function();
    const text = Alert._defaultConfirmText();
    text.should.be.a.String();
    text.length.should.be.greaterThan(0);
  });

  it('Alert._defaultCancelText()', function() {
    Alert._defaultConfirmText.should.be.a.Function();
    const text = Alert._defaultConfirmText();
    text.should.be.a.String();
    text.length.should.be.greaterThan(0);
  });

  it('Alert._constructSwalConfiguration()', function() {
    Alert._constructSwalConfiguration.should.be.a.Function();
    const res1 = Alert._constructSwalConfiguration('info', 'title', 'text', {input: 'text'}, 'ok', 'cancel');
    res1.should.be.an.Object();
    res1.input.should.be.a.String();
    res1.confirmButtonText.should.be.equal('ok');
    res1.cancelButtonText.should.be.equal('cancel');
    const res2 = Alert._constructSwalConfiguration('', 'title', 'text', null, 'ok');
    res2.should.be.an.Object();
    res2.confirmButtonText.should.be.equal('ok');
  });

  it('Alert.alert()', async function() {
    Alert.alert.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.alert('title', 'text', 'ok');
    res1.value.should.be.a.Boolean();
    res1.value.should.be.true();
    Alert._swal = swalCanceled;
    const res2 = await Alert.alert('title', 'text', 'ok');
    res2.value.should.be.a.Boolean();
    res2.value.should.be.false();
  });

  it('Alert.confirm()', async function() {
    Alert.confirm.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.confirm('title', 'text', 'ok', 'cancel');
    res1.value.should.be.a.Boolean();
    res1.value.should.be.true();
    Alert._swal = swalCanceled;
    const res2 = await Alert.alert('title', 'text', 'ok', 'cancel');
    res2.value.should.be.a.Boolean();
    res2.value.should.be.false();
  });

  it('Alert.prompt()', async function() {
    const fakePromptInput = 'something';
    setFakePromptInput(fakePromptInput);
    Alert.prompt.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.prompt('title', 'text', 'ok', 'cancel');
    res1.should.be.a.String();
    res1.should.equal(fakePromptInput);
    Alert._swal = swalCanceled;
    const res2 = await Alert.prompt('title', 'text', 'ok', 'cancel');
    res2.should.be.a.String();
    res2.should.equal('');
  });

  it('Alert.error()', async function() {
    Alert.error.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.error('title', 'text', 'ok');
    res1.value.should.be.a.Boolean();
    res1.value.should.be.true();
    Alert._swal = swalCanceled;
    const res2 = await Alert.error('title', 'text', 'ok');
    res2.value.should.be.a.Boolean();
    res2.value.should.be.false();
  });

  it('Alert.success()', async function() {
    Alert.success.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.success('title', 'text', 'ok');
    res1.value.should.be.a.Boolean();
    res1.value.should.be.true();
    Alert._swal = swalCanceled;
    const res2 = await Alert.success('title', 'text', 'ok');
    res2.value.should.be.a.Boolean();
    res2.value.should.be.false();
  });

  it('Alert.warning()', async function() {
    Alert.warning.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.warning('title', 'text', 'ok', 'cancel');
    res1.value.should.be.a.Boolean();
    res1.value.should.be.true();
    Alert._swal = swalCanceled;
    const res2 = await Alert.warning('title', 'text', 'ok', 'cancel');
    res2.value.should.be.a.Boolean();
    res2.value.should.be.false();
  });

  it('Alert.info()', async function() {
    Alert.info.should.be.a.Function();
    Alert._swal = swalConfirmed;
    const res1 = await Alert.info('title', 'text', 'ok');
    res1.value.should.be.a.Boolean();
    res1.value.should.be.true();
    Alert._swal = swalCanceled;
    const res2 = await Alert.info('title', 'text', 'ok');
    res2.value.should.be.a.Boolean();
    res2.value.should.be.false();
  });

});
