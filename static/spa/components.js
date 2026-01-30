/**
 * Stellarsis SPA Components
 * Reusable Vue components
 */

// Sidebar Component
const SidebarComponent = {
    name: 'SidebarComponent',
    template: `
        <aside class="sidebar" :class="{ collapsed: store.state.sidebarCollapsed, 'mobile-open': store.state.mobileSidebarOpen }">
            <div class="sidebar-header">
                <a href="#/" class="sidebar-logo" @click.prevent="navigateTo('/')">
                    <i class="fas fa-star"></i>
                    <span>群星议会</span>
                </a>
                <button class="header-btn" @click="store.toggleSidebar()" title="收起/展开">
                    <i :class="store.state.sidebarCollapsed ? 'fas fa-angle-right' : 'fas fa-angle-left'"></i>
                </button>
            </div>
            
            <nav class="sidebar-nav">
                <a class="nav-item" :class="{ active: currentPath === '/' }" @click.prevent="navigateTo('/')">
                    <i class="fas fa-home"></i>
                    <span>首页</span>
                </a>
                <a class="nav-item" :class="{ active: currentPath.startsWith('/chat') }" @click.prevent="navigateTo('/chat')">
                    <i class="fas fa-comments"></i>
                    <span>即时聊天</span>
                    <span class="nav-badge" v-if="totalChatUnread > 0">{{ totalChatUnread }}</span>
                </a>
                <a class="nav-item" :class="{ active: currentPath.startsWith('/forum') }" @click.prevent="navigateTo('/forum')">
                    <i class="fas fa-newspaper"></i>
                    <span>贴吧</span>
                    <span class="nav-badge" v-if="totalForumUnread > 0">{{ totalForumUnread }}</span>
                </a>
                <a class="nav-item" :class="{ active: currentPath === '/settings' }" @click.prevent="navigateTo('/settings')" v-if="store.state.user.isAuthenticated">
                    <i class="fas fa-cog"></i>
                    <span>设置</span>
                </a>
                <a class="nav-item" :class="{ active: currentPath === '/admin' }" @click.prevent="navigateTo('/admin')" v-if="store.state.user.isAdmin">
                    <i class="fas fa-shield-alt"></i>
                    <span>管理面板</span>
                </a>
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-info" v-if="store.state.user.isAuthenticated" @click="navigateTo('/settings')">
                    <div class="user-avatar" :style="{ background: store.state.user.color || '#409eff' }">
                        {{ userInitial }}
                    </div>
                    <div class="user-details">
                        <div class="user-name">{{ store.state.user.nickname || store.state.user.username }}</div>
                        <div class="user-status">在线</div>
                    </div>
                </div>
                <a class="nav-item" @click.prevent="window.location.href='/login'" v-else>
                    <i class="fas fa-sign-in-alt"></i>
                    <span>登录</span>
                </a>
            </div>
        </aside>
    `,
    setup() {
        const store = StellarisStore;
        const currentPath = Vue.ref('/');
        
        const userInitial = Vue.computed(() => {
            const name = store.state.user.nickname || store.state.user.username || '?';
            return name.charAt(0).toUpperCase();
        });
        
        const totalChatUnread = Vue.computed(() => {
            return Object.values(store.state.unreadCounts.chat).reduce((a, b) => a + b, 0);
        });
        
        const totalForumUnread = Vue.computed(() => {
            return Object.values(store.state.unreadCounts.forum).reduce((a, b) => a + b, 0);
        });
        
        const navigateTo = (path) => {
            StellarisRouter.navigate(path);
            store.closeMobileSidebar();
        };
        
        window.addEventListener('route-changed', (e) => {
            currentPath.value = e.detail.path;
        });
        
        Vue.onMounted(() => {
            currentPath.value = StellarisRouter.getCurrentPath();
        });
        
        return {
            store,
            currentPath,
            userInitial,
            totalChatUnread,
            totalForumUnread,
            navigateTo
        };
    }
};

// Top Header Component
const TopHeaderComponent = {
    name: 'TopHeaderComponent',
    template: `
        <header class="top-header">
            <div class="header-left">
                <button class="menu-toggle" @click="store.toggleMobileSidebar()">
                    <i class="fas fa-bars"></i>
                </button>
                <h1 class="page-title">{{ pageTitle }}</h1>
            </div>
            <div class="header-right">
                <span class="online-count">
                    <i class="fas fa-users"></i>
                    {{ store.state.onlineCount }}
                </span>
                <button class="header-btn" @click="store.toggleTheme()" :title="store.state.theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'">
                    <i :class="store.state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
                </button>
                <button class="header-btn" @click="store.openCommandPalette()" title="命令面板 (按 : 打开)">
                    <i class="fas fa-terminal"></i>
                </button>
            </div>
        </header>
    `,
    props: ['pageTitle'],
    setup() {
        return {
            store: StellarisStore
        };
    }
};

