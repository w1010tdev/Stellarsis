// 全局变量
let chatSocket = null;
let chatHistoryLoaded = false;
let followedUserIds = new Set();  // 关注的用户ID集合
let lastMessageId = 0;
let onlineUsers = [];
let roomPermission = 'Null';


// 添加变量来跟踪最后的消息日期
let lastMessageDate = null;

let roomId = null;
let userId = null;
let messageQueue = [];
let isRenderingReady = false;
let renderRetryCount = 0;
const MAX_RENDER_RETRY = 3;
let processedMessageIds = new Set();
const processedContentHashes = new Set();
const pendingMessages = new Map();
// 扩展已处理消息集合，区分不同类型
const processedSystemEvents = new Map(); // {eventType_userId_timestamp: true}
const recentSystemMessages = new Map(); // 防止重复系统消息
function setupOnlineListModal() {
    const modal = document.getElementById('online-list-modal');
    const showButton = document.getElementById('show-online-list');
    const onlineCountElement = document.getElementById('online-count');

    if (!showButton || !modal) {
        console.error('在线名单模态框元素缺失');
        return;
    }

    const closeButton = modal.querySelector('.modal-close');
    if (!closeButton) {
        console.error('模态框关闭按钮缺失');
        return;
    }

    // 显示模态框：使用类以触发 CSS 过渡（与 main.css 的 .modal-backdrop.show/.active 配合）
    showButton.addEventListener('click', function () {
        // 先把用户列表清空并请求最新数据
        updateOnlineUsersList();  // 直接更新，而不是通过WebSocket事件

        // 添加显示类以触发可见性和过渡
        modal.classList.add('show');
    });

    // 关闭模态框：先移除 active（触发淡出），transitionend 处理最终隐藏
    closeButton.addEventListener('click', function () {
        modal.classList.remove('show');
    });

    // 点击模态框外部关闭
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
    console.log('在线名单模态框已设置');
}
function updateConnectionStatus(status, message) {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;

    // 更新文本
    statusElement.textContent = message;

    // 更新样式
    statusElement.className = 'chat-status';
    if (status === 'connected') {
        statusElement.classList.add('status-connected');
    } else if (status === 'connecting') {
        statusElement.classList.add('status-connecting');
    } else if (status === 'disconnected') {
        statusElement.classList.add('status-disconnected');
    } else if (status === 'error') {
        statusElement.classList.add('status-error');
    }
}
// 初始化渲染系统
function initializeRenderingSystem() {
    // 如果renderContent函数已经存在，直接使用它
    if (typeof window.renderContent !== 'function') {
        // 定义渲染函数，包含完整的降级方案
        window.renderContent = function (content) {
            try {
                // 安全检查：确保marked可用
                if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                    return marked.parse(content);
                }
                // 降级到简单HTML渲染
                return simpleHtmlRender(content);
            } catch (e) {
                console.warn('高级渲染失败，使用降级方案:', e);
                return simpleHtmlRender(content);
            }
        };

        // 简单HTML渲染作为备选方案
        function simpleHtmlRender(content) {
            // 基本的Markdown行内元素支持
            let html = escapeHtml(content)
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');

            return `<div class="plaintext-render">${html}</div>`;
        }
    }

    // 触发渲染就绪事件
    document.dispatchEvent(new Event('renderReady'));
    isRenderingReady = true;
    console.log('渲染系统已初始化');
}

// 安全的HTML转义
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 生成内容哈希
function generateContentHash(content, timestamp) {
    // 简单哈希：截取内容前50字符 + 时间戳（精确到秒）
    const contentSnippet = content.substring(0, 50);
    const timeKey = new Date(timestamp).getTime() / 1000 | 0;  // 精确到秒
    return btoa(encodeURIComponent(`${contentSnippet}|${timeKey}`)).substring(0, 16);
}

// 统一时间格式化函数（UTC+8时区）
function formatTimeDisplay(timestamp) {
    // 将UTC时间转换为UTC+8（北京时间）
    const date = new Date(timestamp);
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);

    // 获取日期部分
    const year = beijingTime.getFullYear();
    const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
    const day = beijingTime.getDate().toString().padStart(2, '0');

    // 获取时间部分
    const hours = beijingTime.getHours().toString().padStart(2, '0');
    const minutes = beijingTime.getMinutes().toString().padStart(2, '0');

    // 格式化为 "YYYY-MM-DD HH:MM"
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 获取消息日期部分（仅日期）
function getMessageDate(timestamp) {
    // 将UTC时间转换为UTC+8（北京时间）
    const date = new Date(timestamp);
    const beijingTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);

    // 获取日期部分
    const year = beijingTime.getFullYear();
    const month = (beijingTime.getMonth() + 1).toString().padStart(2, '0');
    const day = beijingTime.getDate().toString().padStart(2, '0');

    // 格式化为 "YYYY-MM-DD"
    return `${year}-${month}-${day}`;
}

// 全局变量 - 需要从页面数据获取
var currentUsername = '用户';
var currentNickname = '用户';
var currentUserColor = '#000000';
var currentUserBadge = '';
var currentUserId = 0;

