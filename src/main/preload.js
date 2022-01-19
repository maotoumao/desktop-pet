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
    ipcRenderer.send('executeScript', script);
  },
  moveWindow(canMove) {
    ipcRenderer.send('moveWindow', canMove);
  },
  loadModel(modelName) {
    ipcRenderer.send('loadModel', modelName);
  },
  getModelList() {
    return ipcRenderer.sendSync('getModelList');
  },
  notification(data) {
    ipcRenderer.send('notification');
  },
});

contextBridge.exposeInMainWorld('fs', fs);
