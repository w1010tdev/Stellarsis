// 全局变量
let chatSocket = null;
let chatHistoryLoaded = false;
let chatCurrentPage = null;
let chatTotalPages = null;
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
// 验证码模态相关初始化和事件处理
function setupCaptchaModal(socket) {
    const modal = document.getElementById('captcha-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = document.getElementById('captcha-cancel');
    const submitBtn = document.getElementById('captcha-submit');
    const questionEl = document.getElementById('captcha-question');
    const answerInput = document.getElementById('captcha-answer');

    function hide() {
        modal.classList.remove('show');
        answerInput.value = '';
        questionEl.textContent = '';
    }

    function show(question) {
        questionEl.textContent = question || '';
        modal.classList.add('show');
        setTimeout(() => answerInput.focus(), 250);
    }

    closeBtn && closeBtn.addEventListener('click', hide);
    cancelBtn && cancelBtn.addEventListener('click', hide);

    submitBtn && submitBtn.addEventListener('click', function () {
        const captchaId = modal.dataset.captchaId;
        const answer = answerInput.value && answerInput.value.trim();
        if (!captchaId) return hide();

        // 尝试找到与此客户端 pending 的 client_id
        // 我们优先使用与当前输入最接近的 pending entry
        let clientId = null;
        if (pendingMessages.size > 0) {
            // choose the most recent pending by sentTime
            let latest = null;
            for (const [cid, p] of pendingMessages.entries()) {
                if (!latest || (p.sentTime || 0) > (latest.sentTime || 0)) latest = p;
                if (!clientId) clientId = cid;
            }
            if (latest && !clientId) clientId = latest.client_id || null;
        }

        // 发送带有 captcha_id 的 send_message（服务器会以 pending 为准）
        const payload = {
            room_id: roomId,
            message: '',
            captcha_id: captchaId,
            captcha_answer: answer
        };
        if (clientId) payload.client_id = clientId;
        socket.emit('send_message', payload);
        hide();
    });

    // 接收服务器要求显示验证码
    socket.on('require_captcha', function (data) {
        // data: { captcha_id, question }
        if (!data || !data.captcha_id) return;
        modal.dataset.captchaId = data.captcha_id;
        show(data.question || '请输入验证码');
    });

    // 当用户回车也提交
    answerInput && answerInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitBtn.click();
        }
    });
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
                // 先将 HTML 实体解码回原始字符，再交由 marked 渲染
                const decoded = decodeHTMLEntities(content);
                // 安全检查：确保marked可用
                if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                    return marked.parse(decoded);
                }
                // 降级到简单HTML渲染
                return simpleHtmlRender(decoded);
            } catch (e) {
                console.warn('高级渲染失败，使用降级方案:', e);
                return simpleHtmlRender(decodeHTMLEntities(content));
            }
        };

        // 简单HTML渲染作为备选方案（先解码再安全转义）
        function simpleHtmlRender(content) {
            // 先解码 HTML 实体，再做安全转义以避免 XSS
            let safe = escapeHtml(decodeHTMLEntities(content));
            // 基本的Markdown行内元素支持（在安全的文本上替换）
            let html = safe
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

// 处理 message_updated 事件：用服务器的新内容替换现有消息显示
function setupMessageUpdatedHandler(socket) {
    socket.on('message_updated', function (msg) {
        try {
            if (!msg || !msg.id) return;
            // 尝试查找元素：使用 data-message-id 属性
            const selector = '[data-message-id="' + msg.id + '"]';
            const el = document.querySelector(selector);
            if (el) {
                const contentEl = el.querySelector('.message-content');
                if (contentEl) {
                    // 使用渲染系统更新内容
                    contentEl.innerHTML = window.renderContent(msg.content || '');
                    if (typeof window.postProcessRendered === 'function') window.postProcessRendered(contentEl);
                }
            } else {
                // 如果未找到对应元素，按需追加到消息区
                addMessageToUI(msg, 0, 1);
            }
        } catch (e) {
            console.error('message_updated handler error', e);
        }
    });
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

// 将 HTML 实体解码为原始字符（例如 &quot; -> "）
function decodeHTMLEntities(str) {
    if (!str) return '';
    // 多次解码以处理双重/多重转义的历史数据
    const txt = document.createElement('textarea');
    let prev = null;
    let current = str;
    let iterations = 0;
    const MAX_ITER = 5;
    while (current !== prev && iterations < MAX_ITER) {
        txt.innerHTML = current;
        prev = current;
        current = txt.value;
        iterations++;
    }
    return current;
}

// 标记消息为已删除（幂等）
function markMessageRemoved(el) {
    if (!el) return false;
    try {
        // 如果已标记为删除，跳过
        if (el.dataset && el.dataset.deleted === '1') return false;

        // 如果已经存在 .message-removed，也视为已删除
        if (el.querySelector && el.querySelector('.message-removed')) {
            if (el.dataset) el.dataset.deleted = '1';
            return false;
        }

        // 尝试移除显示内容区（安全降级）
        try {
            el.querySelectorAll('.message-content, .message-user').forEach(n => n.remove());
        } catch (e) {
            // ignore
        }

        const removedNotice = document.createElement('div');
        removedNotice.className = 'message-removed';
        removedNotice.textContent = '该消息已被删除';
        el.appendChild(removedNotice);
        if (el.dataset) el.dataset.deleted = '1';
        return true;
    } catch (e) {
        console.error('markMessageRemoved failed', e);
        return false;
    }
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
    // 请求最后一页以显示最新消息
    const pageSize = 50;
    fetch(`/api/chat/${roomId}/history?page=last&limit=${pageSize}`)
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

            // 如果服务端返回分页信息，初始化加载更多按钮
            if (typeof data.page !== 'undefined' && typeof data.total_pages !== 'undefined') {
                chatCurrentPage = data.page;
                chatTotalPages = data.total_pages;
                if (messagesContainer) {
                    let wrap = document.getElementById('chat-load-more-wrap');
                    if (!wrap) {
                        wrap = document.createElement('div');
                        wrap.id = 'chat-load-more-wrap';
                        wrap.style.textAlign = 'center';
                        wrap.style.margin = '6px 0';
                        const btn = document.createElement('button');
                        btn.id = 'chat-load-more-btn';
                        btn.className = 'btn';
                        btn.dataset.currentPage = chatCurrentPage;
                        btn.dataset.totalPages = chatTotalPages;
                        btn.textContent = '加载更多';
                        
                        // Determine initial visibility based on has_more field
                        if (data.has_more !== undefined) {
                            // Use the has_more field to determine visibility
                            if (data.has_more || chatCurrentPage > 0) {
                                btn.style.display = '';
                            } else {
                                btn.style.display = 'none';
                            }
                        } else {
                            // Fallback to old logic if has_more field is not provided
                            if (chatTotalPages > 1) {
                                btn.style.display = '';
                            } else {
                                btn.style.display = 'none';
                            }
                        }
                        
                        wrap.appendChild(btn);
                        messagesContainer.insertBefore(wrap, messagesContainer.firstChild);
                    }
                }
            }

            data.messages.forEach(msg => {
                addMessageToUI(msg, 0, 1);
                // 记录历史消息ID，防止与随后收到的实时消息重复渲染
                if (msg.id) {
                    processedMessageIds.add(msg.id);
                }
            });

                        btn.addEventListener('click', function () {
                            const cur = parseInt(btn.dataset.currentPage || '0', 10);
                            const nextPage = cur - 1;
                            
                            btn.disabled = true; btn.textContent = '加载中...';
                            fetch(`/api/chat/${roomId}/history?page=${nextPage}&limit=${pageSize}`)
                                .then(r => { if (!r.ok) throw new Error('加载失败'); return r.json(); })
                                .then(d => {
                                    if (d && Array.isArray(d.messages)) {
                                        // 记录之前的滚动高度以便恢复视图位置
                                        const prevScrollTop = messagesContainer.scrollTop;
                                        const prevScrollHeight = messagesContainer.scrollHeight;
                                        prependMessages(d.messages);
                                        // 恢复视图：保持之前顶部消息位置不变
                                        const newScrollHeight = messagesContainer.scrollHeight;
                                        const heightDiff = newScrollHeight - prevScrollHeight;
                                        messagesContainer.scrollTop = prevScrollTop + heightDiff;
                                        btn.dataset.currentPage = nextPage;
                                        
                                        // Use the new has_more field to determine if we should show the button
                                        if (d.has_more !== undefined) {
                                            // Server provides has_more field, use it
                                            if (d.has_more) {
                                                btn.style.display = '';
                                            } else {
                                                btn.style.display = 'none';
                                            }
                                        } else {
                                            // Fallback to old logic if has_more field is not provided
                                            if (nextPage <= 0) btn.style.display = 'none';
                                            else btn.style.display = '';
                                        }
                                    } else {
                                        console.error('加载更多返回格式错误');
                                        btn.style.display = 'none';
                                    }
                                })
                                .catch(err => { 
                                    console.error('加载更多失败', err); 
                                    btn.style.display = 'none';
                                })
                                .finally(() => { btn.disabled = false; btn.textContent = '加载更多'; });
                        });
                    }
                }
            }

            // 更新最后一条消息ID
            if (data.messages.length > 0) {
                lastMessageId = data.messages[data.messages.length - 1].id;
                // 设置最后消息日期为最后一条消息的日期
                lastMessageDate = getMessageDate(data.messages[data.messages.length - 1].timestamp);
            }

            // 如果之前滚动到底部，则滚动到底部
            // 加载最后一页默认滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
                                    const serverDateIso = new Date(serverTsMs).toISOString().slice(0, 10);
                                    const pendingDateIso = new Date(pendingSent).toISOString().slice(0, 10);
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

                    // 检测服务器上已不存在但客户端仍然显示的消息（标记为已删除）
                    try {
                        const serverIds = new Set((data.messages || []).filter(m => m && m.id).map(m => String(m.id)));
                        document.querySelectorAll('[data-message-id]').forEach(function (el) {
                            try {
                                const mid = el.dataset.messageId;
                                if (!mid) return;
                                // 跳过本地 pending 客户端ID
                                if (mid.indexOf('client-') === 0 || mid.indexOf('sent-') === 0) return;
                                if (!serverIds.has(String(mid))) {
                                    // 标记为已删除（幂等操作，避免重复插入）
                                    try {
                                        markMessageRemoved(el);
                                    } catch (e) {
                                        if (el.parentNode) el.parentNode.removeChild(el);
                                    }
                                }
                            } catch (e) { /* ignore per-element errors */ }
                        });
                    } catch (e) { console.debug('轮询删除检测失败', e); }

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

