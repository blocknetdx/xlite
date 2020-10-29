// Copyright (c) 2020 The Blocknet developers
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.
import isDev from 'electron-is-dev';

const windowMenu = (Localize, zoomController) => {

  const menuTemplate = [];

  // File Menu
  menuTemplate.push({
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  });

  // Edit Menu
  menuTemplate.push({
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' }
    ]
  });

  // View Menu
  menuTemplate.push({
    label: Localize.text('View', 'universal'),
    submenu: [
      {
        label: Localize.text('Zoom In', 'univeral'),
        click: zoomController.zoomIn
      },
      {
        label: Localize.text('Zoom Out', 'univeral'),
        click: zoomController.zoomOut
      },
      {
        type: 'separator'
      },
      {
        label: Localize.text('Reset Zoom', 'univeral'),
        click: zoomController.zoomReset
      }
    ]
  });

  // Window Menu
  if(isDev) {
    menuTemplate.push({
      label: 'Window',
      submenu: [
        { label: 'Show Dev Tools', role: 'toggledevtools' }
      ]
    });
  }

  return menuTemplate;
};

export default windowMenu;
