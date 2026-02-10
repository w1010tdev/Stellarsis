# Stellarsis 贡献指南 / Contributing Guide

[English](#english-version) | [中文](#中文版本)

---

## 中文版本

### 欢迎参与贡献！

感谢你有兴趣为 Stellarsis 做出贡献！本指南将帮助你了解如何参与项目开发、提交代码、报告问题等。

我们欢迎各种形式的贡献，包括但不限于：
- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🎨 优化界面设计
- 🔧 修复问题
- ✨ 实现新功能
- 🌐 翻译文档

---

### 行为准则

参与本项目即表示你同意遵守我们的 [行为准则](../../CODE_OF_CONDUCT.md)。请对所有参与者保持尊重和友善。

**核心原则**：
- 尊重不同观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

---

### 开始之前

#### 1. 了解项目

在开始贡献之前，建议你：

- **阅读 README**：了解项目概况和功能
  - [README.md](../../README.md)
  
- **查看现有文档**：
  - [快速入门指南](QUICK_START.md)
  - [部署指南](DEPLOYMENT.md)
  - [API 文档](../ROUTES_AND_WEBSOCKETS.md)
  - [数据库架构](../DATABASE_SCHEMA.md)
  - [权限系统](../PERMISSION_SYSTEM.md)

- **浏览现有 Issue 和 PR**：
  - [Issues](https://github.com/w1010tdev/Stellarsis/issues)
  - [Pull Requests](https://github.com/w1010tdev/Stellarsis/pulls)

- **运行项目**：在本地成功运行并熟悉功能

#### 2. 设置开发环境

参考 [快速入门指南](QUICK_START.md) 设置本地开发环境。

**开发工具推荐**：
- **IDE**: VS Code, PyCharm, Sublime Text
- **Git GUI**: GitHub Desktop, GitKraken, SourceTree
- **数据库工具**: DB Browser for SQLite, pgAdmin, DBeaver
- **API 测试**: Postman, Insomnia, curl

**VS Code 推荐扩展**：
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "streetsidesoftware.code-spell-checker",
    "eamodio.gitlens",
    "dbaeumer.vscode-eslint"
  ]
}
```

---

### 开发流程

#### 1. Fork 和 Clone 仓库

```bash
# Fork 仓库到你的 GitHub 账户（通过 GitHub 网页操作）

# Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/Stellarsis.git
cd Stellarsis

# 添加上游仓库
git remote add upstream https://github.com/w1010tdev/Stellarsis.git

# 验证远程仓库
git remote -v
```

#### 2. 创建分支

**分支命名规范**：

- `feature/功能名称` - 新功能
- `fix/问题描述` - Bug 修复
- `docs/文档主题` - 文档更新
- `refactor/重构内容` - 代码重构
- `style/样式调整` - UI/CSS 调整
- `test/测试内容` - 测试相关

**示例**：

```bash
# 从最新的 main 分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/user-profile-page

# 或修复 Bug
git checkout -b fix/chat-message-timestamp
```

#### 3. 进行开发

在你的分支上进行修改：

```bash
# 查看修改状态
git status

# 查看具体改动
git diff

# 添加文件到暂存区
git add app.py
git add static/js/chat.js

# 或添加所有修改
git add .

# 提交更改
git commit -m "feat: add user profile page"
```

**开发建议**：
- 保持提交粒度合理（每个提交完成一个小功能或修复）
- 经常提交，避免一次性提交大量代码
- 确保代码在提交前能正常运行
- 遵循代码风格指南（见下文）

#### 4. 保持同步

定期同步上游仓库的更新：

```bash
# 获取上游更新
git fetch upstream

# 合并到你的分支
git merge upstream/main

# 或使用 rebase（保持提交历史整洁）
git rebase upstream/main
```

#### 5. 推送到你的 Fork

```bash
# 推送到你的 GitHub fork
git push origin feature/user-profile-page

# 如果使用了 rebase，可能需要强制推送
git push --force-with-lease origin feature/user-profile-page
```

#### 6. 创建 Pull Request

1. 访问你的 GitHub fork 页面
2. 点击 "Compare & pull request" 按钮
3. 填写 PR 标题和描述（见下文模板）
4. 等待代码审查

---

### Pull Request 流程

#### PR 标题格式

使用约定式提交（Conventional Commits）格式：

```
<type>(<scope>): <subject>

类型(范围): 简短描述
```

**类型（type）**：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**范围（scope）**（可选）：
- `chat`: 聊天功能
- `forum`: 论坛功能
- `auth`: 认证系统
- `admin`: 管理面板
- `ui`: 用户界面
- `db`: 数据库
- `api`: API 接口

**示例**：
- `feat(chat): add message edit functionality`
- `fix(forum): resolve thread pagination issue`
- `docs: update deployment guide for Docker`
- `style(ui): improve mobile responsiveness`

#### PR 描述模板

```markdown
## 描述 / Description

简要说明这个 PR 的目的和改动内容。

## 改动类型 / Type of Change

- [ ] 🐛 Bug 修复 (Bug fix)
- [ ] ✨ 新功能 (New feature)
- [ ] 💥 破坏性改动 (Breaking change)
- [ ] 📝 文档更新 (Documentation update)
- [ ] 🎨 样式调整 (Style/UI improvement)
- [ ] ♻️ 代码重构 (Code refactoring)
- [ ] ⚡️ 性能优化 (Performance improvement)
- [ ] ✅ 测试相关 (Test)

## 相关 Issue / Related Issues

Closes #123
Fixes #456

## 改动说明 / Changes Made

- 添加了用户个人资料页面
- 重构了聊天消息渲染逻辑
- 修复了论坛分页的 Bug
- 更新了 API 文档

## 测试 / Testing

描述你如何测试这些改动：

- [ ] 本地开发环境测试通过
- [ ] 添加了单元测试
- [ ] 手动测试所有相关功能
- [ ] 在不同浏览器中测试（Chrome, Firefox, Safari）
- [ ] 移动端测试

## 截图 / Screenshots

如果有 UI 改动，请提供前后对比截图。

**改动前**:
![Before](url)

**改动后**:
![After](url)

## 检查清单 / Checklist

- [ ] 代码遵循项目代码风格
- [ ] 代码通过 linting 检查
- [ ] 添加了必要的注释和文档
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
- [ ] 所有测试通过
- [ ] PR 标题遵循约定式提交格式

## 其他说明 / Additional Notes

任何需要审查者特别注意的内容。
```

#### PR 审查流程

1. **提交 PR** 后，维护者会收到通知
2. **自动检查**：CI/CD 会自动运行测试（如果配置）
3. **代码审查**：维护者会审查你的代码并提供反馈
4. **修改完善**：根据反馈进行修改
5. **合并**：审查通过后，维护者会合并你的 PR

**如何应对审查意见**：
- 仔细阅读每条评论
- 如果同意，进行修改并回复"已修改"
- 如果不同意，礼貌地说明理由
- 所有讨论解决后，请求重新审查

---

### 代码风格指南

#### Python 代码规范（PEP 8）

遵循 [PEP 8](https://pep8.org/) 风格指南：

**基本规则**：

```python
# 1. 缩进：使用 4 个空格
def my_function():
    if condition:
        do_something()

# 2. 行长度：最多 79-100 字符
# 可以使用括号进行换行
result = some_function(
    parameter1, parameter2,
    parameter3, parameter4
)

# 3. 空行
# 顶级定义之间空两行
class MyClass:
    pass


def my_function():
    pass


# 类方法之间空一行
class MyClass:
    def method1(self):
        pass

    def method2(self):
        pass

# 4. 导入
# 标准库
import os
import sys

# 第三方库
from flask import Flask, request

# 本地模块
from config import Config

# 5. 命名约定
class MyClass:  # 类名：驼峰命名
    pass

def my_function():  # 函数：小写+下划线
    pass

MY_CONSTANT = 100  # 常量：全大写+下划线

my_variable = "value"  # 变量：小写+下划线

# 6. 字符串
# 优先使用单引号，除非字符串包含单引号
message = 'Hello, world!'
quote = "It's a beautiful day"

# 7. 注释
# 使用中英文双语注释（项目约定）
# Create new user
# 创建新用户
user = User(username='alice')
```

**使用工具检查**：

```bash
# 安装工具
pip install black flake8 isort

# Black - 自动格式化
black app.py

# Flake8 - 代码检查
flake8 app.py --max-line-length=100

# isort - 排序导入
isort app.py
```

**VS Code 配置**（`.vscode/settings.json`）：

```json
{
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.flake8Args": ["--max-line-length=100"],
  "editor.formatOnSave": true,
  "editor.rulers": [100]
}
```

#### JavaScript 代码规范（ES6+）

**基本规则**：

```javascript
// 1. 使用 const 和 let，避免 var
const API_URL = '/api/chat';
let messageCount = 0;

// 2. 使用箭头函数
const greet = (name) => {
    return `Hello, ${name}!`;
};

// 3. 模板字符串
const message = `User ${username} sent a message`;

// 4. 解构
const { id, username, nickname } = user;
const [first, second] = array;

// 5. 默认参数
function fetchMessages(roomId, limit = 50) {
    // ...
}

// 6. 异步操作使用 async/await
async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

// 7. 命名约定
class MessageHandler {  // 类名：驼峰命名
    constructor() {}
}

function sendMessage() {}  // 函数：驼峰命名
const messageCount = 10;   // 变量：驼峰命名
const MAX_LENGTH = 1000;   // 常量：全大写+下划线

// 8. 注释
// 单行注释使用双斜杠

/**
 * 多行注释使用 JSDoc 格式
 * @param {string} message - 消息内容
 * @returns {boolean} 是否发送成功
 */
function sendMessage(message) {
    // ...
}

// 9. 分号
// 始终使用分号结尾
const value = 42;
```

**使用工具检查**：

```bash
# 安装 ESLint
npm install -g eslint

# 初始化配置
eslint --init

# 检查文件
eslint static/js/chat.js
```

#### HTML/CSS 规范

**HTML**：

```html
<!-- 1. 缩进：2 个空格 -->
<div class="container">
  <h1>标题</h1>
  <p>内容</p>
</div>

<!-- 2. 属性顺序 -->
<input
  type="text"
  id="username"
  class="form-control"
  name="username"
  value=""
  placeholder="输入用户名"
>

<!-- 3. 语义化标签 -->
<header>
  <nav>...</nav>
</header>
<main>
  <article>...</article>
</main>
<footer>...</footer>

<!-- 4. 注释 -->
<!-- 用户信息区域 -->
<div class="user-info">
  ...
</div>
```

**CSS**：

```css
/* 1. 选择器命名：kebab-case */
.user-profile {
    /* 2. 属性分组和顺序 */
    /* 定位 */
    position: relative;
    top: 0;
    left: 0;
    
    /* 盒模型 */
    display: flex;
    width: 100%;
    padding: 10px;
    margin: 0 auto;
    
    /* 视觉 */
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    
    /* 文字 */
    font-size: 14px;
    color: #333;
    
    /* 其他 */
    transition: all 0.3s ease;
}

/* 3. 使用 CSS 变量 */
:root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
}

