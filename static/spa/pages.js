/**
 * Stellarsis SPA Pages
 * Vue page components for routing
 */

// Upload Helper Functions
const uploadHelpers = {
    // Get the correct upload URL based on config
    getUploadUrl(enableFileUpload) {
        return enableFileUpload ? '/api/upload/file' : '/api/upload/image';
    },
    
    // Generate markdown link from upload response
    getMarkdown(data, fileName) {
        return data.markdown || '![' + fileName + '](' + data.url + ')';
    },
    
    // Get success message based on file type
    getSuccessMessage(data) {
        return (data.is_image ? '图片' : '文件') + '上传成功';
    }
};

// Home Page
const HomePage = {
    name: 'HomePage',
    template: `
        <div class="page-container">
            <div class="cards-grid" style="margin-bottom: 24px;">
                <!-- Unread Chat Rooms -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-comments"></i>
                            未读聊天室
                        </div>
                    </div>
                    <loading-component v-if="loading"></loading-component>
                    <div v-else-if="unreadRooms.length > 0">
                        <room-card-component 
                            v-for="room in unreadRooms" 
                            :key="room.id"
                            :room="room"
                            :permission="roomPermissions[room.id]"
                            :unread-count="unreadCounts.chat[room.id]"
                            @click="navigateTo('/chat/' + room.id)"
                            style="margin-bottom: 12px;">
                        </room-card-component>
                    </div>
                    <empty-state-component v-else 
                        icon="fas fa-check-circle"
                        title="暂无未读消息"
                        description="所有聊天室都已读完">
                    </empty-state-component>
                </div>
                
                <!-- Unread Forum Sections -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-newspaper"></i>
                            未读贴吧分区
                        </div>
                    </div>
                    <loading-component v-if="loading"></loading-component>
                    <div v-else-if="unreadSections.length > 0">
                        <room-card-component 
                            v-for="section in unreadSections" 
                            :key="section.id"
                            :room="section"
                            :permission="sectionPermissions[section.id]"
                            :unread-count="unreadCounts.forum[section.id]"
                            @click="navigateTo('/forum/' + section.id)"
                            style="margin-bottom: 12px;">
                        </room-card-component>
                    </div>
                    <empty-state-component v-else 
                        icon="fas fa-check-circle"
                        title="暂无未读消息"
                        description="所有贴吧分区都已读完">
                    </empty-state-component>
                </div>
            </div>
            
            <!-- Quote and Changelog Row -->
            <div class="cards-grid">
                <!-- Quote Card -->
                <div class="quote-card" @click="refreshQuote">
                    <div class="quote-text">"{{ quote.text }}"</div>
                    <div class="quote-author">— {{ quote.author }}</div>
                    <div class="quote-hint">点击更换名言</div>
                </div>
                
                <!-- Changelog -->
                <div class="changelog-container">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fab fa-github"></i>
                            Change Log
                        </div>
                    </div>
                    <div v-if="commits.length > 0">
                        <div class="changelog-item" v-for="commit in commits" :key="commit.sha">
                            <span class="commit-hash">{{ commit.sha.substring(0, 7) }}</span>
                            <span class="commit-message">{{ commit.message }}</span>
                            <span class="commit-date">{{ commit.date }}</span>
                        </div>
                    </div>
                    <div v-else style="text-align: center; padding: 20px; color: var(--text-muted);">
                        加载中...
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const loading = Vue.ref(false);
        const spaData = store.getSpaData();
        const rooms = Vue.ref(spaData.rooms || []);
        const sections = Vue.ref(spaData.sections || []);
        const roomPermissions = Vue.ref(spaData.chatPermissions || {});
        const sectionPermissions = Vue.ref(spaData.forumPermissions || {});
        const unreadCounts = Vue.computed(() => store.state.unreadCounts);
        
        // Parse random quote from server data
        const parseQuote = (quoteStr) => {
            if (!quoteStr) return { text: '暂无名言', author: '' };
            const parts = quoteStr.split(' - ');
            return {
                text: parts[0] || quoteStr,
                author: parts[1] || ''
            };
        };
        const quote = Vue.ref(parseQuote(spaData.randomQuote));
        const commits = Vue.ref([]);
        
        const unreadRooms = Vue.computed(() => {
            return rooms.value.filter(room => (unreadCounts.value.chat[room.id] || 0) > 0);
        });
        
        const unreadSections = Vue.computed(() => {
            return sections.value.filter(section => (unreadCounts.value.forum[section.id] || 0) > 0);
        });
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        const refreshQuote = async () => {
            try {
                const response = await fetch('/api/random_quote');
                const data = await response.json();
                if (data.success) {
                    quote.value = parseQuote(data.quote);
                }
            } catch (e) {
                console.error('Failed to load quote:', e);
            }
        };
        
        const loadCommits = async () => {
            try {
                const response = await fetch('https://proxy.wenzixi.top/https://api.github.com/repos/w1010tdev/stellarsis/commits');
                const data = await response.json();
                if (Array.isArray(data)) {
                    commits.value = data
                        .filter(c => {
                            const msg = c.commit.message.toLowerCase();
                            const hasDeleteUpdate = /delete|update/.test(msg);
                            const hasDbOrGitignore = /\.db|\.gitignore/.test(msg);
                            return !(hasDeleteUpdate && hasDbOrGitignore);
                        })
                        .slice(0, 10)
                        .map(c => ({
                            sha: c.sha,
                            message: c.commit.message.split('\n')[0].substring(0, 30),
                            date: new Date(c.commit.author.date).toLocaleDateString('zh-CN')
                        }));
                }
            } catch (e) {
                console.error('Failed to load commits:', e);
            }
        };
        
        Vue.onMounted(() => {
            loadCommits();
        });
        
        return {
            loading,
            rooms,
            sections,
            roomPermissions,
            sectionPermissions,
            unreadCounts,
            unreadRooms,
            unreadSections,
            quote,
            commits,
            navigateTo,
            refreshQuote
        };
    }
};

// Chat List Page
const ChatListPage = {
    name: 'ChatListPage',
    template: `
        <div class="page-container">
            <div class="card-header" style="margin-bottom: 20px;">
                <div class="card-title">
                    <i class="fas fa-comments"></i>
                    聊天室列表
                </div>
            </div>
            
            <loading-component v-if="loading"></loading-component>
            
            <div v-else-if="rooms.length > 0" class="cards-grid">
                <room-card-component 
                    v-for="room in rooms" 
                    :key="room.id"
                    :room="room"
                    :permission="permissions[room.id]"
                    :unread-count="unreadCounts[room.id]"
                    @click="navigateTo('/chat/' + room.id)">
                </room-card-component>
            </div>
            
            <empty-state-component v-else 
                icon="fas fa-comments"
                title="暂无可访问的聊天室"
                description="请联系管理员以获取权限">
            </empty-state-component>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const spaData = store.getSpaData();
        const loading = Vue.ref(false);
        const rooms = Vue.ref(spaData.rooms || []);
        const permissions = Vue.ref(spaData.chatPermissions || {});
        const unreadCounts = Vue.computed(() => store.state.unreadCounts.chat);
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        Vue.onMounted(() => {});
        
        return {
            loading,
            rooms,
            permissions,
            unreadCounts,
            navigateTo
        };
    }
};

