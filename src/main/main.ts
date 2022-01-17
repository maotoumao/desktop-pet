/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
const windowSize = {
  w: null,
  h: null,
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

/**
 * ! ipc
 */

// 获取资源
ipcMain.on('getAssets', (event, ...args) => {
  event.returnValue = getAssetPath(...args);
});

ipcMain.on('setIgnoreMouseEvents', (event, ignore) => {
  if (mainWindow) {
    if (ignore) {
      mainWindow.setIgnoreMouseEvents(true, {
        forward: true,
      });
    } else {
      mainWindow.setIgnoreMouseEvents(false);
    }
    event.returnValue = true;
  }
  event.returnValue = false;
});

ipcMain.on('executeScript', (event, script) => {
  exec(script);
});

let moveWindowTimer: NodeJS.Timeout | null = null;
ipcMain.on('moveWindow', (event, canMove) => {
  if (!mainWindow) {
    return;
  }
  if (!canMove) {
    // 清空更新
    moveWindowTimer && clearInterval(moveWindowTimer);
    return;
  }
  if (canMove && moveWindowTimer) {
    // 过滤无效行为
    clearInterval(moveWindowTimer);
  }
  const _winPos = mainWindow.getPosition();
  const winStartPos = {
    x: _winPos[0],
    y: _winPos[1],
  };
  // 会有窗口放大的bug。。。。
  const mouseStartPos = screen.getCursorScreenPoint();
  moveWindowTimer = setInterval(() => {
    const mouseCurrPos = screen.getCursorScreenPoint();
    mainWindow?.setBounds(
      {
        x: winStartPos.x + mouseCurrPos.x - mouseStartPos.x,
        y: winStartPos.y + mouseCurrPos.y - mouseStartPos.y,
        width: windowSize?.w ?? mainWindow?.getBounds()?.width,
        height: windowSize?.h ?? mainWindow?.getBounds()?.height,
      },
      true
    );
  }, 32);
});
if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const createWindow = async () => {
  const windowOptions: { [k: string]: any } = {
    show: false,
    width: 300,
    height: 500,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      devTools: false,
    },
  };
  let config;
  try {
    config = JSON.parse(
      await readFile(getAssetPath('app.json'), {
        encoding: 'utf-8',
      })
    );
  } catch {
    config = {};
  }
  const windowOptionsFilter = ['width', 'height', 'x', 'y', 'alwaysOnTop'];
  Object.entries(config?.windowOptions ?? {}).forEach(
    (entry: [string, any]) => {
      if (windowOptionsFilter.includes(entry[0])) {
        windowOptions[entry[0]] = entry[1];
      }
    }
  );

  windowSize.w = windowOptions.width;
  windowSize.h = windowOptions.height;

  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
