// 全局变量
let socket = null;
let tokenData = null;
let lastUnreadCount = 0;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化 Material Design 按钮涟漪效果
    document.querySelectorAll('.mdc-button').forEach(el => {
        mdc.ripple.MDCRipple.attachTo(el);
    });

    // 加载 Token
    tokenData = await window.electronAPI.loadToken();
    if (!tokenData || !tokenData.token) {
        window.electronAPI.navigateTo('login');
        return;
    }

    // 显示用户名
    const userName = tokenData.user?.nickname || tokenData.user?.username || '用户';
    document.getElementById('userName').textContent = userName;

    // 初始化 WebSocket
    initWebSocket();

    // 绑定按钮事件
    document.getElementById('refreshBtn').addEventListener('click', refreshUnread);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

// 初始化 WebSocket 连接
function initWebSocket() {
    const serverUrl = tokenData.serverUrl || 'http://localhost:5000';
    
    updateStatus('正在连接服务器...');
    updateConnectionStatus(false);

    // 创建 Socket.IO 连接，使用 token 认证
    socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        auth: {
            token: tokenData.token
        },
        query: {
            token: tokenData.token
        }
    });

    // 连接成功
    socket.on('connect', () => {
        console.log('WebSocket 已连接');
        updateStatus('已连接');
        updateConnectionStatus(true);
        
        // 请求未读消息
        socket.emit('get_unread_notifications', { token: tokenData.token });
    });

    // 连接断开
    socket.on('disconnect', (reason) => {
        console.log('WebSocket 断开:', reason);
        updateStatus('连接断开，正在重连...');
        updateConnectionStatus(false);
    });

    // 连接错误
    socket.on('connect_error', (error) => {
        console.error('连接错误:', error);
        updateStatus('连接失败: ' + error.message);
        updateConnectionStatus(false);
    });

    // 接收未读消息更新
    socket.on('unread_notifications', (data) => {
        console.log('收到未读通知:', data);
        if (data.success) {
            updateUnreadUI(data);
            
            // 如果未读数增加，发送系统通知
            if (data.total_unread > lastUnreadCount && data.total_unread > 0) {
                sendNotification(data);
            }
            lastUnreadCount = data.total_unread;
        }
    });

    // 接收新消息通知（实时推送）
    socket.on('new_message_notification', (data) => {
        console.log('收到新消息通知:', data);
        // 请求更新未读数
        socket.emit('get_unread_notifications', { token: tokenData.token });
    });

    // 认证失败
    socket.on('auth_error', (data) => {
        console.error('认证错误:', data);
        updateStatus('认证失败，请重新登录');
        setTimeout(() => {
            handleLogout();
        }, 2000);
    });

    // 心跳
    setInterval(() => {
        if (socket && socket.connected) {
            socket.emit('heartbeat');
        }
    }, HEARTBEAT_INTERVAL);
}

// 刷新未读消息
function refreshUnread() {
    if (socket && socket.connected) {
        updateStatus('正在刷新...');
        socket.emit('get_unread_notifications', { token: tokenData.token });
    } else {
        updateStatus('未连接，正在重连...');
        initWebSocket();
    }
}

// 更新未读消息 UI
function updateUnreadUI(data) {
    const totalUnread = data.total_unread || 0;
    
    // 计算聊天和论坛未读数
    let chatCount = 0;
    let forumCount = 0;
    
    if (data.chat) {
        Object.values(data.chat).forEach(item => {
            chatCount += item.count || 0;
        });
    }
    
    if (data.forum) {
        Object.values(data.forum).forEach(item => {
            forumCount += item.count || 0;
        });
    }

    document.getElementById('totalUnread').textContent = totalUnread;
    document.getElementById('chatUnread').textContent = chatCount + ' 条';
    document.getElementById('forumUnread').textContent = forumCount + ' 条';

    const now = new Date().toLocaleTimeString();
    updateStatus('上次更新: ' + now);
}

// 发送系统通知
function sendNotification(data) {
    let chatCount = 0;
    let forumCount = 0;
    
    if (data.chat) {
        Object.values(data.chat).forEach(item => {
            chatCount += item.count || 0;
        });
    }
    
    if (data.forum) {
        Object.values(data.forum).forEach(item => {
            forumCount += item.count || 0;
        });
    }

    const parts = [];
    if (chatCount > 0) parts.push(chatCount + ' 条聊天消息');
    if (forumCount > 0) parts.push(forumCount + ' 条论坛更新');

    const body = parts.length > 0 
        ? '您有 ' + parts.join('，')
        : '您有 ' + data.total_unread + ' 条未读消息';

    window.electronAPI.showNotification('Stellarsis - 新消息', body);
}

// 登出
async function handleLogout() {
    try {
        // 断开 WebSocket
        if (socket) {
            socket.disconnect();
            socket = null;
        }

        // 通知服务器登出
        if (tokenData && tokenData.token) {
            const serverUrl = tokenData.serverUrl || 'http://localhost:5000';
            await fetch(`${serverUrl}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + tokenData.token
                }
            }).catch(() => {});
        }

        // 清除本地 Token
        await window.electronAPI.clearToken();

        // 跳转到登录页
        window.electronAPI.navigateTo('login');
    } catch (error) {
        console.error('登出错误:', error);
        window.electronAPI.navigateTo('login');
    }
}

// 配置常量
const HEARTBEAT_INTERVAL = 30000; // 30秒心跳间隔

// 更新状态文本
function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

// 更新连接状态图标
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const iconSpan = statusEl.querySelector('.material-icons') || document.createElement('span');
    iconSpan.className = 'material-icons';
    
    if (connected) {
        statusEl.className = 'connection-status connected';
        iconSpan.textContent = 'wifi';
    } else {
        statusEl.className = 'connection-status disconnected';
        iconSpan.textContent = 'wifi_off';
    }
    
    if (!statusEl.contains(iconSpan)) {
        statusEl.appendChild(iconSpan);
    }
}
