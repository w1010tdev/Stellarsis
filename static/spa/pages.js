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
                                <li>至少6个字符</li>
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
                
                <!-- 账户管理 -->
                <el-tab-pane label="账户" name="account" v-if="store.state.user.isAuthenticated">
                    <div class="settings-section">
                        <div class="settings-section-title">
                            <i class="fas fa-user-cog"></i>
                            账户管理
                        </div>
                        <div class="settings-item" style="cursor: pointer;" @click="goToUrl('/settings/images')">
                            <div>
                                <div class="settings-item-label">我的文件</div>
                                <div class="settings-item-description">管理上传的图片和文件</div>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
                        </div>
                        <div class="settings-item" style="cursor: pointer;" @click="goToUrl('/settings/follows')">
                            <div>
                                <div class="settings-item-label">关注管理</div>
                                <div class="settings-item-description">管理关注的用户</div>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
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
        
        const toggleTheme = (value) => {
            store.setTheme(value ? 'dark' : 'light');
        };
        
        const toggleHeartRain = (value) => {
            store.setHeartRainEnabled(value);
        };
        
        const saveProfile = async () => {
            saving.value = true;
            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
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
            
            // Use constant from config (default to 6 if not available)
            const minPasswordLength = 6; // TODO: Get from server config
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
                const response = await fetch('/api/change_password', {
                    method: 'PUT',
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
        
        const goToUrl = (url) => {
            window.location.href = url;
        };
        
        const logout = () => {
            window.location.href = '/logout';
        };
        
        return {
            store,
            activeTab,
            isDark,
            heartRainEnabled,
            saving,
            profileForm,
            passwordForm,
            toggleTheme,
            toggleHeartRain,
            saveProfile,
            changePassword,
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
            
            <!-- Management Cards -->
            <div class="admin-grid" style="margin-bottom: 32px;">
                <div class="admin-card" @click="goToUrl('/admin/users')" style="cursor: pointer;">
                    <div class="admin-card-icon blue"><i class="fas fa-users"></i></div>
                    <div class="admin-card-title">用户管理</div>
                    <div class="admin-card-description">管理平台用户，包括创建、删除和修改用户权限</div>
                    <el-button type="primary" size="small">进入</el-button>
                </div>
                
                <div class="admin-card" @click="goToUrl('/admin/chat')" style="cursor: pointer;">
                    <div class="admin-card-icon green"><i class="fas fa-comments"></i></div>
                    <div class="admin-card-title">聊天管理</div>
                    <div class="admin-card-description">管理聊天室和聊天消息</div>
                    <el-button type="primary" size="small">进入</el-button>
                </div>
                
                <div class="admin-card" @click="goToUrl('/admin/forum')" style="cursor: pointer;">
                    <div class="admin-card-icon orange"><i class="fas fa-newspaper"></i></div>
                    <div class="admin-card-title">帖子管理</div>
                    <div class="admin-card-description">管理贴吧分区和帖子内容</div>
                    <el-button type="primary" size="small">进入</el-button>
                </div>
                
                <div class="admin-card" @click="goToUrl('/admin/db')" style="cursor: pointer;">
                    <div class="admin-card-icon red"><i class="fas fa-database"></i></div>
                    <div class="admin-card-title">数据库管理</div>
                    <div class="admin-card-description">查看和管理数据库</div>
                    <el-button type="primary" size="small">进入</el-button>
                </div>
                
                <div class="admin-card" @click="goToUrl('/admin/quotes')" style="cursor: pointer;">
                    <div class="admin-card-icon purple"><i class="fas fa-quote-left"></i></div>
                    <div class="admin-card-title">名言管理</div>
                    <div class="admin-card-description">管理首页显示的名言内容</div>
                    <el-button type="primary" size="small">进入</el-button>
                </div>
            </div>
            
            <!-- System Tools -->
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
                    <el-button @click="recountFiles" :loading="loading.recount">
                        <i class="fas fa-sync"></i> 重新统计文件
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
        </div>
    `,
    setup() {
        const loading = Vue.reactive({
            systemInfo: false,
            logs: false,
            clearCache: false,
            backup: false,
            optimize: false,
            recount: false,
            restart: false,
            shutdown: false
        });
        
        const outputVisible = Vue.ref(false);
        const outputText = Vue.ref('');
        const outputError = Vue.ref(false);
        const serverControlEnabled = Vue.ref(false); // Will be set from config
        
        const showOutput = (text, isError = false) => {
            outputText.value = text;
            outputError.value = isError;
            outputVisible.value = true;
        };
        
        const goToUrl = (url) => {
            window.location.href = url;
        };
        
        const getSystemInfo = async () => {
            loading.systemInfo = true;
            try {
                const response = await fetch('/api/admin/system-info');
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
                const response = await fetch('/api/admin/system-log');
                const data = await response.json();
                if (data.success) {
                    const logs = data.logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n\n');
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
                const response = await fetch('/api/admin/clear-cache', { method: 'POST' });
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
                const response = await fetch('/api/admin/backup-database', { method: 'POST' });
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
                const response = await fetch('/api/admin/optimize-database', { method: 'POST' });
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
                const response = await fetch('/api/admin/recount-file-size', { method: 'POST' });
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
                const response = await fetch('/api/admin/restart', { method: 'POST' });
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
                const response = await fetch('/api/admin/shutdown', {
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
        
        return {
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
            recountFiles,
            downloadProject,
            downloadDatabase,
            downloadImages,
            restartServer,
            shutdownServer
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
    NotFoundPage
};