// 更健壮的渲染就绪检测
function waitForRenderSystem(callback) {
    const checkInterval = setInterval(() => {
        try {
            // 检查渲染系统是否真正可用
            if (typeof window.renderContent === 'function') {
                // 尝试渲染测试内容
                window.renderContent('**test**');
                clearInterval(checkInterval);
                callback();
                return;
            }
        } catch (e) {
            console.debug('渲染系统尚未完全就绪:', e);
        }
    }, 200);

    // 超时处理
    setTimeout(() => {
        clearInterval(checkInterval);
        if (!isRenderingReady) {
            console.warn('渲染系统加载超时，强制初始化降级方案');
            initializeRenderingSystem(); // 使用降级方案
            callback();
        }
    }, 3000);
}



// 加载聊天历史
function loadChatHistory() {
    if (chatHistoryLoaded) return;

    fetch(`/api/chat/${roomId}/history`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const messagesContainer = document.getElementById('chat-messages');
            if (!messagesContainer) return;

            // 重置日期跟踪变量，以便在加载历史时能正确显示日期分隔符
            lastMessageDate = null;

            // 保存当前滚动位置
            const isScrolledToBottom = Math.abs(
                messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight
            ) < 5;

            data.messages.forEach(msg => {
                addMessageToUI(msg, 0, 1);
                // 记录历史消息ID，防止与随后收到的实时消息重复渲染
                if (msg.id) {
                    processedMessageIds.add(msg.id);
                }
            });

            // 更新最后一条消息ID
            if (data.messages.length > 0) {
                lastMessageId = data.messages[data.messages.length - 1].id;
                // 设置最后消息日期为最后一条消息的日期
                lastMessageDate = getMessageDate(data.messages[data.messages.length - 1].timestamp);
            }

            // 如果之前滚动到底部，则滚动到底部
            if (isScrolledToBottom) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            chatHistoryLoaded = true;
        })
        .catch(error => {
            console.error('加载历史消息失败:', error);
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML +=
                    `<div class="chat-error">加载历史消息失败: ${error.message}</div>`;
            }
        });
}

// 设置轮询（老旧浏览器降级方案）
function setupPolling() {
    console.log('使用轮询作为WebSocket的降级方案');

    // 每5秒检查一次新消息
    setInterval(() => {
        if (lastMessageId > 0) {
            fetch(`/api/chat/${roomId}/history?offset=0&limit=50`)
                .then(response => response.json())
                .then(data => {
                    const messagesContainer = document.getElementById('chat-messages');
                    if (!messagesContainer) return;
                    let hasNewMessages = false;
                    data.messages.forEach(msg => {
                        // skip if we've already processed this server id
                        if (msg.id && processedMessageIds.has(msg.id)) return;

                        // Try to match this server message to a pending local message
                        let matched = false;
                        const serverContent = msg.content || msg.message || '';
                        const serverTsMs = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();

                        if (serverContent && pendingMessages.size > 0) {
                            for (const [cid, pending] of pendingMessages.entries()) {
                                try {
                                    // Exact content match + reasonable time window (30s)
                                    const pendingSent = pending.sentTime || pending.timestamp || 0;
                                    // allow match when content equals and timestamps within 30s OR the calendar date matches (tolerate timezone differences)
                                    const serverDateIso = new Date(serverTsMs).toISOString().slice(0,10);
                                    const pendingDateIso = new Date(pendingSent).toISOString().slice(0,10);
                                    if (pending.content === serverContent && (Math.abs(serverTsMs - pendingSent) < 30000 || serverDateIso === pendingDateIso)) {
                                        console.debug('Polling matched pending by content/time (or same-date)', cid, '->', msg.id, 'serverDate=', serverDateIso, 'pendingDate=', pendingDateIso);
                                        updateExistingMessage(cid, msg);
                                        pendingMessages.delete(cid);
                                        processedMessageIds.add(msg.id || cid);
                                        matched = true;
                                        break;
                                    }

                                    // Fallback: compare simplified content/time hash
                                    const pendingHash = generateContentHash(pending.content || '', pending.timestamp || pending.sentTime || Date.now());
                                    const serverHash = generateContentHash(serverContent, msg.timestamp || Date.now());
                                    if (pendingHash === serverHash) {
                                        console.debug('Polling matched pending by hash', cid, '->', msg.id);
                                        updateExistingMessage(cid, msg);
                                        pendingMessages.delete(cid);
                                        processedMessageIds.add(msg.id || cid);
                                        matched = true;
                                        break;
                                    }
                                } catch (e) {
                                    console.debug('Polling pending match error for', cid, e);
                                }
                            }
                        }

                        if (!matched) {
                            // New message for UI
                            addMessageToUI(msg, 0, 1);
                            if (msg.id) processedMessageIds.add(msg.id);
                            hasNewMessages = true;
                        } else {
                            // matched — still update lastMessageId if necessary
                            hasNewMessages = true;
                        }

                        // 更新最后一条消息ID
                        if (msg.id && msg.id > lastMessageId) {
                            lastMessageId = msg.id;
                        }
                    });

                    if (hasNewMessages) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                })
                .catch(error => {
                    console.error('轮询获取消息失败:', error);
                });
        }
    }, 5000);

    // 每30秒更新在线状态
    setInterval(updateOnlineStatus, 30000);
}