// Developer helper: toggle websocket fallback simulation from console
window.__dev_toggle_ws_fallback = function (enable) {
    try {
        if (enable) {
            console.info('Dev: enabling WS fallback (simulate websocket unavailable)');
            document.body.classList.add('no-websocket');
            try { if (chatSocket && chatSocket.disconnect) chatSocket.disconnect(); } catch (e) { }
            try { setupPolling(); } catch (e) { console.warn('setupPolling unavailable', e); }
        } else {
            console.info('Dev: disabling WS fallback (attempt reload)');
            document.body.classList.remove('no-websocket');
            try { location.reload(); } catch (e) { }
        }
    } catch (e) { console.error(e); }
};

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
        if (window.roomHeartbeatInterval) {
            clearInterval(window.roomHeartbeatInterval);
        }
        window.roomHeartbeatInterval = setInterval(() => {
            if (chatSocket && chatSocket.connected) {
                chatSocket.emit('heartbeat_chat', { room_id: roomId });
            }
        }, 5000);
        chatSocket.on('connect', () => {
            console.log('WebSocket连接已建立');
            updateConnectionStatus('connected', '已连接');
            if (!chatSocket.hasJoinedRoom) {
                // 重新加入房间
                chatSocket.emit('join', { room: roomId });
                chatSocket.hasJoinedRoom = true;
                // 重新获取在线人数
                setTimeout(() => {
                    chatSocket.emit('get_online_users', { room_id: roomId });
                }, 1000);
            }
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
            // 清理心跳定时器
            if (window.roomHeartbeatInterval) {
                clearInterval(window.roomHeartbeatInterval);
                window.roomHeartbeatInterval = null;
            }

            // 清理在线人数更新定时器
            if (window.updateOnlineCountInterval) {
                clearInterval(window.updateOnlineCountInterval);
                window.updateOnlineCountInterval = null;
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
                                const serverDateIso = serverTime ? new Date(serverTime).toISOString().slice(0, 10) : '';
                                const pendingDateIso = sentTime ? new Date(sentTime).toISOString().slice(0, 10) : '';
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

        // listen for message deletion broadcasts from server
        chatSocket.on('message_deleted', function (data) {
            try {
                var mid = data && (data.id || data.message_id);
                if (!mid) return;
                var el = document.querySelector('[data-message-id="' + mid + '"]');
                if (el) {
                    try {
                        // use idempotent helper to avoid duplicate notices
                        markMessageRemoved(el);
                    } catch (e) {
                        // fallback remove
                        if (el.parentNode) el.parentNode.removeChild(el);
                    }
                }
            } catch (e) { console.error('处理 message_deleted 失败', e); }
        });

        chatSocket.on('online_users', (data) => {
            onlineUsers = data.users || [];
            updateOnlineCount();
        });
        window.updateOnlineCountInterval = setInterval(() => {
            chatSocket.emit('get_online_users', { room_id: roomId });
        }, 5000);

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

// 3. 修复updateOnlineStatus函数
function updateOnlineStatus() {
    if (chatSocket && chatSocket.connected) {
        chatSocket.emit('get_online_users', { room_id: roomId });
    } else {
        // 轮询模式下，获取特定房间的在线人数
        fetch(`/api/chat/${roomId}/online_count`)
            .then(response => response.json())
            .then(data => {
                const onlineCountElement = document.getElementById('online-count');
                if (onlineCountElement) {
                    onlineCountElement.textContent = data.count || '未知';
                }
                // 同时更新在线用户列表
                if (data.users) {
                    onlineUsers = data.users;
                    updateOnlineUsersList();
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

        // 使用回调处理服务器响应，直接替换消息ID
        chatSocket.emit('send_message', {
            room_id: roomId,
            message: message,
            client_id: clientId  // 发送客户端ID
        }, function(response) {
            // 服务器响应回调，处理返回的消息数据
            if (response && response.success && response.data && response.data.id) {
                // 使用服务器返回的真实ID更新本地消息
                updateExistingMessage(clientId, response.data);
                
                // 从待确认消息集合中移除，避免后续广播重复处理
                pendingMessages.delete(clientId);
                
                // 将服务器返回的ID添加到已处理集合，防止广播时重复处理
                if (response.data.id) {
                    processedMessageIds.add(response.data.id);
                }
            } else {
                console.warn('消息发送响应格式异常:', response);
                // 如果响应有问题，仍依赖广播机制作为备用
                // 广播机制会继续尝试匹配和处理
            }
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
        his = 0;
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
    
    // 自动滚动到最底部 - 使用setTimeout确保DOM渲染完成后再滚动
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
}

// 将一组消息插入到消息容器顶部（按时间顺序：最旧在上）
function prependMessages(messages) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer || !Array.isArray(messages) || messages.length === 0) return;
    
    // 保存加载更多按钮（如果存在）
    const loadMoreWrap = document.getElementById('chat-load-more-wrap');
    if (loadMoreWrap) {
        // 临时移除按钮
        messagesContainer.removeChild(loadMoreWrap);
    }
    
    // 创建文档片段以减少回流
    const frag = document.createDocumentFragment();
    messages.forEach(m => {
        const isLocal = m.user_id && Number(m.user_id) === Number(userId);
        const el = createMessageElement(m, isLocal);
        frag.appendChild(el);
        if (m.id) processedMessageIds.add(m.id);
    });
    
    // 将新消息插入到容器开头
    messagesContainer.insertBefore(frag, messagesContainer.firstChild);
    
    // 重新插入加载更多按钮到最顶部
    if (loadMoreWrap) {
        messagesContainer.insertBefore(loadMoreWrap, messagesContainer.firstChild);
    }
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
        // 如果该元素已被标记为已删除，则不要重新恢复内容
        if (existingMessage.dataset && existingMessage.dataset.deleted === '1') {
            console.debug('updateExistingMessage: 目标元素已标记为删除，跳过恢复', { oldId, serverId });
            return;
        }
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
                    if (typeof window.postProcessRendered === 'function') window.postProcessRendered(contentElement);
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
                const existingDropdown = confirmedMessage.querySelector('.message-actions-dropdown');
                if (existingDropdown) {
                    // Update any delete handlers in the dropdown to use the new serverId
                    const deleteItem = existingDropdown.querySelector('.message-delete-item');
                    console.log("GET_WS_update,need to replace", deleteItem);
                    if (deleteItem && serverId) {
                        const newDeleteItem = deleteItem.cloneNode(true);
                        deleteItem.parentNode.replaceChild(newDeleteItem, deleteItem);
                        newDeleteItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            deleteChatMessage(serverId || serverClientId, confirmedMessage);
                            const menu = existingDropdown.querySelector('.dropdown-menu');
                            if (menu) menu.classList.remove('show');
                        });
                    }
                    const quoteItem = existingDropdown.querySelector('.message-quote-item');
                    if (quoteItem && serverId) {
                        // Remove existing event listener by cloning the element
                        const newQuoteItem = quoteItem.cloneNode(true);
                        quoteItem.parentNode.replaceChild(newQuoteItem, quoteItem);
                        // Rebind the new handler with the correct serverId
                        newQuoteItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            try {
                                const ta = document.getElementById('message-text');
                                if (!ta) return;
                                const insert = `@quote{${serverId || serverClientId}}\n`;
                                ta.value = insert + ta.value;
                                ta.focus();
                                try { ta.setSelectionRange(insert.length, insert.length); } catch (err) { }
                            } catch (err) {
                                console.error('插入引用失败', err);
                            } finally {
                                const menu = existingDropdown.querySelector('.dropdown-menu');
                                if (menu) menu.classList.remove('show');
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('updateExistingMessage: adding delete button failed', e);
        }

        console.debug('updateExistingMessage: successfully updated', { oldId, newId: serverId || serverClientId });
        
        // 在更新消息后，如果消息容器存在，滚动到底部
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 0);
        }
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
    showConfirm('确定要删除此消息吗？此操作不可撤销。', { danger: true })
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
                            // 使用幂等标记函数，避免重复插入删除提示
                            if (messageElement) {
                                markMessageRemoved(messageElement);
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
    try {
        const canDelete = msg.id && (
            (typeof roomPermission !== 'undefined' && roomPermission === 'su') ||
            (typeof roomPermission !== 'undefined' && roomPermission === '777' && Number(msg.user_id) === Number(currentUserId))
        );
        const canQuote = msg.id && canSendMessages();

        if (canDelete || canQuote) {
            // 创建下拉菜单容器
            const dropdown = document.createElement('div');
            dropdown.className = 'dropdown message-actions-dropdown'; // 主容器

            // 创建触发按钮（...）
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn dropdown-toggle action-toggle-btn'; // 触发按钮
            toggleBtn.title = '更多操作';
            toggleBtn.textContent = '⋯';
            toggleBtn.style.marginLeft = '6px';
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 切换菜单显示/隐藏（实际实现需要CSS配合，这里只提供类名）
                const menu = dropdown.querySelector('.dropdown-menu');
                menu.classList.toggle('show'); // 显示/隐藏菜单
            });

            // 创建菜单
            const menu = document.createElement('div');
            menu.className = 'dropdown-menu action-context-menu'; // 下拉菜单容器

            // 添加删除选项（如果权限允许）
            if (canDelete) {
                const deleteItem = document.createElement('button');
                deleteItem.className = 'dropdown-item message-delete-item'; // 菜单项
                deleteItem.textContent = '删除消息';
                deleteItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteChatMessage(msg.id, messageElement);
                    menu.classList.remove('show'); // 关闭菜单
                });
                menu.appendChild(deleteItem);
            }

            // 添加引用选项（如果权限允许）
            if (canQuote) {
                const quoteItem = document.createElement('button');
                quoteItem.className = 'dropdown-item message-quote-item'; // 菜单项
                quoteItem.textContent = '引用';
                quoteItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    try {
                        const ta = document.getElementById('message-text');
                        if (!ta) return;
                        const insert = `@quote{${msg.id}}\n`;
                        ta.value = insert + ta.value;
                        ta.focus();
                        try { ta.setSelectionRange(insert.length, insert.length); } catch (err) { }
                    } catch (err) {
                        console.error('插入引用失败', err);
                    } finally {
                        menu.classList.remove('show'); // 关闭菜单
                    }
                });
                menu.appendChild(quoteItem);
            }

            // 组装组件
            dropdown.appendChild(toggleBtn);
            dropdown.appendChild(menu);

            // 添加点击外部区域关闭菜单（简化版）
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });

            // 插入到用户元素
            userElement.appendChild(dropdown);
        }
    } catch (e) {
        console.error('添加操作菜单失败:', e);
    }
    return messageElement;
}

