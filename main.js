'use strict';

const { app, BrowserWindow } = require('electron');
const { createPrototypeServer } = require('./scripts/e1-server.cjs');

let server;
let origin;
function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 320, minHeight: 560,
    title: 'PolyLife E1',
    backgroundColor: '#080d15',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault(); });
  win.loadURL(`${origin}/hub-redesign/e1-strumentazione.html`);
}

app.whenReady().then(async () => {
  server = createPrototypeServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
}).catch(error => { console.error('Avvio PolyLife E1 non riuscito:', error.message); app.quit(); });

app.on('before-quit', () => { if (server) server.close(); });
app.on('window-all-closed', () => app.quit());
