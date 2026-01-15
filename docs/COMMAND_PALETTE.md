# 命令面板使用指南 / Command Palette Guide

本文档详细介绍 Stellarsis 命令面板的使用方法和 Bash 风格特性。

## 概览 / Overview

命令面板是一个 Bash 风格的快捷命令系统，提供键盘驱动的快速导航和操作界面。

**核心特性**:
- 🔑 按 `:` 键快速打开
- ⌨️ Bash 风格命令解析
- 🔄 命令别名支持
- ⏎ Tab 自动补全
- 💡 智能命令建议
- 🎯 参数提示和验证

---

## 快速开始

### 打开命令面板

在任何页面（非输入框焦点状态），按 `:` 键即可打开命令面板。

### 基本使用

1. 输入命令名称（如 `help`）
2. 按 Enter 执行
3. 按 Esc 关闭面板

### 示例

```
:help          # 显示所有可用命令
:theme ocean   # 切换到 ocean 主题
:focus message # 聚焦到消息输入框
:home          # 返回首页
```

---

## Bash 风格特性

### 1. 命令参数解析

命令面板使用空格分隔命令和参数，类似 Bash：

```
命令格式: <命令名> [参数1] [参数2] ...

示例:
:theme ocean        # 命令: theme, 参数: ["ocean"]
:focus message      # 命令: focus, 参数: ["message"]
```

**内部实现**:
```javascript
var parts = input.value.trim().split(/\s+/);
var cmdToken = parts[0];
var args = parts.slice(1);
```

### 2. 命令别名 (Aliases)

支持短命令别名，提高输入效率：

| 完整命令 | 别名 | 说明 |
|---------|------|------|
| `quit` | `q`, `ex`, `exit`, `close` | 关闭命令面板 |
| `forumlist` | `fl` | 论坛分区列表 |
| `chatlist` | `cl` | 聊天室列表 |
| `settings` | `st` | 设置页面 |
| `admin` | `adm` | 管理面板 |
| `home` | `h` | 首页 |

**注册别名示例**:
```javascript
registerCommand('close', '关闭命令面板', handler, {
    aliases: ['ex', 'quit', 'q']
});
```

### 3. Tab 自动补全

输入命令前缀后按 Tab 键自动补全：

```
输入: :th<Tab>
补全: :theme 

输入: :f<Tab>
显示: focus, forumlist (多个匹配时显示列表)
```

**补全逻辑**:
```javascript
var matches = Object.keys(commands).filter(function (k) {
    return k.indexOf(prefix) === 0;
});

if (matches.length === 1) {
    input.value = matches[0] + ' ';  // 自动补全并添加空格
} else if (matches.length > 1) {
    // 显示所有匹配项供选择
}
```

### 4. 智能命令建议

输入命令时，面板自动显示相关建议：

- **无输入时**: 显示所有可用命令
- **部分输入时**: 显示前缀匹配的命令
- **命令后无参数时**: 显示可用参数列表

**示例**:
```
输入: :theme
显示: light, mint, ocean, purple, solarized, sunset

输入: :focus
显示: message, chat, search, admin-search
```

### 5. 参数提示

某些命令输入后会自动显示可用参数：

```javascript
// theme 命令的参数提示
if (resolved === 'theme' && args.length === 0) {
    getAvailableThemes().forEach(function (t) {
        suggestions.appendChild(renderSuggestionItem(
            t, '主题', function () {
                input.value = 'theme ' + t;
                execute('theme', [t]);
            }
        ));
    });
}
```

### 6. 命令执行

命令支持同步和异步执行（Promise-based）：

```javascript
registerCommand('async-example', '异步示例', function (args) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('操作完成');
        }, 1000);
    });
});
```

---

## 内置命令参考

### 基础命令

#### help
显示所有可用命令列表。

```
:help
```

**输出**: 所有命令及其描述的列表。

#### close / exit / quit / q
关闭命令面板。

```
:close
:exit
:quit
:q
```

**别名**: `close`, `exit`, `quit`, `q`, `ex`

---

### 导航命令

#### home / h
返回首页。

```
:home
:h
```

**效果**: 跳转到 `/`

