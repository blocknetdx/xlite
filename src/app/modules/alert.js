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
  static async alert(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      null,
      buttonText
    );
    const res = await Alert._swal(options);
    return res ? true : false;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Promise<boolean>}
   */
  static async confirm(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText()) {
    const options = Alert._constructSwalConfiguration(
      '',
      title,
      text,
      null,
      confirmButtonText,
      cancelButtonText
    );
    const res = await Alert._swal(options);
    return res ? true : false;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @param obscure {boolean}
   * @returns {Promise<boolean>}
   */
  static async prompt(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText(), obscure = false) {
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
    const res = await Alert._swal(options);
    return res ? res : '';
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static async error(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'error',
      title,
      text,
      null,
      buttonText
    );
    const res = await Alert._swal(options);
    return res ? true : false;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static async success(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'success',
      title,
      text,
      null,
      buttonText
    );
    const res = await Alert._swal(options);
    return res ? true : false;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param confirmButtonText {string}
   * @param cancelButtonText {string}
   * @returns {Promise<boolean>}
   */
  static async warning(title = '', text = '', confirmButtonText = Alert._defaultConfirmText(), cancelButtonText = Alert._defaultCancelText()) {
    const options = Alert._constructSwalConfiguration(
      'warning',
      title,
      text,
      null,
      confirmButtonText,
      cancelButtonText
    );
    const res = await Alert._swal(options);
    return res ? true : false;
  }

  /**
   * @param title {string}
   * @param text {string}
   * @param buttonText {string}
   * @returns {Promise<boolean>}
   */
  static async info(title = '', text = '', buttonText = Alert._defaultConfirmText()) {
    const options = Alert._constructSwalConfiguration(
      'info',
      title,
      text,
      null,
      buttonText
    );
    const res = await Alert._swal(options);
    return res ? true : false;
  }

}

export default Alert;
