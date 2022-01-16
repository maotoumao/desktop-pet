const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs/promises');

contextBridge.exposeInMainWorld('common', {
  getAssets(...paths) {
    return ipcRenderer.sendSync('getAssets', ...paths);
  },
  setIgnoreMouseEvents(ignore) {
    return ipcRenderer.sendSync('setIgnoreMouseEvents', ignore);
  },
  executeScript(script) {
    return ipcRenderer.send('executeScript', script);
  },
});

contextBridge.exposeInMainWorld('fs', fs);
