const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => {
    ipcRenderer.invoke('window-toggle-maximize');
  },
  close: () => ipcRenderer.send('window-close'),
  onMaximizeChange: (callback) => {
    ipcRenderer.on('window-maximized-changed', (_e, v) => callback(v));
  }
});
