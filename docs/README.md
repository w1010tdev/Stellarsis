# Stellarsis 文档中心 / Documentation Center

欢迎来到 Stellarsis 项目文档中心！本文档将帮助您快速了解和使用 Stellarsis 聊天论坛系统。

Welcome to the Stellarsis Documentation Center! This documentation will help you quickly understand and use the Stellarsis chat forum system.

---

## 📖 文档导航 / Documentation Navigation

### 🚀 快速开始 / Quick Start

新手入门请从这里开始 / New users start here:

- **[快速开始指南 / Quick Start Guide](guides/QUICK_START.md)** - 安装、配置和运行应用 / Install, configure, and run the application
- **[部署指南 / Deployment Guide](guides/DEPLOYMENT.md)** - 生产环境部署详解 / Production deployment guide

### 🔧 后端开发 / Backend Development

后端开发者必读 / Essential for backend developers:

- **[后端架构 / Backend Architecture](backend/ARCHITECTURE.md)** - 后端架构概览、技术栈、核心组件 / Backend architecture overview, tech stack, core components
- **[数据库架构 / Database Schema](backend/DATABASE.md)** - 完整的数据库模型和表结构 / Complete database models and table structures
- **[API 文档 / API Documentation](backend/API.md)** - HTTP 路由和 WebSocket 事件参考 / HTTP routes and WebSocket events reference
- **[日志系统 / Logging System](backend/LOGGING.md)** - 日志架构、日志级别、日志分析 / Logging architecture, log levels, log analysis

### 🎨 前端开发 / Frontend Development

前端开发者必读 / Essential for frontend developers:

- **[前端架构 / Frontend Architecture](frontend/ARCHITECTURE.md)** - 前端架构、技术栈、应用流程 / Frontend architecture, tech stack, application flow
- **[组件文档 / Components](frontend/COMPONENTS.md)** - 所有前端组件的详细文档 / Detailed documentation for all frontend components
- **[主题系统 / Theme System](frontend/THEMING.md)** - 主题系统、CSS 变量、自定义主题 / Theme system, CSS variables, custom themes
- **[命令面板 / Command Palette](frontend/COMMAND_PALETTE.md)** - Bash 风格命令面板使用指南 / Bash-style command palette guide

### 📚 用户指南 / User Guide

普通用户和管理员参考 / For regular users and administrators:

- **[权限系统说明 / Permission System](PERMISSION_SYSTEM.md)** - 四级权限系统详解 / Four-tier permission system explained
- **[Markdown & LaTeX 快速入门 / Markdown & LaTeX Quickstart](Markdown_LaTeX_Quickstart.md)** - Markdown 和 LaTeX 语法指南 / Markdown and LaTeX syntax guide

### 👥 贡献指南 / Contributing

想要为项目做贡献？/ Want to contribute to the project?

- **[贡献指南 / Contributing Guide](guides/CONTRIBUTING.md)** - 开发流程、代码规范、提交指南 / Development workflow, code style, submission guidelines

---

## 📋 按主题浏览 / Browse by Topic

### 认证与权限 / Authentication & Authorization