// Toast Container Component
const ToastContainerComponent = {
    name: 'ToastContainerComponent',
    template: `
        <div class="toast-container">
            <div v-for="toast in store.state.toasts" :key="toast.id" 
                 class="toast" :class="'toast-' + toast.type"
                 @click="store.removeToast(toast.id)">
                <i :class="getToastIcon(toast.type)"></i>
                <span>{{ toast.message }}</span>
            </div>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        
        const getToastIcon = (type) => {
            const icons = {
                success: 'fas fa-check-circle',
                error: 'fas fa-times-circle',
                warning: 'fas fa-exclamation-circle',
                info: 'fas fa-info-circle'
            };
            return icons[type] || icons.info;
        };
        
        return { store, getToastIcon };
    }
};

// Command Palette Component
const CommandPaletteComponent = {
    name: 'CommandPaletteComponent',
    template: `
        <div class="command-palette-overlay" :class="{ show: store.state.commandPaletteOpen }" @click.self="store.closeCommandPalette()">
            <div class="command-palette">
                <input class="command-input" 
                       ref="commandInput"
                       v-model="query" 
                       @keydown="handleKeydown"
                       placeholder="输入命令（例如: help, theme dark）">
                <div class="command-suggestions">
                    <div v-if="!query" class="command-item" v-for="cmd in defaultCommands" :key="cmd.name" @click="executeCommand(cmd.name)">
                        <i :class="cmd.icon"></i>
                        <span class="command-item-name">{{ cmd.name }}</span>
                        <span class="command-item-desc">{{ cmd.desc }}</span>
                    </div>
                    <div v-else class="command-item" v-for="result in filteredCommands" :key="result.name" @click="executeCommand(result.name)">
                        <i :class="result.icon"></i>
                        <span class="command-item-name">{{ result.name }}</span>
                        <span class="command-item-desc">{{ result.desc }}</span>
                    </div>
                    <div v-if="output" class="command-item">
                        <i class="fas fa-terminal"></i>
                        <span class="command-item-name">{{ output }}</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const query = Vue.ref('');
        const output = Vue.ref('');
        const commandInput = Vue.ref(null);
        
        const defaultCommands = [
            { name: 'help', desc: '显示可用命令', icon: 'fas fa-question-circle' },
            { name: 'theme light', desc: '切换到亮色主题', icon: 'fas fa-sun' },
            { name: 'theme dark', desc: '切换到暗色主题', icon: 'fas fa-moon' },
            { name: 'cd /', desc: '返回首页', icon: 'fas fa-home' },
            { name: 'cd /chat', desc: '前往聊天室', icon: 'fas fa-comments' },
            { name: 'cd /forum', desc: '前往贴吧', icon: 'fas fa-newspaper' },
            { name: 'cd /settings', desc: '前往设置', icon: 'fas fa-cog' },
            { name: 'exit', desc: '关闭命令面板', icon: 'fas fa-times' }
        ];
        
        const filteredCommands = Vue.computed(() => {
            if (!query.value) return defaultCommands;
            const q = query.value.toLowerCase();
            return defaultCommands.filter(cmd => 
                cmd.name.toLowerCase().includes(q) || 
                cmd.desc.toLowerCase().includes(q)
            );
        });
        
        const executeCommand = (cmdText) => {
            const parts = (cmdText || query.value).trim().split(/\s+/);
            const cmd = parts[0];
            const args = parts.slice(1);
            
            output.value = '';
            
            switch(cmd) {
                case 'help':
                    output.value = '可用命令: help, theme, cd, exit';
                    break;
                case 'theme':
                    if (args[0]) {
                        store.setTheme(args[0]);
                        output.value = `已切换主题: ${args[0]}`;
                    } else {
                        output.value = '用法: theme <light|dark>';
                    }
                    break;
                case 'cd':
                    const routes = {
                        '/': '/',
                        '~': '/',
                        '/chat': '/chat',
                        '/forum': '/forum',
                        '/settings': '/settings',
                        '/admin': '/admin'
                    };
                    if (routes[args[0]]) {
                        StellarisRouter.navigate(routes[args[0]]);
                        store.closeCommandPalette();
                    } else {
                        output.value = '未知路径: ' + args[0];
                    }
                    break;
                case 'exit':
                case 'close':
                case 'q':
                    store.closeCommandPalette();
                    break;
                default:
                    output.value = '未知命令: ' + cmd;
            }
            
            query.value = '';
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                executeCommand();
            } else if (e.key === 'Escape') {
                store.closeCommandPalette();
            }
        };
        
        // Watch for command palette open state
        Vue.watch(() => store.state.commandPaletteOpen, (isOpen) => {
            if (isOpen) {
                Vue.nextTick(() => {
                    commandInput.value?.focus();
                });
            } else {
                query.value = '';
                output.value = '';
            }
        });
        
        // Listen for ':' key to open command palette
        Vue.onMounted(() => {
            document.addEventListener('keydown', (e) => {
                const active = document.activeElement;
                const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
                if (e.key === ':' && !isInput) {
                    e.preventDefault();
                    store.openCommandPalette();
                }
                if (e.key === 'Escape' && store.state.commandPaletteOpen) {
                    store.closeCommandPalette();
                }
            });
        });
        
        return {
            store,
            query,
            output,
            commandInput,
            defaultCommands,
            filteredCommands,
            executeCommand,
            handleKeydown
        };
    }
};