.button {
    background-color: var(--primary-color);
}

/* 4. 媒体查询放在相关规则附近 */
.container {
    width: 1200px;
}

@media (max-width: 768px) {
    .container {
        width: 100%;
    }
}
```

---

### Git 提交规范

#### 提交消息格式

遵循 [约定式提交](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**：

```
feat(chat): add message editing feature

- Add edit button to chat messages
- Implement edit API endpoint
- Add edit modal dialog
- Update message timestamp on edit

Closes #123
```

**类型说明**：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(chat): add emoji picker` |
| `fix` | Bug 修复 | `fix(forum): resolve pagination bug` |
| `docs` | 文档 | `docs: update README` |
| `style` | 格式 | `style: format code with black` |
| `refactor` | 重构 | `refactor(auth): simplify login logic` |
| `perf` | 性能优化 | `perf(db): add index to messages table` |
| `test` | 测试 | `test(api): add chat API tests` |
| `chore` | 构建/工具 | `chore: update dependencies` |

#### 提交最佳实践

1. **一个提交做一件事**：每个提交应该是一个逻辑单元
2. **写清晰的提交消息**：他人应该能理解你的改动
3. **使用现在时态**："add feature" 而不是 "added feature"
4. **提交前检查**：确保代码能运行，没有调试代码
5. **小步提交**：频繁提交，而不是积累大量改动

