/**
 * Stellarsis SPA Main Application
 * Vue 3 + Element Plus Application Entry
 */

// Main App Layout Component
const AppLayout = {
    name: 'AppLayout',
    template: `
        <div class="app-container">
            <!-- Sidebar Overlay (Mobile) -->
            <div class="sidebar-overlay" :class="{ active: store.state.mobileSidebarOpen }" @click="store.closeMobileSidebar()"></div>
            
            <!-- Sidebar -->
            <sidebar-component></sidebar-component>
            
            <!-- Main Content -->
            <div class="main-content">
                <!-- Top Header -->
                <top-header-component :page-title="pageTitle"></top-header-component>
                
                <!-- Content Area -->
                <div class="content-area">
                    <component :is="currentPage"></component>
                </div>
            </div>
            
            <!-- Toast Container -->
            <toast-container-component></toast-container-component>
            
            <!-- Command Palette -->
            <command-palette-component></command-palette-component>
        </div>
    `,
    setup() {
        const store = StellarisStore;
        const currentPage = Vue.ref('home-page');
        const pageTitle = Vue.ref('首页');
        
        const pageTitles = {
            '/': '首页',
            '/chat': '即时聊天',
            '/forum': '贴吧',
            '/settings': '设置',
            '/admin': '管理面板',
            '/admin/su': 'SU 验证'
        };
        
        const updatePage = (route) => {
            const path = route.path;
            
            // Determine which page component to show
            if (path === '/') {
                currentPage.value = 'home-page';
                pageTitle.value = '首页';
            } else if (path === '/chat') {
                currentPage.value = 'chat-list-page';
                pageTitle.value = '即时聊天';
            } else if (path.match(/^\/chat\/\d+$/)) {
                currentPage.value = 'chat-room-page';
                pageTitle.value = '聊天室';
            } else if (path === '/forum') {
                currentPage.value = 'forum-list-page';
                pageTitle.value = '贴吧';
            } else if (path.match(/^\/forum\/\d+$/)) {
                currentPage.value = 'forum-section-page';
                pageTitle.value = '分区';
            } else if (path.match(/^\/forum\/thread\/\d+$/)) {
                currentPage.value = 'forum-thread-page';
                pageTitle.value = '帖子';
            } else if (path === '/settings') {
                currentPage.value = 'settings-page';
                pageTitle.value = '设置';
            } else if (path === '/admin/su') {
                currentPage.value = 'su-verification-page';
                pageTitle.value = 'SU 验证';
            } else if (path === '/admin') {
                currentPage.value = 'admin-page';
                pageTitle.value = '管理面板';
            } else {
                currentPage.value = 'not-found-page';
                pageTitle.value = '页面未找到';
            }
        };
        
        // Listen for route changes
        window.addEventListener('route-changed', (e) => {
            updatePage(e.detail);
        });
        
        // Initial page
        Vue.onMounted(() => {
            updatePage(StellarisRouter.getRoute());
        });
        
        return {
            store,
            currentPage,
            pageTitle
        };
    }
};

// Create Vue Application
const app = Vue.createApp({});

// Use Element Plus
app.use(ElementPlus);

// Make ElMessageBox globally available for use in pages/components
window.ElMessageBox = ElementPlus.ElMessageBox;
window.ElMessage = ElementPlus.ElMessage;

// Register Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

// Register Components
app.component('app-layout', AppLayout);
app.component('sidebar-component', StellarisComponents.SidebarComponent);
app.component('top-header-component', StellarisComponents.TopHeaderComponent);
app.component('toast-container-component', StellarisComponents.ToastContainerComponent);
app.component('command-palette-component', StellarisComponents.CommandPaletteComponent);
app.component('room-card-component', StellarisComponents.RoomCardComponent);
app.component('message-component', StellarisComponents.MessageComponent);
app.component('loading-component', StellarisComponents.LoadingComponent);
app.component('empty-state-component', StellarisComponents.EmptyStateComponent);

// Register Page Components
app.component('home-page', StellarisPages.HomePage);
app.component('chat-list-page', StellarisPages.ChatListPage);
app.component('chat-room-page', StellarisPages.ChatRoomPage);
app.component('forum-list-page', StellarisPages.ForumListPage);
app.component('forum-section-page', StellarisPages.ForumSectionPage);
app.component('forum-thread-page', StellarisPages.ForumThreadPage);
app.component('settings-page', StellarisPages.SettingsPage);
app.component('admin-page', StellarisPages.AdminPage);
app.component('not-found-page', StellarisPages.NotFoundPage);

// Initialize Store
StellarisStore.init();

// Setup Router
StellarisRouter
    .register('/', 'home-page')
    .register('/chat', 'chat-list-page')
    .register('/chat/:id', 'chat-room-page')
    .register('/forum', 'forum-list-page')
    .register('/forum/:id', 'forum-section-page')
    .register('/forum/thread/:id', 'forum-thread-page')
    .register('/settings', 'settings-page')
    .register('/admin/su', 'su-verification-page')
    .register('/admin', 'admin-page');

// Auth guard
StellarisRouter.beforeEach = (to, from) => {
    // Check if user needs to be authenticated for certain routes
    const protectedRoutes = ['/settings', '/admin'];
    if (protectedRoutes.some(r => to.path.startsWith(r))) {
        if (!StellarisStore.state.user.isAuthenticated) {
            window.location.href = '/login';
            return false;
        }
    }
    
    // Admin routes check
    if (to.path.startsWith('/admin') && !StellarisStore.state.user.isAdmin) {
        StellarisStore.showToast('无权访问管理面板', 'error');
        return '/';
    }
    
    return true;
};

// Initialize Router
StellarisRouter.init();

// Initialize Global Socket
StellarisStore.initGlobalSocket();

// Mount App
app.mount('#app');

console.log('Stellarsis SPA initialized');
