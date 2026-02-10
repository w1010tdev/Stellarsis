# Frontend Architecture / 前端架构

> **English** | [中文](#中文文档)

## English Documentation

### Overview

Stellarsis features a **dual-mode frontend architecture** that supports both traditional multi-page application (MPA) and modern single-page application (SPA) patterns. This allows flexibility for different use cases while maintaining consistent functionality across both modes.

### Tech Stack

#### Core Technologies
- **JavaScript**: ES6+ with modules (no build tools required)
- **Vue 3**: SPA framework with Composition API
- **Element Plus**: Vue 3 UI component library for SPA
- **Socket.IO**: Real-time WebSocket communication for chat
- **Marked.js**: Markdown parsing and rendering
- **Highlight.js**: Code syntax highlighting
- **KaTeX**: Mathematical formula rendering

#### UI & Styling
- **CSS Custom Properties**: Design token system with 90+ CSS variables
- **Font Awesome**: Icon library
- **Custom CSS**: Modular, component-based styling
- **Responsive Design**: Mobile-first approach with breakpoints

#### Development Philosophy
- **No Build Step**: Direct browser loading of ES6 modules
- **Progressive Enhancement**: Works without JavaScript for core features
- **Performance First**: Critical CSS inlining, lazy loading
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

---

### Application Architecture

#### Dual-Mode Design

**1. Traditional MPA (`/templates/base.html`)**
- Server-rendered Jinja2 templates
- Separate page loads for navigation
- Vanilla JavaScript modules
- Progressive enhancement approach
- SEO-friendly with server-side rendering

**2. Modern SPA (`/spa.html`)**
- Client-side Vue 3 application
- Hash-based routing (`/#/chat`, `/#/forum`)
- Single page with dynamic content
- Reactive state management
- Optimized for user experience

**Shared Components:**
- Command palette works in both modes
- Theme switcher unified across both
- Toast notification system
- Modal dialogs
- Clipboard utilities

---

### Project Structure

```
static/
├── js/                      # Traditional MPA modules
│   ├── chat.js             # Chat WebSocket client
│   ├── forum.js            # Forum interactions
│   ├── command-palette.js  # Bash-style command system
│   ├── settings.js         # User settings management
│   ├── uploads.js          # File upload handling
│   ├── theme-switcher.js   # Theme management
│   ├── ui.js               # Toast, modal, utilities
│   └── clipboard-polyfill.js # Clipboard compatibility
│
├── spa/                     # SPA modules
│   ├── app.js              # Vue app initialization
│   ├── store.js            # Reactive state management
│   ├── router.js           # Hash-based routing
│   ├── pages.js            # Page components
│   ├── components.js       # Reusable Vue components
│   ├── utils.js            # SPA utilities
│   └── app.css             # SPA-specific styles
│
├── css/                     # Stylesheets
│   ├── main.css            # Design system & base styles
│   ├── chat.css            # Chat interface
│   ├── forum.css           # Forum styles
│   ├── auth.css            # Authentication pages
│   ├── admin.css           # Admin panel
│   ├── alerts.css          # Toast & alerts
│   ├── animations.css      # CSS animations
│   ├── command-palette.css # Command palette UI
│   ├── errors.css          # Error pages
│   └── themes/             # Theme variations
│       ├── light.css       # Light theme
│       ├── mint.css        # Mint theme
│       ├── ocean.css       # Ocean theme
│       ├── purple.css      # Purple dark theme
│       ├── solarized.css   # Solarized theme
│       └── sunset.css      # Sunset theme
│
templates/
├── base.html               # Base template for MPA
├── spa.html                # SPA entry point
└── errors/                 # Error page templates
    ├── 403.html
    ├── 404.html
    └── 500.html
```

---

### Application Flow

#### Traditional MPA Flow

```
User Request → Flask Route → Jinja2 Template Render → HTML Response
                                                     ↓
                                      JavaScript Module Loads (chat.js, etc.)
                                                     ↓
                                      Initialize Components & Event Listeners
                                                     ↓
                                      WebSocket Connection (for chat)
```

#### SPA Flow

```
Initial Load → spa.html → Vue App Bootstrap
                            ↓
                    Router Initializes (hash-based)
                            ↓
                    Store State Management Setup
                            ↓
                    Load Current Route Component
                            ↓
                    Mount Vue Components
                            ↓
                    WebSocket Connection (reactive)
```

---

### Component Structure

#### Traditional Components (Vanilla JS)

Each component is a self-contained module that:
1. **Initializes** on `DOMContentLoaded`
2. **Manages** its own state via closures
3. **Communicates** via custom events or global callbacks
4. **Cleans up** event listeners on navigation

**Example Pattern:**
```javascript
// chat.js
(function() {
    let chatSocket = null;
    let messageQueue = [];
    
    function initialize() {
        setupWebSocket();
        bindEventListeners();
    }
    
    document.addEventListener('DOMContentLoaded', initialize);
})();
```

#### SPA Components (Vue 3)

Vue components follow the Composition API pattern:
1. **Reactive State** via `Vue.reactive()` and `Vue.ref()`
2. **Lifecycle Hooks** for setup and cleanup
3. **Props & Events** for parent-child communication
4. **Store Integration** for global state

**Example Pattern:**
```javascript
// In components.js
const ChatComponent = {
    setup() {
        const messages = Vue.ref([]);
        const socket = StellarisStore.state.chatSocket;
        
        Vue.onMounted(() => {
            setupSocketListeners();
        });
        
        return { messages };
    },
    template: `<div>...</div>`
};
```

---

### State Management

#### Traditional MPA State

**Global Variables per Module:**
```javascript
// chat.js
let chatSocket = null;
let followedUserIds = new Set();
let processedMessageIds = new Set();
let onlineUsers = [];
```

**Persistence:**
- `localStorage` for theme, sidebar state
- Cookies as fallback for theme
- Session state lost on page reload (except persisted data)

#### SPA State (store.js)

**Centralized Reactive Store:**
```javascript
const StellarisStore = {
    state: Vue.reactive({
        user: { ... },           // Authentication state
        theme: 'light',          // Current theme
        chatSocket: null,        // WebSocket instance
        onlineCount: 0,          // Online users count
        unreadCounts: {},        // Unread messages
        followedUserIds: new Set(), // Followed users
        sidebarCollapsed: false, // UI state
        toasts: []               // Toast notifications
    }),
    
    actions: {
        setUser(userData) { ... },
        updateTheme(theme) { ... },
        addToast(toast) { ... }
    }
};
```

**Persistence:**
- `localStorage` for theme, sidebar state
- State maintained across route changes
- WebSocket reconnection on route changes

---

### Routing

#### Traditional MPA Routing

**Server-Side (Flask):**
```python
@app.route('/chat/<room_id>')
def chat_room(room_id):
    return render_template('chat.html', room_id=room_id)
```

Full page reload on navigation.

#### SPA Routing

**Client-Side (router.js):**
```javascript
StellarisRouter
    .register('/', HomePage)
    .register('/chat/:room_id', ChatPage)
    .register('/forum', ForumPage)
    .register('/settings', SettingsPage);
```

Hash-based routing: `/#/chat/1`, `/#/forum`

**Navigation Guards:**
```javascript
StellarisRouter.beforeEach = (to, from) => {
    // Check authentication
    // Update document title
    // Analytics tracking
};
```

---

### Communication Patterns

#### HTTP Requests

**Traditional MPA:**
```javascript
// Using Fetch API
fetch('/api/forum/reply', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => handleResponse(data));
```

**SPA:**
```javascript
// Centralized API utilities
await StellarisAPI.post('/forum/reply', {
    thread_id: 123,
    content: 'Reply text'
});
```

#### WebSocket (Socket.IO)

**Connection Setup:**
```javascript
chatSocket = io('/chat', {
    transports: ['websocket'],
    upgrade: false
});
```

**Event Handling:**
```javascript
// Server → Client
socket.on('new_message', (data) => {
    appendMessage(data);
    updateUnreadCount();
});

// Client → Server
socket.emit('send_message', {
    room_id: roomId,
    content: messageText
});
```

**Deduplication:**
```javascript
const processedMessageIds = new Set();

function handleMessage(msg) {
    if (processedMessageIds.has(msg.id)) return;
    processedMessageIds.add(msg.id);
    renderMessage(msg);
}
```

---

### Performance Optimizations

#### Critical CSS
- Inline critical theme CSS in `<head>` before HTML render
- Prevents flash of unstyled content (FOUC)
- Full theme CSS loaded asynchronously

#### Lazy Loading
- Markdown/KaTeX libraries loaded on demand
- Code highlighting bundled but only executed when needed
- Images lazy-loaded with `loading="lazy"`

#### Message Virtualization
- Chat history pagination (30 messages per page)
- Scroll-based loading of older messages
- DOM cleanup for off-screen messages

#### WebSocket Optimization
- Message batching for high-frequency events
- Debounced typing indicators
- Automatic reconnection with exponential backoff

---

### Error Handling

#### Network Errors
```javascript
fetch('/api/endpoint')
    .catch(error => {
        showToast('danger', '网络请求失败 / Network request failed');
        console.error('API Error:', error);
    });
```

#### WebSocket Errors
```javascript
socket.on('connect_error', (error) => {
    showToast('warning', '连接断开，尝试重连... / Reconnecting...');
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});
```

#### Content Rendering Errors
```javascript
try {
    element.innerHTML = window.renderContent(rawContent);
} catch (e) {
    console.error('渲染失败 / Render failed:', e);
    element.innerHTML = `<div class="render-error">${escapeHtml(rawContent)}</div>`;
}
```

---

### Security Considerations

#### XSS Prevention
- All user content escaped via `escapeHtml()` utility
- Markdown rendered through sanitized pipeline
- `textContent` used instead of `innerHTML` where possible

#### CSRF Protection
- Flask CSRF tokens in forms
- SameSite cookie attributes
- Origin validation on WebSocket connections

#### Content Security Policy
- Inline scripts avoided where possible
- External resources from trusted CDNs only
- Nonce-based script loading for critical code

---

### Browser Compatibility

**Minimum Requirements:**
- ES6+ support (Chrome 51+, Firefox 54+, Safari 10+)
- WebSocket support
- CSS Custom Properties support

**Polyfills Included:**
- Clipboard API polyfill (`clipboard-polyfill.js`)
- Fallback for `execCommand('copy')`

**Graceful Degradation:**
- Basic functionality works without JavaScript
- Command palette unavailable without JS
- Chat requires WebSocket support

---

## 中文文档

### 概览

Stellarsis 采用**双模式前端架构**，同时支持传统的多页应用（MPA）和现代的单页应用（SPA）模式。这种设计提供了灵活性，可以根据不同的使用场景选择合适的模式，同时保持两种模式下的功能一致性。

### 技术栈

#### 核心技术
- **JavaScript**: ES6+ 模块化（无需构建工具）
- **Vue 3**: SPA 框架，使用 Composition API
- **Element Plus**: Vue 3 UI 组件库（用于 SPA）
- **Socket.IO**: 实时 WebSocket 通信（聊天功能）
- **Marked.js**: Markdown 解析和渲染
- **Highlight.js**: 代码语法高亮
- **KaTeX**: 数学公式渲染

#### UI 与样式
- **CSS 自定义属性**: 设计令牌系统，包含 90+ CSS 变量
- **Font Awesome**: 图标库
- **自定义 CSS**: 模块化、基于组件的样式
- **响应式设计**: 移动优先，带有断点

#### 开发理念
- **无构建步骤**: 直接在浏览器中加载 ES6 模块
- **渐进增强**: 核心功能即使没有 JavaScript 也能工作
- **性能优先**: 关键 CSS 内联、懒加载
- **无障碍访问**: ARIA 标签、键盘导航、屏幕阅读器支持

---

### 应用架构

#### 双模式设计

**1. 传统 MPA (`/templates/base.html`)**
- 服务器渲染的 Jinja2 模板
- 导航时完整页面重载
- 原生 JavaScript 模块
- 渐进增强方法
- SEO 友好，服务器端渲染

**2. 现代 SPA (`/spa.html`)**
- 客户端 Vue 3 应用
- 基于哈希的路由（`/#/chat`、`/#/forum`）
- 单页面动态内容
- 响应式状态管理
- 优化用户体验

**共享组件：**
- 命令面板在两种模式下都可用
- 主题切换器统一
- Toast 通知系统
- 模态对话框
- 剪贴板工具

---

### 项目结构

```
static/
├── js/                      # 传统 MPA 模块
│   ├── chat.js             # 聊天 WebSocket 客户端
│   ├── forum.js            # 论坛交互
│   ├── command-palette.js  # Bash 风格命令系统
│   ├── settings.js         # 用户设置管理
│   ├── uploads.js          # 文件上传处理
│   ├── theme-switcher.js   # 主题管理
│   ├── ui.js               # Toast、模态框、工具函数
│   └── clipboard-polyfill.js # 剪贴板兼容性
│
├── spa/                     # SPA 模块
│   ├── app.js              # Vue 应用初始化
│   ├── store.js            # 响应式状态管理
│   ├── router.js           # 基于哈希的路由
│   ├── pages.js            # 页面组件
│   ├── components.js       # 可复用的 Vue 组件
│   ├── utils.js            # SPA 工具函数
│   └── app.css             # SPA 特定样式
│
├── css/                     # 样式表
│   ├── main.css            # 设计系统与基础样式
│   ├── chat.css            # 聊天界面
│   ├── forum.css           # 论坛样式
│   ├── auth.css            # 认证页面
│   ├── admin.css           # 管理面板
│   ├── alerts.css          # Toast 和警告
│   ├── animations.css      # CSS 动画
│   ├── command-palette.css # 命令面板 UI
│   ├── errors.css          # 错误页面
│   └── themes/             # 主题变体
│       ├── light.css       # 浅色主题
│       ├── mint.css        # 薄荷主题
│       ├── ocean.css       # 海洋主题
│       ├── purple.css      # 紫色深色主题
│       ├── solarized.css   # Solarized 主题
│       └── sunset.css      # 日落主题
│
templates/
├── base.html               # MPA 基础模板
├── spa.html                # SPA 入口点
└── errors/                 # 错误页面模板
    ├── 403.html
    ├── 404.html
    └── 500.html
```

---

### 应用流程

#### 传统 MPA 流程

```
用户请求 → Flask 路由 → Jinja2 模板渲染 → HTML 响应
                                        ↓
                        JavaScript 模块加载 (chat.js 等)
                                        ↓
                        初始化组件与事件监听器
                                        ↓
                        WebSocket 连接（用于聊天）
```

#### SPA 流程

```
初始加载 → spa.html → Vue 应用启动
                        ↓
            路由初始化（基于哈希）
                        ↓
            Store 状态管理设置
                        ↓
            加载当前路由组件
                        ↓
            挂载 Vue 组件
                        ↓
            WebSocket 连接（响应式）
```

---

### 组件结构

#### 传统组件（原生 JS）

每个组件都是一个自包含的模块：
1. **初始化**：在 `DOMContentLoaded` 时
2. **管理**：通过闭包管理自己的状态
3. **通信**：通过自定义事件或全局回调
4. **清理**：导航时清理事件监听器

**示例模式：**
```javascript
// chat.js
(function() {
    let chatSocket = null;
    let messageQueue = [];
    
    function initialize() {
        setupWebSocket();
        bindEventListeners();
    }
    
    document.addEventListener('DOMContentLoaded', initialize);
})();
```

#### SPA 组件（Vue 3）

Vue 组件遵循 Composition API 模式：
1. **响应式状态**：通过 `Vue.reactive()` 和 `Vue.ref()`
2. **生命周期钩子**：用于设置和清理
3. **Props 与事件**：用于父子组件通信
4. **Store 集成**：用于全局状态

---

### 状态管理

#### 传统 MPA 状态

**每个模块的全局变量：**
```javascript
// chat.js
let chatSocket = null;
let followedUserIds = new Set();
let processedMessageIds = new Set();
let onlineUsers = [];
```

**持久化：**
- `localStorage` 用于主题、侧边栏状态
- Cookie 作为主题的备用方案
- 页面重载时会话状态丢失（持久化数据除外）

#### SPA 状态（store.js）

**集中式响应式 Store：**
```javascript
const StellarisStore = {
    state: Vue.reactive({
        user: { ... },           // 认证状态
        theme: 'light',          // 当前主题
        chatSocket: null,        // WebSocket 实例
        onlineCount: 0,          // 在线用户数
        unreadCounts: {},        // 未读消息
        followedUserIds: new Set(), // 关注的用户
        sidebarCollapsed: false, // UI 状态
        toasts: []               // Toast 通知
    }),
    
    actions: {
        setUser(userData) { ... },
        updateTheme(theme) { ... },
        addToast(toast) { ... }
    }
};
```

---

### 性能优化

#### 关键 CSS
- 在 HTML 渲染前内联关键主题 CSS
- 防止无样式内容闪烁（FOUC）
- 完整主题 CSS 异步加载

#### 懒加载
- 按需加载 Markdown/KaTeX 库
- 代码高亮打包但仅在需要时执行
- 图片使用 `loading="lazy"` 懒加载

#### 消息虚拟化
- 聊天历史分页（每页 30 条消息）
- 基于滚动加载旧消息
- 清理屏幕外消息的 DOM

#### WebSocket 优化
- 高频事件的消息批处理
- 输入指示器防抖
- 指数退避的自动重连

---

### 浏览器兼容性

**最低要求：**
- ES6+ 支持（Chrome 51+、Firefox 54+、Safari 10+）
- WebSocket 支持
- CSS 自定义属性支持

**包含的 Polyfill：**
- 剪贴板 API polyfill（`clipboard-polyfill.js`）
- `execCommand('copy')` 备用方案

**优雅降级：**
- 基本功能在没有 JavaScript 时也能工作
- 命令面板需要 JS
- 聊天需要 WebSocket 支持

---

## Related Documentation / 相关文档

- [Components Guide / 组件指南](./COMPONENTS.md)
- [Theming Guide / 主题指南](./THEMING.md)
- [Command Palette / 命令面板](./COMMAND_PALETTE.md)