**好的提交**：
```
feat(chat): add message search functionality

- Implement search API endpoint
- Add search UI in chat interface
- Support keyword and user filtering
```

**不好的提交**：
```
update files
```

---

### 测试指南

#### 运行测试

```bash
# 如果项目有测试文件
python test.py

# 或使用 pytest
pip install pytest
pytest

# 运行特定测试
pytest tests/test_chat.py

# 查看覆盖率
pip install pytest-cov
pytest --cov=app tests/
```

#### 编写测试

**单元测试示例**：

```python
# tests/test_auth.py
import unittest
from app import app, db_session, User

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        """测试前设置"""
        self.app = app.test_client()
        self.app.testing = True
    
    def tearDown(self):
        """测试后清理"""
        pass
    
    def test_login_success(self):
        """测试成功登录"""
        response = self.app.post('/login', data={
            'username': 'admin',
            'password': 'admin123'
        }, follow_redirects=True)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Welcome', response.data)
    
    def test_login_failure(self):
        """测试登录失败"""
        response = self.app.post('/login', data={
            'username': 'admin',
            'password': 'wrongpassword'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Invalid', response.data)

if __name__ == '__main__':
    unittest.main()
```

**API 测试示例**：

```python
def test_get_messages_api(self):
    """测试获取消息 API"""
    # 登录
    self.login('admin', 'admin123')
    
    # 调用 API
    response = self.app.get('/api/chat/1/history')
    data = response.get_json()
    
    # 断言
    self.assertEqual(response.status_code, 200)
    self.assertIn('messages', data)
    self.assertIsInstance(data['messages'], list)
```

