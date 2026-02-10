# Command Palette Guide / 命令面板使用指南

> **English** | [中文](#中文文档)

## English Documentation

### Overview

The Command Palette is a **keyboard-driven quick command system** that provides fast navigation and operations across both Traditional MPA and Modern SPA versions of Stellarsis. It features a Bash-style interface with command history, tab completion, and fuzzy search.

**Core Features:**
- 🔑 **Quick Access**: Press `:` to open (when not focused on input)
- ⌨️ **Bash-Style Interface**: Command parsing with parameters (Traditional)
- 🔍 **Fuzzy Search**: Smart command matching (SPA)
- 🔄 **Command Aliases**: Shortcuts for common commands
- ⏎ **Tab Completion**: Auto-complete command names
- 📜 **Command History**: Navigate with ↑/↓ arrows (Traditional) or view recent (SPA)
- 💡 **Context-Aware**: Different commands based on current page (SPA)

---

## Quick Start

### Opening the Command Palette

**On any page** (when not focused on an input field), press the **colon key** (`:`).

### Basic Usage

1. **Type** a command name (e.g., `help`)
2. **Press Enter** to execute
3. **Press Tab** for auto-completion
4. **Press Esc** to close the palette

### Examples

```bash
# Traditional MPA
:help              # Show all available commands
:theme ocean       # Switch to ocean theme
:focus message     # Focus message input
:cd /chat          # Navigate to chat list

# SPA
:help              # Show categorized command list
:go chat           # Navigate to chat list
:theme toggle      # Toggle theme
:sidebar toggle    # Toggle sidebar
```

---

## Traditional MPA Mode

The Traditional version (`/chat`, `/forum`, etc.) features a **Bash-style command interface** with advanced features.

### Bash-Style Features

#### 1. Command Parameter Parsing

Commands and parameters are separated by spaces, like Bash:

```bash
# Format: <command> [arg1] [arg2] ...

:theme ocean        # Command: theme, Args: ["ocean"]
:focus message      # Command: focus, Args: ["message"]
:cd /chat          # Command: cd, Args: ["/chat"]
```

**Internal Implementation:**
```javascript
var parts = input.value.trim().split(/\s+/);
var cmdToken = parts[0];
var args = parts.slice(1);
```

#### 2. Command Aliases

Short aliases for improved typing efficiency:

| Full Command | Aliases | Description |
|--------------|---------|-------------|
| `quit` | `q`, `ex`, `exit`, `close` | Close command palette |
| `history` | `hist` | Show command history |
| `theme` | `tm` | Change theme |
| `home` | `h` | Go to home page |

**Registering Aliases:**
```javascript
registerCommand('close', 'Close palette', handler, {
    aliases: ['ex', 'quit', 'q']
});
```

#### 3. Command History Navigation

Navigate through your command history using **↑** (up) and **↓** (down) arrow keys:

```bash
# Press ↑ to go back in history
# Press ↓ to go forward in history
# History stores last 50 commands
```

**Implementation:**
```javascript
commandHistory = ['theme ocean', 'cd /chat', 'help'];
historyIndex = -1;

// On ↑ key: historyIndex++
// On ↓ key: historyIndex--
```

#### 4. Bash-Style Navigation (`cd` Command)

Navigate pages like changing directories in Bash:

```bash
:cd /chat      # Go to chat room list
:cd /forum     # Go to forum section list
:cd /settings  # Go to settings page
:cd /admin     # Go to admin panel
:cd ~          # Go to home page
:cd /          # Go to home page
:cd            # Show all available directories
```

**Available Directories:**
- `/` or `~` - Home page
- `/chat` - Chat room list
- `/forum` - Forum section list
- `/settings` - Settings page
- `/admin` - Admin panel

#### 5. Bash Standard Commands

| Command | Description | Example |
|---------|-------------|---------|
| `ls` | List all available directories | `:ls` |
| `pwd` | Show current page path | `:pwd` |
| `clear` | Clear command output | `:clear` |
| `history` / `hist` | Show command history | `:history` |

#### 6. Tab Auto-Completion

Press **Tab** after typing a command prefix:

```bash
Input: :th<Tab>
Result: :theme 

Input: :f<Tab>
Result: Shows list: focus, forumlist (multiple matches)
```

**Completion Logic:**
```javascript
var matches = Object.keys(commands).filter(function (k) {
    return k.indexOf(prefix) === 0;
});

if (matches.length === 1) {
    // Auto-complete and add space
    input.value = matches[0] + ' ';
} else if (matches.length > 1) {
    // Show all matches
}
```

#### 7. Fuzzy Matching

Supports fuzzy pattern matching for better suggestions:

```javascript
function fuzzyMatch(pattern, text) {
    pattern = pattern.toLowerCase();
    text = text.toLowerCase();
    var patternIdx = 0, textIdx = 0;
    
    while (patternIdx < pattern.length && textIdx < text.length) {
        if (pattern[patternIdx] === text[textIdx]) {
            patternIdx++;
        }
        textIdx++;
    }
    
    return patternIdx === pattern.length;
}
```

### Traditional MPA Commands

#### Basic Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `help` | `h`, `?` | Show all available commands |
| `history` | `hist` | Show last 10 commands |
| `clear` | - | Clear command output |
| `close` | `quit`, `q`, `exit`, `ex` | Close command palette |

#### Navigation (Bash-Style)

| Command | Arguments | Description |
|---------|-----------|-------------|
| `cd` | `<directory>` | Change to directory/page |
| `ls` | - | List all directories |
| `pwd` | - | Show current path |

#### Theme Commands

| Command | Aliases | Arguments | Description |
|---------|---------|-----------|-------------|
| `theme` | `tm` | `<theme>` | Switch theme |

**Available Themes:**
- `light` - Light blue-purple theme
- `mint` - Fresh mint green theme
- `ocean` - Calm ocean blue theme
- `purple` - Deep purple dark theme
- `solarized` - Solarized color scheme
- `sunset` - Warm sunset theme

**Usage:**
```bash
:theme ocean
:tm purple
:theme          # Show all themes
```

#### Focus Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `focus` | `<target>` | Focus on element |

**Available Targets:**
- `message` / `chat` - Message input (chat room)
- `search` - Search input
- `admin-search` - Admin page search

**Usage:**
```bash
:focus message
:focus search
:focus          # Show all targets
```

### Extending Traditional Command Palette

#### Register Custom Commands

The command palette provides a public API for registering custom commands:

```javascript
// Simple command
window.commandPalette.registerCommand(
    'hello',                          // Command name
    'Say hello',                      // Description
    function (args) {                 // Handler function
        return Promise.resolve('Hello, World!');
    }
);

// Command with aliases
window.commandPalette.registerCommand(
    'goto-profile',
    'Go to profile page',
    function (args) {
        window.location.href = '/profile';
        return Promise.resolve('Navigating...');
    },
    { aliases: ['gp', 'profile'] }    // Aliases
);

// Command with parameters
window.commandPalette.registerCommand(
    'search',
    'Search: search <query>',
    function (args) {
        var query = args[0];
        if (!query) {
            return Promise.reject('Please provide search query');
        }
        window.location.href = '/search?q=' + encodeURIComponent(query);
        return Promise.resolve('Searching: ' + query);
    }
);
```

#### API Methods

**`window.commandPalette.registerCommand(name, desc, handler, opts)`**
- `name` (string): Command name
- `desc` (string): Description shown in help
- `handler` (function): Handler function, receives `args` array
- `opts` (object, optional): Options object
  - `aliases` (array): Array of alias strings

**Handler Return Values:**
- **String**: Display as success message
- **Promise**: For async commands
- **Object with `type: 'help'`**: Display formatted help
- **Error/Reject**: Display as error message

**`window.commandPalette.show()`**
- Programmatically show the command palette

**`window.commandPalette.hide()`**
- Programmatically hide the command palette

**`window.commandPalette.execute(commandString)`**
- Execute a command string programmatically
- Example: `window.commandPalette.execute('theme ocean')`

---

## SPA Mode

The SPA version (`/spa`) features a **modern fuzzy search interface** with context-aware commands.

### SPA Features

#### 1. Fuzzy Search

Type partial command names to find matches:

```bash
Input: go   -> Matches: go home, go chat, go forum, go settings, go admin
Input: th   -> Matches: theme light, theme dark, theme toggle
Input: foc  -> Matches: focus message, focus search, focus reply
```

#### 2. Tab Auto-Completion

- **Single match**: Auto-completes full command
- **Multiple matches**: Completes common prefix

#### 3. Command History

Recently executed commands appear at the top of the list (max 5 shown).

#### 4. Complete Help View

Type `help` and press Enter to see a **categorized full command list**. Click any command to execute it directly.

#### 5. Context-Aware Commands

Different commands appear based on current page:

**Chat Room Page (`/chat/:id`):**
- `send` - Send message (focus input)
- `scroll bottom` - Scroll to bottom
- `scroll top` - Scroll to top
- `load more` - Load more messages

**Forum Thread Page (`/forum/thread/:id`):**
- `reply` - Focus reply input
- `submit reply` - Submit reply

**Forum Section Page (`/forum/:id`):**
- `new thread` - Create new thread

**Settings Page (`/settings`):**
- `profile` - Go to profile settings
- `password` - Go to change password
- `logout` - Log out

### SPA Commands

#### Information & Help

| Command | Description |
|---------|-------------|
| `help` | Show all commands (categorized) |
| `pwd` | Show current page path |

#### Navigation

| Command | Description |
|---------|-------------|
| `go home` | Go to home page |
| `go chat` | Go to chat room list |
| `go forum` | Go to forum section list |
| `go settings` | Go to settings (login required) |
| `go admin` | Go to admin panel (admin only) |
| `back` | Go back to previous page |

#### Theming

| Command | Description |
|---------|-------------|
| `theme light` | Switch to light theme |
| `theme dark` | Switch to dark theme |
| `theme toggle` | Toggle between themes |

#### Focus

| Command | Description |
|---------|-------------|
| `focus message` | Focus message input |
| `focus search` | Focus search input |
| `focus reply` | Focus reply input |

#### Interface

| Command | Description |
|---------|-------------|
| `sidebar toggle` | Toggle sidebar collapsed state |
| `sidebar show` | Expand sidebar |
| `sidebar hide` | Collapse sidebar |

#### Actions

| Command | Description |
|---------|-------------|
| `refresh` | Refresh current page data |
| `reload` | Reload page |

#### System

| Command | Description |
|---------|-------------|
| `exit` | Close command palette |
| `close` | Close command palette |
| `quit` | Close command palette |

### Keyboard Shortcuts (Both Modes)

| Shortcut | Function |
|----------|----------|
| `:` | Open command palette (when not focused on input) |
| `Esc` | Close command palette or help view |
| `Tab` | Command completion |
| `Enter` | Execute command |
| `↑` / `↓` | Navigate history (Traditional only) |

### Permissions

- Some commands require login (e.g., `go settings`)
- Admin commands require admin privileges (e.g., `go admin`)
- Unauthorized commands won't appear in the list

---

## 中文文档

### 概览

命令面板是一个**键盘驱动的快捷命令系统**，在 Stellarsis 的传统 MPA 和现代 SPA 版本中都提供快速导航和操作。它具有 Bash 风格界面，支持命令历史、Tab 补全和模糊搜索。

**核心特性：**
- 🔑 **快速访问**：按 `:` 打开（非输入框焦点时）
- ⌨️ **Bash 风格界面**：命令解析带参数（传统版）
- 🔍 **模糊搜索**：智能命令匹配（SPA）
- 🔄 **命令别名**：常用命令的快捷方式
- ⏎ **Tab 补全**：自动补全命令名称
- 📜 **命令历史**：使用 ↑/↓ 箭头导航（传统版）或查看最近命令（SPA）
- 💡 **上下文感知**：根据当前页面显示不同命令（SPA）

---

## 快速开始

### 打开命令面板

**在任何页面**（非输入框焦点状态），按**冒号键**（`:`）。

### 基本使用

1. **输入**命令名称（如 `help`）
2. **按 Enter** 执行
3. **按 Tab** 自动补全
4. **按 Esc** 关闭面板

### 示例

```bash
# 传统 MPA
:help              # 显示所有可用命令
:theme ocean       # 切换到 ocean 主题
:focus message     # 聚焦消息输入框
:cd /chat          # 导航到聊天列表

# SPA
:help              # 显示分类命令列表
:go chat           # 导航到聊天列表
:theme toggle      # 切换主题
:sidebar toggle    # 切换侧边栏
```

---

## 传统 MPA 模式

传统版本（`/chat`、`/forum` 等）具有**Bash 风格命令界面**和高级功能。

### Bash 风格特性

#### 1. 命令参数解析

命令和参数用空格分隔，类似 Bash：

```bash
# 格式: <命令> [参数1] [参数2] ...

:theme ocean        # 命令: theme, 参数: ["ocean"]
:focus message      # 命令: focus, 参数: ["message"]
:cd /chat          # 命令: cd, 参数: ["/chat"]
```

#### 2. 命令别名

短命令别名，提高输入效率：

| 完整命令 | 别名 | 说明 |
|---------|------|------|
| `quit` | `q`, `ex`, `exit`, `close` | 关闭命令面板 |
| `history` | `hist` | 显示命令历史 |
| `theme` | `tm` | 更改主题 |
| `home` | `h` | 前往首页 |

#### 3. 命令历史导航

使用 **↑**（上）和 **↓**（下）箭头键浏览命令历史：

```bash
# 按 ↑ 返回历史
# 按 ↓ 前进历史
# 历史存储最后 50 条命令
```

#### 4. Bash 风格导航（`cd` 命令）

像在 Bash 中切换目录一样导航页面：

```bash
:cd /chat      # 前往聊天室列表
:cd /forum     # 前往论坛分区列表
:cd /settings  # 前往设置页面
:cd /admin     # 前往管理面板
:cd ~          # 前往首页
:cd /          # 前往首页
:cd            # 显示所有可用目录
```

**可用目录：**
- `/` 或 `~` - 首页
- `/chat` - 聊天室列表
- `/forum` - 论坛分区列表
- `/settings` - 设置页面
- `/admin` - 管理面板

#### 5. Bash 标准命令

| 命令 | 描述 | 示例 |
|------|------|------|
| `ls` | 列出所有可用目录 | `:ls` |
| `pwd` | 显示当前页面路径 | `:pwd` |
| `clear` | 清空命令输出 | `:clear` |
| `history` / `hist` | 显示命令历史 | `:history` |

#### 6. Tab 自动补全

输入命令前缀后按 **Tab** 键：

```bash
输入: :th<Tab>
结果: :theme 

输入: :f<Tab>
结果: 显示列表: focus, forumlist (多个匹配)
```

### 传统 MPA 命令

#### 基础命令

| 命令 | 别名 | 描述 |
|------|------|------|
| `help` | `h`, `?` | 显示所有可用命令 |
| `history` | `hist` | 显示最后 10 条命令 |
| `clear` | - | 清空命令输出 |
| `close` | `quit`, `q`, `exit`, `ex` | 关闭命令面板 |

#### 导航（Bash 风格）

| 命令 | 参数 | 描述 |
|------|------|------|
| `cd` | `<目录>` | 切换到目录/页面 |
| `ls` | - | 列出所有目录 |
| `pwd` | - | 显示当前路径 |

#### 主题命令

| 命令 | 别名 | 参数 | 描述 |
|------|------|------|------|
| `theme` | `tm` | `<主题>` | 切换主题 |

**可用主题：**
- `light` - 浅蓝紫色主题
- `mint` - 清新薄荷绿主题
- `ocean` - 平静海洋蓝主题
- `purple` - 深紫色深色主题
- `solarized` - Solarized 配色方案
- `sunset` - 温暖日落主题

**用法：**
```bash
:theme ocean
:tm purple
:theme          # 显示所有主题
```

#### 焦点命令

| 命令 | 参数 | 描述 |
|------|------|------|
| `focus` | `<目标>` | 聚焦元素 |

**可用目标：**
- `message` / `chat` - 消息输入框（聊天室）
- `search` - 搜索输入框
- `admin-search` - 管理页面搜索框

**用法：**
```bash
:focus message
:focus search
:focus          # 显示所有目标
```

### 扩展传统命令面板

#### 注册自定义命令

命令面板提供了注册自定义命令的公开 API：

```javascript
// 简单命令
window.commandPalette.registerCommand(
    'hello',                          // 命令名
    '打招呼',                          // 描述
    function (args) {                 // 处理函数
        return Promise.resolve('你好，世界！');
    }
);

// 带别名的命令
window.commandPalette.registerCommand(
    'goto-profile',
    '前往个人资料',
    function (args) {
        window.location.href = '/profile';
        return Promise.resolve('正在跳转...');
    },
    { aliases: ['gp', 'profile'] }    // 别名
);

// 带参数的命令
window.commandPalette.registerCommand(
    'search',
    '搜索: search <关键词>',
    function (args) {
        var query = args[0];
        if (!query) {
            return Promise.reject('请提供搜索关键词');
        }
        window.location.href = '/search?q=' + encodeURIComponent(query);
        return Promise.resolve('搜索: ' + query);
    }
);
```

---

## SPA 模式

SPA 版本（`/spa`）具有**现代模糊搜索界面**和上下文感知命令。

### SPA 功能特性

#### 1. 模糊搜索

输入部分命令名称即可找到匹配：

```bash
输入: go   -> 匹配: go home, go chat, go forum, go settings, go admin
输入: th   -> 匹配: theme light, theme dark, theme toggle
输入: foc  -> 匹配: focus message, focus search, focus reply
```

#### 2. Tab 自动补全

- **单个匹配**：自动补全完整命令
- **多个匹配**：补全公共前缀

#### 3. 命令历史

最近执行的命令显示在列表顶部（最多显示 5 条）。

#### 4. 完整帮助视图

输入 `help` 并按 Enter，查看**分类的完整命令列表**。点击任意命令可直接执行。

#### 5. 上下文感知命令

根据当前页面显示不同命令：

**聊天室页面（`/chat/:id`）：**
- `send` - 发送消息（聚焦输入框）
- `scroll bottom` - 滚动到底部
- `scroll top` - 滚动到顶部
- `load more` - 加载更多消息

**论坛帖子页面（`/forum/thread/:id`）：**
- `reply` - 聚焦回复输入框
- `submit reply` - 提交回复

**论坛分区页面（`/forum/:id`）：**
- `new thread` - 创建新帖子

**设置页面（`/settings`）：**
- `profile` - 前往个人资料设置
- `password` - 前往修改密码
- `logout` - 退出登录

### SPA 命令

#### 信息与帮助

| 命令 | 描述 |
|------|------|
| `help` | 显示所有命令（分类） |
| `pwd` | 显示当前页面路径 |

#### 导航

| 命令 | 描述 |
|------|------|
| `go home` | 前往首页 |
| `go chat` | 前往聊天室列表 |
| `go forum` | 前往论坛分区列表 |
| `go settings` | 前往设置（需登录） |
| `go admin` | 前往管理面板（需管理员） |
| `back` | 返回上一页 |

#### 主题

| 命令 | 描述 |
|------|------|
| `theme light` | 切换到浅色主题 |
| `theme dark` | 切换到深色主题 |
| `theme toggle` | 切换主题 |

#### 焦点

| 命令 | 描述 |
|------|------|
| `focus message` | 聚焦消息输入框 |
| `focus search` | 聚焦搜索框 |
| `focus reply` | 聚焦回复框 |

#### 界面

| 命令 | 描述 |
|------|------|
| `sidebar toggle` | 切换侧边栏折叠状态 |
| `sidebar show` | 展开侧边栏 |
| `sidebar hide` | 折叠侧边栏 |

#### 操作

| 命令 | 描述 |
|------|------|
| `refresh` | 刷新当前页面数据 |
| `reload` | 重新加载页面 |

#### 系统

| 命令 | 描述 |
|------|------|
| `exit` | 关闭命令面板 |
| `close` | 关闭命令面板 |
| `quit` | 关闭命令面板 |

### 键盘快捷键（两种模式）

| 快捷键 | 功能 |
|--------|------|
| `:` | 打开命令面板（非输入框焦点时） |
| `Esc` | 关闭命令面板或帮助视图 |
| `Tab` | 命令补全 |
| `Enter` | 执行命令 |
| `↑` / `↓` | 导航历史（仅传统版） |

### 权限说明

- 部分命令需要登录（如 `go settings`）
- 管理员命令需要管理员权限（如 `go admin`）
- 未授权的命令不会显示在列表中

---

## Related Documentation / 相关文档

- [Architecture Overview / 架构概览](./ARCHITECTURE.md)
- [Components Guide / 组件指南](./COMPONENTS.md)
- [Theming Guide / 主题指南](./THEMING.md)
