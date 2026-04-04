# Stellarsis 聊天论坛系统 / Stellarsis Chat Forum System


[![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)

## 项目概述 / Project Overview

Stellarsis (群星议会) 是一个功能丰富的实时聊天和论坛系统，结合了聊天室和论坛功能，支持用户关注、权限管理、实时消息通知等高级功能。采用 Flask + Socket.IO 构建，提供现代化的用户界面和完善的管理功能。

Stellarsis is a feature-rich real-time chat and forum system that combines chat rooms and forum functions, supporting advanced features such as user following, permission management, and real-time message notifications. Built with Flask + Socket.IO, offering a modern UI and comprehensive administrative features.

**代码规模 / Codebase Scale:**
- 后端 (Backend): ~3,800 行 Python 代码（模块化架构）
- 前端 (Frontend): SPA 单页应用（Vue 风格路由 + 组件化）
- 完整的权限系统、消息队列、文件上传、实时通信

## 核心特性 / Core Features

### 🌟 独特功能 / Unique Features

#### 1. **用户关注系统 (User Following System)**
   - 用户可以关注其他用户，实时接收关注用户的上线/离线通知
   - 在聊天室中能看到关注用户加入或离开的通知
   - 支持关注列表管理，快速查看关注的用户状态
   - 关注通知自动合并，避免频繁刷屏

#### 2. **智能在线状态 (Smart Online Status)**
   - 实时显示在线用户列表（模态框展示）
   - 支持全局在线人数统计和单房间在线人数
   - 基于最后活动时间的在线状态判断（30秒超时）
   - 心跳机制自动更新用户活跃状态
   - WebSocket 断线自动切换到轮询模式

#### 3. **高级权限管理 (Advanced Permission Management)**
   - **四级权限系统**：
     - `su` (超级用户): 完全权限，可发送、查看、管理
     - `777` (发送权限): 可发送和查看消息/帖子
     - `444` (只读权限): 只能查看，不能发送
     - `Null` (无权限): 无法访问该区域
   - 聊天室和论坛分区独立权限控制
   - 管理员自动获得所有区域的 su 权限
   - 支持批量权限设置和用户权限查询

#### 4. **Markdown 和 LaTeX 支持 (Markdown and LaTeX Support)**
   - 聊天消息和论坛帖子支持完整 Markdown 格式
   - 支持行内公式 `$...$` 和块级公式 `$$...$$`
   - 代码块语法高亮（三个反引号）
   - 表格、列表、引用块、链接等全部支持
   - 实时渲染预览，支持复杂数学公式（微积分、矩阵等）

#### 5. **多房间聊天系统 (Multi-Room Chat System)**
   - 支持多个独立的聊天室，每个房间有独立的：
     - 权限设置
     - 消息历史
     - 在线用户列表
     - 未读消息计数
   - 用户可以自由切换聊天室
   - 支持消息引用（@quote）和消息合并

#### 6. **多主题支持 (Multi-themes Support)**
   - 可以通过命令面板（`:theme <name>`）或设置页面切换
   - 主题持久化存储到 localStorage
   - 全站主题一致性，支持深色和浅色模式

#### 7. **命令面板 (Command Palette) - Bash 风格**
   - 按 `:` 键快速打开命令面板
   - 可扩展的命令注册 API

#### 8. **图片上传与管理 (Image Upload & Management)**
   - 支持拖粘贴上传
   - 支持格式：PNG, JPG, JPEG, GIF, WebP
   - 单张图片最大 5MB，用户配额 50MB（可配置）
   - 自动生成 Markdown 代码便于插入消息
   - 流式写入避免内存溢出
   - 管理员可重新统计文件大小
   - 用户可在设置中查看和删除已上传图片

#### 9. **消息引用与合并 (Message Quoting & Merging)**
   - 支持引用历史消息（`@quote[id]` 语法）
   - 引用验证：确保引用的消息在同一房间

### 📋 基础功能 / Basic Features

#### 1. **用户认证系统 (User Authentication System)**
   - 用户注册/登录（带速率限制）
   - 密码修改（需验证旧密码）
   - 个人资料管理（昵称、颜色、徽章）
   - 会话管理和自动登出（长时间不活动）
   - SU 验证系统（管理员高危操作需二次验证）

#### 2. **论坛系统 (Forum System)**
   - 创建/删除分区（管理员）
   - 发布/回复帖子（需权限）
   - 帖子权限控制（查看、发帖、管理）
   - 分页浏览回复
   - 未读消息提醒
   - Markdown 格式支持

#### 3. **实时聊天功能 (Real-time Chat Functions)**
   - WebSocket 实时消息推送
   - 消息历史记录分页加载
   - 用户昵称和颜色自定义
   - 在线用户实时更新
   - 验证码防刷屏机制
   - 消息发送速率限制
   - 自动滚动到底部（可选）

#### 4. **管理后台 (Admin Panel)**
   - **用户管理**：创建、编辑、删除用户；修改角色和权限
   - **聊天室管理**：创建、编辑、删除聊天室；批量删除消息
   - **论坛管理**：创建、编辑、删除分区和帖子
   - **文件管理器**：浏览、编辑、备份服务器文件（可选功能）
   - **数据库管理**：查看表结构、编辑记录、导出数据
   - **系统信息**：查看日志、在线状态、数据库优化
   - **备份与下载**：下载项目压缩包、导出数据库文件
   - **服务器控制**：重启、关闭服务器（可选功能）

## 技术栈 / Tech Stack

### 后端 (Backend)
- **框架**: Python 3.7+ with Flask 2.0+（Application Factory + Blueprints 模块化架构）
- **实时通信**: Flask-SocketIO (支持 WebSocket 和轮询降级)
- **数据库**: SQLAlchemy ORM + SQLite (可切换到 PostgreSQL/MySQL)
- **认证**: Flask-Login
- **表单验证**: Flask-WTF, WTForms
- **速率限制**: Flask-Limiter
- **跨域**: Flask-CORS
- **异步模式**: Eventlet
- **日志**: RotatingFileHandler (UTF-8 编码，10MB 轮转)

### 前端 (Frontend)
- **架构**: SPA 单页应用（hash 路由 + 组件化）
- **基础**: HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- **实时通信**: Socket.IO Client (自动降级到轮询)
- **Markdown 渲染**: Marked.js
- **数学公式**: LaTeX 支持（通过 Markdown 扩展）
- **主题系统**: CSS 变量 + localStorage 持久化
- **图标**: Font Awesome 6

### 数据库模型 (Database Models)
- **User**: 用户信息、角色、上传配额
- **ChatRoom**: 聊天室
- **ChatMessage**: 聊天消息
- **ChatPermission**: 聊天室权限
- **ForumSection**: 论坛分区
- **ForumThread**: 论坛主题帖
- **ForumReply**: 论坛回复
- **ForumPermission**: 论坛权限
- **UserFollow**: 用户关注关系
- **ChatLastView**: 聊天室最后查看时间
- **ForumLastView**: 论坛最后查看时间
- **UserImage**: 用户上传图片记录

### 架构特点 (Architecture Features)
- **模块化后端**: Application Factory 模式 + Blueprint 路由组织
- **SPA 前端**: 单页应用，Hash 路由，组件化页面渲染
- **前后端分离**: REST API + WebSocket
- **权限系统**: 基于角色和资源的细粒度权限控制
- **实时通信**: Socket.IO 房间管理 + 心跳检测
- **会话管理**: Flask Session + 登录装饰器
- **文件上传**: 流式写入 + 文件头检测 + 配额管理
- **消息队列**: 客户端消息队列防止消息丢失
- **降级策略**: WebSocket → 轮询自动降级
- **时间标准化**: 所有 API 返回 ISO 8601 UTC 时间（`Z` 后缀）

## 管理与维护 / Admin & Maintenance

### 管理面板功能 (Admin Panel Features)

访问管理面板：登录后通过命令面板输入 `:admin` 或 `:cd /admin`

#### 用户管理 (User Management)
- 创建新用户（设置用户名、密码、昵称、角色）
- 编辑用户信息（昵称、颜色、徽章）
- 修改用户角色（user / admin）
- 设置用户权限（聊天室和论坛分区权限）
- 删除用户（不可删除 admin 用户）
- 查看用户上传配额使用情况

#### 聊天室管理 (Chat Room Management)
- 创建聊天室（名称、描述）
- 编辑聊天室信息
- 删除聊天室（同时删除所有消息）
- 批量删除消息（按房间、按时间）
- 查看和管理用户权限

#### 论坛管理 (Forum Management)
- 创建分区（名称、描述）
- 编辑分区信息
- 删除分区（同时删除所有帖子和回复）
- 删除帖子和回复
- 查看和管理用户权限

#### 文件管理 (File Management)
**需要启用**: `ENABLE_FILE_MANAGER = True`

- 浏览服务器文件系统
- 编辑文本文件（自动备份）
- 查看文件内容
- **安全警告**: 仅在可信环境中启用

#### 数据库管理 (Database Management)
- 查看数据库表结构
- 浏览表数据（分页）
- 编辑记录
- 删除记录
- 数据库优化（VACUUM）
- 导出数据库文件

#### 系统管理 (System Management)
- 查看系统日志（logs/system.log）
- 一键下载项目压缩包（`/down`）
- 下载数据库文件（`/downdb`，仅 SQLite）
- 重新统计文件上传大小（`/api/admin/recalculate-upload-sizes`）
- 清除缓存
- 数据库备份
- 服务器重启/关闭（需要启用 `ENABLE_SERVER_CONTROL`）

### SU 验证系统 (SU Verification)

管理员执行敏感操作时需要 SU 验证（二次密码验证）：
- 验证有效期：5 分钟
- 适用于：文件管理、数据库操作、服务器控制等高危操作
- 访问 `/admin/su` 进行验证

## 安装与部署 / Installation and Deployment

### 快速开始 (Quick Start)

请从 [Release 页面](https://github.com/w1010tdev/Stellarsis/releases/latest) 下载最新稳定版本用于开发部署。

Main Branch 也可以使用，但是不保证 Bug 已解决。

#### 1. 安装依赖 (Install Dependencies)
```bash
# 克隆仓库
git clone https://github.com/w1010tdev/Stellarsis.git
cd Stellarsis

# 安装 Python 依赖
pip install -r requirements.txt -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple

# 如果清华镜像不可用，请移除 -i 参数：
pip install -r requirements.txt

# 或者使用虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**离线安装包**: 如果因网络问题无法安装，可下载：  
https://pan.huang1111.cn/s/zMm6ZcM （访问 Scripts 内的 activate.bat）

#### 2. 配置 (Configuration)

编辑 `config.py` 根据需要修改配置：

```python
# config.py
class Config:
    SECRET_KEY = 'your-secret-key-here'  # 生产环境请修改
    SQLALCHEMY_DATABASE_URI = 'sqlite:///stellarsis.db'  # 或使用 PostgreSQL/MySQL
    
    # 在线超时时间（秒）
    ONLINE_TIMEOUT = 30
    
    # 图片上传配置
    UPLOAD_FOLDER = 'static/uploads'
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 5MB
    USER_UPLOAD_QUOTA = 50 * 1024 * 1024  # 50MB
    
    # 文件上传配置（默认关闭）
    ENABLE_FILE_UPLOAD = False
    ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'md'}
    FILE_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    
    # 管理面板高级功能（默认关闭）
    ENABLE_FILE_MANAGER = False  # 文件管理器
    ENABLE_SERVER_CONTROL = False  # 服务器控制（重启/关闭）
```



#### 3. 运行应用 (Run Application)
```bash
# 开发模式
python app.py

# 或使用启动脚本
bash start.sh  # Linux/Mac
```

#### 4. 访问应用 (Access Application)
- 本地访问: `http://localhost:80`（默认端口，可通过 `PORT` 环境变量修改）
- 局域网访问: `http://YOUR-IP:80`
- 默认管理员账户:
  - 用户名: `admin`
  - 密码: 通过环境变量 `STELLARSIS_ADMIN_PASSWORD` 设置（默认 `admin123`）

**首次登录后请立即修改默认密码！**

> ⚠️ 生产环境请务必设置 `STELLARSIS_ADMIN_PASSWORD` 环境变量，系统会在使用默认密码时输出警告日志。

### 生产部署 (Production Deployment)

#### 使用 Gunicorn + Nginx

1. 安装 Gunicorn:
```bash
pip install gunicorn eventlet
```

2. 运行 Gunicorn:
```bash
gunicorn -k eventlet -w 1 -b 0.0.0.0:80 "stellarsis:create_app()"
```

3. 配置 Nginx 反向代理:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 使用 Docker (可选)

创建 `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 80
ENV STELLARSIS_ADMIN_PASSWORD=changeme
CMD ["python", "app.py"]
```

运行:
```bash
docker build -t stellarsis .
docker run -p 80:80 -e STELLARSIS_ADMIN_PASSWORD=your_secure_password -v $(pwd)/stellarsis.db:/app/stellarsis.db stellarsis
```

### 使用service

```bash
sudo ln -sf "$(pwd)/stellarsis.service" /etc/systemd/system/stellarsis.service
sudo systemctl daemon-reload
sudo systemctl enable stellarsis
sudo systemctl start stellarsis
# (请自行修改相关配置)
```


### 环境变量配置 (Environment Variables)

创建 `.env` 文件：
```env
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///stellarsis.db
UPLOAD_FOLDER=static/uploads
ENABLE_FILE_MANAGER=False
ENABLE_SERVER_CONTROL=False
STELLARSIS_ADMIN_PASSWORD=your_secure_password
PORT=80
```

### 从 v1（单文件 app.py）迁移 (Migrating from v1)

如果您从旧版单文件 `app.py` 升级到模块化版本：

```bash
# 1. 备份数据库
cp stellarsis.db stellarsis_backup.db

# 2. 运行迁移脚本（确保所有表和列兼容）
python migrate_to_v2.py

# 3. 设置管理员密码环境变量
export STELLARSIS_ADMIN_PASSWORD="your_secure_password"

# 4. 启动新版本
python app.py
```

> 迁移脚本会自动检测并添加缺失的数据库列和表，同时为管理员授予 `su` 权限。

## 使用指南 / User Guide

### 命令面板 (Command Palette)

按 `:` 键打开命令面板（Bash 风格的快捷命令系统）

#### 基础命令
- `help` - 显示所有可用命令
- `history` / `hist` - 显示命令历史
- `close` / `exit` / `quit` / `q` - 关闭命令面板
- `clear` - 清空命令输出

#### Bash 风格导航命令
- `cd <目录>` - 切换到指定目录/页面
  - `cd /chat` - 聊天室列表
  - `cd /forum` - 论坛分区列表
  - `cd /settings` - 设置页面
  - `cd /admin` - 管理面板
  - `cd ~` 或 `cd /` - 返回首页
- `ls` - 列出所有可用目录
- `pwd` - 显示当前路径

#### 功能命令
- `theme <name>` / `tm <name>` - 切换主题
  - 可用主题：light, mint, ocean, purple, solarized, sunset
  - 示例：`:theme ocean`
- `focus <target>` - 聚焦到指定元素
  - 可用目标：message, chat, search, admin-search
  - 示例：`:focus message`

#### 使用技巧
- **Tab 补全**: 输入命令前缀后按 Tab 键自动补全
- **别名**: 支持短命令别名（如 `q` 代替 `quit`）
- **参数提示**: 输入命令后自动显示可用参数

### 图片上传 (Image Upload)

#### 上传方式
1. **拖拽上传**: 将图片拖到聊天输入框或论坛编辑器
2. **粘贴上传**: 复制图片后按 Ctrl+V 粘贴
3. **选择文件**: 点击上传按钮选择文件

#### 上传限制
- 支持格式：PNG, JPG, JPEG, GIF, WebP
- 单张图片：最大 5MB
- 用户总配额：50MB（可在 config.py 修改）

#### 管理上传的图片
1. 访问设置 → 图片管理
2. 查看所有已上传图片
3. 点击删除按钮移除图片
4. 查看当前使用配额


#### Markdown 快速参考
```markdown
# 标题
**粗体** *斜体*
- 列表项
`代码`
[链接](url)
![图片](url)
```

#### LaTeX 数学公式
```latex
行内公式：$x^2 + y^2 = z^2$
块级公式：
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
```

### 权限系统说明

#### 权限级别
- **su** (超级用户): 完全权限，可管理内容
- **777** (读写): 可查看和发送消息/帖子
- **444** (只读): 只能查看，不能发送
- **Null** (无权限): 无法访问

#### 权限查看
- 聊天室：右上角显示当前权限
- 论坛分区：分区页面显示权限

#### 权限申请
联系管理员为您分配相应区域的权限

### 关注系统

#### 关注用户
1. 访问设置 → 关注列表
2. 搜索用户名
3. 点击关注按钮

#### 关注通知
- 关注的用户上线时，聊天室会显示通知
- 关注的用户离线时，同样显示通知
- 通知会自动合并，避免刷屏

### 快捷键 (Keyboard Shortcuts)

- `:` - 打开命令面板
- `Esc` - 关闭命令面板或模态框
- `Tab` - 命令补全
- `Enter` - 发送消息 / 执行命令
- `Ctrl+V` - 粘贴图片上传

## 项目结构 / Project Structure

```
Stellarsis/
├── app.py                 # 应用入口（~20 行，调用 create_app()）
├── config.py              # 配置文件
├── requirements.txt       # Python 依赖
├── quotes.json           # 名言数据
├── migrate_to_v2.py      # v1→v2 数据库迁移脚本
├── logger_utils.py       # 日志工具
├── stellarsis.db         # SQLite 数据库（运行后生成）
├── stellarsis/            # 核心应用包（模块化架构）
│   ├── __init__.py       # Application Factory (create_app)
│   ├── extensions.py     # 共享扩展 (db_session, socketio, login_manager, limiter)
│   ├── models.py         # SQLAlchemy 数据模型（12 个表）
│   ├── permissions.py    # 权限系统（常量、检查函数、grant_su_to_admins）
│   ├── decorators.py     # 装饰器 (su_required)
│   ├── forms.py          # WTForms 表单
│   ├── utils.py          # 工具函数（消息处理、在线状态、文件、日志）
│   ├── events.py         # Socket.IO 事件处理
│   └── routes/           # Blueprint 路由模块
│       ├── __init__.py   # Blueprint 注册
│       ├── auth.py       # 认证路由 (login/logout/register/profile)
│       ├── chat.py       # 聊天 API 路由
│       ├── forum.py      # 论坛路由
│       ├── admin.py      # 管理后台路由
│       ├── upload.py     # 文件上传路由
│       ├── follow.py     # 关注/取消关注路由
│       └── spa.py        # SPA 页面 + 杂项 API
├── logs/                 # 日志目录
│   └── system.log       # 系统日志
├── static/              # 静态资源
│   ├── spa/             # SPA 前端应用
│   │   ├── app.js       # SPA 主入口
│   │   ├── app.css      # 全局样式
│   │   ├── router.js    # Hash 路由器
│   │   ├── store.js     # 状态管理
│   │   ├── pages.js     # 页面组件
│   │   ├── components.js # UI 组件
│   │   └── utils.js     # 工具函数
│   ├── css/             # 样式文件
│   │   └── vendor/      # 第三方 CSS（Font Awesome 等）
│   ├── js/              # JavaScript 文件
│   │   └── vendor/      # 第三方 JS（Socket.IO、Marked.js 等）
│   └── uploads/         # 用户上传文件
└── templates/           # HTML 模板
    ├── spa.html         # SPA 单页应用入口
    └── errors/          # 错误页面 (403/404/500)
```

## API 文档 / API Documentation

> 所有 API 返回的时间戳均为 ISO 8601 UTC 格式（`Z` 后缀），例如 `2026-02-21T04:32:00.123456Z`。客户端负责转换为本地时区显示。

### 主要 API 端点

#### 聊天 API
- `GET /api/chat/<room_id>/history` - 获取聊天历史
- `POST /api/chat/send` - 发送消息（HTTP）
- `DELETE /api/chat/<room_id>/messages/<message_id>` - 删除消息
- `GET /api/chat/<room_id>/online_count` - 获取在线人数

#### 论坛 API
- `GET /api/forum/thread/<thread_id>/replies` - 获取回复
- `POST /api/forum/reply` - 发表回复
- `DELETE /api/forum/thread/<thread_id>` - 删除帖子
- `DELETE /api/forum/reply/<reply_id>` - 删除回复

#### 用户 API
- `GET /api/follows` - 获取关注列表
- `POST /api/follows` - 关注用户
- `DELETE /api/follows/<followed_id>` - 取消关注
- `GET /api/search_users?username=<query>` - 搜索用户

#### 上传 API
- `POST /api/upload/image` - 上传图片
- `GET /api/upload/images` - 列出已上传图片
- `GET /api/upload/quota` - 查看配额
- `DELETE /api/upload/image/<image_id>` - 删除图片

### WebSocket 事件

#### 客户端发送
- `connect` - 连接到服务器
- `join` - 加入聊天室
- `leave` - 离开聊天室
- `send_message` - 发送消息
- `heartbeat` / `heartbeat_chat` - 心跳
- `get_online_users` - 获取在线用户

#### 服务器推送
- `message` - 新消息
- `user_join` - 用户加入
- `user_leave` - 用户离开
- `online_users` - 在线用户列表
- `online_count` - 在线人数更新
- `followed_user_online` - 关注的用户上线
- `followed_user_offline` - 关注的用户离线

## 常见问题 / FAQ

### 1. 如何修改默认端口？
设置环境变量 `PORT`：
```bash
PORT=5000 python app.py
```

### 2. 如何启用 HTTPS？
使用 Nginx 反向代理并配置 SSL 证书，或使用 Gunicorn + SSL：
```bash
gunicorn -k eventlet -w 1 -b 0.0.0.0:443 --certfile cert.pem --keyfile key.pem "stellarsis:create_app()"
```

### 3. 如何切换到 PostgreSQL？
1. 安装 psycopg2: `pip install psycopg2-binary`
2. 修改 `config.py`:
```python
SQLALCHEMY_DATABASE_URI = 'postgresql://user:pass@localhost/stellarsis'
```

### 4. WebSocket 连接失败怎么办？
系统会自动降级到轮询模式，但检查以下项：
- 防火墙是否开放端口
- Nginx 是否正确配置 WebSocket 升级
- CORS 设置是否正确

### 5. 如何批量导入用户？
使用管理 API 或直接操作数据库：
```python
from stellarsis import create_app
from stellarsis.extensions import db_session
from stellarsis.models import User

app = create_app()
with app.app_context():
    for username, password in users:
        user = User(username=username)
        user.set_password(password)
        db_session.add(user)
    db_session.commit()
```


### 6. 忘记管理员密码怎么办？
使用迁移脚本重置，或直接修改数据库：
```bash
# 方法 1：设置环境变量后删除 admin 用户，重启自动重建
sqlite3 stellarsis.db "DELETE FROM users WHERE username='admin';"
STELLARSIS_ADMIN_PASSWORD=new_secure_password python app.py

# 方法 2：通过 Python 重置密码
python -c "
from stellarsis import create_app
from stellarsis.extensions import db_session
from stellarsis.models import User
app = create_app()
with app.app_context():
    admin = db_session.query(User).filter_by(username='admin').first()
    admin.set_password('new_password')
    db_session.commit()
"
```

## 贡献指南 / Contributing

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- Python: 遵循 PEP 8
- JavaScript: 使用 ES6+ 语法
- 注释: 中英文双语注释
- 提交信息: 清晰描述改动

## 许可证 / License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢 / Acknowledgments

- Flask 和 Flask-SocketIO 社区
- Marked.js 和 Socket.IO 项目
- 所有贡献者和用户

## 联系方式 / Contact

- GitHub Issues: https://github.com/w1010tdev/Stellarsis/issues
- 项目主页: https://github.com/w1010tdev/Stellarsis

---

**文档版本**: 3.0  
**最后更新**: 2026-02-21