---

### 文档指南

#### 文档结构

文档应包含：
1. **概述**：简要说明文档内容
2. **目录**：便于快速导航（长文档）
3. **主体内容**：详细说明
4. **示例**：代码示例和截图
5. **参考链接**：相关文档链接

#### Markdown 规范

```markdown
# 一级标题

## 二级标题

### 三级标题

**粗体** *斜体* `代码`

- 列表项 1
- 列表项 2
  - 嵌套列表

1. 有序列表
2. 第二项

[链接文字](URL)

![图片描述](图片URL)

```python
# 代码块
def example():
    pass
\```

> 引用块

| 表头1 | 表头2 |
|------|------|
| 内容1 | 内容2 |
```

#### 双语文档

项目文档使用中英文双语：

```markdown
# 标题 / Title

## 概述 / Overview

中文说明...

English description...

### 示例 / Example

\```python
# 中文注释
# English comment
code_here()
\```
```

#### 代码文档

**Python Docstring**：

```python
def send_message(room_id, user_id, content):
    """
    发送聊天消息
    Send a chat message
    
    Args:
        room_id (int): 聊天室 ID / Chat room ID
        user_id (int): 用户 ID / User ID
        content (str): 消息内容 / Message content
    
    Returns:
        dict: 消息对象 / Message object
    
    Raises:
        PermissionError: 用户无权限 / User has no permission
        ValueError: 消息内容为空 / Message content is empty
    
    Example:
        >>> send_message(1, 10, "Hello!")
        {'id': 123, 'content': 'Hello!', ...}
    """
    # 实现代码
    pass
```

**JavaScript JSDoc**：

