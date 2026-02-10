# Stellarsis 后端架构文档 / Backend Architecture Documentation

本文档详细描述 Stellarsis 系统的后端架构、核心组件和设计理念。

This document provides a comprehensive overview of Stellarsis backend architecture, core components, and design principles.

---

## 目录 / Table of Contents

1. [技术栈 / Tech Stack](#技术栈--tech-stack)
2. [项目结构 / Project Structure](#项目结构--project-structure)
3. [核心组件 / Core Components](#核心组件--core-components)
4. [配置管理 / Configuration Management](#配置管理--configuration-management)
5. [安全机制 / Security Mechanisms](#安全机制--security-mechanisms)
6. [性能与扩展性 / Performance and Scalability](#性能与扩展性--performance-and-scalability)

---

## 技术栈 / Tech Stack

### 核心框架 / Core Framework

| 组件 / Component | 技术 / Technology | 版本 / Version | 用途 / Purpose |
|---|---|---|---|
| Web 框架 | Flask | 3.1.2 | HTTP 路由、请求处理 / HTTP routing, request handling |
| 数据库 ORM | SQLAlchemy | 3.1.1 | 数据库抽象层 / Database abstraction layer |
| 实时通信 | Flask-SocketIO | 5.5.1 | WebSocket 实时通信 / Real-time WebSocket communication |
| 异步运行时 | Eventlet | 0.40.3 | 协程支持、异步 I/O / Coroutine support, async I/O |
| 用户认证 | Flask-Login | 0.6.3 | 用户会话管理 / User session management |
| 表单验证 | Flask-WTF | 1.2.2 | CSRF 保护、表单验证 / CSRF protection, form validation |
| 跨域支持 | Flask-CORS | 6.0.1 | CORS 配置 / CORS configuration |
| 速率限制 | Flask-Limiter | 4.1.1 | API 速率限制 / API rate limiting |

### 辅助库 / Supporting Libraries

| 库 / Library | 版本 / Version | 用途 / Purpose |
|---|---|---|
| Werkzeug | 3.1.3 | 密码哈希、安全工具 / Password hashing, security utilities |
| Pillow | 10.0.1 | 图片处理 / Image processing |
| psutil | 7.1.3 | 系统信息监控 / System information monitoring |
| python-dotenv | 1.2.1 | 环境变量管理 / Environment variable management |
| requests | 2.31.0 | HTTP 请求 / HTTP requests |

### 数据库支持 / Database Support

- **默认 / Default**: SQLite（开发环境 / Development）
- **生产可选 / Production Options**: PostgreSQL, MySQL
- **ORM**: SQLAlchemy（支持多数据库 / Multi-database support）

---

## 项目结构 / Project Structure

```
Stellarsis/
├── app.py                      # 主应用程序文件 / Main application file (4428 lines)
├── config.py                   # 配置管理 / Configuration management
├── requirements.txt            # Python 依赖 / Python dependencies
├── start.sh                    # 启动脚本 / Startup script
├── quotes.json                 # 名言数据 / Quotes data
│
├── static/                     # 静态资源 / Static assets
│   ├── css/                    # 样式文件 / Stylesheets
│   ├── js/                     # JavaScript 文件 / JavaScript files
│   └── uploads/                # 用户上传文件 / User uploaded files
│       ├── images/             # 图片文件 / Image files
│       └── files/              # 其他文件 / Other files
│
├── templates/                  # Jinja2 模板 / Jinja2 templates
│   ├── index.html              # 主页 / Home page
│   ├── login.html              # 登录页 / Login page
│   ├── chat/                   # 聊天室模板 / Chat templates
│   ├── forum/                  # 论坛模板 / Forum templates
│   └── admin/                  # 管理后台模板 / Admin templates
│
├── logs/                       # 日志文件 / Log files
│   ├── system.log              # 系统日志 / System logs
│   ├── admin.log               # 管理操作日志 / Admin action logs
│   └── auth.log                # 认证日志 / Authentication logs (未实现 / Not implemented)
│
├── docs/                       # 文档 / Documentation
│   ├── backend/                # 后端文档 / Backend documentation
│   │   ├── ARCHITECTURE.md     # 本文档 / This document
│   │   ├── DATABASE.md         # 数据库文档 / Database documentation
│   │   ├── API.md              # API 文档 / API documentation
│   │   └── LOGGING.md          # 日志文档 / Logging documentation
│   ├── DATABASE_SCHEMA.md      # 数据库架构（旧） / Database schema (legacy)
│   ├── ROUTES_AND_WEBSOCKETS.md # 路由索引（旧） / Routes index (legacy)
│   ├── PERMISSION_SYSTEM.md    # 权限系统 / Permission system
│   └── ...
│
└── stellarsis.db               # SQLite 数据库文件 / SQLite database file
```

---

## 核心组件 / Core Components

### 1. 应用初始化 / Application Initialization

#### 初始化流程 / Initialization Flow

```python
# 1. Flask 应用创建 / Flask application creation
app = Flask(__name__)
app.config.from_object(Config)

# 2. 日志系统初始化 / Logging system initialization
log_dir = Path(app.root_path) / 'logs'
log_dir.mkdir(exist_ok=True)
handler = RotatingFileHandler('logs/system.log', maxBytes=10MB, backupCount=5)
logger.addHandler(handler)

# 3. 数据库引擎初始化 / Database engine initialization
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
db_session = scoped_session(sessionmaker(bind=engine))

# 4. Socket.IO 初始化 / Socket.IO initialization
socketio = SocketIO(app, async_mode='eventlet', cors_allowed_origins='*')

# 5. 登录管理器初始化 / Login manager initialization
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# 6. 速率限制器初始化 / Rate limiter initialization
limiter = Limiter(app, key_func=get_remote_address, storage_uri="memory://")
```

#### 启动时数据库迁移 / Startup Database Migration

```python
def init_db():
    """数据库初始化 / Database initialization"""
    Base.metadata.create_all(bind=engine)      # 创建所有表 / Create all tables
    update_database_schema()                   # 更新架构 / Update schema
    ensure_permission_tables()                 # 确保权限表存在 / Ensure permission tables
    ensure_admin_user()                        # 创建管理员 / Create admin user
    grant_su_to_admins()                       # 分配 su 权限 / Grant su permissions
```

---

### 2. 认证系统 / Authentication System

#### 用户模型 / User Model

```python
class User(UserMixin, Base):
    """用户模型 / User model"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, index=True)
    password_hash = Column(String(128))
    role = Column(String(20), default='user')  # 'user' 或 'admin'
    
    def set_password(self, password):
        """设置密码哈希 / Set password hash"""
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """验证密码 / Verify password"""
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        """检查是否为管理员 / Check if user is admin"""
        return self.role == 'admin'
```

#### 会话管理 / Session Management

- **技术**: Flask-Login
- **会话存储**: 服务器端会话（Flask session）
- **会话标识**: 安全 Cookie（`session` cookie）
- **会话过期**: 浏览器关闭时过期

#### 登录装饰器 / Login Decorators

```python
@login_required  # Flask-Login 提供 / Provided by Flask-Login
def protected_route():
    """需要登录的路由 / Route requiring login"""
    pass

@su_required  # 自定义 SU 验证 / Custom SU verification
def admin_operation():
    """需要管理员二次验证 / Route requiring admin re-verification"""
    pass
```

---

### 3. 权限系统 / Permission System

Stellarsis 实现了四级权限系统：

Stellarsis implements a four-tier permission system:

#### 权限级别 / Permission Levels

| 级别 / Level | 权限名 / Name | 读取 / Read | 写入 / Write | 删除他人内容 / Delete Others | 管理 / Manage |
|---|---|:---:|:---:|:---:|:---:|
| 1 | `su` (Super User) | ✅ | ✅ | ✅ | ✅ |
| 2 | `777` (Read-Write) | ✅ | ✅ | ❌ | ❌ |
| 3 | `444` (Read-Only) | ✅ | ❌ | ❌ | ❌ |
| 4 | `Null` (No Access) | ❌ | ❌ | ❌ | ❌ |

#### 权限作用域 / Permission Scopes

- **聊天室权限 / Chat Room Permissions**: `ChatPermission` 表
- **论坛分区权限 / Forum Section Permissions**: `ForumPermission` 表

#### 权限判断 / Permission Checking

```python
# 聊天室权限常量 / Chat permission constants
CHAT_VIEW_PERMISSIONS = {'su', '777', '444'}  # 可查看 / Can view
CHAT_SEND_PERMISSIONS = {'su', '777'}         # 可发送 / Can send

# 论坛权限常量 / Forum permission constants
FORUM_VIEW_PERMISSIONS = {'su', '777', '444'} # 可查看 / Can view
FORUM_POST_PERMISSIONS = {'su', '777'}        # 可发帖 / Can post

# 权限检查函数 / Permission checking functions
def user_can_view_chat(user, room_id):
    perm = get_chat_permission_value(user, room_id)
    return perm in CHAT_VIEW_PERMISSIONS

def user_can_send_chat(user, room_id):
    perm = get_chat_permission_value(user, room_id)
    return perm in CHAT_SEND_PERMISSIONS
```

**详细文档 / Detailed Documentation**: 参见 `docs/PERMISSION_SYSTEM.md` / See `docs/PERMISSION_SYSTEM.md`

---

### 4. 实时通信系统 / Real-time Communication System

#### Socket.IO 架构 / Socket.IO Architecture

```
客户端 / Client
    ↓ WebSocket 连接 / WebSocket connection
Flask-SocketIO (Flask extension)
    ↓ 事件处理 / Event handling
Eventlet (Async runtime)
    ↓ 协程调度 / Coroutine scheduling
应用逻辑 / Application logic
    ↓ 数据库操作 / Database operations
SQLAlchemy ORM
```

#### 核心事件 / Core Events

| 事件 / Event | 方向 / Direction | 说明 / Description |
|---|---|---|
| `connect` | Client → Server | 客户端连接 / Client connects |
| `join` | Client → Server | 加入聊天室 / Join chat room |
| `leave` | Client → Server | 离开聊天室 / Leave chat room |
| `send_message` | Client → Server | 发送消息 / Send message |
| `message` | Server → Client | 广播消息 / Broadcast message |
| `user_join` | Server → Room | 用户加入通知 / User joined notification |
| `user_leave` | Server → Room | 用户离开通知 / User left notification |
| `online_users` | Server → Client | 在线用户列表 / Online users list |
| `heartbeat` | Client → Server | 心跳保活 / Heartbeat keep-alive |
| `heartbeat_chat` | Client → Server | 聊天室心跳 / Chat room heartbeat |

#### 房间管理 / Room Management

```python
@socketio.on('join')
def on_join(data):
    """加入聊天室 / Join chat room"""
    room_id = data.get('room')
    
    # 1. 权限检查 / Permission check
    if not user_can_view_chat(current_user, room_id):
        emit('error', {'message': '无权限 / No permission'})
        return
    
    # 2. 加入 Socket.IO 房间 / Join Socket.IO room
    join_room(str(room_id))
    
    # 3. 广播加入事件 / Broadcast join event
    emit('user_join', {
        'user_id': current_user.id,
        'username': current_user.username,
        'nickname': current_user.nickname
    }, room=str(room_id))
    
    # 4. 更新房间在线数 / Update room online count
    update_room_online_count(room_id)
```

#### 消息广播 / Message Broadcasting

```python
@socketio.on('send_message')
def handle_message(data):
    """处理消息发送 / Handle message sending"""
    room_id = data.get('room_id')
    message = data.get('message')
    
    # 1. 权限验证 / Permission verification
    # 2. 内容净化 / Content sanitization
    # 3. 保存到数据库 / Save to database
    msg = ChatMessage(content=message, user_id=current_user.id, room_id=room_id)
    db_session.add(msg)
    db_session.commit()
    
    # 4. 广播到房间 / Broadcast to room
    emit('message', {
        'id': msg.id,
        'content': msg.content,
        'username': current_user.username,
        'timestamp': msg.timestamp.isoformat()
    }, room=str(room_id))
```

---

### 5. 日志系统 / Logging System

#### 日志文件 / Log Files

| 文件 / File | 用途 / Purpose | 记录内容 / Content |
|---|---|---|
| `logs/system.log` | 系统日志 / System logs | 应用启动、错误、异常 / App startup, errors, exceptions |
| `logs/admin.log` | 管理操作日志 / Admin actions | 管理员操作记录 / Admin operation records |
| `logs/auth.log` | 认证日志 / Auth logs | **未实现** / **Not implemented** |

#### 日志配置 / Logging Configuration

```python
# 日志处理器 / Log handler
handler = RotatingFileHandler(
    'logs/system.log',
    maxBytes=10*1024*1024,  # 10 MB
    backupCount=5,          # 保留 5 个备份 / Keep 5 backups
    encoding='utf-8'        # UTF-8 编码 / UTF-8 encoding
)

# 日志格式 / Log format
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)

# 日志级别 / Log level
logger.setLevel(logging.INFO)
```

**详细文档 / Detailed Documentation**: 参见 `docs/backend/LOGGING.md` / See `docs/backend/LOGGING.md`

---

### 6. 文件上传系统 / File Upload System

#### 图片上传 / Image Upload

```python
# 配置 / Configuration
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 5 MB
USER_UPLOAD_QUOTA = 50 * 1024 * 1024  # 50 MB per user

# 上传流程 / Upload flow
@app.route('/api/upload/image', methods=['POST'])
@login_required
def api_upload_image():
    # 1. 验证文件扩展名 / Validate file extension
    # 2. 检查文件大小 / Check file size
    # 3. 检查用户配额 / Check user quota
    # 4. 使用 Pillow 验证图片 / Validate image with Pillow
    # 5. 压缩图片（可选） / Compress image (optional)
    # 6. 保存文件 / Save file
    # 7. 记录到数据库 / Record in database (UserImage 表)
    # 8. 返回 URL 和 Markdown / Return URL and Markdown
```

#### 文件上传（可选功能） / File Upload (Optional Feature)

```python
# 配置 / Configuration
ENABLE_FILE_UPLOAD = False  # 默认禁用 / Disabled by default
ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'}
FILE_MAX_SIZE = 10 * 1024 * 1024  # 10 MB

# 安全考虑 / Security considerations
# - 文件类型白名单 / File type whitelist
# - MIME 类型验证 / MIME type validation
# - 文件名净化 / Filename sanitization (secure_filename)
# - 存储路径隔离 / Storage path isolation
```

---

## 配置管理 / Configuration Management

### 配置文件 / Configuration File

**文件**: `config.py`

```python
class Config:
    # 核心配置 / Core configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///stellarsis.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True
    
    # Socket.IO 配置 / Socket.IO configuration
    SOCKETIO_ASYNC_MODE = 'eventlet'
    ONLINE_TIMEOUT = 30  # 30 秒无活动视为离线 / 30 seconds timeout
    
    # 上传配置 / Upload configuration
    UPLOAD_FOLDER = os.path.join('static', 'uploads')
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    IMAGE_MAX_SIZE = 5 * 1024 * 1024
    USER_UPLOAD_QUOTA = 50 * 1024 * 1024
    
    # 功能开关 / Feature flags
    ENABLE_FILE_UPLOAD = os.environ.get('ENABLE_FILE_UPLOAD', 'False').lower() in ('1', 'true', 'yes')
    ENABLE_FILE_MANAGER = os.environ.get('ENABLE_FILE_MANAGER', 'False').lower() in ('1', 'true', 'yes')
    ENABLE_SERVER_CONTROL = os.environ.get('ENABLE_SERVER_CONTROL', 'False').lower() in ('1', 'true', 'yes')
    
    # 密码验证 / Password validation
    MIN_PASSWORD_LENGTH = 6
```

### 环境变量 / Environment Variables

支持通过 `.env` 文件或系统环境变量配置：

Support configuration via `.env` file or system environment variables:

| 变量 / Variable | 说明 / Description | 默认值 / Default |
|---|---|---|
| `SECRET_KEY` | Flask 密钥 / Flask secret key | `'you-will-never-guess'` |
| `DATABASE_URL` | 数据库 URL / Database URL | `'sqlite:///stellarsis.db'` |
| `UPLOAD_FOLDER` | 上传目录 / Upload directory | `'static/uploads'` |
| `ENABLE_FILE_UPLOAD` | 启用文件上传 / Enable file upload | `False` |
| `ENABLE_FILE_MANAGER` | 启用文件管理器 / Enable file manager | `False` |
| `ENABLE_SERVER_CONTROL` | 启用服务器控制 / Enable server control | `False` |

---

## 安全机制 / Security Mechanisms

### 1. 密码安全 / Password Security

```python
from werkzeug.security import generate_password_hash, check_password_hash

# 密码哈希算法 / Password hashing algorithm: PBKDF2-SHA256
# 哈希存储 / Hash storage: password_hash 字段（128 字符）
# 最小密码长度 / Minimum password length: 6 字符
```

### 2. CSRF 保护 / CSRF Protection

```python
# Flask-WTF 自动 CSRF 保护 / Automatic CSRF protection by Flask-WTF
from flask_wtf import FlaskForm

# 所有 POST 表单自动验证 CSRF token
# All POST forms automatically validate CSRF token
```

### 3. SU 二次验证 / SU Re-verification

```python
@su_required
def sensitive_operation():
    """高危操作需要管理员重新输入密码 / 
    Sensitive operations require admin to re-enter password"""
    # 验证有效期：5 分钟 / Verification validity: 5 minutes
    # 存储在 session['su_expires']
```

### 4. 速率限制 / Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

# 登录接口限制 / Login endpoint limit
@limiter.limit("5 per minute")
def login():
    pass
```

### 5. 输入净化 / Input Sanitization

```python
from markupsafe import escape

def sanitize_content(content):
    """净化用户输入，防止 XSS / 
    Sanitize user input to prevent XSS"""
    # 1. HTML 转义 / HTML escaping
    # 2. Markdown 渲染（安全） / Markdown rendering (safe)
    # 3. LaTeX 转义 / LaTeX escaping
    # 4. 图片引用验证 / Image reference validation
```

### 6. 文件上传安全 / File Upload Security

```python
from werkzeug.utils import secure_filename

# 1. 文件名净化 / Filename sanitization
filename = secure_filename(file.filename)

# 2. 扩展名白名单 / Extension whitelist
allowed = ALLOWED_IMAGE_EXTENSIONS

# 3. MIME 类型验证 / MIME type validation
file_type = get_image_type(file.stream)

# 4. 文件大小限制 / File size limit
if file.content_length > IMAGE_MAX_SIZE:
    abort(413)

# 5. 配额检查 / Quota check
if user.upload_used + file_size > USER_UPLOAD_QUOTA:
    abort(413)
```

### 7. 权限隔离 / Permission Isolation

- 用户只能访问有权限的聊天室和论坛分区 / Users can only access authorized rooms and sections
- 管理员操作需要 SU 验证 / Admin operations require SU verification
- 数据库直接编辑仅限管理员 / Database direct editing limited to admins

---

## 性能与扩展性 / Performance and Scalability

### 1. 数据库优化 / Database Optimization

#### 索引策略 / Indexing Strategy

```python
# 用户名索引（唯一） / Username index (unique)
username = Column(String(64), unique=True, index=True)

# 时间戳索引 / Timestamp index
timestamp = Column(DateTime, index=True, default=utcnow)

# 建议添加的复合索引 / Recommended composite indexes
# CREATE INDEX idx_chat_messages_room_time ON chat_messages(room_id, timestamp DESC);
# CREATE INDEX idx_forum_threads_section_time ON forum_threads(section_id, timestamp DESC);
```

#### 查询优化 / Query Optimization

```python
# 1. 分页查询 / Pagination queries
messages = db_session.query(ChatMessage)\
    .filter_by(room_id=room_id)\
    .order_by(ChatMessage.timestamp.desc())\
    .limit(100)\
    .offset(page * 100)\
    .all()

# 2. 预加载关联 / Eager loading relationships
threads = db_session.query(ForumThread)\
    .options(joinedload(ForumThread.user))\
    .filter_by(section_id=section_id)\
    .all()
```

### 2. 会话管理 / Session Management

```python
# Scoped Session（线程安全） / Scoped Session (thread-safe)
db_session = scoped_session(sessionmaker(bind=engine))

# 请求结束后自动清理 / Automatic cleanup after request
@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()
```

### 3. 日志轮转 / Log Rotation

```python
# RotatingFileHandler 自动轮转 / Automatic rotation by RotatingFileHandler
handler = RotatingFileHandler(
    'logs/system.log',
    maxBytes=10*1024*1024,  # 10 MB 后轮转 / Rotate after 10 MB
    backupCount=5           # 保留 5 个备份文件 / Keep 5 backup files
)
```

### 4. 缓存策略 / Caching Strategy

**当前实现 / Current Implementation**: 无缓存层 / No caching layer

**扩展建议 / Scaling Recommendations**:
- 使用 Redis 缓存在线用户列表 / Use Redis to cache online user lists
- 缓存论坛帖子列表 / Cache forum thread lists
- 缓存权限查询结果 / Cache permission query results

### 5. 水平扩展 / Horizontal Scaling

#### 当前架构限制 / Current Architecture Limitations

- **单进程模式 / Single-process mode**: Eventlet 运行在单进程
- **内存会话 / In-memory sessions**: Flask session 存储在服务器内存
- **内存限流 / In-memory rate limiting**: Flask-Limiter 使用内存存储

#### 扩展方案 / Scaling Solutions

1. **迁移到生产 WSGI 服务器 / Migrate to production WSGI server**
   ```bash
   gunicorn --worker-class eventlet -w 4 app:app
   ```

2. **使用 Redis 存储会话 / Use Redis for session storage**
   ```python
   from flask_session import Session
   app.config['SESSION_TYPE'] = 'redis'
   app.config['SESSION_REDIS'] = redis.Redis()
   ```

3. **使用 Redis 存储限流数据 / Use Redis for rate limiting**
   ```python
   limiter = Limiter(app, storage_uri="redis://localhost:6379")
   ```

4. **负载均衡 / Load Balancing**
   ```
   Nginx (负载均衡器 / Load balancer)
     ↓
   多个应用实例 / Multiple app instances
     ↓
   共享 Redis / Shared Redis
     ↓
   共享数据库 / Shared database (PostgreSQL)
   ```

### 6. 数据库扩展 / Database Scaling

#### SQLite → PostgreSQL 迁移 / Migration

```python
# 1. 修改配置 / Modify configuration
SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@localhost/stellarsis'

# 2. 导出数据 / Export data
sqlite3 stellarsis.db .dump > data.sql

# 3. 导入 PostgreSQL / Import to PostgreSQL
psql stellarsis < data.sql

# 4. 优化索引 / Optimize indexes
# PostgreSQL 自动创建查询计划优化
```

---

## 最佳实践 / Best Practices

### 开发环境 / Development Environment

1. **使用虚拟环境 / Use virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   pip install -r requirements.txt
   ```

2. **配置环境变量 / Configure environment variables**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件 / Edit .env file
   ```

3. **启动开发服务器 / Start development server**
   ```bash
   python app.py
   # 或 / Or
   bash start.sh
   ```

### 生产环境 / Production Environment

1. **使用生产级数据库 / Use production database**
   - PostgreSQL（推荐 / Recommended）
   - MySQL

2. **禁用调试模式 / Disable debug mode**
   ```python
   DEBUG = False
   ```

3. **配置强密钥 / Configure strong secret key**
   ```bash
   export SECRET_KEY=$(openssl rand -hex 32)
   ```

4. **启用 HTTPS / Enable HTTPS**
   - 使用 Nginx 反向代理 / Use Nginx reverse proxy
   - 配置 SSL 证书 / Configure SSL certificate

5. **监控日志 / Monitor logs**
   ```bash
   tail -f logs/system.log
   tail -f logs/admin.log
   ```

---

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

#### 1. 数据库锁定（SQLite）/ Database locked (SQLite)

**症状 / Symptom**: `sqlite3.OperationalError: database is locked`

**解决方案 / Solution**:
- 迁移到 PostgreSQL（生产环境推荐）/ Migrate to PostgreSQL (recommended for production)
- 减少并发写入 / Reduce concurrent writes

#### 2. WebSocket 连接失败 / WebSocket connection failed

**症状 / Symptom**: 前端无法连接 Socket.IO

**排查 / Troubleshooting**:
- 检查 CORS 配置 / Check CORS configuration
- 确认 Eventlet 正确安装 / Verify Eventlet is correctly installed
- 检查防火墙规则 / Check firewall rules

#### 3. 上传文件失败 / File upload failed

**症状 / Symptom**: HTTP 413 Payload Too Large

**解决方案 / Solution**:
- 检查 Nginx 配置（如使用）/ Check Nginx config (if used)
- 调整 `IMAGE_MAX_SIZE` / Adjust `IMAGE_MAX_SIZE`
- 检查用户配额 / Check user quota

---

## 版本信息 / Version Information

- **文档版本 / Document Version**: 1.0
- **应用版本 / Application Version**: Flask 3.1.2
- **最后更新 / Last Updated**: 2025-02-10
- **维护者 / Maintainer**: Stellarsis Development Team

---

## 参考文档 / Reference Documentation

- [DATABASE.md](./DATABASE.md) - 数据库架构详细说明 / Detailed database schema
- [API.md](./API.md) - API 接口文档 / API endpoint documentation
- [LOGGING.md](./LOGGING.md) - 日志系统文档 / Logging system documentation
- [../PERMISSION_SYSTEM.md](../PERMISSION_SYSTEM.md) - 权限系统详解 / Permission system details
