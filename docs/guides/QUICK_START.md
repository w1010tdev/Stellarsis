# Stellarsis 快速入门指南 / Quick Start Guide

[English](#english-version) | [中文](#中文版本)

---

## 中文版本

### 概述

本指南将帮助你在几分钟内完成 Stellarsis 的安装和运行。Stellarsis 是一个功能丰富的实时聊天和论坛系统，支持用户关注、权限管理、实时消息通知等高级功能。

### 前置要求

在开始之前，请确保你的系统已安装以下软件：

#### 必需软件
- **Python 3.7+** (推荐 3.9 或更高版本)
  - 检查版本：`python --version` 或 `python3 --version`
  - 下载地址：https://www.python.org/downloads/
  
- **pip** (Python 包管理器，通常随 Python 一起安装)
  - 检查版本：`pip --version` 或 `pip3 --version`

#### 可选软件（推荐）
- **Git** - 用于克隆仓库
  - 检查版本：`git --version`
  - 下载地址：https://git-scm.com/downloads

- **虚拟环境工具** (`venv` 或 `virtualenv`)
  - Python 3.3+ 自带 `venv` 模块

#### 系统要求
- **操作系统**：Linux / macOS / Windows
- **内存**：至少 512MB RAM（推荐 1GB+）
- **磁盘空间**：至少 500MB 可用空间
- **浏览器**：现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）

---

### 安装步骤

#### 方法一：从 Release 下载（推荐用于生产环境）

1. **下载最新稳定版本**

   访问 [Release 页面](https://github.com/w1010tdev/Stellarsis/releases/latest) 下载最新版本的压缩包。

   ```bash
   # 下载并解压（Linux/macOS）
   wget https://github.com/w1010tdev/Stellarsis/releases/latest/download/stellarsis.tar.gz
   tar -xzf stellarsis.tar.gz
   cd Stellarsis
   ```

2. **跳到步骤 3（安装依赖）**

#### 方法二：从 Git 仓库克隆（推荐用于开发）

1. **克隆仓库**

   ```bash
   # HTTPS 方式（推荐）
   git clone https://github.com/w1010tdev/Stellarsis.git
   cd Stellarsis

   # 或 SSH 方式
   git clone git@github.com:w1010tdev/Stellarsis.git
   cd Stellarsis
   ```

2. **（可选）切换到稳定分支**

   ```bash
   # 查看所有分支
   git branch -a
   
   # 切换到最新的稳定版本标签（如果有）
   git checkout tags/v1.0.0  # 替换为实际版本号
   ```

#### 方法三：离线安装包

如果因网络问题无法克隆仓库，可以访问离线安装包：

- 地址：https://pan.huang1111.cn/s/zMm6ZcM
- 下载后解压并进入项目目录

---

#### 3. 创建虚拟环境（强烈推荐）

虚拟环境可以隔离项目依赖，避免与系统 Python 包冲突。

```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows (CMD)
python -m venv venv
venv\Scripts\activate.bat

# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1
```

**提示**：激活虚拟环境后，命令行提示符前会显示 `(venv)`。

#### 4. 安装 Python 依赖

```bash
# 使用清华镜像源（推荐中国大陆用户）
pip install -r requirements.txt -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple

# 如果清华镜像不可用，使用默认源
pip install -r requirements.txt

# 或使用其他镜像源
pip install -r requirements.txt -i https://pypi.douban.com/simple
```

**依赖列表**（自动安装）：
- Flask 3.1.2 - Web 框架
- Flask-SocketIO 5.5.1 - WebSocket 支持
- Flask-Login 0.6.3 - 用户认证
- Flask-WTF 1.2.2 - 表单处理
- Flask-SQLAlchemy 3.1.1 - 数据库 ORM
- eventlet 0.40.3 - 异步支持
- python-dotenv 1.2.1 - 环境变量管理
- psutil 7.1.3 - 系统监控
- Pillow 10.0.1 - 图片处理
- Flask-Limiter 4.1.1 - 速率限制

**安装验证**：
```bash
pip list | grep -i flask
```

#### 5. 配置应用

创建 `.env` 文件（可选，用于环境变量配置）：

```bash
# 创建 .env 文件
cat > .env << 'EOF'
# 密钥配置（生产环境必须修改！）
SECRET_KEY=your-random-secret-key-change-this-in-production

# 数据库配置
DATABASE_URL=sqlite:///stellarsis.db

# 上传配置
UPLOAD_FOLDER=static/uploads

# 功能开关（生产环境建议关闭）
ENABLE_FILE_MANAGER=False
ENABLE_SERVER_CONTROL=False
ENABLE_FILE_UPLOAD=False
EOF
```

**或者直接编辑 `config.py`**：

```bash
# 使用文本编辑器打开 config.py
nano config.py   # 或 vim, code, notepad 等
```

**关键配置项**：
- `SECRET_KEY`: Flask 会话密钥（**生产环境务必修改！**）
- `SQLALCHEMY_DATABASE_URI`: 数据库连接字符串
- `DEBUG`: 调试模式（生产环境设为 `False`）
- `ONLINE_TIMEOUT`: 在线超时时间（秒，默认 30）
- `USER_UPLOAD_QUOTA`: 用户上传配额（字节，默认 50MB）

---

### 运行应用

#### 开发模式运行

1. **启动应用**

   ```bash
   # Linux / macOS（使用启动脚本）
   bash start.sh

   # 或直接运行 Python
   python app.py
   # 或（如果使用虚拟环境）
   venv/bin/python app.py

   # Windows
   python app.py
   # 或
   venv\Scripts\python.exe app.py
   ```

2. **查看启动日志**

   正常启动后，你应该看到类似输出：

   ```
   * Running on http://0.0.0.0:5000
   * Restarting with stat
   * Debugger is active!
   ```

3. **访问应用**

   - **本地访问**：http://localhost:5000
   - **局域网访问**：http://YOUR-IP:5000
     - 查看本机 IP：`ifconfig`（Linux/macOS）或 `ipconfig`（Windows）
   - **公网访问**：需配置端口转发或使用 Nginx 反向代理

#### 生产模式运行

生产环境推荐使用 Gunicorn（详见 [DEPLOYMENT.md](DEPLOYMENT.md)）：

```bash
# 安装 Gunicorn
pip install gunicorn eventlet

# 运行（单进程，eventlet worker）
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app

# 后台运行
nohup gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app > gunicorn.log 2>&1 &
```

---

### 首次登录和设置

#### 1. 访问登录页面

浏览器打开 http://localhost:5000，你会看到登录页面。

#### 2. 使用默认管理员账户登录

- **用户名**：`admin`
- **密码**：`admin123`

**⚠️ 安全警告**：首次登录后**立即修改默认密码**！

#### 3. 修改管理员密码

登录后，点击右上角用户名 → **设置** → **修改密码**

或访问：http://localhost:5000/settings/password

1. 输入旧密码：`admin123`
2. 输入新密码（至少 6 位）
3. 确认新密码
4. 点击"修改密码"

#### 4. 基本设置

访问 **设置** 页面配置个人信息：

- **昵称**：显示在聊天和论坛中的名字
- **用户颜色**：聊天消息的昵称颜色（十六进制，如 `#3498db`）
- **徽章**：个人标识（最多 20 个字符）
- **主题**：选择喜欢的界面主题（light, mint, ocean, purple 等）

#### 5. 浏览应用

- **首页**：http://localhost:5000
- **聊天室列表**：http://localhost:5000/chat/list
- **论坛列表**：http://localhost:5000/forum/list
- **管理面板**：http://localhost:5000/admin/index（仅管理员）

---

### 创建测试数据

#### 1. 创建测试用户

访问 **管理面板** → **用户管理** → **创建用户**

或使用 Python 脚本：

```python
# create_test_users.py
from app import db_session, User

# 创建测试用户
users = [
    {"username": "alice", "password": "password123", "nickname": "Alice", "role": "user"},
    {"username": "bob", "password": "password123", "nickname": "Bob", "role": "user"},
    {"username": "charlie", "password": "password123", "nickname": "Charlie", "role": "user"},
]

for user_data in users:
    user = User(
        username=user_data["username"],
        nickname=user_data["nickname"],
        role=user_data["role"]
    )
    user.password_hash = user_data["password"]  # 生产环境应使用加密
    db_session.add(user)

db_session.commit()
print(f"Created {len(users)} test users")
```

运行脚本：
```bash
python create_test_users.py
```

#### 2. 创建聊天室

访问 **管理面板** → **聊天室管理** → **创建聊天室**

填写信息：
- **房间名称**：例如 "技术讨论"、"闲聊水区"
- **房间描述**：简短介绍聊天室主题

或使用 Python：

```python
from app import db_session, ChatRoom

rooms = [
    {"name": "技术讨论", "description": "讨论编程和技术话题"},
    {"name": "闲聊水区", "description": "自由聊天，轻松愉快"},
    {"name": "项目协作", "description": "项目相关讨论"},
]

for room_data in rooms:
    room = ChatRoom(name=room_data["name"], description=room_data["description"])
    db_session.add(room)

db_session.commit()
```

#### 3. 创建论坛分区

访问 **管理面板** → **论坛管理** → **创建分区**

填写信息：
- **分区名称**：例如 "公告板"、"反馈建议"
- **分区描述**：介绍分区用途

或使用 Python：

```python
from app import db_session, ForumSection

sections = [
    {"name": "公告板", "description": "网站公告和通知"},
    {"name": "反馈建议", "description": "用户反馈和功能建议"},
    {"name": "技术交流", "description": "技术问题讨论区"},
]

for section_data in sections:
    section = ForumSection(name=section_data["name"], description=section_data["description"])
    db_session.add(section)

db_session.commit()
```

#### 4. 设置权限

为测试用户分配权限：

访问 **管理面板** → **用户管理** → 选择用户 → **编辑权限**

权限级别说明：
- **su** (超级用户)：完全权限，可管理内容
- **777** (读写)：可查看和发送消息/帖子
- **444** (只读)：只能查看，不能发送
- **Null** (无权限)：无法访问

为新用户分配权限：
1. 选择聊天室或论坛分区
2. 设置权限级别为 `777`（允许发送）
3. 保存

#### 5. 发送测试消息

使用不同的测试账户登录，发送聊天消息和论坛帖子，测试功能是否正常。

**聊天室测试**：
1. 登录 alice 账户
2. 进入"技术讨论"聊天室
3. 发送消息："Hello, this is a test message!"
4. 尝试上传图片、使用 Markdown 格式

**论坛测试**：
1. 进入"反馈建议"分区
2. 创建新帖子："测试帖子"
3. 发布回复
4. 测试 LaTeX 公式：`$E = mc^2$`

---

### 常见开发任务

#### 1. 查看日志

系统日志位于 `logs/system.log`：

```bash
# 实时查看日志
tail -f logs/system.log

# 查看最后 50 行
tail -n 50 logs/system.log

# 搜索错误
grep -i error logs/system.log
```

#### 2. 重启应用

```bash
# 如果在前台运行，按 Ctrl+C 停止，然后重新运行
python app.py

# 如果使用 Gunicorn 后台运行
# 查找进程 ID
ps aux | grep gunicorn

# 停止进程
kill <PID>

# 重新启动
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app
```

#### 3. 数据库操作

**备份数据库**：

```bash
# SQLite 备份
cp stellarsis.db stellarsis_backup_$(date +%Y%m%d_%H%M%S).db

# 或压缩备份
tar -czf stellarsis_backup_$(date +%Y%m%d_%H%M%S).tar.gz stellarsis.db static/uploads/
```

**重置数据库**：

```bash
# ⚠️ 警告：这会删除所有数据！
rm stellarsis.db
python app.py  # 重新启动会自动创建数据库
```

**查看数据库内容**：

```bash
# 使用 SQLite 命令行工具
sqlite3 stellarsis.db

# 常用命令
.tables                    # 列出所有表
.schema users              # 查看 users 表结构
SELECT * FROM users;       # 查询所有用户
.quit                      # 退出
```

#### 4. 清除缓存和临时文件

```bash
# 清除 Python 缓存
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# 清除上传文件（测试环境）
rm -rf static/uploads/*

# 清除日志
> logs/system.log  # 清空日志文件
```

#### 5. 更新依赖

```bash
# 查看当前安装的包
pip list

# 检查可更新的包
pip list --outdated

# 更新所有包（不推荐）
pip install --upgrade -r requirements.txt

# 更新特定包
pip install --upgrade flask
```

#### 6. 运行测试

```bash
# 如果项目包含测试文件
python test.py

# 或使用 pytest（需要先安装）
pip install pytest
pytest
```

#### 7. 代码格式化（推荐）

使用 Black 和 Flake8 保持代码风格一致：

```bash
# 安装工具
pip install black flake8

# 格式化 Python 代码
black app.py config.py

# 检查代码风格
flake8 app.py --max-line-length=100
```

#### 8. 性能监控

查看应用资源使用：

```bash
# 查看 Python 进程
ps aux | grep python

# 实时监控（Linux）
htop

# 查看端口占用
lsof -i :5000   # Linux/macOS
netstat -ano | findstr :5000   # Windows
```

#### 9. 修改端口

编辑 `app.py` 最后一行：

```python
# 原代码
socketio.run(app, host='0.0.0.0', port=5000, debug=True)

# 修改为其他端口（例如 8080）
socketio.run(app, host='0.0.0.0', port=8080, debug=True)
```

#### 10. 启用/禁用功能

编辑 `config.py` 或 `.env` 文件：

```python
# config.py

# 启用文件上传功能
ENABLE_FILE_UPLOAD = True
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'md'}

# 启用文件管理器（仅在可信环境）
ENABLE_FILE_MANAGER = True

# 启用服务器控制功能（仅在可信环境）
ENABLE_SERVER_CONTROL = True
```

---

### 下一步

恭喜！你已经成功安装并运行了 Stellarsis。接下来你可以：

1. **阅读用户指南**：了解如何使用聊天、论坛、权限等功能
   - [Markdown & LaTeX 快速入门](../Markdown_LaTeX_Quickstart.md)
   - [权限系统说明](../PERMISSION_SYSTEM.md)
   - [命令面板指南](../COMMAND_PALETTE.md)

2. **部署到生产环境**：
   - [部署指南](DEPLOYMENT.md)

3. **参与贡献**：
   - [贡献指南](CONTRIBUTING.md)
   - [API 文档](../ROUTES_AND_WEBSOCKETS.md)
   - [数据库架构](../DATABASE_SCHEMA.md)

4. **探索高级功能**：
   - 用户关注系统
   - 图片上传管理
   - 多主题切换
   - 命令面板（按 `:` 键打开）

---

### 故障排除

#### 问题 1：`ModuleNotFoundError: No module named 'xxx'`

**原因**：依赖包未正确安装

**解决方法**：
```bash
# 确保虚拟环境已激活
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# 重新安装依赖
pip install -r requirements.txt
```

#### 问题 2：端口 5000 已被占用

**错误信息**：`Address already in use`

**解决方法**：

```bash
# Linux/macOS - 查找占用进程
lsof -i :5000
kill <PID>

# Windows - 查找并结束进程
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# 或修改应用端口（见上文"修改端口"）
```

#### 问题 3：数据库错误

**错误信息**：`OperationalError: database is locked`

**解决方法**：
- 关闭所有访问数据库的进程
- 检查是否有多个应用实例运行
- 重启应用

#### 问题 4：静态文件 404

**原因**：静态文件路径配置错误

**解决方法**：
```bash
# 确保 static 目录存在
ls -la static/

# 检查文件权限
chmod -R 755 static/

# 查看 Flask 日志确认路径
```

#### 问题 5：WebSocket 连接失败

**现象**：聊天消息无法实时更新

**解决方法**：
- 检查浏览器控制台是否有错误
- 系统会自动降级到轮询模式
- 检查防火墙设置
- 确保 eventlet 已正确安装

#### 问题 6：无法上传图片

**可能原因**：
1. 上传文件夹不存在或无权限
2. 文件大小超过限制
3. 文件格式不支持

**解决方法**：
```bash
# 创建上传目录
mkdir -p static/uploads
chmod 755 static/uploads

# 检查配置
grep -i upload config.py

# 查看错误日志
tail -f logs/system.log
```

---

### 获取帮助

如果遇到问题，可以：

1. **查看文档**：阅读 `docs/` 目录下的详细文档
2. **查看日志**：`logs/system.log` 包含详细错误信息
3. **提交 Issue**：https://github.com/w1010tdev/Stellarsis/issues
4. **参考 README**：主 README 文件包含常见问题解答

---

## English Version

### Overview

This guide will help you install and run Stellarsis in minutes. Stellarsis is a feature-rich real-time chat and forum system with advanced features like user following, permission management, and real-time notifications.

### Prerequisites

Before you begin, ensure your system has the following software installed:

#### Required Software
- **Python 3.7+** (3.9 or higher recommended)
  - Check version: `python --version` or `python3 --version`
  - Download: https://www.python.org/downloads/
  
- **pip** (Python package manager, usually comes with Python)
  - Check version: `pip --version` or `pip3 --version`

#### Optional Software (Recommended)
- **Git** - For cloning the repository
  - Check version: `git --version`
  - Download: https://git-scm.com/downloads

- **Virtual environment tools** (`venv` or `virtualenv`)
  - Python 3.3+ includes `venv` module

#### System Requirements
- **Operating System**: Linux / macOS / Windows
- **RAM**: At least 512MB (1GB+ recommended)
- **Disk Space**: At least 500MB available
- **Browser**: Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

### Installation Steps

#### Method 1: Download from Release (Recommended for Production)

1. **Download Latest Stable Version**

   Visit the [Release Page](https://github.com/w1010tdev/Stellarsis/releases/latest) to download the latest version.

   ```bash
   # Download and extract (Linux/macOS)
   wget https://github.com/w1010tdev/Stellarsis/releases/latest/download/stellarsis.tar.gz
   tar -xzf stellarsis.tar.gz
   cd Stellarsis
   ```

2. **Skip to Step 3 (Install Dependencies)**

#### Method 2: Clone from Git Repository (Recommended for Development)

1. **Clone Repository**

   ```bash
   # HTTPS method (recommended)
   git clone https://github.com/w1010tdev/Stellarsis.git
   cd Stellarsis

   # Or SSH method
   git clone git@github.com:w1010tdev/Stellarsis.git
   cd Stellarsis
   ```

2. **(Optional) Switch to Stable Branch**

   ```bash
   # List all branches
   git branch -a
   
   # Checkout latest stable tag (if available)
   git checkout tags/v1.0.0  # Replace with actual version
   ```

#### Method 3: Offline Installation Package

If network issues prevent cloning, download the offline package:

- URL: https://pan.huang1111.cn/s/zMm6ZcM
- Extract and enter the project directory

---

#### 3. Create Virtual Environment (Highly Recommended)

Virtual environments isolate project dependencies from system Python packages.

```bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows (CMD)
python -m venv venv
venv\Scripts\activate.bat

# Windows (PowerShell)
python -m venv venv
venv\Scripts\Activate.ps1
```

**Tip**: After activation, you'll see `(venv)` in your command prompt.

#### 4. Install Python Dependencies

```bash
# Using Tsinghua mirror (recommended for China)
pip install -r requirements.txt -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple

# If Tsinghua mirror unavailable, use default
pip install -r requirements.txt

# Or use other mirrors
pip install -r requirements.txt -i https://pypi.douban.com/simple
```

**Dependencies** (automatically installed):
- Flask 3.1.2 - Web framework
- Flask-SocketIO 5.5.1 - WebSocket support
- Flask-Login 0.6.3 - User authentication
- Flask-WTF 1.2.2 - Form handling
- Flask-SQLAlchemy 3.1.1 - Database ORM
- eventlet 0.40.3 - Async support
- python-dotenv 1.2.1 - Environment variables
- psutil 7.1.3 - System monitoring
- Pillow 10.0.1 - Image processing
- Flask-Limiter 4.1.1 - Rate limiting

**Verify Installation**:
```bash
pip list | grep -i flask
```

#### 5. Configure Application

Create `.env` file (optional, for environment variables):

```bash
# Create .env file
cat > .env << 'EOF'
# Secret key (MUST change in production!)
SECRET_KEY=your-random-secret-key-change-this-in-production

# Database configuration
DATABASE_URL=sqlite:///stellarsis.db

# Upload configuration
UPLOAD_FOLDER=static/uploads

# Feature toggles (recommended off in production)
ENABLE_FILE_MANAGER=False
ENABLE_SERVER_CONTROL=False
ENABLE_FILE_UPLOAD=False
EOF
```

**Or edit `config.py` directly**:

```bash
# Open config.py with text editor
nano config.py   # or vim, code, notepad, etc.
```

**Key Configuration Options**:
- `SECRET_KEY`: Flask session key (**MUST change in production!**)
- `SQLALCHEMY_DATABASE_URI`: Database connection string
- `DEBUG`: Debug mode (set to `False` in production)
- `ONLINE_TIMEOUT`: Online timeout in seconds (default 30)
- `USER_UPLOAD_QUOTA`: User upload quota in bytes (default 50MB)

---

### Running the Application

#### Development Mode

1. **Start Application**

   ```bash
   # Linux / macOS (using start script)
   bash start.sh

   # Or run Python directly
   python app.py
   # Or (if using virtual environment)
   venv/bin/python app.py

   # Windows
   python app.py
   # Or
   venv\Scripts\python.exe app.py
   ```

2. **Check Startup Logs**

   On successful startup, you should see:

   ```
   * Running on http://0.0.0.0:5000
   * Restarting with stat
   * Debugger is active!
   ```

3. **Access Application**

   - **Local Access**: http://localhost:5000
   - **LAN Access**: http://YOUR-IP:5000
     - Find your IP: `ifconfig` (Linux/macOS) or `ipconfig` (Windows)
   - **Public Access**: Requires port forwarding or Nginx reverse proxy

#### Production Mode

For production, use Gunicorn (see [DEPLOYMENT.md](DEPLOYMENT.md)):

```bash
# Install Gunicorn
pip install gunicorn eventlet

# Run (single process, eventlet worker)
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app

# Run in background
nohup gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app > gunicorn.log 2>&1 &
```

---

### First Login and Setup

#### 1. Access Login Page

Open http://localhost:5000 in your browser to see the login page.

#### 2. Login with Default Admin Account

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Security Warning**: Change the default password immediately after first login!

#### 3. Change Admin Password

After login, click username (top right) → **Settings** → **Change Password**

Or visit: http://localhost:5000/settings/password

1. Enter old password: `admin123`
2. Enter new password (at least 6 characters)
3. Confirm new password
4. Click "Change Password"

#### 4. Basic Settings

Visit **Settings** page to configure your profile:

- **Nickname**: Display name in chat and forum
- **User Color**: Nickname color in chat (hex color, e.g., `#3498db`)
- **Badge**: Personal identifier (max 20 characters)
- **Theme**: Choose your preferred UI theme (light, mint, ocean, purple, etc.)

#### 5. Explore the Application

- **Home**: http://localhost:5000
- **Chat Rooms**: http://localhost:5000/chat/list
- **Forum**: http://localhost:5000/forum/list
- **Admin Panel**: http://localhost:5000/admin/index (admins only)

---

### Creating Test Data

#### 1. Create Test Users

Visit **Admin Panel** → **User Management** → **Create User**

Or use Python script:

```python
# create_test_users.py
from app import db_session, User

# Create test users
users = [
    {"username": "alice", "password": "password123", "nickname": "Alice", "role": "user"},
    {"username": "bob", "password": "password123", "nickname": "Bob", "role": "user"},
    {"username": "charlie", "password": "password123", "nickname": "Charlie", "role": "user"},
]

for user_data in users:
    user = User(
        username=user_data["username"],
        nickname=user_data["nickname"],
        role=user_data["role"]
    )
    user.password_hash = user_data["password"]  # Use encryption in production
    db_session.add(user)

db_session.commit()
print(f"Created {len(users)} test users")
```

Run script:
```bash
python create_test_users.py
```

#### 2. Create Chat Rooms

Visit **Admin Panel** → **Chat Room Management** → **Create Chat Room**

Fill in:
- **Room Name**: e.g., "Tech Discussion", "General Chat"
- **Room Description**: Brief description of the room's topic

Or use Python:

```python
from app import db_session, ChatRoom

rooms = [
    {"name": "Tech Discussion", "description": "Discuss programming and technology"},
    {"name": "General Chat", "description": "Free chat, relax and have fun"},
    {"name": "Project Collaboration", "description": "Project-related discussions"},
]

for room_data in rooms:
    room = ChatRoom(name=room_data["name"], description=room_data["description"])
    db_session.add(room)

db_session.commit()
```

#### 3. Create Forum Sections

Visit **Admin Panel** → **Forum Management** → **Create Section**

Fill in:
- **Section Name**: e.g., "Announcements", "Feedback"
- **Section Description**: Purpose of the section

Or use Python:

```python
from app import db_session, ForumSection

sections = [
    {"name": "Announcements", "description": "Site announcements and notices"},
    {"name": "Feedback", "description": "User feedback and feature suggestions"},
    {"name": "Tech Exchange", "description": "Technical Q&A area"},
]

for section_data in sections:
    section = ForumSection(name=section_data["name"], description=section_data["description"])
    db_session.add(section)

db_session.commit()
```

#### 4. Set Permissions

Assign permissions to test users:

Visit **Admin Panel** → **User Management** → Select User → **Edit Permissions**

Permission levels:
- **su** (superuser): Full permissions, can manage content
- **777** (read-write): Can view and send messages/posts
- **444** (read-only): Can only view, cannot send
- **Null** (no permission): Cannot access

Assign permissions to new users:
1. Select chat room or forum section
2. Set permission level to `777` (allow sending)
3. Save

#### 5. Send Test Messages

Login with different test accounts, send chat messages and forum posts to test functionality.

**Chat Room Test**:
1. Login as alice
2. Enter "Tech Discussion" chat room
3. Send message: "Hello, this is a test message!"
4. Try uploading images, using Markdown formatting

**Forum Test**:
1. Enter "Feedback" section
2. Create new thread: "Test Thread"
3. Post reply
4. Test LaTeX formula: `$E = mc^2$`

---

### Common Development Tasks

#### 1. View Logs

System logs are in `logs/system.log`:

```bash
# Watch logs in real-time
tail -f logs/system.log

# View last 50 lines
tail -n 50 logs/system.log

# Search for errors
grep -i error logs/system.log
```

#### 2. Restart Application

```bash
# If running in foreground, press Ctrl+C to stop, then restart
python app.py

# If running Gunicorn in background
# Find process ID
ps aux | grep gunicorn

# Stop process
kill <PID>

# Restart
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app
```

#### 3. Database Operations

**Backup Database**:

```bash
# SQLite backup
cp stellarsis.db stellarsis_backup_$(date +%Y%m%d_%H%M%S).db

# Or compressed backup
tar -czf stellarsis_backup_$(date +%Y%m%d_%H%M%S).tar.gz stellarsis.db static/uploads/
```

**Reset Database**:

```bash
# ⚠️ Warning: This will delete all data!
rm stellarsis.db
python app.py  # Restart to auto-create database
```

**View Database Content**:

```bash
# Use SQLite CLI
sqlite3 stellarsis.db

# Common commands
.tables                    # List all tables
.schema users              # Show users table structure
SELECT * FROM users;       # Query all users
.quit                      # Exit
```

#### 4. Clear Cache and Temporary Files

```bash
# Clear Python cache
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Clear uploaded files (test environment)
rm -rf static/uploads/*

# Clear logs
> logs/system.log  # Empty log file
```

#### 5. Update Dependencies

```bash
# View installed packages
pip list

# Check outdated packages
pip list --outdated

# Update all packages (not recommended)
pip install --upgrade -r requirements.txt

# Update specific package
pip install --upgrade flask
```

#### 6. Run Tests

```bash
# If project contains test files
python test.py

# Or use pytest (install first)
pip install pytest
pytest
```

#### 7. Code Formatting (Recommended)

Use Black and Flake8 to maintain consistent code style:

```bash
# Install tools
pip install black flake8

# Format Python code
black app.py config.py

# Check code style
flake8 app.py --max-line-length=100
```

#### 8. Performance Monitoring

Monitor application resource usage:

```bash
# View Python processes
ps aux | grep python

# Real-time monitoring (Linux)
htop

# Check port usage
lsof -i :5000   # Linux/macOS
netstat -ano | findstr :5000   # Windows
```

#### 9. Change Port

Edit last line of `app.py`:

```python
# Original code
socketio.run(app, host='0.0.0.0', port=5000, debug=True)

# Change to different port (e.g., 8080)
socketio.run(app, host='0.0.0.0', port=8080, debug=True)
```

#### 10. Enable/Disable Features

Edit `config.py` or `.env` file:

```python
# config.py

# Enable file upload
ENABLE_FILE_UPLOAD = True
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'md'}

# Enable file manager (trusted environment only)
ENABLE_FILE_MANAGER = True

# Enable server control (trusted environment only)
ENABLE_SERVER_CONTROL = True
```

---

### Next Steps

Congratulations! You've successfully installed and run Stellarsis. Next, you can:

1. **Read User Guides**: Learn how to use chat, forum, permissions, etc.
   - [Markdown & LaTeX Quickstart](../Markdown_LaTeX_Quickstart.md)
   - [Permission System](../PERMISSION_SYSTEM.md)
   - [Command Palette Guide](../COMMAND_PALETTE.md)

2. **Deploy to Production**:
   - [Deployment Guide](DEPLOYMENT.md)

3. **Contribute**:
   - [Contributing Guide](CONTRIBUTING.md)
   - [API Documentation](../ROUTES_AND_WEBSOCKETS.md)
   - [Database Schema](../DATABASE_SCHEMA.md)

4. **Explore Advanced Features**:
   - User following system
   - Image upload management
   - Multi-theme switching
   - Command palette (press `:` key)

---

### Troubleshooting

#### Issue 1: `ModuleNotFoundError: No module named 'xxx'`

**Cause**: Dependencies not properly installed

**Solution**:
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### Issue 2: Port 5000 Already in Use

**Error**: `Address already in use`

**Solution**:

```bash
# Linux/macOS - Find process
lsof -i :5000
kill <PID>

# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change application port (see "Change Port" above)
```

#### Issue 3: Database Error

**Error**: `OperationalError: database is locked`

**Solution**:
- Close all processes accessing the database
- Check if multiple app instances are running
- Restart application

#### Issue 4: Static Files 404

**Cause**: Static file path misconfigured

**Solution**:
```bash
# Ensure static directory exists
ls -la static/

# Check file permissions
chmod -R 755 static/

# Check Flask logs to confirm path
```

#### Issue 5: WebSocket Connection Failed

**Symptom**: Chat messages don't update in real-time

**Solution**:
- Check browser console for errors
- System automatically falls back to polling mode
- Check firewall settings
- Ensure eventlet is correctly installed

#### Issue 6: Cannot Upload Images

**Possible Causes**:
1. Upload folder doesn't exist or lacks permissions
2. File size exceeds limit
3. File format not supported

**Solution**:
```bash
# Create upload directory
mkdir -p static/uploads
chmod 755 static/uploads

# Check configuration
grep -i upload config.py

# View error logs
tail -f logs/system.log
```

---

### Getting Help

If you encounter issues:

1. **Read Documentation**: Check detailed docs in `docs/` directory
2. **Check Logs**: `logs/system.log` contains detailed error information
3. **Submit Issue**: https://github.com/w1010tdev/Stellarsis/issues
4. **See README**: Main README file contains FAQ

---

**Document Version**: 1.0  
**Last Updated**: 2024-02-10
