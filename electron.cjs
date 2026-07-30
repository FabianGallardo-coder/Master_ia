const { app, BrowserWindow, shell, Menu, crashReporter, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

// CrashReporter — collect minidumps locally. No remote upload until a real
// telemetry endpoint exists; flip uploadToServer + submitUrl when it does.
app.setName('Maestro IA');
crashReporter.start({
    submitUrl: 'https://crash-reports.maestro-ia.example.com/submit',
    uploadToServer: false,
    compress: true,
    ignoreSystemCrashHandler: false,
});

// Single-instance lock: prevent multiple Electron instances from clobbering localStorage
if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
}

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// Remove default menu (kiosk feel for ADHD focus app)
Menu.setApplicationMenu(null);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        x: 100,
        y: 100,
        title: 'Maestro IA',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            autoplayPolicy: 'no-user-gesture-required',
            preload: path.join(__dirname, 'preload.cjs')
        },
        frame: false,
        autoHideMenuBar: true,
        show: true
    });

    // IPC handlers for custom titlebar
    ipcMain.on('window-minimize', () => mainWindow.minimize());
    ipcMain.on('window-close', () => mainWindow.close());
    ipcMain.handle('window-toggle-maximize', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized-changed', true));
    mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximized-changed', false));

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        if (!mainWindow) return;
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                shell.openExternal(url);
            }
        } catch (_) { /* malformed URL: silently deny */ }
        return { action: 'deny' };
    });

    // Prevent in-app navigation away from index.html
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const parsed = new URL(url);
        if (parsed.protocol !== 'file:' || parsed.pathname !== path.resolve(__dirname, 'index.html')) {
            event.preventDefault();
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                shell.openExternal(url);
            }
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