// 设置WebSocket
function setupWebSocket() {
    // 检查WebSocket支持
    if (typeof io === 'undefined') {
        console.log('socket.io 未加载，使用轮询代替');
        setupPolling();
        return;
    }

    try {
        chatSocket = io('/', {
            path: '/socket.io',
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            transports: ['websocket', 'polling']
        });

        chatSocket.on('connect', () => {
            console.log('WebSocket连接已建立');
            updateConnectionStatus('connected', '已连接');
            if (!chatSocket.hasJoinedRoom) {
                // 加载关注列表
                fetch('/api/follow/following')
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            followedUserIds = new Set(data.following.map(u => u.id));
                            console.log('已加载关注用户:', Array.from(followedUserIds));
                        }
                    })
                    .catch(err => {
                        console.error('加载关注列表失败:', err);
                        // 可选：降级为本地存储（但你要求后端存储，故不处理）
                    });

                chatSocket.emit('join', { room: roomId });
                chatSocket.hasJoinedRoom = true;
            }

            updateOnlineStatus();
        });

        chatSocket.on('disconnect', (reason) => {
            console.log('WebSocket断开连接:', reason);
            const onlineCountElement = document.getElementById('online-count');
            if (onlineCountElement) {
                onlineCountElement.textContent = '连接中...';
            }

            // 尝试重新连接
            if (reason !== 'io server disconnect') {
                updateConnectionStatus('disconnected', '服务器断开连接，请重新连接');
                setTimeout(() => {
                    if (chatSocket && !chatSocket.connected) {
                        setupWebSocket();
                    }
                }, 5000);
            }
            else {
                updateConnectionStatus('connecting', '连接丢失，尝试重新连接...');
            }
        });

        chatSocket.on('connect_error', (error) => {
            console.error('WebSocket连接错误:', error);
            const onlineCountElement = document.getElementById('online-count');
            if (onlineCountElement) {
                onlineCountElement.textContent = '连接错误';
            }
            updateConnectionStatus('error', '连接错误: ' + (error.message || '未知错误'));
            // 尝试轮询作为后备
            setTimeout(setupPolling, 3000);
        });

        chatSocket.on('permission_denied', (payload = {}) => {
            console.warn('聊天权限不足:', payload);
            addStatusMessage(payload.message || '当前权限不足，无法完成该操作');
        });

        chatSocket.on('message', (data) => {
            let handled = false;
            if (data.id && pendingMessages.size > 0) {
                const serverContent = data.content || data.message || '';
                if (serverContent) {
                    let matchedClientId = null;
                    for (const [cid, pending] of pendingMessages.entries()) {
                        try {
                            console.debug('检查 pending:', cid, 'content=', pending.content, 'sentTime=', pending.sentTime, 'serverContent=', serverContent, 'serverTimestamp=', data.timestamp);
                            // 精确内容+时间匹配（优先）
                            if (pending.content === serverContent) {
                                const serverTime = data.timestamp ? new Date(data.timestamp).getTime() : 0;
                                const sentTime = pending.sentTime || 0;
                                const serverDateIso = serverTime ? new Date(serverTime).toISOString().slice(0,10) : '';
                                const pendingDateIso = sentTime ? new Date(sentTime).toISOString().slice(0,10) : '';
                                if (!serverTime || Math.abs(serverTime - sentTime) < 15000 || (serverDateIso && pendingDateIso && serverDateIso === pendingDateIso)) {
                                    matchedClientId = cid;
                                    console.debug('精确匹配通过:', cid, 'serverDate=', serverDateIso, 'pendingDate=', pendingDateIso);
                                    break;
                                }
                            }
                        } catch (err) {
                            console.debug('pending match check failed for', cid, err);
                        }
                    }

                    if (matchedClientId) {
                        console.debug('Matched pending message by content/time/hash to client_id=', matchedClientId, 'server id=', data.id);
                        updateExistingMessage(matchedClientId, data);
                        pendingMessages.delete(matchedClientId);
                        if (data.id) processedMessageIds.add(data.id); else processedMessageIds.add(matchedClientId);
                        handled = true;
                    }
                }
            }
            // 简单去重：如果已经处理过相同的服务器消息ID，则忽略
            if (data.id && processedMessageIds.has(data.id)) {
                console.debug('忽略重复的服务器消息:', data.id);
                return;
            }
            // 如果上述都没匹配到，则这是一个新的消息（普通逻辑）
            if (!handled) {
                console.debug('未匹配到任何 pending，作为新消息添加，serverId=', data.id);
                addMessageToUI(data);
                if (data.id) processedMessageIds.add(data.id);
            }

            // 控制已处理集合大小，避免无限增长
            if (processedMessageIds.size > 1000) {
                const it = processedMessageIds.values();
                for (let i = 0; i < 200; i++) {
                    const v = it.next().value;
                    if (v) processedMessageIds.delete(v);
                }
            }
        });

        chatSocket.on('online_users', (data) => {
            onlineUsers = data.users || [];
            updateOnlineCount();
        });

        // 监听用户进出事件（用于关注通知） - 使用 addMessageToUI 以利用已存在的系统事件去重逻辑
        chatSocket.on('user_join', (data) => {
            const msg = {
                type: 'join',
                user_id: data.user_id,
                username: data.username,
                nickname: data.nickname || data.username,
                timestamp: data.timestamp || new Date().toISOString(),
                content: ''
            };
            if (followedUserIds.has(data.user_id)) {
                addMessageToUI(msg);
            }
        });

        chatSocket.on('user_leave', (data) => {
            const msg = {
                type: 'leave',
                user_id: data.user_id,
                username: data.username,
                nickname: data.nickname || data.username,
                timestamp: data.timestamp || new Date().toISOString(),
                content: ''
            };
            if (followedUserIds.has(data.user_id)) {
                addMessageToUI(msg);
            }
        });
    } catch (e) {
        console.error('WebSocket初始化失败:', e);
        setupPolling();
    }
}

