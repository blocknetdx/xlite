// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import Localize from '../components/shared/localize';

import Swal from 'sweetalert2/dist/sweetalert2'; // exclude inline styles (required by content-security-policy)

class Alert {

  /**
   * @type {Swal}
   * @private
   */
  static _swal = Swal;

  /**
   * @returns {string}
   * @private
   */
  static _defaultConfirmText = () => Localize.text('OK');

  /**
   * @returns {string}
   * @private
   */
  static _defaultCancelText = () => Localize.text('Cancel');

  /**
   * @param icon {string}
   * @param title {string}
   * @param text {string}
   * @param content {Object}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Object}
   * @private
   */
  static _constructSwalConfiguration(icon, title, text, content, confirmButtonText, cancelButtonText = '') {
    const options = {
      title,
      text,
      animation: false,
      customClass: {
        header: 'lw-alert-header',
        title: 'lw-alert-title',
        content: 'lw-alert-content',
        actions: 'lw-alert-buttons-container',
        confirmButton: 'lw-alert-button-confirm',
        cancelButton: 'lw-alert-button-cancel',
        footer: 'lw-alert-footer'
      }
    };
    if(icon)
      options.icon = icon;
    if(content)
      Object.assign(options, content);
    if (confirmButtonText)
      options.confirmButtonText = confirmButtonText;
    if (cancelButtonText)
      options.showCancelButton = true;
      options.cancelButtonText = cancelButtonText;
    return options;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static alert(title = '', text = '', confirmButtonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      null,
      confirmButtonText
    );
    return Alert._swal.fire(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static confirm(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText()) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      null,
      confirmButtonText,
      cancelButtonText
    );
    return Alert._swal.fire(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @param obscure {boolean}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static prompt(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText(), obscure = false) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      {input: (obscure ? 'password' : 'text')},
      confirmButtonText,
      cancelButtonText
    );
    return Alert._swal.fire(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static error(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'error',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal.fire(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static success(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'success',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal.fire(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static warning(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText()) {
    const options = Alert._constructSwalConfiguration(
      'warning',
      title,
      text,
      null,
      confirmButtonText,
      cancelButtonText
    );
    return Alert._swal.fire(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<Object>} SweetAlert result object (i.e. result.value, result.dismiss)
   */
  static info(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'info',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal.fire(options);
  }

}

export default Alert;