// 处理消息队列
function processMessageQueue() {
    messageQueue.forEach(item => {
        try {
            item.element.innerHTML = window.renderContent(item.content);
            if (typeof window.postProcessRendered === 'function') window.postProcessRendered(item.element);
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
            if (typeof window.postProcessRendered === 'function') window.postProcessRendered(element);
            return true;
        } catch (e) {
            console.error('消息渲染失败:', e);
        }
    }

    // 渲染系统尚未准备好：把元素加入待渲染队列，稍后处理（renderReady 时会调用 processMessageQueue）
    try {
        // 保证 dataset.originalContent 存在
        if (element && element.dataset) element.dataset.originalContent = content;
        // 先显示解码后的安全文本作为占位（避免直接显示被转义的实体）
        element.innerHTML = `<div class="render-fallback">${escapeHtml(decodeHTMLEntities(content))}</div>`;
        // 将该元素排入全局队列以便后续重新渲染
        try {
            messageQueue.push({ element: element, content: content });
        } catch (e) {
            // 如果全局队列不可用，则尽量不阻塞
            console.debug('无法将元素加入渲染队列', e);
        }
    } catch (e) {
        console.debug('降级渲染失败，直接转义显示', e);
        element.innerHTML = `<div class="render-fallback">${escapeHtml(content)}</div>`;
    }
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
            onlineCountElement.textContent = '加载中......';
        }


        setupMessageInput();

        // 2. 然后连接WebSocket
        setupWebSocket();
        // Setup captcha modal and message update handlers once websocket is available
        setTimeout(function () {
            if (chatSocket) {
                try {
                    setupCaptchaModal(chatSocket);
                    setupMessageUpdatedHandler(chatSocket);
                } catch (e) {
                    console.error('初始化验证码/更新处理器失败', e);
                }
            }
        }, 600);

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
        if (chatSocket) {
            window.roomHeartbeatInterval = setInterval(() => {
                if (chatSocket.connected) {
                    chatSocket.emit('heartbeat_chat', { room_id: roomId });
                }
            }, 5000);

            window.updateOnlineCountInterval = setInterval(() => {
                if (chatSocket.connected) {
                    chatSocket.emit('get_online_users', { room_id: roomId });
                }
            }, 5000);
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


