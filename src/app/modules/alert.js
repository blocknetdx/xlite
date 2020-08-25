import swal from 'sweetalert';
import Localize from '../components/shared/localize';

class Alert {

  /**
   * @type {SweetAlert}
   * @private
   */
  static _swal = swal;

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
  static _constructSwalConfiguration(icon, title, text, content, confirmButtonText, cancelButtonText) {
    const options = {
      title,
      text
    };
    if(icon)
      options.icon = icon;
    if(content)
      options.content = content;
    if(confirmButtonText && cancelButtonText) {
      options.buttons = [cancelButtonText, confirmButtonText];
    } else if(confirmButtonText) {
      options.button = confirmButtonText;
    }
    return options;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static alert(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Promise<boolean>}
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
    return Alert._swal(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @param obscure {boolean}
   * @returns {Promise<boolean>}
   */
  static prompt(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText(), obscure = false) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      {
        element: 'input',
        attributes: {
          type: obscure ? 'password' : 'text'
        }
      },
      confirmButtonText,
      cancelButtonText
    );
    return Alert._swal(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static error(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'error',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static success(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'success',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Promise<boolean>}
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
    return Alert._swal(options);
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static info(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'info',
      title,
      text,
      null,
      buttonText
    );
    return Alert._swal(options);
  }

}

export default Alert;