// 切换关注
function toggleFollowUser(userId) {
    fetch('/api/follow/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.action === 'follow') {
                    followedUserIds.add(userId);
                } else {
                    followedUserIds.delete(userId);
                }
                updateOnlineUsersList(); // 刷新按钮状态
            }
        })
        .catch(err => console.error('关注操作失败:', err));
}

// 更新在线状态
function updateOnlineStatus() {
    if (chatSocket) {
        chatSocket.emit('get_online_users', { room_id: roomId });
    } else {
        // 轮询模式下，简单更新在线人数
        fetch('/api/online_count')
            .then(response => response.json())
            .then(data => {
                const onlineCountElement = document.getElementById('online-count');
                if (onlineCountElement) {
                    onlineCountElement.textContent = data.count || '未知';
                }
            })
            .catch(error => {
                console.error('更新在线状态失败:', error);
            });
    }
}

// 更新在线用户列表
function updateOnlineUsersList() {
    const list = document.getElementById('online-users-list');
    if (!list) return;

    list.innerHTML = '';

    if (!onlineUsers || onlineUsers.length === 0) {
        const li = document.createElement('li');
        li.textContent = '没有在线用户';
        list.appendChild(li);
        return;
    }

    onlineUsers.forEach(user => {
        const li = document.createElement('li');
        li.className = 'online-user-item';

        // 构建用户显示
        let userDisplay = '';
        if (user.badge) {
            userDisplay += `<span class="user-badge" style="background-color:${user.color}">${user.badge}</span> `;
        }
        userDisplay += `<span class="user-name" style="color:${user.color}">${user.nickname || user.username}</span>`;

        // 关注按钮
        const followBtn = document.createElement('button');
        followBtn.className = 'follow-btn ' + (followedUserIds.has(user.id) ? 'following' : '');
        followBtn.textContent = followedUserIds.has(user.id) ? '✓' : '+';
        // styling handled by CSS (.follow-btn)
        followBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFollowUser(user.id);
        };
        li.innerHTML = userDisplay;
        li.appendChild(followBtn);
        list.appendChild(li);
    });
}

// 更新在线人数显示
function updateOnlineCount() {
    const onlineCountElement = document.getElementById('online-count');
    if (onlineCountElement) {
        onlineCountElement.textContent = onlineUsers.length;
    }
}

function canSendMessages() {
    return roomPermission === 'su' || roomPermission === '777';
}

// 发送消息
function sendMessage() {
    if (!canSendMessages()) {
        addStatusMessage('当前权限仅允许查看消息');
        return;
    }
    const messageInput = document.getElementById('message-text');
    if (!messageInput) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // 生成唯一客户端ID
    const clientId = 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

    // 保存到待确认消息集合
    pendingMessages.set(clientId, {
        content: message,
        timestamp: new Date().toISOString(),
        sentTime: Date.now()
    });

    // 清空输入框
    messageInput.value = '';

    // 通过WebSocket发送
    if (chatSocket && chatSocket.connected) {
        // 本地预览
            // 本地预览
            // include both id and client_id on the local preview so server echoes can be matched
            const localMessage = {
                id: clientId,
                client_id: clientId,
            content: message,
            timestamp: new Date().toISOString(),
            user_id: currentUserId,
            username: currentUsername,
            nickname: currentNickname,
            color: currentUserColor,
            badge: currentUserBadge,
            isPending: true  // 标记为待确认
        };

        addMessageToUI(localMessage, true);

        chatSocket.emit('send_message', {
            room_id: roomId,
            message: message,
            client_id: clientId  // 发送客户端ID
        });
    } else {
        // WebSocket不可用，使用AJAX
        fetch('/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                room_id: roomId,
                message: message
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('发送消息失败');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // 消息发送成功后，添加到UI
                    const sentMessage = {
                        id: 'sent-' + Date.now(),
                        content: message,
                        timestamp: new Date().toISOString(),
                        user_id: currentUserId,
                        username: currentUsername,
                        nickname: currentNickname,
                        color: currentUserColor,
                        badge: currentUserBadge
                    };

                    addMessageToUI(sentMessage, true);
                }
            })
            .catch(error => {
                console.error('发送消息失败:', error);
                // 显示错误
                const errorElement = document.createElement('div');
                errorElement.className = 'chat-error';
                errorElement.textContent = '消息发送失败，请检查网络连接';
                document.getElementById('chat-messages').appendChild(errorElement);
            });
    }
}

