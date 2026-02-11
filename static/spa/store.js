/**
 * Stellarsis SPA Store
 * Simple reactive state management
 */

const StellarisStore = {
    state: Vue.reactive({
        // User state
        user: {
            isAuthenticated: false,
            id: null,
            username: '',
            nickname: '',
            color: '',
            badge: '',
            isAdmin: false
        },
        
        // Theme state
        theme: localStorage.getItem('stellarsis-theme') || 'light',
        
        // Config
        config: {
            enableFileUpload: false
        },
        
        // UI state
        sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
        mobileSidebarOpen: false,
        
        // Chat state
        chatSocket: null,
        onlineCount: 0,
        onlineUsers: [],
        
        // Unread counts
        unreadCounts: {
            chat: {},
            forum: {}
        },
        
        // Following
        followedUserIds: new Set(),
        
        // Loading states
        isLoading: false,
        
        // Toast queue
        toasts: [],
        
        // Command palette
        commandPaletteOpen: false
    }),
    
    // Initialize from server data
    init() {
        try {
            const serverDataEl = document.getElementById('server-data');
            if (serverDataEl) {
                const data = JSON.parse(serverDataEl.textContent);
                if (data.user) {
                    this.state.user = { ...this.state.user, ...data.user };
                }
                if (data.config) {
                    this.state.config = { ...this.state.config, ...data.config };
                }
                // Load data from Jinja2-injected spaData
                if (data.spaData) {
                    // Store rooms and sections for use by pages
                    this.state.spaData = data.spaData;
                    // Unread counts
                    if (data.spaData.unreadCounts) {
                        this.state.unreadCounts.chat = data.spaData.unreadCounts.chat || {};
                        this.state.unreadCounts.forum = data.spaData.unreadCounts.forum || {};
                    }
                    // Following list
                    if (data.spaData.following) {
                        this.state.followedUserIds = new Set(data.spaData.following.map(u => u.id));
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse server data:', e);
        }
        
        // Apply theme
        this.applyTheme(this.state.theme);
    },
    
    // Theme management
    setTheme(theme) {
        this.state.theme = theme;
        localStorage.setItem('stellarsis-theme', theme);
        this.applyTheme(theme);
    },
    
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.getElementById('hljs-light')?.setAttribute('disabled', 'disabled');
            document.getElementById('hljs-dark')?.removeAttribute('disabled');
        } else {
            document.documentElement.classList.remove('dark');
            document.getElementById('hljs-light')?.removeAttribute('disabled');
            document.getElementById('hljs-dark')?.setAttribute('disabled', 'disabled');
        }
    },
    
    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },
    
    // Sidebar management
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        localStorage.setItem('sidebar-collapsed', this.state.sidebarCollapsed);
    },
    
    toggleMobileSidebar() {
        this.state.mobileSidebarOpen = !this.state.mobileSidebarOpen;
    },
    
    closeMobileSidebar() {
        this.state.mobileSidebarOpen = false;
    },
    
    // Toast notifications
    showToast(message, type = 'info', duration = 4000) {
        const id = Date.now();
        this.state.toasts.push({ id, message, type });
        
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(id);
            }, duration);
        }
        
        return id;
    },
    
    removeToast(id) {
        const index = this.state.toasts.findIndex(t => t.id === id);
        if (index > -1) {
            this.state.toasts.splice(index, 1);
        }
    },
    
    // Unread counts - now loaded from Jinja2 data, these methods are for reactively clearing them
    markChatRoomAsRead(roomId) {
        const id = parseInt(roomId, 10);
        if (this.state.unreadCounts.chat[id] !== undefined) {
            this.state.unreadCounts.chat[id] = 0;
        }
    },
    
    markForumSectionAsRead(sectionId) {
        const id = parseInt(sectionId, 10);
        if (this.state.unreadCounts.forum[id] !== undefined) {
            this.state.unreadCounts.forum[id] = 0;
        }
    },
    
    // Get spa data (rooms, sections, permissions, quote)
    getSpaData() {
        return this.state.spaData || {};
    },
    
    // Following - now loaded from Jinja2 data
    isFollowing(userId) {
        return this.state.followedUserIds.has(userId);
    },
    
    // Command palette
    toggleCommandPalette() {
        this.state.commandPaletteOpen = !this.state.commandPaletteOpen;
    },
    
    openCommandPalette() {
        this.state.commandPaletteOpen = true;
    },
    
    closeCommandPalette() {
        this.state.commandPaletteOpen = false;
    },
    
    // Global WebSocket
    initGlobalSocket() {
        if (typeof io === 'undefined') {
            console.warn('Socket.IO not loaded');
            return;
        }
        
        try {
            this.state.chatSocket = io('/', {
                path: '/socket.io',
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 20000,
                transports: ['websocket', 'polling']
            });
            
            this.state.chatSocket.on('connect', () => {
                console.log('Global WebSocket connected');
                this.state.chatSocket.emit('heartbeat');
            });
            
            this.state.chatSocket.on('global_online_count', (data) => {
                this.state.onlineCount = data.count;
            });
            
            this.state.chatSocket.on('followed_user_online', (data) => {
                this.showFollowedUserNotification(data);
            });
            
            // Heartbeat
            setInterval(() => {
                if (this.state.chatSocket && this.state.chatSocket.connected) {
                    this.state.chatSocket.emit('heartbeat');
                }
            }, 30000);
            
        } catch (e) {
            console.error('Failed to initialize global socket:', e);
        }
    },
    
    showFollowedUserNotification(userData) {
        this.showToast(
            `${userData.nickname || userData.username} 上线了`,
            'info',
            3000
        );
    },
    
    // Heart rain settings
    isHeartRainEnabled() {
        return localStorage.getItem('heartRainEnabled') !== 'false';
    },
    
    setHeartRainEnabled(enabled) {
        localStorage.setItem('heartRainEnabled', enabled);
    },
    
    // Cake rain settings (birthday)
    isCakeRainEnabled() {
        return localStorage.getItem('cakeRainEnabled') !== 'false';
    },
    
    setCakeRainEnabled(enabled) {
        localStorage.setItem('cakeRainEnabled', enabled);
    }
};

// Export for use in Vue
window.StellarisStore = StellarisStore;