// Chat Room Page
const ChatRoomPage = {
    name: 'ChatRoomPage',
    template: `
        <div class="chat-container">
            <div class="chat-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <el-button @click="navigateTo('/chat')" :icon="ArrowLeft" circle></el-button>
                    <h2 style="margin: 0; font-size: 18px;">{{ room.name || '聊天室' }}</h2>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="color: var(--text-muted);">
                        <i class="fas fa-users"></i>
                        {{ onlineCount }} 在线
                    </span>
                    <el-button @click="showOnlineList = true" size="small">查看在线名单</el-button>
                </div>
            </div>
            
            <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
                <div v-if="hasMore" style="text-align: center; padding: 12px;">
                    <el-button @click="loadMore" :loading="loadingMore" size="small">加载更多</el-button>
                </div>
                
                <template v-for="(msg, index) in messages" :key="msg.id || msg.client_id">
                    <!-- Date Separator -->
                    <div v-if="shouldShowDate(msg, index)" class="date-separator">
                        {{ formatDate(msg.timestamp) }}
                    </div>
                    
                    <!-- System Message -->
                    <div v-if="msg.type === 'join' || msg.type === 'leave'" class="system-message">
                        <span :style="{ color: msg.color }">{{ msg.nickname || msg.username }}</span>
                        {{ msg.type === 'join' ? '进入了聊天室' : '离开了聊天室' }}
                    </div>
                    
                    <!-- Regular Message -->
                    <message-component v-else
                        :message="msg"
                        :current-user-id="store.state.user.id"
                        :room-permission="permission"
                        :show-actions="true"
                        @quote="quoteMessage"
                        @delete="deleteMessage">
                    </message-component>
                </template>
                
                <div v-if="messages.length === 0 && !loading" class="system-message">
                    暂无消息，发送第一条消息吧！
                </div>
            </div>
            
            <div class="chat-input-container" v-if="canSend">
                <div class="chat-input-wrapper">
                    <textarea 
                        class="chat-textarea" 
                        ref="messageInput"
                        v-model="messageText"
                        @input="autoResize"
                        @keydown="handleKeydown"
                        placeholder="输入消息...（支持Markdown和LaTeX）"
                        rows="1">
                    </textarea>
                    <div class="chat-actions">
                        <button class="chat-btn chat-btn-secondary" @click="triggerUpload" title="上传文件">
                            <i class="fas fa-paperclip"></i>
                        </button>
                        <button class="chat-btn chat-btn-primary" @click="sendMessage" :disabled="!messageText.trim()">
                            发送
                        </button>
                    </div>
                </div>
                <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" :accept="enableFileUpload ? '' : 'image/*'">
            </div>
            <div v-else class="chat-input-container" style="text-align: center; padding: 20px; color: var(--text-muted);">
                当前权限不允许发送消息
            </div>
            
            <!-- Online Users Dialog -->
            <el-dialog v-model="showOnlineList" title="在线用户" width="400px">
                <div v-for="user in onlineUsers" :key="user.id" style="padding: 8px 0; display: flex; align-items: center; gap: 12px;">
                    <div class="user-avatar" :style="{ background: user.color || '#409eff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }">
                        {{ (user.nickname || user.username || '?').charAt(0).toUpperCase() }}
                    </div>
                    <span :style="{ color: user.color }" style="flex: 1;">{{ user.nickname || user.username }}</span>
                    <span v-if="user.badge" style="font-size: 12px; padding: 2px 6px; border-radius: 4px; color: #fff;" :style="{ background: user.color }">{{ user.badge }}</span>
                    <el-button 
                        v-if="user.id !== store.state.user.id"
                        size="small" 
                        :type="isFollowing(user.id) ? 'default' : 'primary'"
                        @click="toggleFollow(user)">
                        {{ isFollowing(user.id) ? '已关注' : '关注' }}
                    </el-button>
                </div>
                <div v-if="onlineUsers.length === 0" style="text-align: center; color: var(--text-muted);">
                    暂无在线用户
                </div>
            </el-dialog>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const route = Vue.ref(StellarisRouter.getRoute());
        const roomId = Vue.computed(() => route.value.params.id);
        
        const room = Vue.ref({});
        const permission = Vue.ref('');
        const messages = Vue.ref([]);
        const onlineCount = Vue.ref(0);
        const onlineUsers = Vue.ref([]);
        const showOnlineList = Vue.ref(false);
        
        const loading = Vue.ref(true);
        const loadingMore = Vue.ref(false);
        const hasMore = Vue.ref(false);
        const currentPage = Vue.ref(0);
        
        const messageText = Vue.ref('');
        const messagesContainer = Vue.ref(null);
        const messageInput = Vue.ref(null);
        const fileInput = Vue.ref(null);
        
        let socket = null;
        const processedMessageIds = new Set();
        
        const canSend = Vue.computed(() => {
            return permission.value === 'su' || permission.value === '777';
        });
        
        const enableFileUpload = Vue.computed(() => {
            return store.state.config?.enableFileUpload || false;
        });
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        const formatDate = (timestamp) => {
            return StellarisUtils.formatDate(timestamp);
        };
        
        const shouldShowDate = (msg, index) => {
            if (index === 0) return true;
            if (msg.type === 'join' || msg.type === 'leave') return false;
            const prevMsg = messages.value[index - 1];
            if (!prevMsg || prevMsg.type === 'join' || prevMsg.type === 'leave') return false;
            
            const msgDate = new Date(msg.timestamp).toDateString();
            const prevDate = new Date(prevMsg.timestamp).toDateString();
            return msgDate !== prevDate;
        };
        
        const scrollToBottom = () => {
            Vue.nextTick(() => {
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            });
        };
        
        const handleScroll = () => {
            // Track scroll position for new messages
        };
        
        const autoResize = () => {
            StellarisUtils.autoResizeTextarea(messageInput.value);
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
        
        const sendMessage = async () => {
            const content = messageText.value.trim();
            if (!content || !socket) return;
            
            const clientId = StellarisUtils.generateClientId();
            
            // Optimistic update
            messages.value.push({
                client_id: clientId,
                user_id: store.state.user.id,
                username: store.state.user.username,
                nickname: store.state.user.nickname,
                color: store.state.user.color,
                badge: store.state.user.badge,
                content: content,
                timestamp: new Date().toISOString(),
                pending: true
            });
            
            messageText.value = '';
            autoResize();
            scrollToBottom();
            
            // Check for heart effect
            if (StellarisUtils.hasHeartEffect(content)) {
                StellarisUtils.triggerHeartRain();
            }
            
            // Send via socket
            socket.emit('send_message', {
                room_id: roomId.value,
                message: content,
                client_id: clientId
            });
        };
        
        const quoteMessage = (msg) => {
            messageText.value = `@quote{${msg.id}} ` + messageText.value;
            messageInput.value?.focus();
        };
        
        const deleteMessage = async (msg) => {
            try {
                const confirmed = await ElMessageBox.confirm(
                    '确定要删除这条消息吗？此操作不可撤销。',
                    '删除消息',
                    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
                );
                
                if (confirmed) {
                    socket.emit('delete_message', { message_id: msg.id, room_id: roomId.value });
                }
            } catch (e) {
                // Cancelled
            }
        };
        
        const triggerUpload = () => {
            fileInput.value?.click();
        };
        
        const handleFileUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadUrl = uploadHelpers.getUploadUrl(enableFileUpload.value);
            
            try {
                const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    messageText.value += ` ${uploadHelpers.getMarkdown(data, file.name)}`;
                    store.showToast(uploadHelpers.getSuccessMessage(data), 'success');
                } else {
                    store.showToast('上传失败: ' + data.message, 'error');
                }
            } catch (err) {
                store.showToast('上传失败', 'error');
            }
            
            fileInput.value.value = '';
        };
        
        const loadMore = async () => {
            if (loadingMore.value || !hasMore.value) return;
            loadingMore.value = true;
            
            const prevPage = currentPage.value - 1;
            if (prevPage < 0) {
                hasMore.value = false;
                loadingMore.value = false;
                return;
            }
            
            try {
                const response = await fetch(`/api/chat/${roomId.value}/history?page=${prevPage}&limit=50`);
                const data = await response.json();
                if (Array.isArray(data.messages)) {
                    const newMessages = data.messages.filter(m => !processedMessageIds.has(m.id));
                    newMessages.forEach(m => processedMessageIds.add(m.id));
                    messages.value = [...newMessages, ...messages.value];
                    currentPage.value = prevPage;
                    hasMore.value = prevPage > 0;
                }
            } catch (e) {
                store.showToast('加载更多失败', 'error');
            }
            
            loadingMore.value = false;
        };
        
        const initSocket = () => {
            if (typeof io === 'undefined') {
                store.showToast('聊天功能不可用', 'error');
                return;
            }
            
            socket = io('/', {
                path: '/socket.io',
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                transports: ['websocket', 'polling']
            });
            
            socket.on('connect', () => {
                socket.emit('join', { room: roomId.value });
                socket.emit('get_online_users', { room_id: roomId.value });
            });
            
            socket.on('message', (msg) => {
                if (msg.id && processedMessageIds.has(msg.id)) return;
                if (msg.id) processedMessageIds.add(msg.id);
                
                // Update pending message if matches by client_id
                const pendingIndex = messages.value.findIndex(m => 
                    m.pending && (m.client_id === msg.client_id || m.content === msg.content)
                );
                if (pendingIndex > -1) {
                    messages.value.splice(pendingIndex, 1, { ...msg, pending: false });
                } else {
                    // Only add if not from current user (avoid double display)
                    const isFromSelf = msg.user_id === store.state.user.id;
                    const hasPendingWithSameContent = messages.value.some(m => 
                        m.pending && m.content === msg.content && m.user_id === msg.user_id
                    );
                    if (!isFromSelf || !hasPendingWithSameContent) {
                        messages.value.push(msg);
                    }
                }
                
                scrollToBottom();
            });
            
            socket.on('message_deleted', (data) => {
                const index = messages.value.findIndex(m => m.id === data.id || m.id === data.message_id);
                if (index > -1) {
                    // Remove the message from array
                    messages.value.splice(index, 1);
                }
            });
            
            socket.on('online_users', (data) => {
                onlineUsers.value = data.users || [];
                onlineCount.value = onlineUsers.value.length;
            });
            
            socket.on('user_join', (data) => {
                messages.value.push({ ...data, type: 'join' });
                scrollToBottom();
            });
            
            socket.on('user_leave', (data) => {
                messages.value.push({ ...data, type: 'leave' });
            });
            
            // Heartbeat
            setInterval(() => {
                if (socket && socket.connected) {
                    socket.emit('heartbeat_chat', { room_id: roomId.value });
                }
            }, 5000);
        };
        
        const loadRoom = async () => {
            loading.value = true;
            try {
                // Get room info from spaData
                const spaData = store.getSpaData();
                const roomIdNum = parseInt(roomId.value, 10);
                const roomInfo = (spaData.rooms || []).find(r => r.id === roomIdNum);
                const perm = (spaData.chatPermissions || {})[roomIdNum] || 'Read';
                
                if (roomInfo) {
                    room.value = roomInfo;
                    permission.value = perm;
                } else {
                    // Fallback: room not found in spaData, show error
                    store.showToast('聊天室不存在或无权限', 'error');
                    loading.value = false;
                    return;
                }
                
                // Load history - API returns messages array directly, use page=last for latest
                const historyRes = await fetch(`/api/chat/${roomId.value}/history?page=last&limit=50`);
                const historyData = await historyRes.json();
                if (Array.isArray(historyData.messages)) {
                    messages.value = historyData.messages || [];
                    messages.value.forEach(m => processedMessageIds.add(m.id));
                    currentPage.value = historyData.page || 0;
                    hasMore.value = historyData.has_more || (historyData.page > 0);
                    scrollToBottom();
                }
                
                // Mark as read on server (update last view time)
                fetch(`/api/spa/chat/${roomId.value}/mark_read`, { method: 'POST' });
                // Mark as read in store (update unread count in sidebar/homepage)
                store.markChatRoomAsRead(roomId.value);
                
                initSocket();
            } catch (e) {
                console.error('加载聊天室失败:', e);
                store.showToast('加载聊天室失败', 'error');
            }
            loading.value = false;
        };
        
        Vue.onMounted(loadRoom);
        
        Vue.onUnmounted(() => {
            if (socket) {
                socket.emit('leave', { room: roomId.value });
                socket.disconnect();
            }
        });
        
        // Watch for route changes
        window.addEventListener('route-changed', (e) => {
            route.value = e.detail;
        });
        
        // Follow functionality
        const isFollowing = (userId) => {
            return store.state.followedUserIds.has(userId);
        };
        
        const toggleFollow = async (user) => {
            try {
                if (isFollowing(user.id)) {
                    // Unfollow
                    const res = await fetch(`/api/follows/${user.id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                        store.state.followedUserIds.delete(user.id);
                        store.showToast('已取消关注', 'success');
                    }
                } else {
                    // Follow
                    const formData = new FormData();
                    formData.append('followed_id', user.id);
                    const res = await fetch('/api/follows', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (data.success) {
                        store.state.followedUserIds.add(user.id);
                        store.showToast('关注成功', 'success');
                    }
                }
            } catch (e) {
                store.showToast('操作失败', 'error');
            }
        };
        
        return {
            store,
            room,
            permission,
            messages,
            onlineCount,
            onlineUsers,
            showOnlineList,
            loading,
            loadingMore,
            hasMore,
            messageText,
            messagesContainer,
            messageInput,
            fileInput,
            canSend,
            enableFileUpload,
            navigateTo,
            formatDate,
            shouldShowDate,
            autoResize,
            handleKeydown,
            handleScroll,
            sendMessage,
            quoteMessage,
            deleteMessage,
            triggerUpload,
            handleFileUpload,
            loadMore,
            isFollowing,
            toggleFollow,
            ArrowLeft: ElementPlusIconsVue.ArrowLeft
        };
    }
};

// Forum List Page
const ForumListPage = {
    name: 'ForumListPage',
    template: `
        <div class="page-container">
            <div class="card-header" style="margin-bottom: 20px;">
                <div class="card-title">
                    <i class="fas fa-newspaper"></i>
                    贴吧分区
                </div>
            </div>
            
            <loading-component v-if="loading"></loading-component>
            
            <div v-else-if="sections.length > 0" class="cards-grid">
                <room-card-component 
                    v-for="section in sections" 
                    :key="section.id"
                    :room="section"
                    :permission="permissions[section.id]"
                    :unread-count="unreadCounts[section.id]"
                    @click="navigateTo('/forum/' + section.id)">
                </room-card-component>
            </div>
            
            <empty-state-component v-else 
                icon="fas fa-newspaper"
                title="暂无可访问的贴吧分区"
                description="请联系管理员以获取权限">
            </empty-state-component>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const spaData = store.getSpaData();
        const loading = Vue.ref(false);
        const sections = Vue.ref(spaData.sections || []);
        const permissions = Vue.ref(spaData.forumPermissions || {});
        const unreadCounts = Vue.computed(() => store.state.unreadCounts.forum);
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        Vue.onMounted(() => {});
        
        return {
            loading,
            sections,
            permissions,
            unreadCounts,
            navigateTo
        };
    }
};

// Forum Section Page
const ForumSectionPage = {
    name: 'ForumSectionPage',
    template: `
        <div class="page-container">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                <el-button @click="navigateTo('/forum')" :icon="ArrowLeft" circle></el-button>
                <h2 style="margin: 0;">{{ section.name || '分区' }}</h2>
                <el-button v-if="canPost" type="primary" @click="showNewThread = true">
                    <i class="fas fa-plus" style="margin-right: 8px;"></i>发表新帖
                </el-button>
            </div>
            
            <loading-component v-if="loading"></loading-component>
            
            <div v-else-if="threads.length > 0">
                <div v-for="thread in threads" :key="thread.id" class="card" style="cursor: pointer;" @click="navigateTo('/forum/thread/' + thread.id)">
                    <div class="card-header">
                        <div class="card-title">{{ thread.title }}</div>
                        <span style="font-size: 12px; color: var(--text-muted);">
                            回复: {{ thread.reply_count || 0 }}
                        </span>
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                        {{ thread.content?.substring(0, 100) }}{{ thread.content?.length > 100 ? '...' : '' }}
                    </div>
                    <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-muted);">
                        <span><i class="fas fa-user"></i> {{ thread.user?.nickname || thread.user?.username }}</span>
                        <span><i class="fas fa-clock"></i> {{ formatTime(thread.timestamp) }}</span>
                    </div>
                </div>
            </div>
            
            <empty-state-component v-else 
                icon="fas fa-file-alt"
                title="暂无帖子"
                :description="canPost ? '发表第一个帖子吧！' : '等待他人发表帖子'">
            </empty-state-component>
            
            <!-- New Thread Dialog -->
            <el-dialog v-model="showNewThread" title="发表新帖" width="600px">
                <el-form :model="newThread" label-position="top">
                    <el-form-item label="标题">
                        <el-input v-model="newThread.title" placeholder="请输入帖子标题"></el-input>
                    </el-form-item>
                    <el-form-item label="内容">
                        <el-input v-model="newThread.content" type="textarea" :rows="8" placeholder="请输入帖子内容（支持Markdown和LaTeX）"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button @click="triggerUpload">
                            <i class="fas fa-paperclip"></i> {{ enableFileUpload ? '上传文件' : '上传图片' }}
                        </el-button>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showNewThread = false">取消</el-button>
                    <el-button type="primary" @click="createThread" :loading="creating">发表</el-button>
                </template>
                <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" :accept="enableFileUpload ? '' : 'image/*'">
            </el-dialog>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const route = Vue.ref(StellarisRouter.getRoute());
        const sectionId = Vue.computed(() => route.value.params.id);
        
        const section = Vue.ref({});
        const permission = Vue.ref('');
        const threads = Vue.ref([]);
        const loading = Vue.ref(true);
        
        const showNewThread = Vue.ref(false);
        const creating = Vue.ref(false);
        const newThread = Vue.reactive({ title: '', content: '' });
        const fileInput = Vue.ref(null);
        
        const canPost = Vue.computed(() => permission.value === 'su' || permission.value === '777');
        
        const enableFileUpload = Vue.computed(() => {
            return store.state.config?.enableFileUpload || false;
        });
        
        const triggerUpload = () => {
            fileInput.value?.click();
        };
        
        const handleFileUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadUrl = uploadHelpers.getUploadUrl(enableFileUpload.value);
            
            try {
                const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    const markdown = uploadHelpers.getMarkdown(data, file.name);
                    newThread.content = (newThread.content ? newThread.content + '\n' : '') + markdown;
                    store.showToast(uploadHelpers.getSuccessMessage(data), 'success');
                } else {
                    store.showToast('上传失败: ' + data.message, 'error');
                }
            } catch (err) {
                store.showToast('上传失败', 'error');
            }
            
            fileInput.value.value = '';
        };
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        const formatTime = (timestamp) => {
            return StellarisUtils.formatRelativeTime(timestamp);
        };
        
        const loadSection = async () => {
            loading.value = true;
            try {
                const response = await fetch(`/api/spa/forum/section/${sectionId.value}`);
                const data = await response.json();
                if (data.success) {
                    section.value = data.section;
                    permission.value = data.permission;
                    threads.value = data.threads || [];
                    // Mark as read in store (update unread count in sidebar/homepage)
                    store.markForumSectionAsRead(sectionId.value);
                }
            } catch (e) {
                store.showToast('加载分区失败', 'error');
            }
            loading.value = false;
        };
        
        const createThread = async () => {
            if (!newThread.title.trim() || !newThread.content.trim()) {
                store.showToast('请填写标题和内容', 'warning');
                return;
            }
            
            creating.value = true;
            try {
                const formData = new FormData();
                formData.append('section_id', sectionId.value);
                formData.append('title', newThread.title);
                formData.append('content', newThread.content);
                
                const response = await fetch('/api/spa/forum/thread', { method: 'POST', body: formData });
                const data = await response.json();
                
                if (data.success) {
                    store.showToast('发表成功', 'success');
                    showNewThread.value = false;
                    newThread.title = '';
                    newThread.content = '';
                    loadSection();
                } else {
                    store.showToast(data.message || '发表失败', 'error');
                }
            } catch (e) {
                store.showToast('发表失败', 'error');
            }
            creating.value = false;
        };
        
        Vue.onMounted(loadSection);
        
        window.addEventListener('route-changed', (e) => {
            route.value = e.detail;
        });
        
        return {
            section,
            permission,
            threads,
            loading,
            showNewThread,
            creating,
            newThread,
            fileInput,
            canPost,
            enableFileUpload,
            navigateTo,
            formatTime,
            createThread,
            triggerUpload,
            handleFileUpload,
            ArrowLeft: ElementPlusIconsVue.ArrowLeft
        };
    }
};