#### chatlist / cl
打开聊天室列表页面。

```
:chatlist
:cl
```

**效果**: 跳转到 `/chat`

#### forumlist / fl
打开论坛分区列表页面。

```
:forumlist
:fl
```

**效果**: 跳转到 `/forum`

#### settings / st
打开设置页面。

```
:settings
:st
```

**效果**: 跳转到 `/settings`

#### admin / adm
打开管理面板（需管理员权限）。

```
:admin
:adm
```

**效果**: 跳转到 `/admin/index`

---

### 功能命令

#### theme / tm
切换主题。

```
:theme <主题名>
:tm <主题名>
```

**可用主题**:
- `light` - 亮色主题
- `mint` - 薄荷主题
- `ocean` - 海洋主题
- `purple` - 紫色主题
- `solarized` - Solarized 主题
- `sunset` - 日落主题

**示例**:
```
:theme ocean
:tm purple
```

**无参数时**: 显示所有可用主题列表供选择。

#### focus
聚焦到指定元素。

```
:focus <目标>
```

**可用目标**:
- `message` - 消息输入框（聊天室）
- `chat` - 聊天输入框（别名）
- `search` - 搜索输入框
- `admin-search` - 管理页面搜索框

**示例**:
```
:focus message
:focus search
```

**无参数时**: 显示所有可用目标列表。

**实现**:
```javascript
var focusTargets = {
    message: '#message-text',
    chat: '#message-text',
    search: '#searchInput',
    'admin-search': '#searchInput'
};

var el = document.querySelector(focusTargets[target]);
el.focus();
```

---

## 扩展命令面板

### 注册自定义命令

命令面板提供了公开 API，可以在页面中注册自定义命令：

```javascript
// 注册简单命令
window.commandPalette.registerCommand(
    'hello',                          // 命令名
    '打招呼',                          // 描述
    function (args) {                 // 处理函数
        return Promise.resolve('Hello, World!');
    }
);

// 注册带别名的命令
window.commandPalette.registerCommand(
    'goto-profile',
    '跳转到个人资料',
    function (args) {
        window.location.href = '/profile';
        return Promise.resolve('跳转中...');
    },
    { aliases: ['gp', 'profile'] }    // 别名
);

// 注册带参数的命令
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

### API 方法

#### registerCommand(name, desc, handler, opts)

注册新命令。

**参数**:
- `name` (String): 命令名称
- `desc` (String): 命令描述
- `handler` (Function): 命令处理函数，接收参数数组，返回 Promise
- `opts` (Object, 可选): 选项对象
  - `aliases` (Array): 命令别名列表

**示例**:
```javascript
registerCommand('mycommand', '我的命令', function (args) {
    console.log('参数:', args);
    return Promise.resolve('执行成功');
}, { aliases: ['mc', 'mycmd'] });
```

#### show()

手动显示命令面板。

```javascript
window.commandPalette.show();
```

#### hide()

手动隐藏命令面板。

```javascript
window.commandPalette.hide();
```

#### listCommands()

获取所有已注册命令的名称列表。

```javascript
var commands = window.commandPalette.listCommands();
console.log(commands);  // ['help', 'theme', 'close', ...]
```

#### resolveCommand(nameOrAlias)

解析命令别名，返回实际命令名。

```javascript
var actual = window.commandPalette.resolveCommand('q');
console.log(actual);  // 'quit'

var actual2 = window.commandPalette.resolveCommand('theme');
console.log(actual2);  // 'theme'
```

---

## 高级用法

### 条件命令

根据用户角色或页面状态注册不同命令：

```javascript
// 仅管理员可用的命令
if (userRole === 'admin') {
    window.commandPalette.registerCommand(
        'reboot',
        '重启服务器（管理员）',
        function (args) {
            if (confirm('确定要重启服务器吗？')) {
                fetch('/api/admin/restart', { method: 'POST' });
                return Promise.resolve('重启中...');
            }
            return Promise.reject('已取消');
        }
    );
}

