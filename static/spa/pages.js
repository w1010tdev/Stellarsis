/**
 * Stellarsis SPA Pages
 * Vue page components for routing
 */

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
        const loading = Vue.ref(true);
        const rooms = Vue.ref([]);
        const sections = Vue.ref([]);
        const roomPermissions = Vue.ref({});
        const sectionPermissions = Vue.ref({});
        const unreadCounts = Vue.computed(() => store.state.unreadCounts);
        
        const quote = Vue.ref({ text: '加载中...', author: '' });
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
                    const parts = data.quote.split(' - ');
                    quote.value = {
                        text: parts[0] || data.quote,
                        author: parts[1] || ''
                    };
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
        
        const loadData = async () => {
            loading.value = true;
            try {
                // Load chat rooms
                const roomsRes = await fetch('/api/chat/rooms');
                const roomsData = await roomsRes.json();
                if (roomsData.success) {
                    rooms.value = roomsData.rooms || [];
                    roomPermissions.value = roomsData.permissions || {};
                }
                
                // Load forum sections
                const sectionsRes = await fetch('/api/forum/sections');
                const sectionsData = await sectionsRes.json();
                if (sectionsData.success) {
                    sections.value = sectionsData.sections || [];
                    sectionPermissions.value = sectionsData.permissions || {};
                }
            } catch (e) {
                console.error('Failed to load data:', e);
            }
            loading.value = false;
        };
        
        Vue.onMounted(() => {
            loadData();
            refreshQuote();
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
        const loading = Vue.ref(true);
        const rooms = Vue.ref([]);
        const permissions = Vue.ref({});
        const unreadCounts = Vue.computed(() => store.state.unreadCounts.chat);
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        const loadRooms = async () => {
            loading.value = true;
            try {
                const response = await fetch('/api/chat/rooms');
                const data = await response.json();
                if (data.success) {
                    rooms.value = data.rooms || [];
                    permissions.value = data.permissions || {};
                }
            } catch (e) {
                console.error('Failed to load rooms:', e);
                store.showToast('加载聊天室失败', 'error');
            }
            loading.value = false;
        };
        
        Vue.onMounted(loadRooms);
        
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
            
            // Use the correct API endpoint based on config
            const enableFileUpload = store.state.config?.enableFileUpload || false;
            const uploadUrl = enableFileUpload ? '/api/upload/file' : '/api/upload/image';
            
            try {
                const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    // Use the markdown link from server response
                    messageText.value += ` ${data.markdown || '![' + file.name + '](' + data.url + ')'}`;
                    store.showToast((data.is_image ? '图片' : '文件') + '上传成功', 'success');
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
                // Load room info
                const roomRes = await fetch(`/api/chat/room/${roomId.value}`);
                const roomData = await roomRes.json();
                if (roomData.success) {
                    room.value = roomData.room;
                    permission.value = roomData.permission;
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
        const loading = Vue.ref(true);
        const sections = Vue.ref([]);
        const permissions = Vue.ref({});
        const unreadCounts = Vue.computed(() => store.state.unreadCounts.forum);
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
        };
        
        const loadSections = async () => {
            loading.value = true;
            try {
                const response = await fetch('/api/forum/sections');
                const data = await response.json();
                if (data.success) {
                    sections.value = data.sections || [];
                    permissions.value = data.permissions || {};
                }
            } catch (e) {
                store.showToast('加载贴吧分区失败', 'error');
            }
            loading.value = false;
        };
        
        Vue.onMounted(loadSections);
        
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
            
            // Use the correct API endpoint based on config
            const uploadUrl = enableFileUpload.value ? '/api/upload/file' : '/api/upload/image';
            
            try {
                const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    // Insert markdown link into content
                    const markdown = data.markdown || '![' + file.name + '](' + data.url + ')';
                    newThread.content = (newThread.content ? newThread.content + '\n' : '') + markdown;
                    store.showToast((data.is_image ? '图片' : '文件') + '上传成功', 'success');
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
                const response = await fetch(`/api/forum/section/${sectionId.value}`);
                const data = await response.json();
                if (data.success) {
                    section.value = data.section;
                    permission.value = data.permission;
                    threads.value = data.threads || [];
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
                
                const response = await fetch('/api/forum/thread', { method: 'POST', body: formData });
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
            
            // Use the correct API endpoint based on config
            const uploadUrl = enableFileUpload.value ? '/api/upload/file' : '/api/upload/image';
            
            try {
                const response = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.success) {
                    // Insert markdown link into reply content
                    const markdown = data.markdown || '![' + file.name + '](' + data.url + ')';
                    replyContent.value = (replyContent.value ? replyContent.value + '\n' : '') + markdown;
                    store.showToast((data.is_image ? '图片' : '文件') + '上传成功', 'success');
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
                const response = await fetch(`/api/forum/thread/${threadId.value}`);
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
            <h2 style="margin-bottom: 24px;">设置</h2>
            
            <!-- Appearance -->
            <div class="settings-section">
                <div class="settings-section-title">
                    <i class="fas fa-palette"></i>
                    外观
                </div>
                <div class="settings-item">
                    <div>
                        <div class="settings-item-label">主题模式</div>
                        <div class="settings-item-description">选择亮色或暗色主题</div>
                    </div>
                    <el-switch v-model="isDark" @change="toggleTheme" active-text="暗色" inactive-text="亮色"></el-switch>
                </div>
            </div>
            
            <!-- Features -->
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
            
            <!-- Account -->
            <div class="settings-section" v-if="store.state.user.isAuthenticated">
                <div class="settings-section-title">
                    <i class="fas fa-user"></i>
                    账户
                </div>
                <div class="settings-item" style="cursor: pointer;" @click="goToUrl('/profile')">
                    <div>
                        <div class="settings-item-label">修改个人资料</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
                </div>
                <div class="settings-item" style="cursor: pointer;" @click="goToUrl('/change_password')">
                    <div>
                        <div class="settings-item-label">修改密码</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
                </div>
                <div class="settings-item" style="cursor: pointer;" @click="goToUrl('/settings/images')">
                    <div>
                        <div class="settings-item-label">我的文件</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
                </div>
                <div class="settings-item" style="cursor: pointer;" @click="goToUrl('/settings/follows')">
                    <div>
                        <div class="settings-item-label">关注管理</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-muted);"></i>
                </div>
            </div>
            
            <!-- Logout -->
            <div class="settings-section" v-if="store.state.user.isAuthenticated">
                <el-button type="danger" @click="logout" style="width: 100%;">退出登录</el-button>
            </div>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        
        const isDark = Vue.ref(store.state.theme === 'dark');
        const heartRainEnabled = Vue.ref(store.isHeartRainEnabled());
        
        const toggleTheme = (value) => {
            store.setTheme(value ? 'dark' : 'light');
        };
        
        const toggleHeartRain = (value) => {
            store.setHeartRainEnabled(value);
        };
        
        const goToUrl = (url) => {
            window.location.href = url;
        };
        
        const logout = () => {
            window.location.href = '/logout';
        };
        
        return {
            store,
            isDark,
            heartRainEnabled,
            toggleTheme,
            toggleHeartRain,
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
            
            <div class="admin-grid">
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
            </div>
        </div>
    `,
    setup() {
        const goToUrl = (url) => {
            window.location.href = url;
        };
        
        return {
            goToUrl
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