- [用户认证系统](backend/ARCHITECTURE.md#2-认证系统) - User authentication system
- [权限系统详解](PERMISSION_SYSTEM.md) - Permission system details
- [SU 验证机制](backend/API.md#su-验证) - SU verification mechanism

### 聊天系统 / Chat System

- [聊天室管理](backend/DATABASE.md#2-chatroom聊天室表) - Chat room management
- [消息系统](backend/DATABASE.md#3-chatmessage聊天消息表) - Message system
- [聊天权限](backend/DATABASE.md#4-chatpermission聊天室权限表) - Chat permissions
- [实时通信](backend/ARCHITECTURE.md#4-实时通信) - Real-time communication
- [聊天组件](frontend/COMPONENTS.md#1-聊天系统-chat-system) - Chat components

### 论坛系统 / Forum System

- [论坛分区](backend/DATABASE.md#6-forumsection论坛分区表) - Forum sections
- [主题帖管理](backend/DATABASE.md#7-forumthread论坛主题帖表) - Thread management
- [回复系统](backend/DATABASE.md#8-forumreply论坛回复表) - Reply system
- [论坛权限](backend/DATABASE.md#9-forumpermission论坛权限表) - Forum permissions
- [论坛组件](frontend/COMPONENTS.md#2-论坛系统-forum-system) - Forum components

### 文件上传 / File Upload

- [图片上传](backend/API.md#文件上传-api) - Image upload
- [上传配额管理](backend/DATABASE.md#12-userimage用户图片表) - Upload quota management
- [上传组件](frontend/COMPONENTS.md#5-上传系统-upload-system) - Upload components

### 用户关注 / User Follow

- [关注系统](backend/DATABASE.md#11-userfollow用户关注关系表) - Follow system
- [关注 API](backend/API.md#关注-api) - Follow API
- [在线状态](backend/API.md#在线状态-api) - Online status

### 主题与界面 / Themes & UI

- [主题系统](frontend/THEMING.md) - Theme system
- [可用主题](frontend/THEMING.md#可用主题) - Available themes
- [自定义主题](frontend/THEMING.md#自定义主题开发) - Custom theme development
- [命令面板](frontend/COMMAND_PALETTE.md) - Command palette

### 管理功能 / Admin Features

- [用户管理](backend/API.md#用户管理-api) - User management
- [聊天室管理](backend/API.md#聊天室管理-api) - Chat room management
- [论坛管理](backend/API.md#论坛管理-api) - Forum management
- [系统管理](backend/API.md#系统管理-api) - System management
- [文件管理器](backend/ARCHITECTURE.md#文件管理器可选) - File manager

### 部署与运维 / Deployment & Operations

- [服务器要求](guides/DEPLOYMENT.md#服务器要求) - Server requirements
- [数据库配置](guides/DEPLOYMENT.md#数据库配置) - Database configuration
- [Web 服务器配置](guides/DEPLOYMENT.md#web-服务器配置) - Web server configuration
- [SSL/HTTPS 配置](guides/DEPLOYMENT.md#ssl--https-配置) - SSL/HTTPS configuration
- [Docker 部署](guides/DEPLOYMENT.md#docker-部署) - Docker deployment
- [监控和日志](guides/DEPLOYMENT.md#监控和日志) - Monitoring and logging
- [备份与维护](guides/DEPLOYMENT.md#备份和维护) - Backup and maintenance

### 开发工具 / Development Tools

- [日志系统](backend/LOGGING.md) - Logging system
- [调试技巧](guides/QUICK_START.md#常见开发任务) - Debugging tips
- [性能优化](guides/DEPLOYMENT.md#性能优化) - Performance optimization
- [故障排查](guides/DEPLOYMENT.md#故障排查) - Troubleshooting

---

## 🔍 常见任务 / Common Tasks

### 安装与启动 / Installation & Startup

```bash
# 克隆仓库 / Clone repository
git clone https://github.com/w1010tdev/Stellarsis.git
cd Stellarsis

# 安装依赖 / Install dependencies
pip install -r requirements.txt

# 运行应用 / Run application
python app.py
```

详见 [快速开始指南](guides/QUICK_START.md)

### 创建管理员用户 / Create Admin User

默认管理员账户 / Default admin account:
- 用户名 / Username: `admin`
- 密码 / Password: `admin123`

**首次登录后请立即修改密码！/ Please change password after first login!**

详见 [快速开始指南 - 首次登录](guides/QUICK_START.md#4-首次登录和设置)

### 配置数据库 / Configure Database

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'sqlite:///stellarsis.db'  # SQLite
# SQLALCHEMY_DATABASE_URI = 'postgresql://user:pass@localhost/stellarsis'  # PostgreSQL
# SQLALCHEMY_DATABASE_URI = 'mysql://user:pass@localhost/stellarsis'  # MySQL
```

详见 [部署指南 - 数据库配置](guides/DEPLOYMENT.md#数据库配置)

### 部署到生产环境 / Deploy to Production

```bash
# 使用 Gunicorn / Using Gunicorn
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app

# 使用 systemd / Using systemd
sudo systemctl start stellarsis
sudo systemctl enable stellarsis
```

详见 [部署指南](guides/DEPLOYMENT.md)

### 查看日志 / View Logs

```bash
# 实时查看系统日志 / View system logs in real-time
tail -f logs/system.log

# 查看管理员操作日志 / View admin operation logs
tail -f logs/admin.log

# 搜索错误日志 / Search error logs
grep -i error logs/system.log
```

详见 [日志系统文档](backend/LOGGING.md)

### 备份数据库 / Backup Database

```bash
# SQLite 备份 / SQLite backup
cp stellarsis.db stellarsis_backup_$(date +%Y%m%d).db

# PostgreSQL 备份 / PostgreSQL backup
pg_dump stellarsis > stellarsis_backup_$(date +%Y%m%d).sql
```

详见 [部署指南 - 备份与维护](guides/DEPLOYMENT.md#备份和维护)

---

## 📞 获取帮助 / Get Help

### 文档问题 / Documentation Issues

如果您在文档中发现错误或需要补充说明，请：
If you find errors or need additional explanations in the documentation, please:

1. 在 [GitHub Issues](https://github.com/w1010tdev/Stellarsis/issues) 提交问题 / Submit an issue on GitHub Issues
2. 标记为 `documentation` 标签 / Tag with `documentation` label

### 技术支持 / Technical Support

- **问题反馈 / Issue Reporting**: [GitHub Issues](https://github.com/w1010tdev/Stellarsis/issues)
- **功能建议 / Feature Requests**: [GitHub Issues](https://github.com/w1010tdev/Stellarsis/issues) (使用 `enhancement` 标签)
- **安全问题 / Security Issues**: 请私下联系项目维护者 / Please contact project maintainers privately

### 贡献代码 / Contribute Code

欢迎提交 Pull Request！请先阅读 [贡献指南](guides/CONTRIBUTING.md)。

Welcome to submit Pull Requests! Please read the [Contributing Guide](guides/CONTRIBUTING.md) first.

---

## 📚 文档更新日志 / Documentation Changelog

### 2026-02-10

- ✨ **重大更新 / Major Update**: 完整重构文档系统 / Complete documentation system refactoring
- 📁 新增后端文档 / Added backend documentation:
  - ARCHITECTURE.md - 后端架构 / Backend architecture
  - DATABASE.md - 数据库架构 / Database schema
  - API.md - API 文档 / API documentation
  - LOGGING.md - 日志系统 / Logging system
- 📁 新增前端文档 / Added frontend documentation:
  - ARCHITECTURE.md - 前端架构 / Frontend architecture
  - COMPONENTS.md - 组件文档 / Component documentation
  - THEMING.md - 主题系统 / Theme system
  - COMMAND_PALETTE.md - 命令面板 / Command palette
- 📁 新增指南文档 / Added guide documentation:
  - QUICK_START.md - 快速开始 / Quick start
  - DEPLOYMENT.md - 部署指南 / Deployment guide
  - CONTRIBUTING.md - 贡献指南 / Contributing guide
- 📝 总计 12 个新文档文件，11,000+ 行高质量双语文档 / Total 12 new documentation files, 11,000+ lines of high-quality bilingual documentation

---

## 📖 阅读建议 / Reading Recommendations

### 新用户 / New Users

1. [快速开始指南](guides/QUICK_START.md) - 了解如何安装和运行
2. [权限系统说明](PERMISSION_SYSTEM.md) - 了解权限机制
3. [Markdown & LaTeX 快速入门](Markdown_LaTeX_Quickstart.md) - 学习如何格式化消息

### 前端开发者 / Frontend Developers

1. [前端架构](frontend/ARCHITECTURE.md) - 了解前端结构
2. [组件文档](frontend/COMPONENTS.md) - 学习如何使用和开发组件
3. [主题系统](frontend/THEMING.md) - 学习如何自定义主题

### 后端开发者 / Backend Developers

1. [后端架构](backend/ARCHITECTURE.md) - 了解后端结构
2. [数据库架构](backend/DATABASE.md) - 理解数据模型
3. [API 文档](backend/API.md) - 学习 API 设计

### 运维人员 / DevOps Engineers

1. [部署指南](guides/DEPLOYMENT.md) - 学习如何部署到生产环境
2. [日志系统](backend/LOGGING.md) - 了解日志管理
3. [备份与维护](guides/DEPLOYMENT.md#备份和维护) - 学习维护策略

---

## 许可证 / License

本文档采用 [MIT License](../LICENSE) 授权。

This documentation is licensed under the [MIT License](../LICENSE).

---

**文档版本 / Documentation Version**: 3.0  
**最后更新 / Last Updated**: 2026-02-10