// 仅聊天室页面可用的命令
if (window.location.pathname.startsWith('/chat/')) {
    window.commandPalette.registerCommand(
        'clear',
        '清空聊天记录（本地）',
        function (args) {
            document.querySelector('#messages').innerHTML = '';
            return Promise.resolve('已清空');
        }
    );
}
```

### 异步命令

命令处理函数可以返回 Promise 执行异步操作：

```javascript
window.commandPalette.registerCommand(
    'fetch-data',
    '获取数据',
    function (args) {
        return fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                console.log(data);
                return '数据已加载';
            })
            .catch(err => {
                throw '加载失败: ' + err.message;
            });
    }
);
```

### 动态参数建议

根据当前状态提供动态参数建议：

```javascript
// 在 command-palette.js 的 updateSuggestions 中添加逻辑
if (cmdToken === 'join-room') {
    // 获取可用房间列表
    fetch('/api/chat/rooms').then(res => res.json()).then(rooms => {
        rooms.forEach(room => {
            suggestions.appendChild(renderSuggestionItem(
                room.name,
                '房间 #' + room.id,
                function () {
                    execute('join-room', [room.id]);
                }
            ));
        });
    });
}
```

---

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `:` | 打开命令面板（非输入框焦点时） |
| `Esc` | 关闭命令面板 |
| `Tab` | 命令补全 |
| `Enter` | 执行命令 |
| `↑` / `↓` | 选择建议项（可扩展） |

---

## 样式自定义

命令面板的样式在 `static/css/main.css` 中定义：

```css
#command-palette-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    justify-content: center;
    align-items: center;
}

#command-palette-overlay.show {
    display: flex;
}

.cp-input {
    width: 500px;
    padding: 10px;
    font-size: 18px;
    border: 2px solid #007bff;
    border-radius: 5px;
}

.cp-suggestions {
    max-height: 300px;
    overflow-y: auto;
    background: white;
    border-radius: 5px;
    margin-top: 10px;
}

.cp-suggestion {
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
}

.cp-suggestion:hover {
    background: #f0f0f0;
}
```

---

## 最佳实践

### 1. 命令命名规范

- 使用小写字母
- 使用短横线分隔多个单词（如 `goto-profile`）
- 保持命令名简洁直观

### 2. 别名设计

- 为常用命令提供单字母别名（如 `q` → `quit`）
- 别名要直观易记
- 避免别名冲突

### 3. 参数验证

- 在处理函数中验证参数
- 提供清晰的错误消息
- 使用 Promise.reject 返回错误

```javascript
registerCommand('example', '示例命令', function (args) {
    if (args.length === 0) {
        return Promise.reject('缺少必需参数');
    }
    if (!/^\d+$/.test(args[0])) {
        return Promise.reject('参数必须为数字');
    }
    // 执行逻辑
    return Promise.resolve('成功');
});
```

### 4. 用户反馈

- 使用 Promise.resolve 返回成功消息
- 使用 Promise.reject 返回错误消息
- 提供清晰的执行结果反馈

---

## 常见问题

### 1. 为什么按 `:` 没反应？

确保当前没有输入框处于焦点状态。命令面板只在非输入框焦点时响应 `:` 键。

### 2. 如何禁用某个命令？

暂不支持直接禁用命令，但可以在处理函数中添加条件检查：

```javascript
registerCommand('restricted', '受限命令', function (args) {
    if (!userHasPermission) {
        return Promise.reject('无权限执行此命令');
    }
    // 执行逻辑
});
```

### 3. 如何添加历史记录功能？

可以扩展命令面板代码，添加命令历史：

```javascript
var commandHistory = [];
var historyIndex = -1;

input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
        // 上一条命令
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        // 下一条命令
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        }
    }
});

// 执行命令后添加到历史
function execute(name, args) {
    var cmd = input.value.trim();
    if (cmd && commandHistory[commandHistory.length - 1] !== cmd) {
        commandHistory.push(cmd);
    }
    historyIndex = -1;
    // 执行逻辑...
}
```

---

## 参考资料

- **源代码**: `static/js/command-palette.js`
- **主题切换**: `static/js/theme-switcher.js`
- **UI 工具**: `static/js/ui.js`

---

**文档版本**: 1.0  
**最后更新**: 2026-01-15