// Forum Thread Page
const ForumThreadPage = {
    name: 'ForumThreadPage',
    template: `
        <div class="page-container thread-container">
            <loading-component v-if="loading"></loading-component>
            
            <template v-else>
                <div class="thread-header">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <el-button @click="goBack" :icon="ArrowLeft" circle></el-button>
                        <span style="font-size: 13px; color: var(--text-muted);">返回分区</span>
                        <div style="margin-left: auto;" v-if="canDeleteThread">
                            <el-button type="danger" size="small" @click="deleteThread">
                                <i class="fas fa-trash"></i> 删除帖子
                            </el-button>
                        </div>
                    </div>
                    <h1 class="thread-title">{{ thread.title }}</h1>
                    <div class="thread-meta">
                        <span :style="{ color: thread.user?.color }">
                            <i class="fas fa-user"></i>
                            {{ thread.user?.nickname || thread.user?.username }}
                        </span>
                        <span v-if="thread.user?.badge" class="message-badge" :style="{ background: thread.user?.color }">{{ thread.user?.badge }}</span>
                        <span><i class="fas fa-clock"></i> {{ formatTime(thread.timestamp) }}</span>
                    </div>
                </div>
                
                <div class="thread-content" v-html="renderedContent"></div>
                
                <!-- Replies -->
                <h3 style="margin: 24px 0 16px;">回复 ({{ replies.length }})</h3>
                
                <div v-for="reply in replies" :key="reply.id" class="reply-card">
                    <div class="reply-header">
                        <div class="reply-avatar" :style="{ background: reply.user?.color || '#409eff' }">
                            {{ (reply.user?.nickname || reply.user?.username || '?').charAt(0).toUpperCase() }}
                        </div>
                        <div>
                            <span :style="{ color: reply.user?.color, fontWeight: 600 }">{{ reply.user?.nickname || reply.user?.username }}</span>
                            <span v-if="reply.user?.badge" class="message-badge" :style="{ background: reply.user?.color, marginLeft: '8px' }">{{ reply.user?.badge }}</span>
                        </div>
                        <span style="margin-left: auto; font-size: 12px; color: var(--text-muted);">{{ formatTime(reply.timestamp) }}</span>
                        <el-button 
                            v-if="canDeleteReply(reply)" 
                            type="danger" 
                            size="small" 
                            circle
                            @click="deleteReply(reply)"
                            style="margin-left: 8px;">
                            <i class="fas fa-trash"></i>
                        </el-button>
                    </div>
                    <div class="reply-content" v-html="renderContent(reply.content)"></div>
                </div>
                
                <!-- Reply Form -->
                <div v-if="canReply" class="card" style="margin-top: 24px;">
                    <h3 style="margin-bottom: 16px;">添加回复</h3>
                    <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="输入回复内容...（支持Markdown和LaTeX）"></el-input>
                    <div style="display: flex; gap: 12px; margin-top: 16px;">
                        <el-button type="primary" @click="submitReply" :loading="submitting">回复</el-button>
                        <el-button @click="triggerUpload">
                            <i class="fas fa-paperclip"></i> {{ enableFileUpload ? '上传文件' : '上传图片' }}
                        </el-button>
                    </div>
                    <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" :accept="enableFileUpload ? '' : 'image/*'">
                </div>
            </template>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const route = Vue.ref(StellarisRouter.getRoute());
        const threadId = Vue.computed(() => route.value.params.id);
        
        const thread = Vue.ref({});
        const permission = Vue.ref('');
        const replies = Vue.ref([]);
        const loading = Vue.ref(true);
        
        const replyContent = Vue.ref('');
        const submitting = Vue.ref(false);
        const fileInput = Vue.ref(null);
        
        const canReply = Vue.computed(() => permission.value === 'su' || permission.value === '777');
        
        const enableFileUpload = Vue.computed(() => {
            return store.state.config?.enableFileUpload || false;
        });
        
        const canDeleteThread = Vue.computed(() => {
            if (permission.value === 'su') return true;
            if (permission.value === '777' && Number(thread.value.user?.id) === Number(store.state.user.id)) return true;
            return false;
        });
        
        const canDeleteReply = (reply) => {
            if (permission.value === 'su') return true;
            if (permission.value === '777' && Number(reply.user?.id) === Number(store.state.user.id)) return true;
            return false;
        };
        
        const triggerUpload = () => {
            fileInput.value?.click();
        };
        
        const handleFileUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            const uploadUrl = uploadHelpers.getUploadUrl(enableFileUpload.value);
            
            try {
                const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    const markdown = uploadHelpers.getMarkdown(data, file.name);
                    replyContent.value = (replyContent.value ? replyContent.value + '\n' : '') + markdown;
                    store.showToast(uploadHelpers.getSuccessMessage(data), 'success');
                } else {
                    store.showToast('上传失败: ' + data.message, 'error');
                }
            } catch (err) {
                store.showToast('上传失败', 'error');
            }
            
            fileInput.value.value = '';
        };
        
        const renderedContent = Vue.computed(() => {
            return StellarisUtils.renderContent(thread.value.content || '');
        });
        
        const renderContent = (content) => {
            return StellarisUtils.renderContent(content || '');
        };
        
        const formatTime = (timestamp) => {
            if (!timestamp) return '';
            return new Date(timestamp).toLocaleString('zh-CN');
        };
        
        const goBack = () => {
            if (thread.value.section_id) {
                StellarisRouter.navigate('/forum/' + thread.value.section_id);
            } else {
                StellarisRouter.navigate('/forum');
            }
        };
        
        const loadThread = async () => {
            loading.value = true;
            try {
                const response = await fetch(`/api/spa/forum/thread/${threadId.value}`);
                const data = await response.json();
                if (data.success) {
                    thread.value = data.thread;
                    permission.value = data.permission;
                    replies.value = data.replies || [];
                }
            } catch (e) {
                store.showToast('加载帖子失败', 'error');
            }
            loading.value = false;
        };
        
        const submitReply = async () => {
            if (!replyContent.value.trim()) {
                store.showToast('请输入回复内容', 'warning');
                return;
            }
            
            submitting.value = true;
            try {
                const formData = new FormData();
                formData.append('thread_id', threadId.value);
                formData.append('content', replyContent.value);
                
                const response = await fetch('/api/forum/reply', { method: 'POST', body: formData });
                const data = await response.json();
                
                if (data.success) {
                    store.showToast('回复成功', 'success');
                    replyContent.value = '';
                    loadThread();
                } else {
                    store.showToast(data.message || '回复失败', 'error');
                }
            } catch (e) {
                store.showToast('回复失败', 'error');
            }
            submitting.value = false;
        };
        
        const deleteThread = async () => {
            try {
                await ElMessageBox.confirm(
                    '确定要删除这个帖子吗？此操作不可撤销。',
                    '删除帖子',
                    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
                );
                
                const response = await fetch(`/api/forum/thread/${threadId.value}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    store.showToast('帖子已删除', 'success');
                    if (thread.value.section_id) {
                        StellarisRouter.navigate('/forum/' + thread.value.section_id);
                    } else {
                        StellarisRouter.navigate('/forum');
                    }
                } else {
                    store.showToast(data.message || '删除失败', 'error');
                }
            } catch (e) {
                // Cancelled or error
            }
        };
        
        const deleteReply = async (reply) => {
            try {
                await ElMessageBox.confirm(
                    '确定要删除这条回复吗？此操作不可撤销。',
                    '删除回复',
                    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
                );
                
                const response = await fetch(`/api/forum/reply/${reply.id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    store.showToast('回复已删除', 'success');
                    replies.value = replies.value.filter(r => r.id !== reply.id);
                } else {
                    store.showToast(data.message || '删除失败', 'error');
                }
            } catch (e) {
                // Cancelled or error
            }
        };
        
        Vue.onMounted(loadThread);
        
        window.addEventListener('route-changed', (e) => {
            route.value = e.detail;
        });
        
        return {
            store,
            thread,
            replies,
            loading,
            replyContent,
            submitting,
            fileInput,
            canReply,
            enableFileUpload,
            canDeleteThread,
            canDeleteReply,
            renderedContent,
            renderContent,
            formatTime,
            goBack,
            submitReply,
            deleteThread,
            deleteReply,
            triggerUpload,
            handleFileUpload,
            ArrowLeft: ElementPlusIconsVue.ArrowLeft
        };
    }
};

// Settings Page
const SettingsPage = {
    name: 'SettingsPage',
    template: `
        <div class="page-container settings-container">
            <el-tabs v-model="activeTab" type="border-card">
                <!-- 外观设置 -->
                <el-tab-pane label="外观" name="appearance">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-palette"></i>
                            外观设置
                        </div>
                        <div class="settings-item">
                            <div>
                                <div class="settings-item-label">主题模式</div>
                                <div class="settings-item-description">选择亮色或暗色主题</div>
                            </div>
                            <el-switch v-model="isDark" @change="toggleTheme" active-text="暗色" inactive-text="亮色"></el-switch>
                        </div>
                    </div>
                </el-tab-pane>
                
                <!-- 功能设置 -->
                <el-tab-pane label="功能" name="features">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-sliders-h"></i>
                            功能设置
                        </div>
                        <div class="settings-item">
                            <div>
                                <div class="settings-item-label">爱心雨效果</div>
                                <div class="settings-item-description">发送包含"2026"的消息时显示爱心雨动画</div>
                            </div>
                            <el-switch v-model="heartRainEnabled" @change="toggleHeartRain"></el-switch>
                        </div>
                    </div>
                </el-tab-pane>
                
                <!-- 个人资料 -->
                <el-tab-pane label="个人资料" name="profile" v-if="store.state.user.isAuthenticated">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-user"></i>
                            个人资料设置
                        </div>
                        <div class="current-settings" style="margin-bottom: 20px; padding: 15px; background: var(--surface-color); border-radius: 8px;">
                            <h3 style="margin-bottom: 10px;">当前设置预览</h3>
                            <p style="margin-bottom: 10px;">在聊天中，您的消息会显示为:</p>
                            <div class="sample-text" style="padding: 10px; background: var(--background-color); border-radius: 6px;">
                                <span v-if="profileForm.badge" class="message-badge" 
                                      :style="{ backgroundColor: profileForm.color, color: 'white', display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginRight: '6px' }">
                                    {{ profileForm.badge }}
                                </span>
                                <span :style="{ color: profileForm.color, fontWeight: '600' }">
                                    {{ profileForm.nickname || store.state.user.username }}
                                </span>:
                                <span style="margin-left: 8px;">Ciallo～(∠・ω< )⌒☆</span>
                            </div>
                        </div>
                        <el-form :model="profileForm" label-width="120px">
                            <el-form-item label="昵称">
                                <el-input v-model="profileForm.nickname" placeholder="留空使用用户名"></el-input>
                            </el-form-item>
                            <el-form-item label="颜色">
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <el-input v-model="profileForm.color" placeholder="#000000" style="flex: 1;"></el-input>
                                    <el-color-picker v-model="profileForm.color"></el-color-picker>
                                </div>
                            </el-form-item>
                            <el-form-item label="徽章">
                                <el-input v-model="profileForm.badge" placeholder="如: VIP, MOD"></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="saveProfile" :loading="saving">保存设置</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </el-tab-pane>
                
                <!-- 修改密码 -->
                <el-tab-pane label="修改密码" name="password" v-if="store.state.user.isAuthenticated">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-key"></i>
                            修改密码
                        </div>
                        <div class="requirements" style="margin-bottom: 20px; padding: 15px; background: var(--surface-color); border-radius: 8px;">
                            <p style="font-weight: 600; margin-bottom: 8px;">密码要求:</p>
                            <ul style="margin-left: 20px;">
                                <li>至少{{ store.state.config?.minPasswordLength || 6 }}个字符</li>
                                <li>新密码和确认密码必须一致</li>
                            </ul>
                        </div>
                        <el-form :model="passwordForm" label-width="120px">
                            <el-form-item label="当前密码">
                                <el-input v-model="passwordForm.oldPassword" type="password" show-password></el-input>
                            </el-form-item>
                            <el-form-item label="新密码">
                                <el-input v-model="passwordForm.newPassword" type="password" show-password></el-input>
                            </el-form-item>
                            <el-form-item label="确认新密码">
                                <el-input v-model="passwordForm.confirmPassword" type="password" show-password></el-input>
                            </el-form-item>
                            <el-form-item>
                                <el-button type="primary" @click="changePassword" :loading="saving">修改密码</el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                </el-tab-pane>
                
                <!-- 我的文件/图片 -->
                <el-tab-pane :label="store.state.config.enableFileUpload ? '我的文件' : '我的图片'" name="uploads" v-if="store.state.user.isAuthenticated">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-images"></i>
                            {{ store.state.config.enableFileUpload ? '我的文件' : '我的图片' }}
                        </div>
                        
                        <!-- Quota Info -->
                        <el-alert v-if="quotaInfo" :closable="false" style="margin-bottom: 16px;">
                            <div v-if="quotaInfo.is_admin">
                                <strong>管理员 - 无限制</strong>
                            </div>
                            <div v-else>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>{{ store.state.config.enableFileUpload ? '文件配额' : '图片配额' }}：</span>
                                    <span>{{ (quotaInfo.used / (1024 * 1024)).toFixed(2) }} MB / {{ (quotaInfo.total / (1024 * 1024)).toFixed(2) }} MB ({{ quotaInfo.percent.toFixed(1) }}%)</span>
                                </div>
                                <el-progress :percentage="quotaInfo.percent" :status="quotaInfo.percent >= 90 ? 'exception' : (quotaInfo.percent >= 70 ? 'warning' : 'success')"></el-progress>
                            </div>
                        </el-alert>
                        
                        <!-- Upload Button -->
                        <div style="margin-bottom: 16px;">
                            <input 
                                ref="uploadInput" 
                                type="file" 
                                :accept="store.state.config.enableFileUpload ? '*/*' : 'image/*'" 
                                @change="handleFileUpload" 
                                style="display: none;">
                            <el-button type="primary" @click="triggerFileUpload" :loading="uploading">
                                <i class="fas fa-upload"></i>
                                {{ store.state.config.enableFileUpload ? '上传文件' : '上传图片' }}
                            </el-button>
                        </div>
                        
                        <!-- Files List -->
                        <loading-component v-if="loadingUploads"></loading-component>
                        <div v-else-if="uploadsList.length > 0">
                            <div v-for="item in uploadsList" :key="item.id" style="margin-bottom: 16px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px;">
                                <div style="display: flex; gap: 12px; align-items: start;">
                                    <!-- Preview (for images) -->
                                    <div v-if="item.is_image" style="flex-shrink: 0;">
                                        <img :src="item.url" :alt="item.filename" style="max-width: 120px; max-height: 120px; border-radius: 4px; object-fit: cover;">
                                    </div>
                                    <div v-else style="flex-shrink: 0; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; background: var(--surface-color); border-radius: 4px;">
                                        <i class="fas fa-file" style="font-size: 48px; color: var(--text-muted);"></i>
                                    </div>
                                    
                                    <!-- Info -->
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 600; margin-bottom: 4px; word-break: break-all;">{{ item.filename }}</div>
                                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                                            上传于 {{ new Date(item.uploaded).toLocaleString() }}
                                        </div>
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                            <el-button size="small" @click="copyMarkdown(item.markdown)">
                                                <i class="fas fa-copy"></i> 复制 Markdown
                                            </el-button>
                                            <el-button size="small" type="danger" @click="deleteUpload(item.id)">
                                                <i class="fas fa-trash"></i> 删除
                                            </el-button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <empty-state-component v-else 
                            icon="fas fa-images"
                            title="暂无上传"
                            :description="'还没有上传任何' + (store.state.config.enableFileUpload ? '文件' : '图片')">
                        </empty-state-component>
                    </div>
                </el-tab-pane>
                
                <!-- 关注管理 -->
                <el-tab-pane label="关注管理" name="follows" v-if="store.state.user.isAuthenticated">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-user-friends"></i>
                            关注管理
                        </div>
                        
                        <!-- Search User -->
                        <div style="margin-bottom: 16px;">
                            <el-input 
                                v-model="followSearchQuery" 
                                placeholder="输入用户名并回车搜索"
                                @keyup.enter="searchUserToFollow"
                                :loading="searchingUser">
                                <template #append>
                                    <el-button @click="searchUserToFollow" :loading="searchingUser">
                                        <i class="fas fa-search"></i>
                                    </el-button>
                                </template>
                            </el-input>
                        </div>
                        
                        <!-- Search Result -->
                        <div v-if="searchResult" style="margin-bottom: 16px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">{{ searchResult.nickname || searchResult.username }}</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">@{{ searchResult.username }}</div>
                                </div>
                                <el-button type="primary" size="small" @click="followUser(searchResult)" :loading="following">
                                    <i class="fas fa-user-plus"></i> 关注
                                </el-button>
                            </div>
                        </div>
                        
                        <h3 style="margin-top: 18px; margin-bottom: 12px;">已关注</h3>
                        
                        <!-- Follows List -->
                        <loading-component v-if="loadingFollows"></loading-component>
                        <div v-else-if="followsList.length > 0">
                            <div v-for="follow in followsList" :key="follow.id" style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600;">{{ follow.nickname || follow.username }}</div>
                                    <div style="font-size: 12px; color: var(--text-muted);">@{{ follow.username }}</div>
                                </div>
                                <el-button type="danger" size="small" @click="unfollowUser(follow.id)">
                                    <i class="fas fa-user-minus"></i> 取消关注
                                </el-button>
                            </div>
                        </div>
                        <empty-state-component v-else 
                            icon="fas fa-user-friends"
                            title="暂无关注"
                            description="还没有关注任何用户">
                        </empty-state-component>
                    </div>
                </el-tab-pane>
                
                <!-- 账户管理 -->
                <el-tab-pane label="账户" name="account" v-if="store.state.user.isAuthenticated">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-user-cog"></i>
                            账户管理
                        </div>
                        <el-divider></el-divider>
                        <el-button type="danger" @click="logout" style="width: 100%;">退出登录</el-button>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const activeTab = Vue.ref('appearance');
        
        const isDark = Vue.ref(store.state.theme === 'dark');
        const heartRainEnabled = Vue.ref(store.isHeartRainEnabled());
        const saving = Vue.ref(false);
        
        // Safely initialize profile form with defaults
        const user = store.state.user || {};
        const profileForm = Vue.reactive({
            nickname: user.nickname || '',
            color: user.color || '#000000',
            badge: user.badge || ''
        });
        
        const passwordForm = Vue.reactive({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        // Uploads management
        const uploadsList = Vue.ref([]);
        const loadingUploads = Vue.ref(false);
        const uploading = Vue.ref(false);
        const quotaInfo = Vue.ref(null);
        const uploadInput = Vue.ref(null);
        
        // Follows management
        const followsList = Vue.ref([]);
        const loadingFollows = Vue.ref(false);
        const followSearchQuery = Vue.ref('');
        const searchResult = Vue.ref(null);
        const searchingUser = Vue.ref(false);
        const following = Vue.ref(false);
        
        const toggleTheme = (value) => {
            store.setTheme(value ? 'dark' : 'light');
        };
        
        const toggleHeartRain = (value) => {
            store.setHeartRainEnabled(value);
        };
        
        const saveProfile = async () => {
            saving.value = true;
            try {
                const response = await fetch('/profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nickname: profileForm.nickname || '',
                        color: profileForm.color || '#000000',
                        badge: profileForm.badge || ''
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success(data.message);
                    // Update store
                    store.state.user.nickname = profileForm.nickname;
                    store.state.user.color = profileForm.color;
                    store.state.user.badge = profileForm.badge;
                } else {
                    ElMessage.error(data.message || '保存失败，请重试');
                }
            } catch (error) {
                console.error('Save profile error:', error);
                ElMessage.error('保存失败: ' + error.message);
            } finally {
                saving.value = false;
            }
        };
        
        const changePassword = async () => {
            if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                ElMessage.warning('请填写所有字段');
                return;
            }
            
            // Get minimum password length from server config
            const minPasswordLength = StellarisStore.state.config?.minPasswordLength || 6;
            if (passwordForm.newPassword.length < minPasswordLength) {
                ElMessage.warning(`新密码至少需要${minPasswordLength}个字符`);
                return;
            }
            
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                ElMessage.warning('新密码和确认密码不一致');
                return;
            }
            
            saving.value = true;
            try {
                const response = await fetch('/change_password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        old_password: passwordForm.oldPassword,
                        new_password: passwordForm.newPassword,
                        confirm_password: passwordForm.confirmPassword
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success(data.message);
                    passwordForm.oldPassword = '';
                    passwordForm.newPassword = '';
                    passwordForm.confirmPassword = '';
                } else {
                    ElMessage.error(data.message || '修改失败，请重试');
                }
            } catch (error) {
                console.error('Change password error:', error);
                ElMessage.error('修改失败: ' + error.message);
            } finally {
                saving.value = false;
            }
        };
        
        // Load uploads list
        const loadUploads = async () => {
            loadingUploads.value = true;
            try {
                const response = await fetch('/api/upload/images');
                if (!response.ok) {
                    console.error('Failed to load uploads - HTTP error:', response.status, response.statusText);
                    uploadsList.value = [];
                    ElMessage.error('加载上传列表失败，请稍后重试');
                    return;
                }
                const data = await response.json();
                if (data.success) {
                    uploadsList.value = data.images;
                } else {
                    uploadsList.value = [];
                    ElMessage.error(data.message || '加载上传列表失败');
                }
            } catch (error) {
                console.error('Failed to load uploads - error:', error);
                uploadsList.value = [];
                ElMessage.error('加载上传列表失败');
            } finally {
                loadingUploads.value = false;
            }
        };
        
        // Load quota info
        const loadQuota = async () => {
            try {
                const response = await fetch('/api/upload/quota');
                const data = await response.json();
                if (data.success) {
                    quotaInfo.value = data.quota;
                }
            } catch (error) {
                console.error('Load quota error:', error);
            }
        };
        
        // Trigger file upload
        const triggerFileUpload = () => {
            if (uploadInput.value) {
                uploadInput.value.click();
            }
        };
        
        // Handle file upload
        const handleFileUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            uploading.value = true;
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const uploadUrl = store.state.config.enableFileUpload ? '/api/upload/file' : '/api/upload/image';
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.success) {
                    ElMessage.success((data.is_image ? '图片' : '文件') + '上传成功');
                    await loadUploads();
                    await loadQuota();
                } else {
                    ElMessage.error(data.message || '上传失败');
                }
            } catch (error) {
                console.error('Upload error:', error);
                ElMessage.error('上传失败: ' + error.message);
            } finally {
                uploading.value = false;
                event.target.value = ''; // Reset input
            }
        };
        
        // Copy markdown to clipboard
        const copyMarkdown = async (markdown) => {
            try {
                await navigator.clipboard.writeText(markdown);
                ElMessage.success('Markdown 已复制到剪贴板');
            } catch (error) {
                console.error('Copy error:', error);
                ElMessage.error('复制失败');
            }
        };
        
        // Delete upload
        const deleteUpload = async (id) => {
            try {
                await ElMessageBox.confirm('确定要删除这个文件吗？', '确认删除', {
                    confirmButtonText: '删除',
                    cancelButtonText: '取消',
                    type: 'warning'
                });
                
                const response = await fetch(`/api/upload/image/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                if (data.success) {
                    ElMessage.success('删除成功');
                    await loadUploads();
                    await loadQuota();
                } else {
                    ElMessage.error(data.message || '删除失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Delete error:', error);
                    ElMessage.error('删除失败');
                }
            }
        };
        
        // Load follows list
        const loadFollows = async () => {
            loadingFollows.value = true;
            try {
                const response = await fetch('/api/follows');
                const data = await response.json();
                if (data.success) {
                    followsList.value = data.follows;
                }
            } catch (error) {
                console.error('Load follows error:', error);
                ElMessage.error('加载关注列表失败');
            } finally {
                loadingFollows.value = false;
            }
        };
        
        // Search user to follow
        const searchUserToFollow = async () => {
            if (!followSearchQuery.value.trim()) {
                ElMessage.warning('请输入用户名');
                return;
            }
            
            searchingUser.value = true;
            try {
                const response = await fetch(`/api/search_users?username=${encodeURIComponent(followSearchQuery.value)}`);
                const data = await response.json();
                
                if (data.success && data.users && data.users.length > 0) {
                    searchResult.value = data.users[0];
                } else {
                    ElMessage.warning('未找到用户');
                    searchResult.value = null;
                }
            } catch (error) {
                console.error('Search user error:', error);
                ElMessage.error('搜索失败');
            } finally {
                searchingUser.value = false;
            }
        };
        
        // Follow user
        const followUser = async (user) => {
            following.value = true;
            try {
                const response = await fetch('/api/follows', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id
                    })
                });
                
                const data = await response.json();
                if (data.success) {
                    ElMessage.success('关注成功');
                    searchResult.value = null;
                    followSearchQuery.value = '';
                    await loadFollows();
                } else {
                    ElMessage.error(data.message || '关注失败');
                }
            } catch (error) {
                console.error('Follow error:', error);
                ElMessage.error('关注失败: ' + error.message);
            } finally {
                following.value = false;
            }
        };
        
        // Unfollow user
        const unfollowUser = async (userId) => {
            try {
                await ElMessageBox.confirm('确定要取消关注吗？', '确认取消', {
                    confirmButtonText: '取消关注',
                    cancelButtonText: '保留',
                    type: 'warning'
                });
                
                const response = await fetch(`/api/follows/${userId}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                if (data.success) {
                    ElMessage.success('已取消关注');
                    await loadFollows();
                } else {
                    ElMessage.error(data.message || '取消失败');
                }
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('Unfollow error:', error);
                    ElMessage.error('取消失败');
                }
            }
        };
        
        const goToUrl = (url) => {
            window.location.href = url;
        };
        
        const logout = () => {
            window.location.href = '/logout';
        };
        
        // Watch activeTab to load data when needed
        Vue.watch(activeTab, (newTab) => {
            if (newTab === 'uploads') {
                loadUploads();
                loadQuota();
            } else if (newTab === 'follows') {
                loadFollows();
            }
        });
        
        return {
            store,
            activeTab,
            isDark,
            heartRainEnabled,
            saving,
            profileForm,
            passwordForm,
            uploadsList,
            loadingUploads,
            uploading,
            quotaInfo,
            uploadInput,
            followsList,
            loadingFollows,
            followSearchQuery,
            searchResult,
            searchingUser,
            following,
            toggleTheme,
            toggleHeartRain,
            saveProfile,
            changePassword,
            triggerFileUpload,
            handleFileUpload,
            copyMarkdown,
            deleteUpload,
            searchUserToFollow,
            followUser,
            unfollowUser,
            goToUrl,
            logout
        };
    }
};