```javascript
/**
 * 发送聊天消息
 * Send a chat message
 * 
 * @param {number} roomId - 聊天室 ID / Chat room ID
 * @param {string} message - 消息内容 / Message content
 * @returns {Promise<Object>} 消息对象 / Message object
 * 
 * @example
 * sendMessage(1, "Hello!")
 *   .then(msg => console.log(msg));
 */
async function sendMessage(roomId, message) {
    // 实现代码
}
```

---

### 报告问题

#### 如何提交 Bug 报告

1. **搜索现有 Issue**：避免重复
2. **使用 Issue 模板**（如果有）
3. **提供详细信息**

**Bug 报告模板**：

```markdown
## Bug 描述 / Bug Description

简要描述问题。

## 重现步骤 / Steps to Reproduce

1. 访问聊天室列表页面
2. 点击"技术讨论"房间
3. 发送消息"测试"
4. 观察到错误

## 预期行为 / Expected Behavior

消息应该成功发送并显示在聊天窗口中。

## 实际行为 / Actual Behavior

页面显示错误提示"发送失败"。

## 环境信息 / Environment

- **操作系统**: Ubuntu 22.04
- **浏览器**: Chrome 120.0
- **Python 版本**: 3.9.7
- **Flask 版本**: 3.1.2
- **部署方式**: 本地开发环境

## 错误日志 / Error Logs

\```
[2024-02-10 10:30:45] ERROR: Database connection failed
Traceback (most recent call last):
  ...
\```

## 截图 / Screenshots

![错误截图](url)

## 其他信息 / Additional Context

在尝试发送长消息（>1000 字符）时更容易出现。
```

#### 如何提交功能请求

**功能请求模板**：

```markdown
## 功能描述 / Feature Description

希望添加消息引用功能，允许用户引用之前的消息进行回复。

## 使用场景 / Use Case

在讨论技术问题时，经常需要引用之前的消息来回答特定问题。

## 建议实现 / Proposed Solution

1. 在每条消息旁添加"引用"按钮
2. 点击后在输入框插入引用标记
3. 发送时在数据库记录引用关系
4. 显示时显示被引用的消息

## 替代方案 / Alternatives

可以手动 @用户名，但不如直接引用直观。

## 相关参考 / References

- Telegram 的消息引用功能
- Discord 的回复功能
```

---

### 发布流程

（针对维护者）

#### 版本号规范

