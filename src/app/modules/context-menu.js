class ContextMenu {

  /**
   * Opens a context menu with a copy button only
   */
  showCopyMenu() {
    window.api.contextMenu_showCopyMenu();
  }

  /**
   * Opens a context menu with a paste button only
   */
  showPasteMenu() {
    window.api.contextMenu_showPasteMenu();
  }

  /**
   * Opens a standard context menu with the regular cut, copy, paste, and select all buttons
   */
  showStandardMenu() {
    window.api.contextMenu_showStandardMenu();
  }

}

export default ContextMenu;
