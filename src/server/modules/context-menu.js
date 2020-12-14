class ContextMenu {

  /**
   * @type {Electron.Menu}
   * @private
   */
  _Menu = null;

  /**
   * @param Menu {Electron.Menu}
   */
  constructor(Menu) {
    this._Menu = Menu;
  }

  /**
   * Opens a context menu with a copy button only
   */
  showCopyMenu() {
    const menu = this._Menu.buildFromTemplate([
      {role: 'copy'}
    ]);
    menu.popup();
  }

  /**
   * Opens a context menu with a paste button only
   */
  showPasteMenu() {
    const menu = this._Menu.buildFromTemplate([
      {role: 'paste'}
    ]);
    menu.popup();
  }

  /**
   * Opens a standard context menu with the regular cut, copy, paste, and select all buttons
   */
  showStandardMenu() {
    const menu = this._Menu.buildFromTemplate([
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {type: 'separator'},
      {role: 'selectAll'},
    ]);
    menu.popup();
  }

}

export default ContextMenu;