// Admin Page
const AdminPage = {
    name: 'AdminPage',
    template: `
        <div class="page-container">
            <h2 style="margin-bottom: 24px;">管理面板</h2>
            
            <el-tabs v-model="activeTab" type="border-card">
                <!-- System Tools Tab -->
                <el-tab-pane label="系统工具" name="system">
                    <el-card shadow="hover" style="margin-bottom: 24px;">
                        <template #header>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-tools"></i>
                                <span>系统工具</span>
                            </div>
                        </template>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <el-button @click="getSystemInfo" :loading="loading.systemInfo">
                                <i class="fas fa-info-circle"></i> 系统信息
                            </el-button>
                            <el-button @click="viewLogs" :loading="loading.logs">
                                <i class="fas fa-file-alt"></i> 查看日志
                            </el-button>
                            <el-button @click="clearCache" :loading="loading.clearCache">
                                <i class="fas fa-broom"></i> 清除缓存
                            </el-button>
                            <el-button @click="backupDatabase" :loading="loading.backup">
                                <i class="fas fa-save"></i> 备份数据库
                            </el-button>
                            <el-button @click="optimizeDatabase" :loading="loading.optimize">
                                <i class="fas fa-cog"></i> 优化数据库
                            </el-button>
                            <el-button @click="recalculateUploads" :loading="loading.recalculate">
                                <i class="fas fa-calculator"></i> 重新统计图片大小
                            </el-button>
                            <el-button @click="recountFiles" :loading="loading.recount">
                                <i class="fas fa-sync"></i> 重新按文件统计
                            </el-button>
                        </div>
                    </el-card>
                    
                    <!-- Backup & Download -->
                    <el-card shadow="hover" style="margin-bottom: 24px;">
                        <template #header>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-download"></i>
                                <span>备份下载</span>
                            </div>
                        </template>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <el-button @click="downloadProject">
                                <i class="fas fa-folder-open"></i> 下载项目根目录
                            </el-button>
                            <el-button @click="downloadDatabase">
                                <i class="fas fa-database"></i> 下载数据库文件
                            </el-button>
                            <el-button @click="downloadImages">
                                <i class="fas fa-images"></i> 下载图片压缩包
                            </el-button>
                        </div>
                    </el-card>
                    
                    <!-- Server Control (if enabled) -->
                    <el-card shadow="hover" v-if="serverControlEnabled">
                        <template #header>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-server"></i>
                                <span style="color: var(--danger-color);">服务器控制</span>
                            </div>
                        </template>
                        <el-alert type="warning" :closable="false" style="margin-bottom: 16px;">
                            <template #title>危险操作：请谨慎使用以下功能</template>
                        </el-alert>
                        <div style="display: flex; gap: 12px;">
                            <el-button type="warning" @click="restartServer" :loading="loading.restart">
                                <i class="fas fa-redo"></i> 重启服务器
                            </el-button>
                            <el-button type="danger" @click="shutdownServer" :loading="loading.shutdown">
                                <i class="fas fa-power-off"></i> 关停服务器
                            </el-button>
                        </div>
                    </el-card>
                    
                    <!-- Output Display -->
                    <el-card v-if="outputVisible" shadow="hover" :class="outputError ? 'error-output' : 'success-output'">
                        <template #header>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span>{{ outputError ? '错误信息' : '执行结果' }}</span>
                                <el-button size="small" text @click="outputVisible = false">
                                    <i class="fas fa-times"></i>
                                </el-button>
                            </div>
                        </template>
                        <pre style="white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 14px; max-height: 400px; overflow-y: auto;">{{ outputText }}</pre>
                    </el-card>
                </el-tab-pane>
                
                <!-- User Management Tab -->
                <el-tab-pane label="用户管理" name="users">
                    <div style="margin-bottom: 16px;">
                        <el-button type="primary" @click="showUserDialog()">
                            <i class="fas fa-plus"></i> 新建用户
                        </el-button>
                        <el-button @click="loadUsers" :loading="loading.users">
                            <i class="fas fa-sync"></i> 刷新
                        </el-button>
                    </div>
                    
                    <el-table :data="users" v-loading="loading.users" stripe border>
                        <el-table-column prop="id" label="ID" width="80"></el-table-column>
                        <el-table-column prop="username" label="用户名" width="150"></el-table-column>
                        <el-table-column prop="nickname" label="昵称" width="150"></el-table-column>
                        <el-table-column label="颜色" width="100">
                            <template #default="scope">
                                <div :style="{ color: scope.row.color || '#409eff', fontWeight: 'bold' }">
                                    {{ scope.row.color || '#409eff' }}
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="badge" label="徽章" width="120"></el-table-column>
                        <el-table-column prop="role" label="角色" width="100">
                            <template #default="scope">
                                <el-tag v-if="scope.row.role === 'admin'" type="danger">管理员</el-tag>
                                <el-tag v-else-if="scope.row.role === 'user'" type="info">普通用户</el-tag>
                                <el-tag v-else type="info">{{ scope.row.role || 'N/A' }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" label="创建时间" width="180"></el-table-column>
                        <el-table-column label="操作" fixed="right" width="200">
                            <template #default="scope">
                                <el-button size="small" @click="showUserDialog(scope.row)">编辑</el-button>
                                <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- User Dialog -->
                    <el-dialog v-model="userDialogVisible" :title="editingUser.id ? '编辑用户' : '新建用户'" width="500px">
                        <el-form :model="editingUser" label-width="100px">
                            <el-form-item label="用户名">
                                <el-input v-model="editingUser.username" :disabled="!!editingUser.id"></el-input>
                            </el-form-item>
                            <el-form-item label="密码" v-if="!editingUser.id">
                                <el-input v-model="editingUser.password" type="password"></el-input>
                            </el-form-item>
                            <el-form-item label="昵称">
                                <el-input v-model="editingUser.nickname"></el-input>
                            </el-form-item>
                            <el-form-item label="颜色">
                                <el-color-picker v-model="editingUser.color"></el-color-picker>
                            </el-form-item>
                            <el-form-item label="徽章">
                                <el-input v-model="editingUser.badge"></el-input>
                            </el-form-item>
                            <el-form-item label="角色">
                                <el-select v-model="editingUser.role">
                                    <el-option label="普通用户" value="user"></el-option>
                                    <el-option label="管理员" value="admin"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <el-button @click="userDialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="saveUser" :loading="loading.saveUser">保存</el-button>
                        </template>
                    </el-dialog>
                </el-tab-pane>
                
                <!-- Chat Management Tab -->
                <el-tab-pane label="聊天管理" name="chat">
                    <div style="margin-bottom: 16px;">
                        <el-button type="primary" @click="showRoomDialog()">
                            <i class="fas fa-plus"></i> 新建聊天室
                        </el-button>
                        <el-button @click="loadRooms" :loading="loading.rooms">
                            <i class="fas fa-sync"></i> 刷新
                        </el-button>
                    </div>
                    
                    <el-table :data="rooms" v-loading="loading.rooms" stripe border>
                        <el-table-column prop="id" label="ID" width="80"></el-table-column>
                        <el-table-column prop="name" label="聊天室名称" min-width="200"></el-table-column>
                        <el-table-column prop="description" label="描述" min-width="300"></el-table-column>
                        <el-table-column label="操作" fixed="right" width="280">
                            <template #default="scope">
                                <el-button size="small" @click="showRoomPermissions(scope.row)">权限</el-button>
                                <el-button size="small" @click="showRoomDialog(scope.row)">编辑</el-button>
                                <el-button size="small" type="danger" @click="deleteRoom(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- Room Dialog -->
                    <el-dialog v-model="roomDialogVisible" :title="editingRoom.id ? '编辑聊天室' : '新建聊天室'" width="500px">
                        <el-form :model="editingRoom" label-width="100px">
                            <el-form-item label="名称">
                                <el-input v-model="editingRoom.name"></el-input>
                            </el-form-item>
                            <el-form-item label="描述">
                                <el-input v-model="editingRoom.description" type="textarea" :rows="3"></el-input>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <el-button @click="roomDialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="saveRoom" :loading="loading.saveRoom">保存</el-button>
                        </template>
                    </el-dialog>
                    
                    <!-- Room Permissions Dialog -->
                    <el-dialog v-model="roomPermissionsVisible" :title="'权限管理 - ' + (currentRoom?.name || '')" width="700px">
                        <div style="margin-bottom: 16px;">
                            <el-radio-group v-model="permissionView">
                                <el-radio-button label="list">按权限显示</el-radio-button>
                                <el-radio-button label="quick">777快速选择</el-radio-button>
                            </el-radio-group>
                        </div>
                        
                        <!-- List View -->
                        <div v-if="permissionView === 'list'" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                            <div>
                                <h4>SU</h4>
                                <div style="border: 1px solid #eee; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto;">
                                    <div v-for="user in roomUsersBySU" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'chat', currentRoom.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="roomUsersBySU.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                            <div>
                                <h4>777</h4>
                                <div style="border: 1px solid #eee; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto;">
                                    <div v-for="user in roomUsersBy777" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'chat', currentRoom.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="roomUsersBy777.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                            <div>
                                <h4>444</h4>
                                <div style="border: 1px solid #eee; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto;">
                                    <div v-for="user in roomUsersBy444" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'chat', currentRoom.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="roomUsersBy444.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                            <div>
                                <h4>未设置</h4>
                                <div style="border: 1px dashed #ddd; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto; color: #666;">
                                    <div v-for="user in roomUsersByNull" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'chat', currentRoom.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="roomUsersByNull.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Select View -->
                        <div v-if="permissionView === 'quick'">
                            <p style="margin-bottom: 12px; color: var(--text-secondary);">点击用户切换777权限状态（SU用户不显示）</p>
                            <div style="border: 1px solid var(--border-color, #eee); padding: 12px; border-radius: 6px; max-height: 400px; overflow-y: auto;">
                                <div v-for="user in roomUsersNonSU" :key="user.id" 
                                     @click="toggleRoomUser777(user)"
                                     style="padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                                     :style="{ 
                                         background: user.perm === '777' ? 'var(--el-color-primary-light-9, #e6f7ff)' : 'var(--el-fill-color-light, #f5f5f5)', 
                                         border: user.perm === '777' ? '1px solid var(--el-color-primary-light-5, #91d5ff)' : '1px solid var(--border-color, #d9d9d9)',
                                         color: 'var(--text-primary, inherit)'
                                     }">
                                    <span>{{ user.nickname || user.username }}</span>
                                    <el-tag v-if="user.perm === '777'" type="success" size="small">777</el-tag>
                                    <el-tag v-else type="info" size="small">Null</el-tag>
                                </div>
                                <div v-if="roomUsersNonSU.length === 0" style="color: var(--text-secondary, #999); padding: 12px; text-align: center;">无可用用户</div>
                            </div>
                        </div>
                        
                        <template #footer>
                            <el-button @click="roomPermissionsVisible = false">关闭</el-button>
                        </template>
                    </el-dialog>
                </el-tab-pane>
                
                <!-- Forum Management Tab -->
                <el-tab-pane label="论坛管理" name="forum">
                    <div style="margin-bottom: 16px;">
                        <el-button type="primary" @click="showSectionDialog()">
                            <i class="fas fa-plus"></i> 新建分区
                        </el-button>
                        <el-button @click="loadSections" :loading="loading.sections">
                            <i class="fas fa-sync"></i> 刷新
                        </el-button>
                    </div>
                    
                    <el-table :data="sections" v-loading="loading.sections" stripe border>
                        <el-table-column prop="id" label="ID" width="80"></el-table-column>
                        <el-table-column prop="name" label="分区名称" min-width="200"></el-table-column>
                        <el-table-column prop="description" label="描述" min-width="350"></el-table-column>
                        <el-table-column label="操作" fixed="right" width="280">
                            <template #default="scope">
                                <el-button size="small" @click="showSectionPermissions(scope.row)">权限</el-button>
                                <el-button size="small" @click="showSectionDialog(scope.row)">编辑</el-button>
                                <el-button size="small" type="danger" @click="deleteSection(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- Section Dialog -->
                    <el-dialog v-model="sectionDialogVisible" :title="editingSection.id ? '编辑分区' : '新建分区'" width="500px">
                        <el-form :model="editingSection" label-width="100px">
                            <el-form-item label="名称">
                                <el-input v-model="editingSection.name"></el-input>
                            </el-form-item>
                            <el-form-item label="描述">
                                <el-input v-model="editingSection.description" type="textarea" :rows="3"></el-input>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <el-button @click="sectionDialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="saveSection" :loading="loading.saveSection">保存</el-button>
                        </template>
                    </el-dialog>
                    
                    <!-- Section Permissions Dialog -->
                    <el-dialog v-model="sectionPermissionsVisible" :title="'权限管理 - ' + (currentSection?.name || '')" width="700px">
                        <div style="margin-bottom: 16px;">
                            <el-radio-group v-model="permissionView">
                                <el-radio-button label="list">按权限显示</el-radio-button>
                                <el-radio-button label="quick">777快速选择</el-radio-button>
                            </el-radio-group>
                        </div>
                        
                        <!-- List View -->
                        <div v-if="permissionView === 'list'" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                            <div>
                                <h4>SU</h4>
                                <div style="border: 1px solid #eee; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto;">
                                    <div v-for="user in sectionUsersBySU" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'forum', currentSection.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="sectionUsersBySU.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                            <div>
                                <h4>777</h4>
                                <div style="border: 1px solid #eee; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto;">
                                    <div v-for="user in sectionUsersBy777" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'forum', currentSection.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="sectionUsersBy777.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                            <div>
                                <h4>444</h4>
                                <div style="border: 1px solid #eee; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto;">
                                    <div v-for="user in sectionUsersBy444" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'forum', currentSection.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="sectionUsersBy444.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                            <div>
                                <h4>未设置</h4>
                                <div style="border: 1px dashed #ddd; padding: 8px; border-radius: 6px; min-height: 200px; max-height: 300px; overflow-y: auto; color: #666;">
                                    <div v-for="user in sectionUsersByNull" :key="user.id" style="padding: 4px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>{{ user.nickname || user.username }}</span>
                                        <el-select v-model="user.perm" size="small" @change="updateUserPermission(user, 'forum', currentSection.id)" style="width: 80px;">
                                            <el-option label="SU" value="su"></el-option>
                                            <el-option label="777" value="777"></el-option>
                                            <el-option label="444" value="444"></el-option>
                                            <el-option label="Null" value="Null"></el-option>
                                        </el-select>
                                    </div>
                                    <div v-if="sectionUsersByNull.length === 0" style="color: #999; padding: 8px;">无</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Select View -->
                        <div v-if="permissionView === 'quick'">
                            <p style="margin-bottom: 12px; color: var(--text-secondary);">点击用户切换777权限状态（SU用户不显示）</p>
                            <div style="border: 1px solid var(--border-color, #eee); padding: 12px; border-radius: 6px; max-height: 400px; overflow-y: auto;">
                                <div v-for="user in sectionUsersNonSU" :key="user.id" 
                                     @click="toggleSectionUser777(user)"
                                     style="padding: 8px 12px; margin-bottom: 6px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;"
                                     :style="{ 
                                         background: user.perm === '777' ? 'var(--el-color-primary-light-9, #e6f7ff)' : 'var(--el-fill-color-light, #f5f5f5)', 
                                         border: user.perm === '777' ? '1px solid var(--el-color-primary-light-5, #91d5ff)' : '1px solid var(--border-color, #d9d9d9)',
                                         color: 'var(--text-primary, inherit)'
                                     }">
                                    <span>{{ user.nickname || user.username }}</span>
                                    <el-tag v-if="user.perm === '777'" type="success" size="small">777</el-tag>
                                    <el-tag v-else type="info" size="small">Null</el-tag>
                                </div>
                                <div v-if="sectionUsersNonSU.length === 0" style="color: var(--text-secondary, #999); padding: 12px; text-align: center;">无可用用户</div>
                            </div>
                        </div>
                        
                        <template #footer>
                            <el-button @click="sectionPermissionsVisible = false">关闭</el-button>
                        </template>
                    </el-dialog>
                </el-tab-pane>
                
                <!-- Database Management Tab -->
                <el-tab-pane label="数据库管理" name="database">
                    <div style="margin-bottom: 16px;">
                        <el-button @click="loadDatabaseTables" :loading="loading.dbTables">
                            <i class="fas fa-sync"></i> 刷新表列表
                        </el-button>
                        <el-button @click="goToUrl('/admin/db/')">
                            <i class="fas fa-external-link-alt"></i> 打开完整管理界面
                        </el-button>
                    </div>
                    
                    <el-card v-if="!selectedTable">
                        <h3 style="margin-bottom: 16px;">数据库表列表</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                            <el-card v-for="table in dbTables" :key="table" 
                                     shadow="hover" 
                                     @click="selectTable(table)"
                                     style="cursor: pointer;">
                                <div style="text-align: center;">
                                    <i class="fas fa-table" style="font-size: 32px; color: var(--primary-color); margin-bottom: 8px;"></i>
                                    <h4>{{ table }}</h4>
                                </div>
                            </el-card>
                        </div>
                        <div v-if="dbTables.length === 0 && !loading.dbTables" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            <i class="fas fa-database" style="font-size: 48px; margin-bottom: 16px;"></i>
                            <p>暂无数据表</p>
                        </div>
                    </el-card>
                    
                    <el-card v-else>
                        <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <el-button @click="selectedTable = null" size="small">
                                    <i class="fas fa-arrow-left"></i> 返回表列表
                                </el-button>
                                <span style="margin-left: 16px; font-size: 18px; font-weight: bold;">{{ selectedTable }}</span>
                            </div>
                            <el-button @click="loadTableData" :loading="loading.tableData" size="small">
                                <i class="fas fa-sync"></i> 刷新
                            </el-button>
                        </div>
                        
                        <el-table :data="tableData" v-loading="loading.tableData" stripe border style="width: 100%;" max-height="500">
                            <el-table-column v-for="col in tableColumns" :key="col" :prop="col" :label="col" min-width="120" show-overflow-tooltip></el-table-column>
                            <el-table-column label="操作" fixed="right" width="180">
                                <template #default="scope">
                                    <el-button size="small" @click="showEditRecordDialog(scope.row)">编辑</el-button>
                                    <el-button size="small" type="danger" @click="deleteRecord(scope.row)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <div v-if="tableData.length === 0 && !loading.tableData" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            表中暂无数据
                        </div>
                    </el-card>
                    
                    <!-- Edit Record Dialog -->
                    <el-dialog v-model="editRecordDialogVisible" :title="'编辑记录 - ' + selectedTable" width="600px">
                        <el-form :model="editingRecord" label-width="120px" v-if="editingRecord">
                            <el-form-item v-for="col in editableColumns" :key="col" :label="col">
                                <el-input v-model="editingRecord[col]"></el-input>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <el-button @click="editRecordDialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="saveRecord" :loading="loading.saveRecord">保存</el-button>
                        </template>
                    </el-dialog>
                </el-tab-pane>
                
                <!-- Quotes Management Tab -->
                <el-tab-pane label="名言管理" name="quotes">
                    <div style="margin-bottom: 16px;">
                        <el-button type="primary" @click="showQuoteDialog()">
                            <i class="fas fa-plus"></i> 新建名言
                        </el-button>
                        <el-button @click="loadQuotes" :loading="loading.quotes">
                            <i class="fas fa-sync"></i> 刷新
                        </el-button>
                    </div>
                    
                    <el-table :data="quotes" v-loading="loading.quotes" stripe border>
                        <el-table-column prop="id" label="ID" width="80"></el-table-column>
                        <el-table-column prop="text" label="名言内容" min-width="300"></el-table-column>
                        <el-table-column prop="author" label="作者" width="150"></el-table-column>
                        <el-table-column label="操作" fixed="right" width="200">
                            <template #default="scope">
                                <el-button size="small" @click="showQuoteDialog(scope.row)">编辑</el-button>
                                <el-button size="small" type="danger" @click="deleteQuote(scope.row)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    
                    <!-- Quote Dialog -->
                    <el-dialog v-model="quoteDialogVisible" :title="editingQuote.id ? '编辑名言' : '新建名言'" width="600px">
                        <el-form :model="editingQuote" label-width="100px">
                            <el-form-item label="名言内容">
                                <el-input v-model="editingQuote.text" type="textarea" :rows="4"></el-input>
                            </el-form-item>
                            <el-form-item label="作者">
                                <el-input v-model="editingQuote.author"></el-input>
                            </el-form-item>
                        </el-form>
                        <template #footer>
                            <el-button @click="quoteDialogVisible = false">取消</el-button>
                            <el-button type="primary" @click="saveQuote" :loading="loading.saveQuote">保存</el-button>
                        </template>
                    </el-dialog>
                </el-tab-pane>
                
                <!-- File Manager Tab -->
            </el-tabs>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const activeTab = Vue.ref('system');
        
        // Helper function for API calls with SU verification check
        const fetchWithSU = async (url, options = {}) => {
            const response = await StellarisUtils.fetchWithSUCheck(url, options);
            if (response === null) {
                // User was redirected to SU verification page
                throw new Error('SU verification required');
            }
            return response;
        };
        
        const loading = Vue.reactive({
            systemInfo: false,
            logs: false,
            clearCache: false,
            backup: false,
            optimize: false,
            recalculate: false,
            recount: false,
            restart: false,
            shutdown: false,
            users: false,
            saveUser: false,
            rooms: false,
            saveRoom: false,
            sections: false,
            saveSection: false,
            quotes: false,
            saveQuote: false,
            dbTables: false,
            tableData: false,
            saveRecord: false
        });
        
        const outputVisible = Vue.ref(false);
        const outputText = Vue.ref('');
        const outputError = Vue.ref(false);
        const serverControlEnabled = Vue.ref(store.state.config?.enableServerControl || false);
        
        // Users
        const users = Vue.ref([]);
        const userDialogVisible = Vue.ref(false);
        const editingUser = Vue.ref({});
        
        // Rooms
        const rooms = Vue.ref([]);
        const roomDialogVisible = Vue.ref(false);
        const editingRoom = Vue.ref({});
        
        // Room Permissions
        const roomPermissionsVisible = Vue.ref(false);
        const currentRoom = Vue.ref(null);
        const roomUsers = Vue.ref([]);
        const permissionView = Vue.ref('list');
        
        // Sections
        const sections = Vue.ref([]);
        const sectionDialogVisible = Vue.ref(false);
        const editingSection = Vue.ref({});
        
        // Section Permissions
        const sectionPermissionsVisible = Vue.ref(false);
        const currentSection = Vue.ref(null);
        const sectionUsers = Vue.ref([]);
        
        // Quotes
        const quotes = Vue.ref([]);
        const quoteDialogVisible = Vue.ref(false);
        const editingQuote = Vue.ref({});
        
        // Database
        const dbTables = Vue.ref([]);
        const selectedTable = Vue.ref(null);
        const tableColumns = Vue.ref([]);
        const tableData = Vue.ref([]);
        const editRecordDialogVisible = Vue.ref(false);
        const editingRecord = Vue.ref(null);
        const primaryKey = Vue.ref('id');
        
        const editableColumns = Vue.computed(() => {
            return tableColumns.value.filter(col => col !== primaryKey.value);
        });
        
        const showOutput = (text, isError = false) => {
            outputText.value = text;
            outputError.value = isError;
            outputVisible.value = true;
        };
        
        const goToUrl = (url) => {
            window.location.href = url;
        };
        
        // System Tools Functions
        const getSystemInfo = async () => {
            loading.systemInfo = true;
            try {
                const response = await fetchWithSU('/api/admin/system-info');
                const data = await response.json();
                if (data.success) {
                    const info = `内存: ${data.memory_usage || 'N/A'}\n时间: ${data.server_time || 'N/A'}\nPython: ${data.python_version || 'N/A'}\nFlask: ${data.flask_version || 'N/A'}`;
                    showOutput(info, false);
                } else {
                    showOutput('错误: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.systemInfo = false;
            }
        };
        
        const viewLogs = async () => {
            loading.logs = true;
            try {
                const response = await fetchWithSU('/api/admin/system-log');
                const data = await response.json();
                if (data.success) {
                    const logs = (data.logs || []).map(l => `[${l.timestamp}] ${l.message}`).join('\n\n');
                    showOutput(logs || '无日志', false);
                } else {
                    showOutput('获取日志失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.logs = false;
            }
        };
        
        const clearCache = async () => {
            const confirmed = await ElMessageBox.confirm(
                '确认要清除服务器缓存？此操作不会重启服务。',
                '清除缓存',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.clearCache = true;
            try {
                const response = await fetchWithSU('/api/admin/clear-cache', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    showOutput('清除缓存成功: ' + (data.message || ''), false);
                    ElMessage.success('缓存已清除');
                } else {
                    showOutput('清除缓存失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.clearCache = false;
            }
        };
        
        const backupDatabase = async () => {
            const confirmed = await ElMessageBox.confirm(
                '是否创建数据库备份？请确认为管理员操作。',
                '备份数据库',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.backup = true;
            try {
                const response = await fetchWithSU('/api/admin/backup-database', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    showOutput('备份成功: ' + (data.backup_path || data.message || '已创建'), false);
                    ElMessage.success('数据库备份成功');
                } else {
                    showOutput('备份失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.backup = false;
            }
        };
        
        const optimizeDatabase = async () => {
            const confirmed = await ElMessageBox.confirm(
                '确认执行数据库优化（VACUUM）？此操作可能会阻塞数据库短时间。',
                '数据库优化',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.optimize = true;
            try {
                const response = await fetchWithSU('/api/admin/optimize-database', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    showOutput('优化成功: ' + (data.message || ''), false);
                    ElMessage.success('数据库已优化');
                } else {
                    showOutput('优化失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.optimize = false;
            }
        };
        
        const recountFiles = async () => {
            const confirmed = await ElMessageBox.confirm(
                '将通过扫描磁盘重新统计每个用户上传的文件大小并更新数据库，可能需要一些时间，是否继续？',
                '重新按文件统计大小',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.recount = true;
            try {
                const response = await fetchWithSU('/api/admin/recount-file-size', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    showOutput(`完成，更新用户数: ${data.updated_users || 0}\n总文件数: ${data.total_files || 0}`, false);
                    ElMessage.success('文件大小重新统计完成');
                } else {
                    showOutput('失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.recount = false;
            }
        };
        
        const recalculateUploads = async () => {
            const confirmed = await ElMessageBox.confirm(
                '是否重新统计所有用户的上传图片大小？此操作仅从数据库统计并返回结果。',
                '重新统计图片大小',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.recalculate = true;
            try {
                const response = await fetchWithSU('/api/admin/recalculate-upload-sizes', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    const totals = data.totals || {};
                    const lines = Object.keys(totals).map(uid => `用户ID ${uid}: ${totals[uid]} 字节`);
                    showOutput('统计结果:\n' + lines.join('\n'), false);
                    ElMessage.success('图片大小重新统计完成');
                } else {
                    showOutput('执行失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.recalculate = false;
            }
        };
        
        const downloadProject = async () => {
            const confirmed = await ElMessageBox.confirm(
                '将创建项目根目录压缩包（会排除 uploads/logs 等大文件夹），是否继续？',
                '下载项目根目录',
                { type: 'info' }
            ).catch(() => false);
            
            if (!confirmed) return;
            window.location.href = '/down';
        };
        
        const downloadDatabase = async () => {
            const confirmed = await ElMessageBox.confirm(
                '下载数据库文件，仅支持 SQLite，确认吗？',
                '下载数据库',
                { type: 'info' }
            ).catch(() => false);
            
            if (!confirmed) return;
            window.location.href = '/downdb';
        };
        
        const downloadImages = async () => {
            const confirmed = await ElMessageBox.confirm(
                '将创建一个静态图片压缩包并下载，可能会占用较多磁盘空间。是否继续？',
                '下载静态图片压缩包',
                { type: 'info' }
            ).catch(() => false);
            
            if (!confirmed) return;
            window.location.href = '/admin/download-images-zip';
        };
        
        const restartServer = async () => {
            const confirmed = await ElMessageBox.confirm(
                '确认要重启服务器？所有用户连接将中断。',
                '重启服务器',
                { type: 'error' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.restart = true;
            try {
                const response = await fetchWithSU('/api/admin/restart', { method: 'POST' });
                const data = await response.json();
                if (data.success) {
                    showOutput('服务器正在重启: ' + (data.message || ''), false);
                    ElMessage.warning('服务器正在重启...');
                } else {
                    showOutput('重启失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.restart = false;
            }
        };
        
        const shutdownServer = async () => {
            const reason = await ElMessageBox.prompt(
                '请输入关停原因（可选）:',
                '关停服务器',
                { confirmButtonText: '下一步', cancelButtonText: '取消' }
            ).then(({ value }) => value || '由管理员触发').catch(() => null);
            
            if (reason === null) return;
            
            const confirmed = await ElMessageBox.confirm(
                '确认关停服务器？此操作会关闭进程。',
                '确认',
                { type: 'error' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            loading.shutdown = true;
            try {
                const response = await fetchWithSU('/api/admin/shutdown', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reason })
                });
                const data = await response.json();
                if (data.success) {
                    showOutput(`关停已触发: ${data.message || ''}\n原因: ${data.reason || ''}`, false);
                    ElMessage.warning('服务器正在关停...');
                } else {
                    showOutput('关停失败: ' + (data.message || JSON.stringify(data)), true);
                }
            } catch (error) {
                showOutput('请求失败: ' + error.message, true);
            } finally {
                loading.shutdown = false;
            }
        };
        
        // User Management Functions
        const loadUsers = async () => {
            loading.users = true;
            try {
                const response = await fetchWithSU('/api/admin/users');
                const data = await response.json();
                if (data.success) {
                    users.value = data.users || [];
                } else {
                    ElMessage.error('加载用户失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.users = false;
            }
        };
        
        const showUserDialog = (user = null) => {
            if (user) {
                editingUser.value = { ...user };
            } else {
                editingUser.value = { username: '', password: '', nickname: '', color: '#409eff', badge: '', role: 'user' };
            }
            userDialogVisible.value = true;
        };
        
        const saveUser = async () => {
            loading.saveUser = true;
            try {
                const isEdit = !!editingUser.value.id;
                const url = isEdit 
                    ? `/api/admin/users/${editingUser.value.id}` 
                    : '/api/admin/users';
                const method = isEdit ? 'PUT' : 'POST';
                
                // For editing, we need to track the original role to detect changes
                const originalRole = isEdit ? users.value.find(u => u.id === editingUser.value.id)?.role : null;
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingUser.value)
                });
                const data = await response.json();
                
                if (data.success) {
                    // If editing and role changed, update role separately
                    if (isEdit && originalRole !== undefined && originalRole !== editingUser.value.role) {
                        try {
                            const roleResponse = await fetchWithSU(`/api/admin/users/${editingUser.value.id}/role`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role: editingUser.value.role })
                            });
                            const roleData = await roleResponse.json();
                            if (!roleData.success) {
                                ElMessage.warning(roleData.message ? '用户信息已更新，但角色更新失败: ' + roleData.message : '用户信息已更新，但角色更新失败');
                            }
                        } catch (roleError) {
                            ElMessage.warning('用户信息已更新，但角色更新失败');
                        }
                    }
                    
                    ElMessage.success(isEdit ? '用户更新成功' : '用户创建成功');
                    userDialogVisible.value = false;
                    loadUsers();
                } else {
                    ElMessage.error('保存失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.saveUser = false;
            }
        };
        
        const deleteUser = async (user) => {
            const confirmed = await ElMessageBox.confirm(
                `确认删除用户 "${user.username}" 吗？此操作不可恢复。`,
                '删除用户',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            try {
                const response = await fetchWithSU(`/api/admin/users/${user.id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success('用户删除成功');
                    loadUsers();
                } else {
                    ElMessage.error('删除失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Chat Room Management Functions
        const loadRooms = async () => {
            loading.rooms = true;
            try {
                const response = await fetchWithSU('/api/admin/chat/rooms');
                const data = await response.json();
                if (data.success) {
                    rooms.value = data.rooms || [];
                } else {
                    ElMessage.error('加载聊天室失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.rooms = false;
            }
        };
        
        const showRoomDialog = (room = null) => {
            if (room) {
                editingRoom.value = { ...room };
            } else {
                editingRoom.value = { name: '', description: '' };
            }
            roomDialogVisible.value = true;
        };
        
        const saveRoom = async () => {
            loading.saveRoom = true;
            try {
                const url = editingRoom.value.id 
                    ? `/api/admin/chat/rooms/${editingRoom.value.id}` 
                    : '/api/admin/chat/rooms';
                const method = editingRoom.value.id ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingRoom.value)
                });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success(editingRoom.value.id ? '聊天室更新成功' : '聊天室创建成功');
                    roomDialogVisible.value = false;
                    loadRooms();
                } else {
                    ElMessage.error('保存失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.saveRoom = false;
            }
        };
        
        const deleteRoom = async (room) => {
            const confirmed = await ElMessageBox.confirm(
                `确认删除聊天室 "${room.name}" 吗？此操作不可恢复。`,
                '删除聊天室',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            try {
                const response = await fetchWithSU(`/api/admin/chat/rooms/${room.id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success('聊天室删除成功');
                    loadRooms();
                } else {
                    ElMessage.error('删除失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Room Permission Management
        const showRoomPermissions = async (room) => {
            currentRoom.value = room;
            permissionView.value = 'list';
            try {
                const response = await fetchWithSU(`/api/admin/chat/room-users/${room.id}`);
                const data = await response.json();
                if (data.success) {
                    roomUsers.value = data.users || [];
                    roomPermissionsVisible.value = true;
                } else {
                    ElMessage.error('加载权限失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        const roomUsersBySU = Vue.computed(() => roomUsers.value.filter(u => u.perm === 'su'));
        const roomUsersBy777 = Vue.computed(() => roomUsers.value.filter(u => u.perm === '777'));
        const roomUsersBy444 = Vue.computed(() => roomUsers.value.filter(u => u.perm === '444'));
        const roomUsersByNull = Vue.computed(() => roomUsers.value.filter(u => u.perm === 'Null' || !u.perm));
        const roomUsersNonSU = Vue.computed(() => roomUsers.value.filter(u => u.perm !== 'su'));
        
        const updateUserPermission = async (user, scope, targetId) => {
            try {
                const response = await fetchWithSU(`/api/admin/users/${user.id}/permissions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scope: scope,
                        target_id: targetId,
                        perm: user.perm
                    })
                });
                const data = await response.json();
                if (data.success) {
                    ElMessage.success('权限更新成功');
                } else {
                    ElMessage.error('更新失败: ' + (data.message || ''));
                    // Reload permissions on error
                    if (scope === 'chat') {
                        showRoomPermissions(currentRoom.value);
                    } else {
                        showSectionPermissions(currentSection.value);
                    }
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        const toggleRoomUser777 = async (user) => {
            const newPerm = user.perm === '777' ? 'Null' : '777';
            try {
                // Update user permission via API - use correct scope/target_id format
                const response = await fetchWithSU(`/api/admin/users/${user.id}/permissions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scope: 'chat',
                        target_id: currentRoom.value.id,
                        perm: newPerm
                    })
                });
                const data = await response.json();
                if (data.success) {
                    // Update local state
                    user.perm = newPerm;
                    ElMessage.success('权限更新成功');
                } else {
                    ElMessage.error('更新失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Forum Section Management Functions
        const loadSections = async () => {
            loading.sections = true;
            try {
                const response = await fetchWithSU('/api/admin/forum/sections');
                const data = await response.json();
                if (data.success) {
                    sections.value = data.sections || [];
                } else {
                    ElMessage.error('加载分区失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.sections = false;
            }
        };
        
        const showSectionDialog = (section = null) => {
            if (section) {
                editingSection.value = { ...section };
            } else {
                editingSection.value = { name: '', description: '' };
            }
            sectionDialogVisible.value = true;
        };
        
        const saveSection = async () => {
            loading.saveSection = true;
            try {
                const url = editingSection.value.id 
                    ? `/api/admin/forum/sections/${editingSection.value.id}` 
                    : '/api/admin/forum/sections';
                const method = editingSection.value.id ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingSection.value)
                });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success(editingSection.value.id ? '分区更新成功' : '分区创建成功');
                    sectionDialogVisible.value = false;
                    loadSections();
                } else {
                    ElMessage.error('保存失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.saveSection = false;
            }
        };
        
        const deleteSection = async (section) => {
            const confirmed = await ElMessageBox.confirm(
                `确认删除分区 "${section.name}" 吗？此操作不可恢复。`,
                '删除分区',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            try {
                const response = await fetchWithSU(`/api/admin/forum/sections/${section.id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success('分区删除成功');
                    loadSections();
                } else {
                    ElMessage.error('删除失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Section Permission Management
        const showSectionPermissions = async (section) => {
            currentSection.value = section;
            permissionView.value = 'list';
            try {
                const response = await fetchWithSU(`/api/admin/forum/section-users/${section.id}`);
                const data = await response.json();
                if (data.success) {
                    sectionUsers.value = data.users || [];
                    sectionPermissionsVisible.value = true;
                } else {
                    ElMessage.error('加载权限失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        const sectionUsersBySU = Vue.computed(() => sectionUsers.value.filter(u => u.perm === 'su'));
        const sectionUsersBy777 = Vue.computed(() => sectionUsers.value.filter(u => u.perm === '777'));
        const sectionUsersBy444 = Vue.computed(() => sectionUsers.value.filter(u => u.perm === '444'));
        const sectionUsersByNull = Vue.computed(() => sectionUsers.value.filter(u => u.perm === 'Null' || !u.perm));
        const sectionUsersNonSU = Vue.computed(() => sectionUsers.value.filter(u => u.perm !== 'su'));
        
        const toggleSectionUser777 = async (user) => {
            const newPerm = user.perm === '777' ? 'Null' : '777';
            try {
                // Update user permission via API - use correct scope/target_id format
                const response = await fetchWithSU(`/api/admin/users/${user.id}/permissions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scope: 'forum',
                        target_id: currentSection.value.id,
                        perm: newPerm
                    })
                });
                const data = await response.json();
                if (data.success) {
                    // Update local state
                    user.perm = newPerm;
                    ElMessage.success('权限更新成功');
                } else {
                    ElMessage.error('更新失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Quote Management Functions
        const loadQuotes = async () => {
            loading.quotes = true;
            try {
                const response = await fetchWithSU('/api/admin/quotes');
                const data = await response.json();
                if (data.success) {
                    // Add index as id for each quote
                    quotes.value = (data.quotes || []).map((quote, index) => ({
                        ...quote,
                        id: index
                    }));
                } else {
                    ElMessage.error('加载名言失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.quotes = false;
            }
        };
        
        const showQuoteDialog = (quote = null) => {
            if (quote) {
                editingQuote.value = { ...quote };
            } else {
                editingQuote.value = { text: '', author: '' };
            }
            quoteDialogVisible.value = true;
        };
        
        const saveQuote = async () => {
            loading.saveQuote = true;
            try {
                const url = editingQuote.value.id 
                    ? `/api/admin/quotes/${editingQuote.value.id}` 
                    : '/api/admin/quotes';
                const method = editingQuote.value.id ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingQuote.value)
                });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success(editingQuote.value.id ? '名言更新成功' : '名言创建成功');
                    quoteDialogVisible.value = false;
                    loadQuotes();
                } else {
                    ElMessage.error('保存失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.saveQuote = false;
            }
        };
        
        const deleteQuote = async (quote) => {
            const confirmed = await ElMessageBox.confirm(
                `确认删除这条名言吗？此操作不可恢复。`,
                '删除名言',
                { type: 'warning' }
            ).catch(() => false);
            
            if (!confirmed) return;
            
            try {
                const response = await fetchWithSU(`/api/admin/quotes/${quote.id}`, { method: 'DELETE' });
                const data = await response.json();
                
                if (data.success) {
                    ElMessage.success('名言删除成功');
                    loadQuotes();
                } else {
                    ElMessage.error('删除失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Database Management Functions
        const loadDatabaseTables = async () => {
            loading.dbTables = true;
            try {
                const response = await fetchWithSU('/api/admin/db/tables');
                const data = await response.json();
                if (data.success) {
                    dbTables.value = data.tables || [];
                } else {
                    ElMessage.error('加载数据表失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.dbTables = false;
            }
        };
        
        const selectTable = (tableName) => {
            selectedTable.value = tableName;
            loadTableData();
        };
        
        const loadTableData = async () => {
            if (!selectedTable.value) return;
            
            loading.tableData = true;
            try {
                const response = await fetchWithSU(`/admin/db/table/${selectedTable.value}/data`);
                
                // Check if response is OK before parsing
                if (!response.ok) {
                    ElMessage.error(`加载表数据失败: HTTP ${response.status}`);
                    tableColumns.value = [];
                    tableData.value = [];
                    loading.tableData = false;
                    return;
                }
                
                // Check content type to ensure it's JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    ElMessage.error('加载表数据失败: 服务器返回了非JSON响应');
                    tableColumns.value = [];
                    tableData.value = [];
                    loading.tableData = false;
                    return;
                }
                
                const data = await response.json();
                if (data.success) {
                    tableColumns.value = data.columns || [];
                    tableData.value = data.data || [];
                    
                    // Determine primary key from data if available
                    if (data.primary_key) {
                        primaryKey.value = data.primary_key;
                    } else if (tableColumns.value.includes('id')) {
                        primaryKey.value = 'id';
                    } else if (tableColumns.value.length > 0) {
                        primaryKey.value = tableColumns.value[0];
                    }
                } else {
                    ElMessage.error('加载表数据失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.tableData = false;
            }
        };
        
        const showEditRecordDialog = (record) => {
            editingRecord.value = { ...record };
            editRecordDialogVisible.value = true;
        };
        
        const saveRecord = async () => {
            if (!editingRecord.value || !selectedTable.value) return;
            
            loading.saveRecord = true;
            try {
                const response = await fetchWithSU(`/admin/db/table/${selectedTable.value}/edit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingRecord.value)
                });
                const data = await response.json();
                if (data.success) {
                    ElMessage.success('记录更新成功');
                    editRecordDialogVisible.value = false;
                    await loadTableData(); // Reload table data
                } else {
                    ElMessage.error('更新失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            } finally {
                loading.saveRecord = false;
            }
        };
        
        const deleteRecord = async (record) => {
            if (!selectedTable.value) return;
            
            try {
                await ElMessageBox.confirm(
                    '确定要删除这条记录吗？此操作不可撤销。',
                    '警告',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                    }
                );
            } catch {
                return; // User cancelled
            }
            
            try {
                const response = await fetchWithSU(`/admin/db/table/${selectedTable.value}/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: record[primaryKey.value] || record.id })
                });
                const data = await response.json();
                if (data.success) {
                    ElMessage.success('记录删除成功');
                    await loadTableData(); // Reload table data
                } else {
                    ElMessage.error('删除失败: ' + (data.message || ''));
                }
            } catch (error) {
                ElMessage.error('请求失败: ' + error.message);
            }
        };
        
        // Track which tabs have been loaded
        const loadedTabs = Vue.ref(new Set(['system']));
        
        // Watch for tab changes to load data
        Vue.watch(activeTab, (newTab) => {
            if (loadedTabs.value.has(newTab)) return;
            
            loadedTabs.value.add(newTab);
            if (newTab === 'users') {
                loadUsers();
            } else if (newTab === 'chat') {
                loadRooms();
            } else if (newTab === 'forum') {
                loadSections();
            } else if (newTab === 'quotes') {
                loadQuotes();
            } else if (newTab === 'database') {
                loadDatabaseTables();
            }
        });
        
        return {
            activeTab,
            loading,
            outputVisible,
            outputText,
            outputError,
            serverControlEnabled,
            goToUrl,
            getSystemInfo,
            viewLogs,
            clearCache,
            backupDatabase,
            optimizeDatabase,
            recalculateUploads,
            recountFiles,
            downloadProject,
            downloadDatabase,
            downloadImages,
            restartServer,
            shutdownServer,
            users,
            userDialogVisible,
            editingUser,
            showUserDialog,
            loadUsers,
            saveUser,
            deleteUser,
            rooms,
            roomDialogVisible,
            editingRoom,
            showRoomDialog,
            loadRooms,
            saveRoom,
            deleteRoom,
            roomPermissionsVisible,
            currentRoom,
            roomUsers,
            permissionView,
            showRoomPermissions,
            roomUsersBySU,
            roomUsersBy777,
            roomUsersBy444,
            roomUsersByNull,
            roomUsersNonSU,
            updateUserPermission,
            toggleRoomUser777,
            sections,
            sectionDialogVisible,
            editingSection,
            showSectionDialog,
            loadSections,
            saveSection,
            deleteSection,
            sectionPermissionsVisible,
            currentSection,
            sectionUsers,
            showSectionPermissions,
            sectionUsersBySU,
            sectionUsersBy777,
            sectionUsersBy444,
            sectionUsersByNull,
            sectionUsersNonSU,
            toggleSectionUser777,
            quotes,
            quoteDialogVisible,
            editingQuote,
            showQuoteDialog,
            loadQuotes,
            saveQuote,
            deleteQuote,
            dbTables,
            selectedTable,
            tableColumns,
            tableData,
            editRecordDialogVisible,
            editingRecord,
            primaryKey,
            editableColumns,
            loadDatabaseTables,
            selectTable,
            loadTableData,
            showEditRecordDialog,
            saveRecord,
            deleteRecord
        };
    }
};

// SU Verification Page
const SUVerificationPage = {
    name: 'SUVerificationPage',
    template: `
        <div class="page-container" style="max-width: 500px; margin: 0 auto; padding: 60px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🛡️</div>
                <h2 style="margin-bottom: 12px;">需要 SU 验证</h2>
                <p style="color: var(--text-secondary);">您正在访问管理面板，请输入密码以继续。验证成功后 5 分钟内无需再次验证。</p>
            </div>
            
            <el-card shadow="hover">
                <el-form @submit.prevent="verifySU">
                    <el-form-item label="管理员密码">
                        <el-input 
                            v-model="password" 
                            type="password" 
                            placeholder="请输入管理员密码"
                            :disabled="loading"
                            @keyup.enter="verifySU"
                            autofocus>
                        </el-input>
                    </el-form-item>
                    
                    <el-form-item>
                        <el-button 
                            type="primary" 
                            @click="verifySU" 
                            :loading="loading"
                            style="width: 100%;">
                            验证并继续
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-card>
            
            <div style="text-align: center; margin-top: 20px;">
                <el-button text @click="navigateTo('/')">
                    <i class="fas fa-arrow-left"></i> 返回首页
                </el-button>
            </div>
        </div>
    `,
    setup() {
        const password = Vue.ref('');
        const loading = Vue.ref(false);
        const store = StellarisStore;
        
        const verifySU = async () => {
            if (!password.value) {
                ElMessage.warning('请输入密码');
                return;
            }

            loading.value = true;
            try {
                const response = await fetch('/admin/su', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        password: password.value
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    ElMessage.success('SU 验证成功');

                    // Get the return URL from query params
                    const queryParams = StellarisRouter.getQueryParams();
                    const returnUrl = queryParams.next || '/admin';

                    // Navigate to the intended destination
                    setTimeout(() => {
                        StellarisRouter.navigate(returnUrl);
                    }, 500);
                } else {
                    ElMessage.error(data.message || '密码错误');
                    password.value = '';
                }
            } catch (error) {
                console.error('SU verification error:', error);
                ElMessage.error('验证失败，请重试');
            } finally {
                loading.value = false;
            }
        };
        
        return {
            password,
            loading,
            verifySU,
            navigateTo: (path) => StellarisRouter.navigate(path)
        };
    }
};

// Login Page
const LoginPage = {
    name: 'LoginPage',
    template: `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary);">
            <div style="width: 100%; max-width: 400px; padding: 0 20px;">
                <div class="card" style="padding: 40px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="font-size: 32px; margin-bottom: 8px;">登录</h1>
                        <p style="color: var(--text-secondary);">欢迎回到 群星议会</p>
                    </div>

                    <el-form @submit.prevent="handleLogin" :model="form" :rules="rules" ref="loginFormRef">
                        <el-form-item prop="username">
                            <el-input
                                v-model="form.username"
                                placeholder="用户名"
                                size="large"
                                :prefix-icon="User"
                                clearable>
                            </el-input>
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input
                                v-model="form.password"
                                type="password"
                                placeholder="密码"
                                size="large"
                                :prefix-icon="Lock"
                                show-password
                                @keyup.enter="handleLogin">
                            </el-input>
                        </el-form-item>

                        <el-form-item>
                            <el-button
                                type="primary"
                                @click="handleLogin"
                                :loading="loading"
                                size="large"
                                style="width: 100%;">
                                {{ loading ? '登录中...' : '登录' }}
                            </el-button>
                        </el-form-item>
                    </el-form>

                    <div style="text-align: center; margin-top: 16px; color: var(--text-secondary);">
                        <p>还没有账号? <a href="#" style="color: var(--primary);">请联系WTX</a></p>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const form = Vue.ref({
            username: '',
            password: ''
        });
        const loading = Vue.ref(false);
        const loginFormRef = Vue.ref(null);

        const rules = {
            username: [
                { required: true, message: '请输入用户名', trigger: 'blur' }
            ],
            password: [
                { required: true, message: '请输入密码', trigger: 'blur' }
            ]
        };

        const handleLogin = async () => {
            if (!loginFormRef.value) return;

            await loginFormRef.value.validate(async (valid) => {
                if (!valid) return;

                loading.value = true;

                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: form.value.username,
                            password: form.value.password
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        ElMessage.success('登录成功');
                        // Redirect to SPA home page or reload to update session
                        window.location.href = '/spa';
                    } else {
                        ElMessage.error(data.error || '登录失败，请检查用户名和密码');
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    ElMessage.error('登录失败，请稍后重试');
                } finally {
                    loading.value = false;
                }
            });
        };

        return {
            form,
            rules,
            loading,
            loginFormRef,
            handleLogin,
            User: ElementPlusIconsVue.User,
            Lock: ElementPlusIconsVue.Lock
        };
    }
};

// 404 Page
const NotFoundPage = {
    name: 'NotFoundPage',
    template: `
        <div class="page-container" style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-compass" style="font-size: 64px; color: var(--text-muted); margin-bottom: 24px;"></i>
            <h1 style="font-size: 48px; margin-bottom: 16px;">404</h1>
            <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 24px;">页面未找到</p>
            <el-button type="primary" @click="navigateTo('/')">返回首页</el-button>
        </div>
    `,
    setup() {
        return {
            navigateTo: (path) => StellarisRouter.navigate(path)
        };
    }
};

// Export pages
window.StellarisPages = {
    HomePage,
    ChatListPage,
    ChatRoomPage,
    ForumListPage,
    ForumSectionPage,
    ForumThreadPage,
    SettingsPage,
    AdminPage,
    SUVerificationPage,
    LoginPage,
    NotFoundPage
};