// 设置消息输入
function setupMessageInput() {
    const sendButton = document.getElementById('send-button');
    const messageInput = document.getElementById('message-text');

    if (!canSendMessages()) {
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.textContent = '仅可查看';
        }
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = '当前权限仅允许查看';
        }
        return;
    }

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        // 使用 keydown 以便检测 ctrl/meta 键
        messageInput.addEventListener('keydown', function (e) {
            // Ctrl+Enter 或 Meta(Command)+Enter：插入换行
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const val = this.value;
                this.value = val.slice(0, start) + '\n' + val.slice(end);
                // 将光标移动到新行之后
                this.selectionStart = this.selectionEnd = start + 1;
                // 触发 input 事件以便页面逻辑（如自动调整高度）能响应
                this.dispatchEvent(new Event('input'));
                return;
            }

            // Enter 无 Shift/Ctrl/Meta：发送消息
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                sendMessage();
                return;
            }
        });
    }

    // 移动端：聚焦时确保消息区滚动到底部，避免被软键盘遮挡
    function ensureInputVisible() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        // 延迟以等待软键盘或布局调整
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 150);
    }

    if (messageInput) {
        messageInput.addEventListener('focus', ensureInputVisible);
        messageInput.addEventListener('input', ensureInputVisible);
        window.addEventListener('resize', ensureInputVisible);
    }

    // 移动端在线列表浮动按钮（如果存在）绑定到现有显示逻辑
    const mobileOnlineBtn = document.getElementById('show-online-list-mobile');
    const showOnlineBtn = document.getElementById('show-online-list');
    if (mobileOnlineBtn) {
        mobileOnlineBtn.addEventListener('click', function () {
            // 优先复用已有的显示逻辑
            if (showOnlineBtn) {
                showOnlineBtn.click();
            } else {
                const modal = document.getElementById('online-list-modal');
                if (modal) modal.classList.add('show');
            }
        });
    }
}


// 添加消息到UI
function addMessageToUI(msg, isLocal = false, his = false) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    if (his) {
        isLocal = (msg.user_id == userId);
        his=0;
    }
    if (msg.user_id == userId && !isLocal) return;
    // 2. 特殊处理系统消息
    if (msg.type === 'system' || msg.type === 'join' || msg.type === 'leave') {
        const eventKey = `${msg.type}_${msg.user_id}_${Math.floor(new Date(msg.timestamp).getTime() / 60000)}`;
        if (processedSystemEvents.has(eventKey)) {
            return;
        }
        processedSystemEvents.set(eventKey, true);

        // 限制系统事件缓存大小，避免内存泄漏
        if (processedSystemEvents.size > 100) {
            const keys = Array.from(processedSystemEvents.keys());
            for (let i = 0; i < 20; i++) {
                processedSystemEvents.delete(keys[i]);
            }
        }
    }

    // 创建并添加消息元素
    const messageElement = createMessageElement(msg, isLocal);
    // 添加到容器
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}



