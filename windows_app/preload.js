const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 配置
    getConfig: () => ipcRenderer.invoke('get-config'),
    
    // Token 管理
    saveToken: (data) => ipcRenderer.invoke('save-token', data),
    loadToken: () => ipcRenderer.invoke('load-token'),
    clearToken: () => ipcRenderer.invoke('clear-token'),
    
    // 通知
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
    
    // 导航
    navigateTo: (page) => ipcRenderer.invoke('navigate-to', page)
});
