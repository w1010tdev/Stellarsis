# Frontend Documentation / 前端文档

> **English** | [中文](#中文)

## Overview

Comprehensive documentation for the Stellarsis frontend architecture, components, theming system, and command palette.

---

## Documentation Index

### 📐 [Architecture Overview](./ARCHITECTURE.md)
**Complete guide to the frontend architecture**

Topics covered:
- Tech stack (JavaScript ES6+, Vue 3, Socket.IO, Marked.js, etc.)
- Dual-mode design (Traditional MPA vs Modern SPA)
- Project structure and file organization
- Application flow and component structure
- State management strategies
- Routing (server-side and client-side)
- Communication patterns (HTTP and WebSocket)
- Performance optimizations
- Error handling and security considerations
- Browser compatibility

**Read if you want to:**
- Understand the overall frontend architecture
- Learn how MPA and SPA modes work together
- See how state management differs between modes
- Understand WebSocket communication patterns

---

### 🧩 [Components Guide](./COMPONENTS.md)
**Detailed documentation for all frontend components**

Components covered:
- **Chat System** (`chat.js`) - Real-time messaging with WebSocket
- **Forum System** (`forum.js`) - Thread viewing and replies
- **Command Palette** (`command-palette.js`) - Bash-style command interface
- **Settings** (`settings.js`) - User settings and follow management
- **Upload System** (`uploads.js`) - File upload with progress tracking
- **Theme Switcher** (`theme-switcher.js`) - Theme management
- **UI Utilities** (`ui.js`) - Toast notifications, modals, helpers
- **SPA Components** (`spa/`) - Vue 3 store, router, pages, components

**Read if you want to:**
- Learn how individual components work
- Understand component APIs and usage
- Integrate or extend existing components
- Debug component-specific issues

---

### 🎨 [Theming Guide](./THEMING.md)
**Complete theme system documentation**

Topics covered:
- 6 available themes (Light, Mint, Ocean, Purple, Solarized, Sunset)
- Theme structure and CSS custom properties
- Design token system (90+ CSS variables)
- Color scales (neutral, primary, accent, status)
- Semantic tokens and their usage
- Critical CSS optimization
- Creating custom themes
- Theme switcher implementation
- Performance considerations

**Read if you want to:**
- Switch or customize themes
- Create a new theme
- Understand the design token system
- Learn about critical CSS optimization
- Use theme-aware components

---

### ⌨️ [Command Palette Guide](./COMMAND_PALETTE.md)
**Unified command palette documentation for both MPA and SPA**

Topics covered:
- Quick start guide
- Bash-style features (Traditional MPA)
  - Command parameter parsing
  - Command aliases
  - History navigation (↑/↓)
  - Bash-style navigation (`cd`, `ls`, `pwd`)
  - Tab auto-completion
  - Fuzzy matching
- Modern features (SPA)
  - Fuzzy search
  - Context-aware commands
  - Command history
  - Complete help view
- Built-in commands reference
- Extending the command palette
- API documentation

**Read if you want to:**
- Learn how to use the command palette effectively
- Understand the differences between MPA and SPA modes
- Register custom commands
- See all available built-in commands

---

## Quick Links

### Getting Started
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for the big picture
2. Check [COMPONENTS.md](./COMPONENTS.md) for specific components
3. See [THEMING.md](./THEMING.md) to customize themes
4. Learn [COMMAND_PALETTE.md](./COMMAND_PALETTE.md) for power user features

### Common Tasks

**How do I...**
- **Add a new component?** → See [COMPONENTS.md](./COMPONENTS.md) "Extending" sections
- **Create a custom theme?** → See [THEMING.md](./THEMING.md) "Creating Custom Themes"
- **Add a custom command?** → See [COMMAND_PALETTE.md](./COMMAND_PALETTE.md) "Extending"
- **Understand WebSocket?** → See [ARCHITECTURE.md](./ARCHITECTURE.md) "Communication Patterns"
- **Debug state issues?** → See [ARCHITECTURE.md](./ARCHITECTURE.md) "State Management"

---

## Related Documentation

### Backend Documentation
- [Backend Architecture](../backend/ARCHITECTURE.md)
- [Database Schema](../DATABASE_SCHEMA.md)
- [Routes and WebSockets](../ROUTES_AND_WEBSOCKETS.md)
- [Permission System](../PERMISSION_SYSTEM.md)

### Guides
- [Markdown & LaTeX Quickstart](../Markdown_LaTeX_Quickstart.md)
- [SPA Settings & Admin](../SPA_SETTINGS_ADMIN.md)

---

## File Structure

```
docs/frontend/
├── README.md              # This file - Documentation index
├── ARCHITECTURE.md        # Frontend architecture overview
├── COMPONENTS.md          # Component documentation
├── THEMING.md            # Theme system guide
└── COMMAND_PALETTE.md    # Command palette guide (unified MPA/SPA)
```

---

## Contributing

When updating frontend documentation:

1. **Keep both English and Chinese** - All docs are bilingual
2. **Update related docs** - If you change architecture, update component docs if needed
3. **Add examples** - Code examples help readers understand
4. **Keep formatting consistent** - Follow the existing structure
5. **Link between docs** - Use relative links to related documentation

---

## 中文

## 概览

Stellarsis 前端架构、组件、主题系统和命令面板的综合文档。

---

## 文档索引

### 📐 [架构概览](./ARCHITECTURE.md)
**前端架构完整指南**

涵盖主题：
- 技术栈（JavaScript ES6+、Vue 3、Socket.IO、Marked.js 等）
- 双模式设计（传统 MPA vs 现代 SPA）
- 项目结构和文件组织
- 应用流程和组件结构
- 状态管理策略
- 路由（服务器端和客户端）
- 通信模式（HTTP 和 WebSocket）
- 性能优化
- 错误处理和安全考虑
- 浏览器兼容性

**适合阅读如果您想：**
- 了解整体前端架构
- 学习 MPA 和 SPA 模式如何协同工作
- 了解不同模式间状态管理的差异
- 理解 WebSocket 通信模式

---

### 🧩 [组件指南](./COMPONENTS.md)
**所有前端组件的详细文档**

涵盖组件：
- **聊天系统**（`chat.js`）- 带 WebSocket 的实时消息
- **论坛系统**（`forum.js`）- 帖子查看和回复
- **命令面板**（`command-palette.js`）- Bash 风格命令界面
- **设置**（`settings.js`）- 用户设置和关注管理
- **上传系统**（`uploads.js`）- 带进度跟踪的文件上传
- **主题切换器**（`theme-switcher.js`）- 主题管理
- **UI 工具**（`ui.js`）- Toast 通知、模态框、辅助功能
- **SPA 组件**（`spa/`）- Vue 3 store、router、pages、components

**适合阅读如果您想：**
- 学习各个组件的工作原理
- 了解组件 API 和用法
- 集成或扩展现有组件
- 调试组件特定问题

---

### 🎨 [主题指南](./THEMING.md)
**完整的主题系统文档**

涵盖主题：
- 6 个可用主题（Light、Mint、Ocean、Purple、Solarized、Sunset）
- 主题结构和 CSS 自定义属性
- 设计令牌系统（90+ CSS 变量）
- 颜色比例（中性、主色、强调、状态）
- 语义令牌及其用法
- 关键 CSS 优化
- 创建自定义主题
- 主题切换器实现
- 性能考虑

**适合阅读如果您想：**
- 切换或自定义主题
- 创建新主题
- 了解设计令牌系统
- 学习关键 CSS 优化
- 使用主题感知组件

---

### ⌨️ [命令面板指南](./COMMAND_PALETTE.md)
**MPA 和 SPA 的统一命令面板文档**

涵盖主题：
- 快速入门指南
- Bash 风格特性（传统 MPA）
  - 命令参数解析
  - 命令别名
  - 历史导航（↑/↓）
  - Bash 风格导航（`cd`、`ls`、`pwd`）
  - Tab 自动补全
  - 模糊匹配
- 现代特性（SPA）
  - 模糊搜索
  - 上下文感知命令
  - 命令历史
  - 完整帮助视图
- 内置命令参考
- 扩展命令面板
- API 文档

**适合阅读如果您想：**
- 学习如何有效使用命令面板
- 了解 MPA 和 SPA 模式的差异
- 注册自定义命令
- 查看所有可用的内置命令

---

## 快速链接

### 入门
1. 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解全局
2. 查看 [COMPONENTS.md](./COMPONENTS.md) 了解特定组件
3. 参阅 [THEMING.md](./THEMING.md) 自定义主题
4. 学习 [COMMAND_PALETTE.md](./COMMAND_PALETTE.md) 掌握高级功能

### 常见任务

**如何...**
- **添加新组件？** → 参见 [COMPONENTS.md](./COMPONENTS.md) "扩展" 部分
- **创建自定义主题？** → 参见 [THEMING.md](./THEMING.md) "创建自定义主题"
- **添加自定义命令？** → 参见 [COMMAND_PALETTE.md](./COMMAND_PALETTE.md) "扩展"
- **理解 WebSocket？** → 参见 [ARCHITECTURE.md](./ARCHITECTURE.md) "通信模式"
- **调试状态问题？** → 参见 [ARCHITECTURE.md](./ARCHITECTURE.md) "状态管理"

---

## 相关文档

### 后端文档
- [后端架构](../backend/ARCHITECTURE.md)
- [数据库架构](../DATABASE_SCHEMA.md)
- [路由和 WebSocket](../ROUTES_AND_WEBSOCKETS.md)
- [权限系统](../PERMISSION_SYSTEM.md)

### 指南
- [Markdown 和 LaTeX 快速入门](../Markdown_LaTeX_Quickstart.md)
- [SPA 设置和管理](../SPA_SETTINGS_ADMIN.md)

---

## 贡献

更新前端文档时：

1. **保持中英文双语** - 所有文档都是双语的
2. **更新相关文档** - 如果更改架构，必要时更新组件文档
3. **添加示例** - 代码示例帮助读者理解
4. **保持格式一致** - 遵循现有结构
5. **文档间建立链接** - 使用相对链接连接相关文档
