# Frontend Components / 前端组件

> **English** | [中文](#中文文档)

## English Documentation

### Overview

This document provides detailed documentation for all frontend components in Stellarsis. Components are split between **Traditional MPA modules** (`static/js/`) and **SPA components** (`static/spa/`).

---

## Traditional Components (static/js/)

### 1. Chat System (`chat.js`)

**Purpose**: Real-time chat interface with WebSocket communication, message rendering, and online user tracking.

#### Features

- **WebSocket Connection**: Socket.IO-based real-time messaging
- **Message Rendering**: Markdown, LaTeX, code highlighting support
- **Message Deduplication**: Prevents duplicate messages from appearing
- **History Pagination**: Load older messages on scroll
- **Online User Tracking**: Real-time online user list with status updates
- **Follow System**: Follow/unfollow users with color highlighting
- **CAPTCHA Support**: Anti-spam verification for rapid messages
- **Typing Indicators**: Shows when users are typing
- **File Upload**: Support for image and file sharing (if enabled)

#### Key Variables

```javascript
let chatSocket = null;              // Socket.IO instance
let chatHistoryLoaded = false;      // Whether initial history is loaded
let chatCurrentPage = null;         // Current pagination page
let followedUserIds = new Set();    // Set of followed user IDs
let onlineUsers = [];               // Array of currently online users
let processedMessageIds = new Set(); // Deduplication tracking
let isScrolledToBottom = true;      // Auto-scroll tracking
let newMessagesCount = 0;           // Unread message counter
```

#### Main Functions

**`initializeChat(roomIdParam, userIdParam)`**
- Initializes chat system with room and user context
- Sets up WebSocket connection
- Loads initial message history
- Binds UI event listeners

**`setupWebSocket()`**
- Creates Socket.IO connection to `/chat` namespace
- Registers event handlers for messages, errors, online status
- Implements auto-reconnection logic

**`handleNewMessage(data)`**
- Receives new message from WebSocket
- Checks for duplicates
- Renders message with proper formatting
- Updates online user list if needed
- Auto-scrolls if at bottom

**`sendMessage()`**
- Validates message content
- Sends message via WebSocket
- Adds pending message to UI
- Handles CAPTCHA challenges

**`loadMoreMessages()`**
- Loads previous message history
- Pagination support (30 messages per page)
- Preserves scroll position after load

**`updateOnlineUsersList()`**
- Updates the online users modal
- Highlights followed users
- Shows user badges and colors
- Provides follow/unfollow actions

#### WebSocket Events

**Client → Server:**
- `send_message`: Send a chat message
- `captcha_answer`: Submit CAPTCHA solution
- `join`: Join chat room
- `leave`: Leave chat room

**Server → Client:**
- `new_message`: New message received
- `message_sent`: Own message confirmed
- `message_error`: Message send failed
- `online_users_update`: Online user list changed
- `user_joined`: User joined room
- `user_left`: User left room
- `captcha_required`: CAPTCHA challenge needed
- `history`: Message history response

#### Message Rendering

Messages are rendered with the following pipeline:

1. **Parse Markdown**: `marked.parse(content)`
2. **Highlight Code**: `hljs.highlightAll()`
3. **Render Math**: `renderMathInElement()` (KaTeX)
4. **Sanitize**: Escape HTML to prevent XSS
5. **Process Links**: Add `target="_blank"` to external links

#### Usage Example

```html
<div id="chat-messages"></div>
<textarea id="message-input"></textarea>
<button id="send-button">Send</button>

<script src="/static/js/chat.js"></script>
<script>
    // Automatically initializes via data attributes
    // or call manually:
    // initializeChat(roomId, userId);
</script>
```

---

### 2. Forum System (`forum.js`)

**Purpose**: Forum thread viewing and reply functionality with Markdown rendering.

#### Features

- **Thread Content Rendering**: Markdown, LaTeX, code highlighting
- **Reply System**: Post and render replies dynamically
- **Auto-resizing Textarea**: Reply input grows with content
- **Real-time Reply Addition**: New replies added without page reload
- **Error Handling**: User-friendly error messages

#### Main Functions

**`renderAndSetContent(element, content)`**
- Waits for rendering libraries to load
- Renders Markdown content safely
- Applies syntax highlighting and math rendering
- Handles errors gracefully

**`setupReplyForm()`**
- Initializes reply form event listeners
- Sets up textarea auto-resize
- Handles reply submission via AJAX
- Creates new reply elements dynamically

**`createReplyElement(data)`**
- Creates DOM element for new reply
- Renders reply content with Markdown
- Adds user badge and timestamp
- Returns insertable HTML element

#### Usage Example

```html
<div class="thread-content" data-content="# Hello **World**"></div>

<form id="reply-form" data-thread-id="123">
    <textarea name="content"></textarea>
    <button type="submit">Submit Reply</button>
</form>

<script src="/static/js/forum.js"></script>
```

---

### 3. Command Palette (`command-palette.js`)

**Purpose**: Bash-style keyboard-driven command system for quick navigation and actions.

#### Features

- **Bash-Style Interface**: Colon (`:`) to open, Enter to execute
- **Command History**: Navigate with ↑/↓ arrows (last 50 commands)
- **Tab Completion**: Auto-complete command names
- **Fuzzy Matching**: Smart command suggestions
- **Aliases**: Short aliases for common commands (e.g., `h` → `help`)
- **Parameter Support**: Commands can accept arguments

#### Built-in Commands

| Command | Description | Aliases | Example |
|---------|-------------|---------|---------|
| `help` | Show all commands | `h`, `?` | `:help` |
| `history` | Show command history | - | `:history` |
| `clear` | Clear command history | - | `:clear` |
| `theme` | Change theme | `t` | `:theme ocean` |
| `go` | Navigate to page | `cd` | `:go home` |
| `focus` | Focus input element | - | `:focus message` |
| `sidebar` | Toggle sidebar | - | `:sidebar` |
| `refresh` | Reload page | `r` | `:refresh` |

#### API

**Register Custom Commands:**

```javascript
window.commandPalette.registerCommand(
    'mycommand',           // Command name
    'Description',         // Help text
    function(args) {       // Handler function
        console.log('Args:', args);
        return Promise.resolve('Success!');
    },
    { aliases: ['mc'] }    // Options (aliases)
);
```

**Programmatic Control:**

```javascript
// Show command palette
window.commandPalette.show();

// Hide command palette
window.commandPalette.hide();

// Execute command programmatically
window.commandPalette.execute('theme ocean');
```

#### Command Handler Return Values

Handlers can return:
- **String**: Display as success message
- **Object with `type: 'help'`**: Display formatted help list
- **Promise**: Async command execution
- **Error**: Display as error message

#### Usage Example

```javascript
// Register a custom command
window.commandPalette.registerCommand(
    'admin',
    'Go to admin panel',
    function(args) {
        window.location.href = '/admin';
        return Promise.resolve('Navigating to admin...');
    },
    { aliases: ['a', 'adm'] }
);
```

See [COMMAND_PALETTE.md](./COMMAND_PALETTE.md) for complete documentation.

---

### 4. Settings Management (`settings.js`)

**Purpose**: User settings page with follow/unfollow functionality.

#### Features

- **User Search**: Search users by username or nickname
- **Follow Management**: Follow/unfollow users
- **Follow List**: Display and manage followed users
- **Real-time Updates**: List updates after actions
- **Error Handling**: Toast notifications for errors

#### Main Functions

**`renderFollowList(items)`**
- Renders list of followed users
- Displays user badges and nicknames
- Adds unfollow buttons

**`refreshFollowList()`**
- Fetches current follow list from API
- Updates UI with latest data

**`handleFollow(userId)`**
- Sends follow request to API
- Updates UI on success
- Shows error toast on failure

**`handleUnfollow(userId)`**
- Sends unfollow request to API
- Removes user from list
- Shows success/error toast

#### API Endpoints

- `GET /api/follows`: Get user's follow list
- `POST /api/follow`: Follow a user
- `POST /api/unfollow`: Unfollow a user
- `GET /api/search_users?q=query`: Search users

---

### 5. Upload System (`uploads.js`)

**Purpose**: File upload handling with progress tracking and clipboard integration.

#### Features

- **Drag & Drop**: Drag files onto chat to upload
- **Progress Tracking**: Upload progress bars
- **Clipboard Integration**: Copy file URLs with polyfill support
- **File Type Validation**: Checks allowed file types
- **Size Limits**: Enforces maximum file size
- **Multiple Upload Methods**: Click, drag-drop, paste

#### Main Functions

**`copyToClipboard(text)`**
- Tries clipboard-polyfill first (HTTPS fallback)
- Falls back to modern Clipboard API
- Final fallback to `document.execCommand('copy')`
- Shows toast notification on success/failure

**`setupFileUpload()`**
- Initializes file input event listeners
- Sets up drag-and-drop zones
- Configures paste event handling

**`uploadFile(file)`**
- Validates file type and size
- Creates FormData and sends to server
- Tracks upload progress
- Shows upload status in UI
- Inserts file link on success

**`handleDrop(event)`**
- Processes drag-and-drop events
- Prevents default browser behavior
- Extracts files from DataTransfer
- Initiates upload for each file

#### Configuration

```javascript
// Set from server-side template
window.ENABLE_FILE_UPLOAD = true; // or false

// File upload enabled check
if (window.ENABLE_FILE_UPLOAD) {
    setupFileUpload();
}
```

---

### 6. Theme Switcher (`theme-switcher.js`)

**Purpose**: Theme management system with critical CSS optimization.

#### Features

- **6 Curated Themes**: Light, Mint, Ocean, Purple, Solarized, Sunset
- **Critical CSS**: Inline critical variables to prevent FOUC
- **Lazy Loading**: Full theme CSS loaded after page render
- **Persistence**: localStorage + cookie fallback
- **Auto Reload**: Page reloads after theme change for full effect
- **Event System**: Fires `themeChanged` event for other components

#### Available Themes

| Theme | Type | Description |
|-------|------|-------------|
| `light` | Light | Default light blue-purple theme |
| `mint` | Light | Fresh mint green theme |
| `ocean` | Light | Calm ocean blue theme |
| `purple` | Dark | Deep purple dark theme |
| `solarized` | Light | Solarized color scheme |
| `sunset` | Warm | Warm sunset orange theme |

#### Critical CSS Variables

Each theme defines critical CSS variables that are applied immediately:

```javascript
{
    '--surface-color': '#ffffff',
    '--text-color': '#0f172a',
    '--background-image': 'linear-gradient(...)'
}
```

#### API

**`window.setTheme(themeName)`**
- Changes current theme
- Saves to localStorage and cookie
- Applies critical CSS immediately
- Loads full theme CSS
- Reloads page after 120ms

**`window.getCurrentTheme()`**
- Returns current theme name
- Checks localStorage first, then cookie

**`window.availableThemes`**
- Array of available theme names
- `['light', 'mint', 'ocean', 'purple', 'solarized', 'sunset']`

#### Theme Event

```javascript
window.addEventListener('themeChanged', (event) => {
    console.log('New theme:', event.detail.theme);
    // React to theme change
});
```

#### Usage Example

```html
<select id="theme-selector">
    <option value="light">Light</option>
    <option value="ocean">Ocean</option>
    <option value="purple">Purple</option>
</select>

<script src="/static/js/theme-switcher.js"></script>
<script>
    const selector = document.getElementById('theme-selector');
    selector.value = window.getCurrentTheme();
    
    selector.addEventListener('change', (e) => {
        window.setTheme(e.target.value);
    });
</script>
```

---

### 7. UI Utilities (`ui.js`)

**Purpose**: Common UI utilities including toast notifications, modals, and textarea helpers.

#### Features

##### Toast Notification System

**Types**: `success`, `warning`, `danger`, `info`

**API:**
```javascript
// Simple message
window.showToast('Hello!');

// With type
window.showToast('success', 'Saved successfully!');

// With custom timeout (ms)
window.showToast('warning', 'Warning message', 6000);
```

**Features:**
- Auto-dismiss after 4 seconds (configurable)
- Smooth fade-in/fade-out animations
- Manual close button
- Stacks multiple toasts
- Prevents interaction during fade-out

##### Confirm/Prompt Modal

**API:**
```javascript
// Simple confirmation
const confirmed = await window.showConfirm('Delete this item?');
if (confirmed) {
    // User clicked OK
}

// With options
const confirmed = await window.showConfirm('Delete permanently?', {
    title: 'Confirm Delete',
    danger: true,              // Red confirm button
    confirmText: 'Delete',
    cancelText: 'Cancel'
});

// Input prompt
const username = await window.showConfirm('Enter username:', {
    input: true,
    title: 'Create User'
});
if (username !== false) {
    console.log('Username:', username);
}
```

##### Textarea Auto-Resize

**API:**
```javascript
const textarea = document.querySelector('textarea');
window.autoResizeTextarea(textarea);

// Or set up auto-resize on input
textarea.addEventListener('input', function() {
    window.autoResizeTextarea(this);
});
```

**Features:**
- Grows with content
- Respects min-height CSS property
- Smooth height transitions

---

### 8. Clipboard Polyfill (`clipboard-polyfill.js`)

**Purpose**: Cross-browser clipboard support for HTTP and HTTPS contexts.

#### Features

- Modern Clipboard API support (HTTPS)
- Fallback for HTTP contexts
- `execCommand` fallback for older browsers
- Used by uploads.js for file link copying

---

## SPA Components (static/spa/)

### 9. SPA Store (`store.js`)

**Purpose**: Centralized reactive state management for SPA.

#### State Structure

```javascript
const StellarisStore = {
    state: Vue.reactive({
        // User authentication
        user: {
            isAuthenticated: false,
            id: null,
            username: '',
            nickname: '',
            color: '',
            badge: '',
            isAdmin: false
        },
        
        // Theme
        theme: 'light',
        
        // Configuration
        config: {
            enableFileUpload: false
        },
        
        // UI state
        sidebarCollapsed: false,
        mobileSidebarOpen: false,
        
        // Chat
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
        
        // Loading
        isLoading: false,
        
        // Toasts
        toasts: []
    }),
    
    actions: {
        setUser(userData) { ... },
        updateTheme(theme) { ... },
        addToast(toast) { ... },
        removeToast(id) { ... },
        toggleSidebar() { ... },
        // ... more actions
    }
};
```

#### Usage

```javascript
// In Vue components
setup() {
    const store = StellarisStore.state;
    
    // Reactive access
    console.log(store.user.username);
    
    // Call actions
    StellarisStore.actions.updateTheme('ocean');
    
    return { store };
}
```

---

### 10. SPA Router (`router.js`)

**Purpose**: Hash-based client-side routing for SPA.

#### Features

- Hash-based navigation (`/#/path`)
- Query parameter support
- Navigation guards (beforeEach, afterEach)
- Programmatic navigation
- Route replace (no history entry)

#### API

**Route Registration:**
```javascript
StellarisRouter
    .register('/', HomeComponent)
    .register('/chat/:room_id', ChatComponent)
    .register('/forum', ForumComponent);
```

**Navigation:**
```javascript
// Navigate to route
StellarisRouter.navigate('/chat/1');

// With query params
StellarisRouter.navigate('/forum', { page: 2 });

// Replace (no history)
StellarisRouter.replace('/settings');

// Go back
StellarisRouter.back();
```

**Guards:**
```javascript
StellarisRouter.beforeEach = (to, from) => {
    // Check authentication
    if (to === '/admin' && !store.user.isAdmin) {
        StellarisRouter.navigate('/');
        return false;
    }
    return true;
};
```

---

### 11. SPA Pages (`pages.js`)

**Purpose**: Page-level Vue components for SPA routes.

#### Available Pages

- **HomePage**: Landing page with navigation cards
- **ChatPage**: Chat interface (Vue version)
- **ForumPage**: Forum thread list
- **SettingsPage**: User settings and profile
- **AdminPage**: Admin panel (admin only)
- **NotFoundPage**: 404 error page

---

### 12. SPA Components (`components.js`)

**Purpose**: Reusable Vue components for SPA.

#### Available Components

- **SidebarComponent**: Navigation sidebar
- **HeaderComponent**: Top navigation bar
- **ToastContainer**: Toast notification display
- **MessageList**: Chat message list
- **ThreadCard**: Forum thread preview card
- **UserBadge**: User badge display
- **LoadingSpinner**: Loading indicator

---

## 中文文档

### 概览

本文档为 Stellarsis 的所有前端组件提供详细文档。组件分为**传统 MPA 模块**（`static/js/`）和 **SPA 组件**（`static/spa/`）。

---

## 传统组件 (static/js/)

### 1. 聊天系统 (`chat.js`)

**用途**：基于 WebSocket 的实时聊天界面，支持消息渲染和在线用户跟踪。

#### 功能特性

- **WebSocket 连接**：基于 Socket.IO 的实时消息传递
- **消息渲染**：支持 Markdown、LaTeX、代码高亮
- **消息去重**：防止重复消息显示
- **历史分页**：滚动加载旧消息
- **在线用户跟踪**：实时在线用户列表与状态更新
- **关注系统**：关注/取消关注用户，颜色高亮显示
- **验证码支持**：防止快速发送消息的验证
- **输入指示器**：显示用户正在输入
- **文件上传**：支持图片和文件分享（如果启用）

#### 主要函数

**`initializeChat(roomIdParam, userIdParam)`**
- 使用房间和用户上下文初始化聊天系统
- 设置 WebSocket 连接
- 加载初始消息历史
- 绑定 UI 事件监听器

**`setupWebSocket()`**
- 创建到 `/chat` 命名空间的 Socket.IO 连接
- 注册消息、错误、在线状态的事件处理器
- 实现自动重连逻辑

**`handleNewMessage(data)`**
- 从 WebSocket 接收新消息
- 检查重复
- 使用正确的格式渲染消息
- 根据需要更新在线用户列表
- 如果在底部则自动滚动

**`sendMessage()`**
- 验证消息内容
- 通过 WebSocket 发送消息
- 将待发送消息添加到 UI
- 处理验证码挑战

**`loadMoreMessages()`**
- 加载以前的消息历史
- 支持分页（每页 30 条消息）
- 加载后保持滚动位置

---

### 2. 论坛系统 (`forum.js`)

**用途**：论坛帖子查看和回复功能，支持 Markdown 渲染。

#### 功能特性

- **帖子内容渲染**：Markdown、LaTeX、代码高亮
- **回复系统**：动态发布和渲染回复
- **自动调整文本框**：回复输入框随内容增长
- **实时回复添加**：无需刷新页面即可添加新回复
- **错误处理**：用户友好的错误消息

---

### 3. 命令面板 (`command-palette.js`)

**用途**：Bash 风格的键盘驱动命令系统，用于快速导航和操作。

#### 功能特性

- **Bash 风格界面**：冒号（`:`）打开，Enter 执行
- **命令历史**：使用 ↑/↓ 箭头导航（最后 50 条命令）
- **Tab 补全**：自动补全命令名称
- **模糊匹配**：智能命令建议
- **别名**：常用命令的简短别名（例如 `h` → `help`）
- **参数支持**：命令可以接受参数

#### 内置命令

| 命令 | 描述 | 别名 | 示例 |
|------|------|------|------|
| `help` | 显示所有命令 | `h`, `?` | `:help` |
| `history` | 显示命令历史 | - | `:history` |
| `clear` | 清除命令历史 | - | `:clear` |
| `theme` | 更改主题 | `t` | `:theme ocean` |
| `go` | 导航到页面 | `cd` | `:go home` |
| `focus` | 聚焦输入元素 | - | `:focus message` |
| `sidebar` | 切换侧边栏 | - | `:sidebar` |
| `refresh` | 重新加载页面 | `r` | `:refresh` |

---

### 4. 设置管理 (`settings.js`)

**用途**：用户设置页面，支持关注/取消关注功能。

---

### 5. 上传系统 (`uploads.js`)

**用途**：文件上传处理，支持进度跟踪和剪贴板集成。

---

### 6. 主题切换器 (`theme-switcher.js`)

**用途**：主题管理系统，支持关键 CSS 优化。

#### 可用主题

| 主题 | 类型 | 描述 |
|------|------|------|
| `light` | 浅色 | 默认浅蓝紫色主题 |
| `mint` | 浅色 | 清新薄荷绿主题 |
| `ocean` | 浅色 | 平静海洋蓝主题 |
| `purple` | 深色 | 深紫色深色主题 |
| `solarized` | 浅色 | Solarized 配色方案 |
| `sunset` | 暖色 | 温暖日落橙色主题 |

---

### 7. UI 工具 (`ui.js`)

**用途**：常用 UI 工具，包括 Toast 通知、模态框和文本框辅助功能。

#### Toast 通知系统

**类型**：`success`、`warning`、`danger`、`info`

**API：**
```javascript
// 简单消息
window.showToast('你好！');

// 带类型
window.showToast('success', '保存成功！');

// 自定义超时（毫秒）
window.showToast('warning', '警告消息', 6000);
```

---

## SPA 组件 (static/spa/)

### 9. SPA Store (`store.js`)

**用途**：SPA 的集中式响应式状态管理。

---

### 10. SPA 路由器 (`router.js`)

**用途**：SPA 的基于哈希的客户端路由。

---

## 相关文档 / Related Documentation

- [Architecture Overview / 架构概览](./ARCHITECTURE.md)
- [Theming Guide / 主题指南](./THEMING.md)
- [Command Palette / 命令面板](./COMMAND_PALETTE.md)
