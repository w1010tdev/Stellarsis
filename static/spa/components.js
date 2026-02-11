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
            <div class="command-palette" :class="{ 'help-mode': showHelpView }">
                <input class="command-input" 
                       ref="commandInput"
                       v-model="query" 
                       @keydown="handleKeydown"
                       @input="updateSuggestions"
                       placeholder="输入命令（例如: help, go home, send）">
                
                <!-- Help View - Full Command List -->
                <div v-if="showHelpView" class="command-help-view">
                    <div class="help-header">
                        <h3><i class="fas fa-question-circle"></i> 命令帮助</h3>
                        <button class="help-close-btn" @click="showHelpView = false">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="help-content">
                        <div v-for="(commands, category) in commandsByCategory" :key="category" class="help-category">
                            <h4 class="help-category-title">{{ getCategoryName(category) }}</h4>
                            <div class="help-command-list">
                                <div v-for="cmd in commands" :key="cmd.name" class="help-command-item" @click="executeCommand(cmd.name); showHelpView = false">
                                    <i :class="cmd.icon" class="help-cmd-icon"></i>
                                    <span class="help-cmd-name">{{ cmd.name }}</span>
                                    <span class="help-cmd-desc">{{ cmd.desc }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="help-footer">
                        共 {{ allCommands.length }} 个命令可用 | 点击命令可直接执行
                    </div>
                </div>
                
                <!-- Normal Command Suggestions -->
                <div v-else class="command-suggestions">
                    <div v-if="output" class="command-item output-item">
                        <i class="fas fa-terminal"></i>
                        <span class="command-item-name">{{ output }}</span>
                    </div>
                    <div v-if="!query" class="command-item" v-for="cmd in displayCommands" :key="cmd.name" @click="executeCommand(cmd.name)">
                        <i :class="cmd.icon"></i>
                        <span class="command-item-name">{{ cmd.name }}</span>
                        <span class="command-item-desc">{{ cmd.desc }}</span>
                    </div>
                    <div v-else class="command-item" v-for="result in filteredCommands" :key="result.name" @click="executeCommand(result.name)">
                        <i :class="result.icon"></i>
                        <span class="command-item-name">{{ result.name }}</span>
                        <span class="command-item-desc">{{ result.desc }}</span>
                    </div>
                </div>
                <div class="command-help-text" v-if="!showHelpView">
                    按 Enter 执行，Tab 补全，Esc 退出 | 输入 help 查看完整命令列表
                </div>
            </div>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const query = Vue.ref('');
        const output = Vue.ref('');
        const commandInput = Vue.ref(null);
        const commandHistory = Vue.ref([]); // Store recently executed command names
        const showHelpView = Vue.ref(false); // Show full help view
        
        // Constants
        const AUTO_CLOSE_DELAY = 400; // Consistent delay for auto-closing palette
        
        // Get current route info
        const getCurrentRoute = () => {
            return StellarisRouter.getRoute();
        };
        
        // All available commands
        const allCommands = Vue.computed(() => {
            const route = getCurrentRoute();
            const commands = [
                // Help & Info
                { name: 'help', desc: '显示所有可用命令', icon: 'fas fa-question-circle', category: 'info' },
                { name: 'pwd', desc: '显示当前页面路径', icon: 'fas fa-map-marker-alt', category: 'info' },
                
                // Navigation commands
                { name: 'go home', desc: '返回首页', icon: 'fas fa-home', category: 'navigation', action: () => StellarisRouter.navigate('/') },
                { name: 'go chat', desc: '前往聊天室列表', icon: 'fas fa-comments', category: 'navigation', action: () => StellarisRouter.navigate('/chat') },
                { name: 'go forum', desc: '前往贴吧列表', icon: 'fas fa-newspaper', category: 'navigation', action: () => StellarisRouter.navigate('/forum') },
                { name: 'go settings', desc: '前往设置页面', icon: 'fas fa-cog', category: 'navigation', action: () => StellarisRouter.navigate('/settings'), authRequired: true },
                { name: 'go admin', desc: '前往管理面板', icon: 'fas fa-shield-alt', category: 'navigation', action: () => StellarisRouter.navigate('/admin'), adminRequired: true },
                { name: 'back', desc: '返回上一页', icon: 'fas fa-arrow-left', category: 'navigation', action: () => window.history.back() },
                
                // Theme commands
                { name: 'theme light', desc: '切换到亮色主题', icon: 'fas fa-sun', category: 'theme', action: () => store.setTheme('light') },
                { name: 'theme dark', desc: '切换到暗色主题', icon: 'fas fa-moon', category: 'theme', action: () => store.setTheme('dark') },
                { name: 'theme toggle', desc: '切换主题', icon: 'fas fa-adjust', category: 'theme', action: () => store.toggleTheme() },
                
                // Focus commands
                { name: 'focus message', desc: '聚焦消息输入框', icon: 'fas fa-pencil-alt', category: 'focus', action: () => focusElement('#message-text, .message-input, textarea[placeholder*="消息"]') },
                { name: 'focus search', desc: '聚焦搜索框', icon: 'fas fa-search', category: 'focus', action: () => focusElement('#searchInput, input[type="search"]') },
                { name: 'focus reply', desc: '聚焦回复框', icon: 'fas fa-reply', category: 'focus', action: () => focusElement('textarea[placeholder*="回复"]') },
                
                // UI commands
                { name: 'sidebar toggle', desc: '切换侧边栏折叠状态', icon: 'fas fa-bars', category: 'ui', action: () => store.toggleSidebar() },
                { name: 'sidebar show', desc: '展开侧边栏', icon: 'fas fa-chevron-right', category: 'ui', action: () => { if (store.state.sidebarCollapsed) store.toggleSidebar(); } },
                { name: 'sidebar hide', desc: '折叠侧边栏', icon: 'fas fa-chevron-left', category: 'ui', action: () => { if (!store.state.sidebarCollapsed) store.toggleSidebar(); } },
                
                // Refresh commands
                { name: 'refresh', desc: '刷新当前页面数据', icon: 'fas fa-sync-alt', category: 'action', action: () => { window.location.reload(); } },
                { name: 'reload', desc: '重新加载页面', icon: 'fas fa-redo', category: 'action', action: () => { window.location.reload(); } },
                
                // Exit commands
                { name: 'exit', desc: '关闭命令面板', icon: 'fas fa-times', category: 'system' },
                { name: 'close', desc: '关闭命令面板', icon: 'fas fa-times-circle', category: 'system' },
                { name: 'quit', desc: '关闭命令面板', icon: 'fas fa-door-open', category: 'system' },
            ];
            
            // Add context-specific commands based on current route
            if (route.path.startsWith('/chat/')) {
                commands.push(
                    { name: 'send', desc: '发送消息（聚焦输入框）', icon: 'fas fa-paper-plane', category: 'action', action: () => { focusElement('#message-text, .message-input'); } },
                    { name: 'scroll bottom', desc: '滚动到底部', icon: 'fas fa-arrow-down', category: 'action', action: () => scrollToBottom() },
                    { name: 'scroll top', desc: '滚动到顶部', icon: 'fas fa-arrow-up', category: 'action', action: () => scrollToTop() },
                    { name: 'load more', desc: '加载更多消息', icon: 'fas fa-history', category: 'action', action: () => clickButton('加载更多') },
                );
            }
            
            if (route.path.startsWith('/forum/thread/')) {
                commands.push(
                    { name: 'reply', desc: '聚焦回复输入框', icon: 'fas fa-reply', category: 'action', action: () => focusElement('textarea[placeholder*="回复"]') },
                    { name: 'submit reply', desc: '提交回复', icon: 'fas fa-check', category: 'action', action: () => clickButton('回复') },
                );
            }
            
            if (route.path.startsWith('/forum/') && !route.path.includes('/thread/')) {
                commands.push(
                    { name: 'new thread', desc: '创建新帖子', icon: 'fas fa-plus', category: 'action', action: () => clickButton('发帖') },
                );
            }
            
            if (route.path === '/settings') {
                commands.push(
                    { name: 'profile', desc: '前往个人资料设置', icon: 'fas fa-user', category: 'navigation', action: () => { window.location.href = '/profile'; } },
                    { name: 'password', desc: '前往修改密码', icon: 'fas fa-key', category: 'navigation', action: () => { window.location.href = '/change_password'; } },
                    { name: 'logout', desc: '退出登录', icon: 'fas fa-sign-out-alt', category: 'action', action: () => { if (confirm('确定要退出登录吗？')) window.location.href = '/logout'; } },
                );
            }
            
            // Filter commands based on auth status
            return commands.filter(cmd => {
                if (cmd.authRequired && !store.state.user.isAuthenticated) return false;
                if (cmd.adminRequired && !store.state.user.isAdmin) return false;
                return true;
            });
        });
        
        // Group commands by category for help view
        const commandsByCategory = Vue.computed(() => {
            const grouped = {};
            allCommands.value.forEach(cmd => {
                const cat = cmd.category || 'other';
                if (!grouped[cat]) {
                    grouped[cat] = [];
                }
                grouped[cat].push(cmd);
            });
            return grouped;
        });
        
        // Get human-readable category name
        const getCategoryName = (category) => {
            const names = {
                'info': '📋 信息与帮助',
                'navigation': '🧭 导航',
                'theme': '🎨 主题',
                'focus': '🎯 焦点',
                'ui': '🖼️ 界面',
                'action': '⚡ 操作',
                'system': '⚙️ 系统',
                'other': '📦 其他'
            };
            return names[category] || category;
        };
        
        // Display commands - put recently executed commands at the top
        const displayCommands = Vue.computed(() => {
            const history = commandHistory.value;
            const all = allCommands.value;
            
            // Get recently executed commands (in reverse order, most recent first)
            const recentCmds = [];
            for (let i = history.length - 1; i >= 0 && recentCmds.length < 5; i--) {
                const cmdName = history[i];
                const cmd = all.find(c => c.name === cmdName);
                if (cmd && !recentCmds.some(c => c.name === cmdName)) {
                    recentCmds.push({ ...cmd, isRecent: true });
                }
            }
            
            // Get other commands (excluding recent ones)
            const otherCmds = all.filter(cmd => !recentCmds.some(r => r.name === cmd.name));
            
            // Return recent commands first, then others
            return [...recentCmds, ...otherCmds].slice(0, 15);
        });
        
        // Fuzzy match helper
        const fuzzyMatch = (pattern, text) => {
            pattern = pattern.toLowerCase();
            text = text.toLowerCase();
            let patternIdx = 0;
            let textIdx = 0;
            
            while (patternIdx < pattern.length && textIdx < text.length) {
                if (pattern[patternIdx] === text[textIdx]) {
                    patternIdx++;
                }
                textIdx++;
            }
            
            return patternIdx === pattern.length;
        };
        
        const filteredCommands = Vue.computed(() => {
            if (!query.value) return allCommands.value.slice(0, 15);
            const q = query.value.toLowerCase().trim();
            
            // Exact prefix matches first
            const exactMatches = allCommands.value.filter(cmd => 
                cmd.name.toLowerCase().startsWith(q)
            );
            
            // Fuzzy matches
            const fuzzyMatches = allCommands.value.filter(cmd => 
                !cmd.name.toLowerCase().startsWith(q) && (
                    cmd.name.toLowerCase().includes(q) ||
                    cmd.desc.toLowerCase().includes(q) ||
                    fuzzyMatch(q, cmd.name) ||
                    fuzzyMatch(q, cmd.desc)
                )
            );
            
            return [...exactMatches, ...fuzzyMatches].slice(0, 20);
        });
        
        // Helper: Focus an element
        const focusElement = (selector) => {
            const candidates = document.querySelectorAll(selector);
            const isFocusable = (el) => {
                if (!(el instanceof HTMLElement)) return false;
                // Skip disabled controls
                if (typeof el.disabled !== 'undefined' && el.disabled) return false;
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 && rect.height === 0) return false;
                return true;
            };

            const el = Array.from(candidates).find(isFocusable);

            if (el) {
                el.focus();
                // Move cursor to end for text inputs
                if (typeof el.setSelectionRange === 'function' && typeof el.value === 'string') {
                    const len = el.value.length;
                    el.setSelectionRange(len, len);
                }
                output.value = '已聚焦元素';
                setTimeout(() => store.closeCommandPalette(), AUTO_CLOSE_DELAY);
            } else {
                output.value = '未找到可聚焦的目标元素';
            }
        };
        
        // Helper: Click a button
        const clickButton = (textContent) => {
            // Guard against empty search text
            if (!textContent) {
                output.value = '未找到目标按钮';
                return;
            }

            // Normalize target text: trim, collapse whitespace, lowercase
            const normalizedTarget = textContent.trim().toLowerCase();

            // Find button by (normalized) text content
            const buttons = Array.from(document.querySelectorAll('button, .el-button'));
            const normalize = (node) =>
                (node.textContent || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();

            // Prefer exact normalized text matches
            let el = buttons.find(btn => normalize(btn) === normalizedTarget);

            // Fallback: substring match on normalized text (preserves previous behavior)
            if (!el) {
                el = buttons.find(btn => normalize(btn).includes(normalizedTarget));
            }

            if (el) {
                el.click();
                output.value = '已触发点击';
                setTimeout(() => store.closeCommandPalette(), AUTO_CLOSE_DELAY);
            } else {
                output.value = '未找到目标按钮';
            }
        };
        
        // Helper: Scroll to bottom
        const scrollToBottom = () => {
            const container = document.querySelector('.messages-container, .content-area');
            if (container) {
                container.scrollTop = container.scrollHeight;
                output.value = '已滚动到底部';
            } else {
                output.value = '未找到滚动容器';
            }
        };
        
        // Helper: Scroll to top
        const scrollToTop = () => {
            const container = document.querySelector('.messages-container, .content-area');
            if (container) {
                container.scrollTop = 0;
                output.value = '已滚动到顶部';
            } else {
                output.value = '未找到滚动容器';
            }
        };
        
        // Clear output when user types (suggestions update automatically via computed property)
        const clearOutputOnInput = () => {
            output.value = '';
        };
        
        // Backwards-compatible alias for template binding
        const updateSuggestions = clearOutputOnInput;
        
        // Add command to history (most recent at the end, but displayed in reverse)
        const addToHistory = (cmdName) => {
            // Remove duplicate if exists
            const index = commandHistory.value.indexOf(cmdName);
            if (index > -1) {
                commandHistory.value.splice(index, 1);
            }
            // Add to end (will be shown first due to reverse iteration)
            commandHistory.value.push(cmdName);
            // Keep only last 10 commands
            if (commandHistory.value.length > 10) {
                commandHistory.value.shift();
            }
        };
        
        const executeCommand = (cmdText) => {
            const input = (cmdText || query.value).trim();
            if (!input) return;
            
            output.value = '';
            
            // Find matching command
            const matchedCmd = allCommands.value.find(cmd => cmd.name.toLowerCase() === input.toLowerCase());
            
            if (matchedCmd) {
                // Add to history
                addToHistory(matchedCmd.name);
                
                // Execute command action
                if (matchedCmd.action) {
                    try {
                        matchedCmd.action();
                        if (!output.value) {
                            output.value = `执行: ${matchedCmd.name}`;
                        }
                        // Close palette for most commands (except system commands)
                        // Don't auto-close on error to let user see the error message
                        if (matchedCmd.category !== 'system' && matchedCmd.category !== 'info') {
                            setTimeout(() => store.closeCommandPalette(), AUTO_CLOSE_DELAY);
                        }
                    } catch (err) {
                        output.value = `执行失败: ${err.message}`;
                        // Don't auto-close on error
                    }
                } else {
                    // Handle special commands
                    if (input === 'help') {
                        // Show the full help view with all commands
                        showHelpView.value = true;
                        output.value = '';
                    } else if (input === 'pwd') {
                        const route = getCurrentRoute();
                        output.value = `当前路径: ${route.path}`;
                    } else if (input === 'exit' || input === 'close' || input === 'quit') {
                        store.closeCommandPalette();
                    } else {
                        output.value = `执行: ${matchedCmd.name}`;
                    }
                }
            } else {
                output.value = `未知命令: ${input}。输入 help 查看所有命令`;
            }
            
            query.value = '';
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeCommand();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                store.closeCommandPalette();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Tab completion
                if (filteredCommands.value.length === 1) {
                    query.value = filteredCommands.value[0].name;
                } else if (filteredCommands.value.length > 1) {
                    // Find common prefix (case-insensitive comparison)
                    const first = filteredCommands.value[0].name;
                    const firstLower = first.toLowerCase();
                    let prefixLen = firstLower.length;
                    
                    for (let i = 1; i < filteredCommands.value.length; i++) {
                        const name = filteredCommands.value[i].name;
                        const nameLower = name.toLowerCase();
                        let j = 0;
                        while (j < prefixLen && j < nameLower.length && firstLower[j] === nameLower[j]) {
                            j++;
                        }
                        prefixLen = j;
                    }
                    
                    if (prefixLen > query.value.length) {
                        // Preserve user-typed casing, use command name casing for new characters
                        let completed = '';
                        for (let i = 0; i < prefixLen; i++) {
                            if (i < query.value.length) {
                                completed += query.value[i];
                            } else {
                                completed += first[i];
                            }
                        }
                        query.value = completed;
                    }
                }
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
                showHelpView.value = false;
            }
        });
        
        // Listen for ':' key to open command palette
        Vue.onMounted(() => {
            document.addEventListener('keydown', (e) => {
                const active = document.activeElement;
                const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
                // Open palette when ':' is pressed outside input fields
                // Note: If palette is open and user types in command input, ':' is handled by the input itself (isInput is true)
                if (e.key === ':' && !isInput && !store.state.commandPaletteOpen) {
                    e.preventDefault();
                    store.openCommandPalette();
                }
                if (e.key === 'Escape' && store.state.commandPaletteOpen) {
                    e.preventDefault();
                    if (showHelpView.value) {
                        showHelpView.value = false;
                    } else {
                        store.closeCommandPalette();
                    }
                }
            });
        });
        
        return {
            store,
            query,
            output,
            commandInput,
            showHelpView,
            allCommands,
            displayCommands,
            filteredCommands,
            commandsByCategory,
            getCategoryName,
            executeCommand,
            handleKeydown,
            updateSuggestions
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
        <div class="message" :class="{ 'heart-border': hasHeartEffect, 'cake-border': hasBirthdayEffect, 'message-self': isSelf, 'message-other': !isSelf }" :data-message-id="message.id">
            <div class="message-avatar" :style="{ background: userColor }">
                {{ userInitial }}
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-username" :style="{ color: isSelf ? 'rgba(255, 255, 255, 0.95)' : userColor }">{{ displayName }}</span>
                    <span class="message-badge" v-if="message.badge" :style="{ background: userColor }">{{ message.badge }}</span>
                    <span class="message-time">{{ formattedTime }}</span>
                </div>
                <div class="message-text" v-html="renderedContent"></div>
                <div class="message-actions" v-if="showActions">
                    <button class="message-action-btn" @click="$emit('quote', message)" title="引用">
                        <i class="fas fa-quote-right"></i>
                    </button>
                    <button class="message-action-btn" v-if="canDelete" @click.stop="handleDelete" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    props: ['message', 'currentUserId', 'roomPermission', 'showActions'],
    emits: ['quote', 'delete'],
    setup(props, { emit }) {
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
        
        const hasBirthdayEffect = Vue.computed(() => {
            return StellarisUtils.hasBirthdayEffect(props.message.content || props.message.message || '');
        });
        
        const isSelf = Vue.computed(() => {
            return Number(props.message.user_id) === Number(props.currentUserId);
        });
        
        const canDelete = Vue.computed(() => {
            if (!props.message.id) return false;
            if (props.roomPermission === 'su') return true;
            if (props.roomPermission === '777' && Number(props.message.user_id) === Number(props.currentUserId)) return true;
            return false;
        });
        
        const handleDelete = () => {
            emit('delete', props.message);
        };
        
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
            hasBirthdayEffect,
            canDelete,
            isSelf,
            handleDelete
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