// Room Card Component
const RoomCardComponent = {
    name: 'RoomCardComponent',
    template: `
        <div class="room-card" @click="$emit('click')">
            <div class="room-card-header">
                <span class="room-name">{{ room.name }}</span>
                <div class="room-badge">
                    <span class="unread-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
                    <span class="perm-badge" :class="'perm-' + (permission || '').toLowerCase()">{{ permission }}</span>
                </div>
            </div>
            <p class="room-description">{{ room.description || '暂无描述' }}</p>
            <div class="room-actions">
                <el-button type="primary" size="small">进入</el-button>
            </div>
        </div>
    `,
    props: ['room', 'permission', 'unreadCount']
};

// Message Component
const MessageComponent = {
    name: 'MessageComponent',
    template: `
        <div class="message" :class="{ 'heart-border': hasHeartEffect }" :data-message-id="message.id">
            <div class="message-avatar" :style="{ background: userColor }">
                {{ userInitial }}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username" :style="{ color: userColor }">{{ displayName }}</span>
                    <span class="message-badge" v-if="message.badge" :style="{ background: userColor }">{{ message.badge }}</span>
                    <span class="message-time">{{ formattedTime }}</span>
                </div>
                <div class="message-text" v-html="renderedContent"></div>
                <div class="message-actions" v-if="showActions">
                    <button class="message-action-btn" @click="$emit('quote', message)" title="引用">
                        <i class="fas fa-quote-right"></i>
                    </button>
                    <button class="message-action-btn" v-if="canDelete" @click="$emit('delete', message)" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    props: ['message', 'currentUserId', 'roomPermission', 'showActions'],
    emits: ['quote', 'delete'],
    setup(props) {
        const displayName = Vue.computed(() => {
            return props.message.nickname || props.message.username || '匿名';
        });
        
        const userColor = Vue.computed(() => {
            return StellarisUtils.getUserColor(props.message.color);
        });
        
        const userInitial = Vue.computed(() => {
            return StellarisUtils.getUserInitial(displayName.value);
        });
        
        const formattedTime = Vue.computed(() => {
            return StellarisUtils.formatTime(props.message.timestamp);
        });
        
        const renderedContent = Vue.computed(() => {
            return StellarisUtils.renderContent(props.message.content || props.message.message || '');
        });
        
        const hasHeartEffect = Vue.computed(() => {
            return StellarisUtils.hasHeartEffect(props.message.content || props.message.message || '');
        });
        
        const canDelete = Vue.computed(() => {
            if (!props.message.id) return false;
            if (props.roomPermission === 'su') return true;
            if (props.roomPermission === '777' && Number(props.message.user_id) === Number(props.currentUserId)) return true;
            return false;
        });
        
        // Load quotes after render
        Vue.onMounted(() => {
            Vue.nextTick(() => {
                StellarisUtils.loadQuotesInElement(document.querySelector(`[data-message-id="${props.message.id}"]`));
            });
        });
        
        // Also watch for content changes
        Vue.watch(() => props.message.content, () => {
            Vue.nextTick(() => {
                StellarisUtils.loadQuotesInElement(document.querySelector(`[data-message-id="${props.message.id}"]`));
            });
        });
        
        return {
            displayName,
            userColor,
            userInitial,
            formattedTime,
            renderedContent,
            hasHeartEffect,
            canDelete
        };
    }
};

// Loading Component
const LoadingComponent = {
    name: 'LoadingComponent',
    template: `
        <div class="loading-container">
            <div class="loading-spinner"></div>
        </div>
    `
};

// Empty State Component
const EmptyStateComponent = {
    name: 'EmptyStateComponent',
    template: `
        <div class="empty-state">
            <i :class="icon"></i>
            <div class="empty-state-title">{{ title }}</div>
            <div class="empty-state-description">{{ description }}</div>
        </div>
    `,
    props: {
        icon: { type: String, default: 'fas fa-inbox' },
        title: { type: String, default: '暂无数据' },
        description: { type: String, default: '' }
    }
};

// Export components
window.StellarisComponents = {
    SidebarComponent,
    TopHeaderComponent,
    ToastContainerComponent,
    CommandPaletteComponent,
    RoomCardComponent,
    MessageComponent,
    LoadingComponent,
    EmptyStateComponent
};