遵循 [语义化版本](https://semver.org/)：

```
主版本号.次版本号.修订号

MAJOR.MINOR.PATCH
```

- **MAJOR**: 不兼容的 API 改动
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

**示例**：
- `1.0.0` → `1.0.1` (Bug 修复)
- `1.0.1` → `1.1.0` (新功能)
- `1.1.0` → `2.0.0` (破坏性改动)

#### 发布步骤

1. **更新版本号**
2. **更新 CHANGELOG**
3. **创建 Git 标签**
4. **构建发布包**
5. **发布到 GitHub Releases**

```bash
# 1. 更新版本号
# 编辑 app.py 或 package.json

# 2. 提交版本更新
git add .
git commit -m "chore: bump version to 1.1.0"

# 3. 创建标签
git tag -a v1.1.0 -m "Release version 1.1.0"

# 4. 推送到远程
git push origin main
git push origin v1.1.0

# 5. 在 GitHub 上创建 Release
# 访问 https://github.com/w1010tdev/Stellarsis/releases/new
```

---

### 常见问题

#### Q: 我应该从哪里开始？

A: 查看标记为 `good first issue` 的 Issue，这些通常适合新贡献者。

#### Q: 我可以同时处理多个 Issue 吗？

A: 可以，但建议先完成一个再开始下一个，避免 PR 冲突。

#### Q: PR 被拒绝了怎么办？

A: 不要灰心！仔细阅读拒绝原因，进行改进后可以重新提交。

#### Q: 如何知道我的 PR 何时会被审查？

A: 维护者会尽快审查，通常在 1-7 天内。你可以礼貌地在 PR 中评论提醒。

#### Q: 我发现了安全漏洞，应该如何报告？

A: 请**不要**公开提交 Issue，而是通过私密方式联系维护者（见 README 联系方式）。

---

### 获取帮助

如果你在贡献过程中遇到问题：

1. **查看文档**：README 和其他文档可能有答案
2. **搜索 Issue**：看看是否有人遇到类似问题
3. **提问**：在 Issue 或 Discussions 中提问
4. **联系维护者**：通过 GitHub 或其他方式

---

### 致谢

感谢所有贡献者的付出！你们的贡献让 Stellarsis 变得更好。

**贡献者名单**：https://github.com/w1010tdev/Stellarsis/graphs/contributors

---

## English Version

### Welcome Contributors!

Thank you for your interest in contributing to Stellarsis! This guide will help you understand how to participate in project development, submit code, report issues, and more.

We welcome all forms of contributions, including but not limited to:
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📝 Improving documentation
- 🎨 Optimizing UI design
- 🔧 Fixing issues
- ✨ Implementing new features
- 🌐 Translating documentation

---

### Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](../../CODE_OF_CONDUCT.md). Please be respectful and kind to all participants.

**Core Principles**:
- Respect different viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy toward other community members

---

### Before You Start

#### 1. Understand the Project

Before contributing, we recommend:

- **Read the README**: Understand project overview and features
  - [README.md](../../README.md)
  
- **Review Existing Documentation**:
  - [Quick Start Guide](QUICK_START.md)
  - [Deployment Guide](DEPLOYMENT.md)
  - [API Documentation](../ROUTES_AND_WEBSOCKETS.md)
  - [Database Schema](../DATABASE_SCHEMA.md)
  - [Permission System](../PERMISSION_SYSTEM.md)

- **Browse Existing Issues and PRs**:
  - [Issues](https://github.com/w1010tdev/Stellarsis/issues)
  - [Pull Requests](https://github.com/w1010tdev/Stellarsis/pulls)

- **Run the Project**: Successfully run locally and familiarize yourself with features

#### 2. Set Up Development Environment

Refer to the [Quick Start Guide](QUICK_START.md) to set up your local development environment.

**Recommended Development Tools**:
- **IDE**: VS Code, PyCharm, Sublime Text
- **Git GUI**: GitHub Desktop, GitKraken, SourceTree
- **Database Tools**: DB Browser for SQLite, pgAdmin, DBeaver
- **API Testing**: Postman, Insomnia, curl

(Continue with English translations of Development Workflow, Code Style Guide, Git Commit Standards, Testing Guidelines, Documentation Guidelines, Issue Reporting, and other sections...)

---

### Development Workflow

#### 1. Fork and Clone Repository

```bash
# Fork repository to your GitHub account (via GitHub web interface)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/Stellarsis.git
cd Stellarsis

# Add upstream repository
git remote add upstream https://github.com/w1010tdev/Stellarsis.git

# Verify remotes
git remote -v
```

#### 2. Create Branch

**Branch Naming Conventions**:

- `feature/feature-name` - New features
- `fix/issue-description` - Bug fixes
- `docs/documentation-topic` - Documentation updates
- `refactor/refactor-content` - Code refactoring
- `style/style-adjustment` - UI/CSS adjustments
- `test/test-content` - Testing related

**Examples**:

```bash
# Create new branch from latest main
git checkout main
git pull upstream main
git checkout -b feature/user-profile-page

# Or fix a bug
git checkout -b fix/chat-message-timestamp
```

(Continue with remaining sections in English...)

---

### Getting Help

If you encounter issues during contribution:

1. **Check Documentation**: README and other docs may have answers
2. **Search Issues**: See if others have encountered similar problems
3. **Ask Questions**: Ask in Issues or Discussions
4. **Contact Maintainers**: Via GitHub or other channels

---

### Acknowledgments

Thanks to all contributors for their efforts! Your contributions make Stellarsis better.

**Contributors List**: https://github.com/w1010tdev/Stellarsis/graphs/contributors

---

**Document Version**: 1.0  
**Last Updated**: 2024-02-10