// 添加状态消息
function addStatusMessage(msg) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    // 生成消息指纹
    const messageFingerprint = msg.substring(0, 50); // 取前50个字符
    const now = Date.now();

    // 检查是否最近已显示相同消息
    if (recentSystemMessages.has(messageFingerprint)) {
        const lastShown = recentSystemMessages.get(messageFingerprint);
        if (now - lastShown < 5000) { // 5秒内不重复显示
            return;
        }
    }

    recentSystemMessages.set(messageFingerprint, now);

    // 清理旧记录
    setTimeout(() => {
        if (recentSystemMessages.get(messageFingerprint) === now) {
            recentSystemMessages.delete(messageFingerprint);
        }
    }, 10000);

    const statusElement = document.createElement('div');
    statusElement.className = 'chat-status';
    statusElement.textContent = msg;

    messagesContainer.appendChild(statusElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 更新现有消息
function updateExistingMessage(clientId, serverMessage) {
    // Allow call with just the serverMessage
    if (typeof clientId === 'object' && clientId !== null && !serverMessage) {
        serverMessage = clientId;
        clientId = serverMessage.client_id || null;
    }

    if (!serverMessage) {
        console.debug('updateExistingMessage: missing serverMessage');
        return;
    }

    const serverId = serverMessage.id;
    const serverClientId = serverMessage.client_id || null;
    console.debug('updateExistingMessage: start lookup', { clientId, serverId, serverClientId });

    let existingMessage = null;

    // 1) direct clientId match
    if (clientId) {
        existingMessage = document.querySelector(`[data-message-id="${clientId}"]`);
        if (existingMessage) console.debug('updateExistingMessage: found by clientId selector', clientId);
    }

    // 2) match serverClientId (server echoed our client_id)
    if (!existingMessage && serverClientId) {
        existingMessage = document.querySelector(`[data-message-id="${serverClientId}"]`);
        if (existingMessage) console.debug('updateExistingMessage: found by server.client_id selector', serverClientId);
    }

    // 3) match serverId (maybe UI already added server id as data attr)
    if (!existingMessage && serverId) {
        existingMessage = document.querySelector(`[data-message-id="${serverId}"]`);
        if (existingMessage) console.debug('updateExistingMessage: found by server id selector', serverId);
    }

    // 4) try other common temporary-data attributes
    if (!existingMessage) {
        const altAttrs = ['data-client-id', 'data-temp-id', 'data-tempid', 'data-message-temp'];
        for (const a of altAttrs) {
            try {
                const sel = `[${a}="${clientId || serverClientId || ''}"]`;
                if ((clientId || serverClientId) && document.querySelector(sel)) {
                    existingMessage = document.querySelector(sel);
                    if (existingMessage) {
                        console.debug('updateExistingMessage: found by alt attr', a);
                        break;
                    }
                }
            } catch (e) {
                // ignore malformed selectors
            }
        }
    }

    // 5) fallback: scan pending elements and match by originalContent + username OR hash + time
    if (!existingMessage) {
        const pendingEls = document.querySelectorAll('.chat-message.pending-message');
        const targetContent = (serverMessage.content || serverMessage.message || '').trim();
        const targetUser = (serverMessage.nickname || serverMessage.username || currentNickname || currentUsername);
        const serverTsMs = serverMessage.timestamp ? new Date(serverMessage.timestamp).getTime() : null;

        for (const el of pendingEls) {
            try {
                const contentEl = el.querySelector('.message-content');
                const userEl = el.querySelector('.message-username');
                const original = contentEl && contentEl.dataset ? (contentEl.dataset.originalContent || '').trim() : '';
                const username = userEl ? userEl.textContent && userEl.textContent.trim() : '';

                // exact original content + username match
                if (original && targetContent && original === targetContent && username === (currentNickname || currentUsername)) {
                    existingMessage = el;
                    console.debug('updateExistingMessage: matched pending by original content + username');
                    break;
                }

                // time-tolerant match if element stores sentTime
                const sentAttr = el.dataset.sentTime || el.getAttribute('data-sent-time');
                const sentMs = sentAttr ? Number(sentAttr) : null;
                if (original && targetContent && sentMs && serverTsMs && Math.abs(serverTsMs - sentMs) < 60000 && normalizeWhitespace(original) === normalizeWhitespace(targetContent)) {
                    existingMessage = el;
                    console.debug('updateExistingMessage: matched pending by content+time tolerance', { sentMs, serverTsMs });
                    break;
                }

                // hash fallback
                const elHash = generateContentHash(original || '', sentMs || Date.now());
                const serverHash = generateContentHash(targetContent || '', serverTsMs || Date.now());
                if (elHash === serverHash) {
                    existingMessage = el;
                    console.debug('updateExistingMessage: matched pending by hash fallback', elHash);
                    break;
                }
            } catch (e) {
                console.debug('updateExistingMessage: error inspecting pending element', e);
            }
        }
    }

    if (!existingMessage) {
        console.debug('updateExistingMessage: could not find pending element for', { clientId, serverId, serverClientId });
        return;
    }

    // At this point we have the element to update
    const oldId = existingMessage.dataset.messageId || (clientId || serverClientId || null);
    try {
        // set new id
        if (serverId) existingMessage.dataset.messageId = serverId; else if (serverClientId) existingMessage.dataset.messageId = serverClientId;

        // update timestamp display
        const timeElement = existingMessage.querySelector('.message-time');
        if (timeElement) timeElement.textContent = formatTimeDisplay(serverMessage.timestamp || new Date().toISOString());

        // remove pending marker
        existingMessage.classList.remove('pending-message');

        // update rendered content
        const contentElement = existingMessage.querySelector('.message-content');
        if (contentElement) {
            contentElement.dataset.originalContent = serverMessage.content || serverMessage.message || contentElement.dataset.originalContent || '';
            try {
                if (typeof window.renderContent === 'function') {
                    contentElement.innerHTML = window.renderContent(contentElement.dataset.originalContent);
                } else {
                    contentElement.innerHTML = `<div class="render-fallback">${escapeHtml(contentElement.dataset.originalContent)}</div>`;
                }
            } catch (e) {
                console.warn('updateExistingMessage: rendering replacement failed', e);
            }
        }

        // update processedMessageIds set
        try {
            if (oldId && processedMessageIds.has(oldId)) processedMessageIds.delete(oldId);
            if (serverId) processedMessageIds.add(serverId);
        } catch (e) {
            console.debug('updateExistingMessage: processedMessageIds update error', e);
        }

        // ensure delete button present if permitted
        try {
            const confirmedMessage = document.querySelector(`[data-message-id="${serverId || serverClientId}"]`);
            if (confirmedMessage) {
                const hasDel = confirmedMessage.querySelector('.message-delete-btn');
                // If a delete button already exists it may still have an old click handler
                // bound to the temporary id. Replace it so it uses the authoritative id.
                if (hasDel) {
                    try {
                        const replaced = hasDel.cloneNode(true);
                        hasDel.parentNode.replaceChild(replaced, hasDel);
                        // rebind new handler
                        replaced.addEventListener('click', function (e) {
                            e.stopPropagation();
                            deleteChatMessage(serverId || serverClientId, confirmedMessage);
                        });
                    } catch (e) {
                        // If cloning/rebinding fails we'll remove the old handler and proceed to add a fresh button below
                        try { hasDel.remove(); } catch (er) { /* ignore */ }
                    }
                }

                if (!confirmedMessage.querySelector('.message-delete-btn')) {
                    const userElement = confirmedMessage.querySelector('.message-user');
                    const canDeleteAll = (typeof roomPermission !== 'undefined' && roomPermission === 'su');
                    const canDeleteOwn = (typeof roomPermission !== 'undefined' && roomPermission === '777' && Number(serverMessage.user_id) === Number(currentUserId));
                    if (userElement && (canDeleteAll || canDeleteOwn)) {
                        const delBtn = document.createElement('button');
                        delBtn.className = 'btn delete-btn message-delete-btn';
                        delBtn.title = '删除消息';
                        delBtn.textContent = '删除';
                        delBtn.style.marginLeft = '8px';
                        delBtn.addEventListener('click', function (e) {
                            e.stopPropagation();
                            deleteChatMessage(serverId || serverClientId, confirmedMessage);
                        });
                        userElement.appendChild(delBtn);
                    }
                }
            }
        } catch (e) {
            console.warn('updateExistingMessage: adding delete button failed', e);
        }

        console.debug('updateExistingMessage: successfully updated', { oldId, newId: serverId || serverClientId });
    } catch (e) {
        console.error('updateExistingMessage: error updating element', e);
    }

    // helper to normalize whitespace for comparisons
    function normalizeWhitespace(s) {
        return (s || '').replace(/\s+/g, ' ').trim();
    }
}

// 删除聊天室消息
function deleteChatMessage(messageId, messageElement) {
    if (!messageId) return;
    showConfirm('确定要删除此消息吗？此操作不可撤销。', {danger: true})
        .then(function (confirmed) {
            if (!confirmed) return;
            // 调用后端删除接口
            fetch(`/api/chat/${roomId}/messages/${messageId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        // 可选择完全移除或替换为已删除提示
                        try {
                            if (messageElement && messageElement.parentNode) {
                                // 将内容替换为已删除提示
                                messageElement.querySelectorAll('.message-content, .message-user').forEach(n => n.remove());
                                const removedNotice = document.createElement('div');
                                removedNotice.className = 'message-removed';
                                removedNotice.textContent = '该消息已被删除';
                                messageElement.appendChild(removedNotice);
                            }
                        } catch (e) {
                            console.warn('更新删除的消息UI失败，尝试移除元素:', e);
                            if (messageElement && messageElement.parentNode) messageElement.parentNode.removeChild(messageElement);
                        }
                        showToast('success', data.message || '消息已删除');
                    } else {
                        showToast('error', '删除失败: ' + (data && data.message ? data.message : '未知错误'));
                    }
                })
                .catch(err => {
                    console.error('删除消息请求失败:', err);
                    showToast('error', '删除请求失败');
                });
        });
}

// 创建消息元素
function createMessageElement(msg, isLocal = false) {
    const messageElement = document.createElement('div');

    // 区分消息类型
    if (msg.type === 'system' || msg.type === 'join' || msg.type === 'leave') {
        messageElement.className = 'chat-system-message';
    } else {
        // 判断本地消息和远程消息，分别加 local/remote 类
        messageElement.className = `chat-message ${isLocal ? 'local' : 'remote'}${msg.isPending ? ' pending-message' : ''}`;
    }

    // 系统消息特殊处理
    if (msg.type === 'system' || msg.type === 'join' || msg.type === 'leave') {
        const contentElement = document.createElement('div');
        contentElement.className = 'system-message-content';

        // 格式化系统消息
        let messageText = msg.content;
        if (msg.type === 'join') {
            messageText = `${msg.nickname || msg.username} 加入了聊天室`;
        } else if (msg.type === 'leave') {
            messageText = `${msg.nickname || msg.username} 离开了聊天室`;
        }

        contentElement.textContent = messageText;

        // 系统消息时间
        const timeElement = document.createElement('span');
        timeElement.className = 'system-message-time';
        timeElement.textContent = formatTimeDisplay(msg.timestamp);

        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        return messageElement;
    }

    // 用户消息处理
    // 用户信息
    const userElement = document.createElement('div');
    userElement.className = 'message-user';

    // 用户徽章（如果有）
    if (msg.badge) {
        const badgeElement = document.createElement('span');
        badgeElement.className = 'message-badge';
        badgeElement.style.backgroundColor = msg.color;
        badgeElement.textContent = msg.badge;
        userElement.appendChild(badgeElement);
    }

    // 用户名
    const nameElement = document.createElement('span');
    nameElement.className = 'message-username';
    nameElement.style.color = msg.color;
    nameElement.textContent = msg.nickname || msg.username;
    userElement.appendChild(nameElement);

    // 时间
    const timeElement = document.createElement('span');
    timeElement.className = 'message-time';
    timeElement.textContent = formatTimeDisplay(msg.timestamp);
    userElement.appendChild(timeElement);

    // 消息内容
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.dataset.originalContent = msg.content; // 保存原始内容用于重试

    // 尝试立即渲染
    tryRenderMessage(contentElement, msg.content);

    // 组装
    messageElement.appendChild(userElement);
    messageElement.appendChild(contentElement);

    // 设置 data-message-id，用于后续通过 client_id 查找并更新
    if (msg.id) {
        messageElement.dataset.messageId = msg.id;
    } else if (msg.client_id) {
        messageElement.dataset.messageId = msg.client_id;
    }

    // 添加删除按钮（根据权限）
    try {
        const canDeleteAll = (typeof roomPermission !== 'undefined' && roomPermission === 'su');
        const canDeleteOwn = (typeof roomPermission !== 'undefined' && roomPermission === '777' && Number(msg.user_id) === Number(currentUserId));
        if (msg.id && (canDeleteAll || canDeleteOwn)) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn delete-btn message-delete-btn';
            delBtn.title = '删除消息';
            delBtn.textContent = '删除';
            delBtn.style.marginLeft = '8px';
            delBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteChatMessage(msg.id, messageElement);
            });
            // 将删除按钮添加到用户Element末尾（更靠近用户名）
            userElement.appendChild(delBtn);
        }
    } catch (e) {
        console.error('添加删除按钮失败:', e);
    }

    return messageElement;
}

// 处理消息队列
function processMessageQueue() {
    messageQueue.forEach(item => {
        try {
            item.element.innerHTML = window.renderContent(item.content);
        } catch (e) {
            console.error('队列消息渲染失败:', e);
            item.element.innerHTML = `<div class="render-error">${escapeHtml(item.content)}</div>`;
        }
    });
    messageQueue = [];
}

// 安全渲染消息
function tryRenderMessage(element, content) {
    if (typeof window.renderContent === 'function') {
        try {
            element.innerHTML = window.renderContent(content);
            return true;
        } catch (e) {
            console.error('消息渲染失败:', e);
        }
    }

    // 降级渲染
    element.innerHTML = `<div class="render-fallback">${escapeHtml(content)}</div>`;
    return false;
}

// 重新尝试渲染所有消息
function retryRenderingAllMessages() {
    document.querySelectorAll('.message-content').forEach(element => {
        const content = element.dataset.originalContent;
        if (content) {
            tryRenderMessage(element, content);
        }
    });
}


// 全局初始化函数
window.initChat = function () {
    // 重置日期跟踪变量
    lastMessageDate = null;

    // 从页面数据获取房间ID
    const roomElement = document.getElementById('chat-room-data');
    if (!roomElement) {
        console.error('未找到聊天室数据');
        return;
    }

    try {
        const roomData = JSON.parse(roomElement.textContent);
        roomId = roomData.room_id;
        userId = roomData.user_id;
        currentUserId = roomData.user_id;
        currentUsername = roomData.username || '用户';
        currentNickname = roomData.nickname || currentUsername;
        currentUserColor = roomData.color || '#000000';
        currentUserBadge = roomData.badge || '';
        roomPermission = roomData.permission || 'Null';

        // 1. 先设置UI元素
        const onlineCountElement = document.getElementById('online-count');
        if (onlineCountElement) {
            onlineCountElement.textContent = '加载中...';
        }


        setupMessageInput();

        // 2. 然后连接WebSocket
        setupWebSocket();

        // 3. 最后加载历史消息（确保WebSocket已设置好）
        setTimeout(() => {
            loadChatHistory();
        }, 500); // 短暂延迟，确保WebSocket有时间初始化
        setupOnlineListModal();
        // 4. 设置渲染就绪处理
        document.addEventListener('renderReady', function () {
            isRenderingReady = true;
            processMessageQueue();
        });

        if (typeof window.renderContent === 'function') {
            isRenderingReady = true;
        }

        console.log('聊天系统初始化完成');
    } catch (e) {
        console.error('聊天室初始化失败:', e);
    }
};

// 确保所有依赖加载
function ensureDependenciesLoaded(callback) {
    let dependencies = [
        { name: 'socket.io', check: () => typeof io !== 'undefined' },
        { name: 'marked', check: () => typeof marked !== 'undefined' }
    ];

    let loadedCount = 0;
    const checkAllLoaded = setInterval(() => {
        dependencies.forEach(dep => {
            if (dep.check()) {
                dependencies = dependencies.filter(d => d !== dep);
                loadedCount++;
                console.log(`${dep.name} 已加载`);
            }
        });

        if (dependencies.length === 0 || loadedCount >= dependencies.length) {
            clearInterval(checkAllLoaded);
            callback();
        }
    }, 200);

    // 超时处理
    setTimeout(() => {
        clearInterval(checkAllLoaded);
        if (dependencies.length > 0) {
            console.warn('部分依赖加载超时，继续初始化:',
                dependencies.map(d => d.name));
        }
        callback();
    }, 5000);
}

// 全局错误处理
window.addEventListener('error', function (e) {
    if (e.message.includes('marked is not defined')) {
        console.warn('检测到marked未定义，重新初始化渲染系统');
        initializeRenderingSystem();
        retryRenderingAllMessages();
    }
    // ...其他错误处理
    console.error('全局错误:', e.message, 'at', e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('未处理的Promise拒绝:', e.reason);
    e.preventDefault();
});

// 全局在线人数更新 - 用于所有页面
// 注意：此函数现在仅在非聊天页面使用，聊天页面的全局在线人数由base.html处理
function initializeGlobalOnlineCount() {
    // 不执行任何操作，因为全局在线人数现在由base.html统一管理
    // 避免重复更新导致冲突
    console.log('聊天页面的全局在线人数由base.html统一管理');
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('chat-messages')) {
        // 1. 首先确保渲染系统就绪
        waitForRenderSystem(() => {
            // 2. 确保所有依赖库加载
            ensureDependenciesLoaded(() => {
                // 3. 最后初始化聊天系统
                if (typeof window.initChat === 'function') {
                    window.initChat();
                } else {
                    console.error('initChat 函数未定义');
                }
            });
        });
    } else {
        // 如果不是聊天页面，仍然初始化全局在线人数更新
        initializeGlobalOnlineCount();
    }
});