const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
    serverUrl: 'http://localhost:5000',
    tokenFile: path.join(app.getPath('userData'), 'token.json')
};

let mainWindow = null;
let tray = null;

// 创建主窗口
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 650,
        minWidth: 400,
        minHeight: 550,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        autoHideMenuBar: true,
        show: false
    });

    // 加载页面
    const tokenData = loadToken();
    if (tokenData && tokenData.token) {
        mainWindow.loadFile('renderer/main.html');
    } else {
        mainWindow.loadFile('renderer/login.html');
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 关闭时最小化到托盘
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

// 创建系统托盘
function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    let icon;
    
    try {
        if (fs.existsSync(iconPath)) {
            icon = nativeImage.createFromPath(iconPath);
        } else {
            // 创建一个简单的占位图标
            icon = nativeImage.createEmpty();
        }
    } catch (e) {
        icon = nativeImage.createEmpty();
    }

    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: '显示窗口', 
            click: () => {
                mainWindow.show();
                mainWindow.focus();
            }
        },
        { type: 'separator' },
        { 
            label: '退出', 
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Stellarsis');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
        mainWindow.focus();
    });
}

// Token 存储
function saveToken(data) {
    try {
        fs.writeFileSync(CONFIG.tokenFile, JSON.stringify(data), 'utf-8');
        return true;
    } catch (e) {
        console.error('保存 Token 失败:', e);
        return false;
    }
}

function loadToken() {
    try {
        if (fs.existsSync(CONFIG.tokenFile)) {
            return JSON.parse(fs.readFileSync(CONFIG.tokenFile, 'utf-8'));
        }
    } catch (e) {
        console.error('加载 Token 失败:', e);
    }
    return null;
}

function clearToken() {
    try {
        if (fs.existsSync(CONFIG.tokenFile)) {
            fs.unlinkSync(CONFIG.tokenFile);
        }
        return true;
    } catch (e) {
        console.error('清除 Token 失败:', e);
        return false;
    }
}

// 显示通知
function showNotification(title, body) {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, 'assets', 'icon.png')
        });
        notification.on('click', () => {
            mainWindow.show();
            mainWindow.focus();
        });
        notification.show();
    }
}

// IPC 处理
ipcMain.handle('get-config', () => {
    return CONFIG;
});

ipcMain.handle('save-token', (event, data) => {
    return saveToken(data);
});

ipcMain.handle('load-token', () => {
    return loadToken();
});

ipcMain.handle('clear-token', () => {
    return clearToken();
});

ipcMain.handle('show-notification', (event, title, body) => {
    showNotification(title, body);
});

ipcMain.handle('navigate-to', (event, page) => {
    if (page === 'login') {
        mainWindow.loadFile('renderer/login.html');
    } else if (page === 'main') {
        mainWindow.loadFile('renderer/main.html');
    }
});

// 应用事件
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.isQuitting = true;
});
