# Stellarsis 日志系统文档 / Logging System Documentation

本文档详细描述 Stellarsis 系统的日志架构、日志文件、日志格式和使用方法。

This document provides comprehensive documentation for the Stellarsis logging system, including architecture, log files, formats, and usage.

---

## 目录 / Table of Contents

1. [日志概览 / Logging Overview](#日志概览--logging-overview)
2. [日志文件 / Log Files](#日志文件--log-files)
3. [日志级别与格式 / Log Levels and Formats](#日志级别与格式--log-levels-and-formats)
4. [日志分类 / Log Categories](#日志分类--log-categories)
5. [日志轮转策略 / Log Rotation Policy](#日志轮转策略--log-rotation-policy)
6. [开发环境使用 / Development Usage](#开发环境使用--development-usage)
7. [生产环境监控 / Production Monitoring](#生产环境监控--production-monitoring)
8. [日志分析 / Log Analysis](#日志分析--log-analysis)

---

## 日志概览 / Logging Overview

### 日志架构 / Logging Architecture

```
应用层 / Application Layer
    ↓
Python logging 模块 / Python logging module
    ↓
RotatingFileHandler（自动轮转）/ RotatingFileHandler (auto-rotation)
    ↓
日志文件 / Log Files
    ├── system.log（系统日志）/ system.log (System logs)
    ├── admin.log（管理操作日志）/ admin.log (Admin action logs)
    └── auth.log（认证日志，未实现）/ auth.log (Auth logs, not implemented)
```

### 日志技术栈 / Logging Tech Stack

| 组件 / Component | 技术 / Technology | 说明 / Description |
|---|---|---|
| 日志框架 / Framework | Python logging | Python 标准库 / Python standard library |
| 处理器 / Handler | RotatingFileHandler | 自动轮转文件处理器 / Auto-rotating file handler |
| 格式化器 / Formatter | logging.Formatter | 自定义日志格式 / Custom log format |
| 编码 / Encoding | UTF-8 | 支持中文和 Unicode / Supports Chinese and Unicode |

---

## 日志文件 / Log Files

所有日志文件位于项目根目录的 `logs/` 文件夹中。

All log files are located in the `logs/` folder at project root.

### 日志目录结构 / Log Directory Structure

```
logs/
├── system.log          # 当前系统日志 / Current system log
├── system.log.1        # 系统日志备份 1 / System log backup 1
├── system.log.2        # 系统日志备份 2 / System log backup 2
├── system.log.3        # 系统日志备份 3 / System log backup 3
├── system.log.4        # 系统日志备份 4 / System log backup 4
├── system.log.5        # 系统日志备份 5 / System log backup 5 (最老 / oldest)
├── admin.log           # 管理操作日志 / Admin action log
└── auth.log            # 认证日志（未实现）/ Auth log (not implemented)
```

---

### 1. system.log（系统日志）

**用途 / Purpose**: 记录应用运行的主要事件、错误和异常。

Records main application events, errors, and exceptions.

**内容 / Content**:
- 应用启动和关闭 / Application startup and shutdown
- 数据库连接和初始化 / Database connection and initialization
- HTTP 请求错误 / HTTP request errors
- WebSocket 连接事件 / WebSocket connection events
- 异常和错误堆栈 / Exceptions and error stacks
- 性能警告 / Performance warnings

**日志级别 / Log Levels**: INFO, WARNING, ERROR, CRITICAL

**轮转策略 / Rotation Policy**:
- 最大文件大小：10 MB / Max file size: 10 MB
- 备份文件数：5 个 / Backup count: 5
- 总存储空间：约 60 MB / Total storage: ~60 MB

**配置代码 / Configuration Code**:

```python
# app.py
handler = RotatingFileHandler(
    'logs/system.log',
    maxBytes=10*1024*1024,  # 10 MB
    backupCount=5,
    encoding='utf-8'
)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)

logger = logging.getLogger('stellarsis')
logger.setLevel(logging.INFO)
logger.addHandler(handler)
```

**示例日志条目 / Example Log Entries**:

```
2025-02-10 08:30:15,234 - stellarsis - INFO - 应用启动
2025-02-10 08:30:16,012 - stellarsis - INFO - 数据库初始化完成
2025-02-10 08:35:42,567 - stellarsis - WARNING - 用户 alice 登录失败：密码错误
2025-02-10 09:12:33,890 - stellarsis - ERROR - 数据库查询失败: sqlite3.OperationalError: database is locked
2025-02-10 10:05:21,123 - stellarsis - INFO - 用户 bob 上传图片: image.png (2.5 MB)
```

---

### 2. admin.log（管理操作日志）

**用途 / Purpose**: 记录所有管理员操作，用于审计和安全追踪。

Records all admin operations for auditing and security tracking.

**内容 / Content**:
- 用户登录和登出 / User login and logout
- 管理员操作（创建、更新、删除）/ Admin operations (create, update, delete)
- 权限变更 / Permission changes
- 系统配置修改 / System configuration changes
- 敏感操作记录 / Sensitive operation records

**日志级别 / Log Level**: 无明确级别（手动记录）/ No explicit level (manual recording)

**轮转策略 / Rotation Policy**: 手动管理（无自动轮转）/ Manual management (no auto-rotation)

**记录函数 / Logging Function**:

```python
# app.py
def log_admin_action(action):
    """记录管理员操作 / Record admin action"""
    try:
        log_dir = Path(app.root_path) / 'logs'
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / 'admin.log'
        
        with open(log_file, 'a', encoding='utf-8') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            username = current_user.username if current_user.is_authenticated else 'anonymous'
            f.write(f"[{timestamp}] {username}: {action}\n")
    except Exception as e:
        logger.error(f"记录管理操作失败: {str(e)}")
```

**示例日志条目 / Example Log Entries**:

```
[2025-02-10 08:32:15] admin: 用户登录: admin
[2025-02-10 09:15:42] admin: 创建了聊天室 技术讨论
[2025-02-10 09:20:10] admin: 修改用户 alice 的角色: user -> admin
[2025-02-10 10:05:33] admin: 管理员 admin 更新用户 bob 的 chat 权限
[2025-02-10 11:30:20] admin: 删除了聊天室: 测试房间
[2025-02-10 12:00:45] admin: 数据库备份成功: stellarsis_backup_20250210_120045.db
[2025-02-10 14:15:30] admin: 管理员 admin 下载了应用源码压缩包
[2025-02-10 16:45:12] admin: 服务器关停，原因: 维护升级
```

---

### 3. auth.log（认证日志）【未实现】

**状态 / Status**: 未实现 / Not implemented

**计划用途 / Planned Purpose**: 专门记录认证相关事件，包括登录、登出、密码修改、SU 验证等。

Specifically record authentication events including login, logout, password changes, SU verification, etc.

**计划内容 / Planned Content**:
- 登录成功/失败 / Login success/failure
- 登出事件 / Logout events
- 密码修改 / Password changes
- SU 验证 / SU verification
- 会话过期 / Session expiration
- 可疑登录尝试 / Suspicious login attempts

**实现建议 / Implementation Suggestion**:

```python
# 创建认证日志记录器 / Create auth logger
auth_logger = logging.getLogger('stellarsis.auth')
auth_handler = RotatingFileHandler(
    'logs/auth.log',
    maxBytes=5*1024*1024,  # 5 MB
    backupCount=3,
    encoding='utf-8'
)
auth_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(levelname)s - [%(ip)s] %(username)s: %(message)s'
))
auth_logger.addHandler(auth_handler)

# 使用示例 / Usage example
def log_auth_event(event_type, username, ip_address, success=True):
    """记录认证事件 / Record auth event"""
    level = logging.INFO if success else logging.WARNING
    auth_logger.log(level, f"{event_type}", extra={
        'ip': ip_address,
        'username': username
    })
```

**示例日志条目（计划）/ Example Log Entries (Planned)**:

```
2025-02-10 08:32:15 - INFO - [192.168.1.100] alice: 登录成功
2025-02-10 08:35:42 - WARNING - [192.168.1.105] bob: 登录失败 - 密码错误
2025-02-10 09:12:30 - INFO - [192.168.1.100] alice: 修改密码成功
2025-02-10 10:05:20 - WARNING - [192.168.1.200] unknown: 登录失败 - 用户不存在
2025-02-10 11:30:15 - INFO - [192.168.1.100] admin: SU 验证成功
```

---

## 日志级别与格式 / Log Levels and Formats

### 日志级别 / Log Levels

Stellarsis 使用 Python logging 标准的 5 个日志级别：

Stellarsis uses Python logging's standard 5 log levels:

| 级别 / Level | 数值 / Value | 用途 / Purpose | 示例 / Example |
|---|---|---|---|
| DEBUG | 10 | 详细调试信息 / Detailed debug info | 变量值、函数调用 / Variable values, function calls |
| INFO | 20 | 一般信息性消息 / General informational messages | 用户登录、数据库操作 / User login, database operations |
| WARNING | 30 | 警告信息 / Warning messages | 登录失败、配额不足 / Login failure, quota low |
| ERROR | 40 | 错误信息 / Error messages | 数据库错误、文件读写失败 / DB error, file I/O failure |
| CRITICAL | 50 | 严重错误 / Critical errors | 系统崩溃、数据损坏 / System crash, data corruption |

### 当前日志级别 / Current Log Level

```python
# app.py
logger.setLevel(logging.INFO)  # 默认级别：INFO / Default level: INFO
```

**说明 / Description**: 仅记录 INFO 及以上级别的日志（INFO, WARNING, ERROR, CRITICAL）。DEBUG 级别日志不会被记录。

Only logs at INFO level and above are recorded (INFO, WARNING, ERROR, CRITICAL). DEBUG logs are not recorded.

### 日志格式 / Log Format

#### system.log 格式 / system.log Format

```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

**字段说明 / Field Description**:

| 字段 / Field | 说明 / Description | 示例 / Example |
|---|---|---|
| `%(asctime)s` | 时间戳（精确到毫秒）/ Timestamp (millisecond precision) | `2025-02-10 08:30:15,234` |
| `%(name)s` | 日志记录器名称 / Logger name | `stellarsis` |
| `%(levelname)s` | 日志级别 / Log level | `INFO`, `WARNING`, `ERROR` |
| `%(message)s` | 日志消息 / Log message | `用户登录: alice` |

**完整示例 / Full Example**:

```
2025-02-10 08:30:15,234 - stellarsis - INFO - 应用启动
```

#### admin.log 格式 / admin.log Format

```
[%(timestamp)s] %(username)s: %(action)s
```

**字段说明 / Field Description**:

| 字段 / Field | 说明 / Description | 示例 / Example |
|---|---|---|
| `%(timestamp)s` | 时间戳（秒级）/ Timestamp (second precision) | `2025-02-10 08:32:15` |
| `%(username)s` | 操作用户 / Operating user | `admin`, `alice` |
| `%(action)s` | 操作描述 / Action description | `创建了聊天室 技术讨论` |

**完整示例 / Full Example**:

```
[2025-02-10 09:15:42] admin: 创建了聊天室 技术讨论
```

---

## 日志分类 / Log Categories

### 1. 应用生命周期日志 / Application Lifecycle Logs

**记录内容 / Content**:
- 应用启动 / Application startup
- 数据库初始化 / Database initialization
- 模块加载 / Module loading
- 应用关闭 / Application shutdown

**示例 / Examples**:

```python
logger.info("应用启动")
logger.info("数据库初始化完成")
logger.info("Socket.IO 初始化完成")
```

**日志输出 / Log Output**:

```
2025-02-10 08:30:15,234 - stellarsis - INFO - 应用启动
2025-02-10 08:30:16,012 - stellarsis - INFO - 数据库初始化完成
2025-02-10 08:30:16,123 - stellarsis - INFO - Socket.IO 初始化完成
```

---

### 2. 用户操作日志 / User Operation Logs

**记录内容 / Content**:
- 用户登录/登出 / User login/logout
- 密码修改 / Password changes
- 个人资料更新 / Profile updates
- 关注/取消关注 / Follow/unfollow

**记录位置 / Log Location**: `admin.log`

**记录代码 / Logging Code**:

```python
# 登录 / Login
log_admin_action(f"用户登录: {user.username}")

# 修改密码 / Change password
log_admin_action(f"用户修改密码: {current_user.username}")

# 更新资料 / Update profile
log_admin_action(f"用户更新个人资料: {current_user.username}")

# 关注 / Follow
log_admin_action(f"{current_user.username} 关注 用户 {target_user.username}")
```

---

### 3. 聊天室操作日志 / Chat Room Operation Logs

**记录内容 / Content**:
- 聊天室创建/删除 / Room creation/deletion
- 消息发送 / Message sending
- 消息删除 / Message deletion
- 房间权限变更 / Room permission changes

**记录位置 / Log Location**: `admin.log` (管理操作 / Admin operations)

**记录代码 / Logging Code**:

```python
# 创建聊天室 / Create room
log_admin_action(f"创建了聊天室 {new_room.name}")

# 删除聊天室 / Delete room
log_admin_action(f"删除了聊天室: {room_name}")

# 批量删除消息 / Bulk delete messages
log_admin_action(f"清空聊天消息: {deleted_count} 条消息被删除")
```

---

### 4. 论坛操作日志 / Forum Operation Logs

**记录内容 / Content**:
- 分区创建/删除 / Section creation/deletion
- 主题帖发布 / Thread posting
- 回复发布 / Reply posting
- 帖子/回复删除 / Thread/reply deletion

**记录位置 / Log Location**: `admin.log`

**记录代码 / Logging Code**:

```python
# 创建分区 / Create section
log_admin_action(f"创建了贴吧分区 {new_section.name}")

# 发帖 / Create thread
log_admin_action(f"用户创建新帖: {current_user.username} - {title}")

# 回复 / Reply to thread
log_admin_action(f"用户回复帖子: {current_user.username} - 帖子ID: {thread_id}")

# 删除帖子 / Delete thread
log_admin_action(f"删除了主题帖: {thread.title}")
```

---

### 5. 文件上传日志 / File Upload Logs

**记录内容 / Content**:
- 图片上传 / Image upload
- 文件上传 / File upload
- 文件删除 / File deletion
- 配额统计 / Quota calculation

**记录位置 / Log Location**: `system.log`, `admin.log`

**记录代码 / Logging Code**:

```python
# 图片上传 / Image upload
logger.info(f"用户 {current_user.username} 上传图片: {filename} ({file_size} 字节)")

# 配额重新统计 / Recalculate quota
log_admin_action(f"管理员 {current_user.username} 重新统计了所有用户上传图片大小")
```

---

### 6. 系统管理日志 / System Management Logs

**记录内容 / Content**:
- 数据库备份 / Database backup
- 数据库优化 / Database optimization
- 服务器重启 / Server restart
- 服务器关闭 / Server shutdown
- 缓存清理 / Cache clearing

**记录位置 / Log Location**: `admin.log`

**记录代码 / Logging Code**:

```python
# 数据库备份 / Database backup
log_admin_action(f"数据库备份成功: {backup_path}")

# 数据库优化 / Database optimization
log_admin_action("数据库优化成功")

# 服务器重启 / Server restart
log_admin_action("管理员请求重启服务器")

# 服务器关闭 / Server shutdown
log_admin_action(f"服务器关停，原因: {reason}")
```

---

### 7. 错误和异常日志 / Error and Exception Logs

**记录内容 / Content**:
- 数据库错误 / Database errors
- 文件 I/O 错误 / File I/O errors
- 权限错误 / Permission errors
- 未捕获异常 / Uncaught exceptions

**记录位置 / Log Location**: `system.log`

**记录代码 / Logging Code**:

```python
# 数据库错误 / Database error
logger.error(f"数据库查询失败: {str(e)}")

# 文件错误 / File error
logger.error(f"文件读取失败: {str(e)}")

# 未捕获异常 / Uncaught exception
logger.exception("未处理的异常")  # 自动记录堆栈跟踪 / Auto-logs stack trace
```

**日志输出 / Log Output**:

```
2025-02-10 09:12:33,890 - stellarsis - ERROR - 数据库查询失败: sqlite3.OperationalError: database is locked
2025-02-10 10:25:45,123 - stellarsis - ERROR - 文件读取失败: [Errno 2] No such file or directory: 'config.json'
2025-02-10 11:30:12,456 - stellarsis - ERROR - 未处理的异常
Traceback (most recent call last):
  File "app.py", line 1234, in some_function
    result = risky_operation()
ValueError: Invalid value
```

---

## 日志轮转策略 / Log Rotation Policy

### system.log 轮转 / system.log Rotation

**轮转触发条件 / Rotation Trigger**: 文件大小达到 10 MB / File size reaches 10 MB

**轮转行为 / Rotation Behavior**:

1. 当 `system.log` 达到 10 MB 时 / When `system.log` reaches 10 MB:
   - `system.log.5` 被删除（如果存在）/ `system.log.5` is deleted (if exists)
   - `system.log.4` → `system.log.5`
   - `system.log.3` → `system.log.4`
   - `system.log.2` → `system.log.3`
   - `system.log.1` → `system.log.2`
   - `system.log` → `system.log.1`
   - 创建新的空 `system.log` / Create new empty `system.log`

2. 保留最近的 6 个文件（1 个当前 + 5 个备份）/ Keep last 6 files (1 current + 5 backups)

3. 总存储空间约 60 MB / Total storage ~60 MB

**配置代码 / Configuration Code**:

```python
handler = RotatingFileHandler(
    'logs/system.log',
    maxBytes=10*1024*1024,  # 10 MB
    backupCount=5,          # 保留 5 个备份 / Keep 5 backups
    encoding='utf-8'
)
```

### admin.log 轮转 / admin.log Rotation

**当前状态 / Current Status**: 无自动轮转（持续追加）/ No auto-rotation (continuous append)

**推荐改进 / Recommended Improvement**:

```python
# 添加 admin.log 轮转 / Add admin.log rotation
admin_handler = RotatingFileHandler(
    'logs/admin.log',
    maxBytes=5*1024*1024,   # 5 MB
    backupCount=10,         # 保留 10 个备份（用于审计）/ Keep 10 backups (for audit)
    encoding='utf-8'
)
```

### 手动轮转 / Manual Rotation

如果需要手动轮转日志文件：

If manual log rotation is needed:

```bash
# 1. 备份当前日志 / Backup current log
cp logs/system.log logs/system.log.backup_$(date +%Y%m%d_%H%M%S)

# 2. 清空当前日志 / Clear current log
> logs/system.log

# 或者重启应用让 RotatingFileHandler 自动处理
# Or restart application to let RotatingFileHandler handle automatically
```

---

## 开发环境使用 / Development Usage

### 1. 查看实时日志 / View Real-time Logs

#### 方法 1：使用 tail 命令 / Method 1: Using tail

```bash
# 查看 system.log 实时日志 / View system.log in real-time
tail -f logs/system.log

# 查看 admin.log 实时日志 / View admin.log in real-time
tail -f logs/admin.log

# 同时查看多个日志文件 / View multiple log files simultaneously
tail -f logs/system.log logs/admin.log
```

#### 方法 2：使用 less 查看 / Method 2: Using less

```bash
# 使用 less 查看并搜索 / View and search with less
less logs/system.log

# 在 less 中搜索 / Search in less
# 按 / 然后输入搜索词 / Press / then type search term
# 例如搜索 "ERROR" / For example, search "ERROR"
/ERROR
```

#### 方法 3：使用 grep 过滤 / Method 3: Using grep to filter

```bash
# 只查看错误日志 / View only error logs
tail -f logs/system.log | grep ERROR

# 查看特定用户的操作 / View operations by specific user
tail -f logs/admin.log | grep "alice"

# 查看最近 100 条包含 "登录" 的日志 / View last 100 logs containing "login"
grep "登录" logs/admin.log | tail -100
```

---

### 2. 调试时启用 DEBUG 级别 / Enable DEBUG Level for Debugging

```python
# app.py（临时修改用于调试）/ app.py (temporary modification for debugging)

# 修改日志级别 / Change log level
logger.setLevel(logging.DEBUG)

# 添加详细的调试日志 / Add detailed debug logs
logger.debug(f"用户 ID: {user.id}, 房间 ID: {room_id}")
logger.debug(f"权限值: {perm}, 检查结果: {can_send}")
```

**注意 / Note**: DEBUG 级别会产生大量日志，生产环境不建议启用。

DEBUG level generates a lot of logs, not recommended for production.

---

### 3. 临时增加日志记录 / Add Temporary Logging

```python
# 在需要调试的代码位置添加日志 / Add logs at code locations to debug
def process_message(message):
    logger.debug(f"开始处理消息: {message[:50]}")  # 只记录前50个字符 / Only log first 50 chars
    
    try:
        result = do_something(message)
        logger.debug(f"处理结果: {result}")
        return result
    except Exception as e:
        logger.exception("处理消息时发生错误")  # 自动记录完整堆栈 / Auto-logs full stack
        raise
```

---

### 4. 测试日志记录 / Test Logging

```python
# 测试所有日志级别 / Test all log levels
logger.debug("这是 DEBUG 消息")
logger.info("这是 INFO 消息")
logger.warning("这是 WARNING 消息")
logger.error("这是 ERROR 消息")
logger.critical("这是 CRITICAL 消息")

# 测试 admin.log 记录 / Test admin.log recording
log_admin_action("测试管理操作日志")
```

---

## 生产环境监控 / Production Monitoring

### 1. 日志监控工具 / Log Monitoring Tools

#### 使用 logwatch（Linux）

```bash
# 安装 logwatch / Install logwatch
sudo apt-get install logwatch

# 配置 logwatch 监控 Stellarsis 日志
# Configure logwatch to monitor Stellarsis logs
# 编辑 /etc/logwatch/conf/logfiles/stellarsis.conf
```

#### 使用 fail2ban 防止暴力破解

```bash
# 安装 fail2ban / Install fail2ban
sudo apt-get install fail2ban

# 配置 fail2ban 监控登录失败
# Configure fail2ban to monitor login failures
# 编辑 /etc/fail2ban/jail.local
```

**fail2ban 配置示例 / fail2ban Configuration Example**:

```ini
# /etc/fail2ban/jail.local
[stellarsis]
enabled = true
port = 5000
filter = stellarsis
logpath = /path/to/stellarsis/logs/admin.log
maxretry = 5
bantime = 3600
```

---

### 2. 错误告警 / Error Alerting

#### 方法 1：邮件告警（使用 logrotate）

```bash
# /etc/logrotate.d/stellarsis
/path/to/stellarsis/logs/system.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    postrotate
        # 检查错误数量并发送邮件 / Check error count and send email
        ERROR_COUNT=$(grep -c "ERROR" /path/to/stellarsis/logs/system.log)
        if [ $ERROR_COUNT -gt 10 ]; then
            echo "Stellarsis 今日错误数: $ERROR_COUNT" | mail -s "Stellarsis Error Alert" admin@example.com
        fi
    endscript
}
```

#### 方法 2：使用 Python 监控脚本

```python
# monitor_logs.py
import re
import smtplib
from email.mime.text import MIMEText
from pathlib import Path

def check_errors():
    """检查最近的错误日志并发送告警 / Check recent error logs and send alerts"""
    log_file = Path('logs/system.log')
    
    # 读取最后 1000 行 / Read last 1000 lines
    with open(log_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()[-1000:]
    
    # 统计错误和严重错误 / Count errors and critical errors
    errors = [line for line in lines if ' - ERROR - ' in line]
    criticals = [line for line in lines if ' - CRITICAL - ' in line]
    
    if len(errors) > 50 or len(criticals) > 0:
        send_alert(f"发现 {len(errors)} 个错误，{len(criticals)} 个严重错误")

def send_alert(message):
    """发送告警邮件 / Send alert email"""
    msg = MIMEText(message)
    msg['Subject'] = 'Stellarsis Error Alert'
    msg['From'] = 'alert@example.com'
    msg['To'] = 'admin@example.com'
    
    # 发送邮件 / Send email
    # ...

if __name__ == '__main__':
    check_errors()
```

**定时任务 / Cron Job**:

```bash
# 每小时检查一次 / Check every hour
0 * * * * cd /path/to/stellarsis && python monitor_logs.py
```

---

### 3. 日志聚合（大规模部署）/ Log Aggregation (Large-scale Deployment)

#### 使用 ELK Stack (Elasticsearch + Logstash + Kibana)

```yaml
# logstash.conf
input {
  file {
    path => "/path/to/stellarsis/logs/system.log"
    start_position => "beginning"
    codec => multiline {
      pattern => "^%{TIMESTAMP_ISO8601}"
      negate => true
      what => "previous"
    }
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} - %{WORD:logger} - %{LOGLEVEL:level} - %{GREEDYDATA:message}" }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "stellarsis-%{+YYYY.MM.dd}"
  }
}
```

---

## 日志分析 / Log Analysis

### 1. 统计分析 / Statistical Analysis

#### 统计错误数量 / Count Errors

```bash
# 统计今天的错误数 / Count today's errors
grep "$(date +%Y-%m-%d)" logs/system.log | grep -c "ERROR"

# 统计最近 7 天的错误数 / Count errors in last 7 days
for i in {0..6}; do
  DATE=$(date -d "$i days ago" +%Y-%m-%d)
  COUNT=$(grep "$DATE" logs/system.log | grep -c "ERROR")
  echo "$DATE: $COUNT 个错误"
done
```

#### 统计用户活动 / Count User Activity

```bash
# 统计登录次数 / Count logins
grep "用户登录:" logs/admin.log | wc -l

# 统计每个用户的登录次数 / Count logins per user
grep "用户登录:" logs/admin.log | awk -F': ' '{print $2}' | sort | uniq -c
```

#### 统计管理操作 / Count Admin Operations

```bash
# 统计聊天室创建次数 / Count room creations
grep "创建了聊天室" logs/admin.log | wc -l

# 统计最活跃的管理员 / Count most active admin
grep "^\[" logs/admin.log | awk '{print $2}' | sort | uniq -c | sort -rn | head -10
```

---

### 2. 性能分析 / Performance Analysis

#### 查找慢查询 / Find Slow Queries

```bash
# 查找数据库相关的警告 / Find database-related warnings
grep "database" logs/system.log | grep "WARNING"

# 查找超时错误 / Find timeout errors
grep -i "timeout" logs/system.log
```

#### 分析响应时间 / Analyze Response Time

如果日志中记录了响应时间：

If response times are logged:

```bash
# 提取响应时间并计算平均值 / Extract response times and calculate average
grep "响应时间" logs/system.log | awk '{print $NF}' | awk '{sum+=$1} END {print "平均响应时间:", sum/NR, "ms"}'
```

---

### 3. 安全分析 / Security Analysis

#### 检测登录失败 / Detect Login Failures

```bash
# 查找登录失败记录 / Find login failure records
grep "登录失败" logs/admin.log

# 统计失败次数最多的 IP / Count most failed IPs
# (需要在日志中记录 IP 地址 / Requires IP logging)
grep "登录失败" logs/admin.log | grep -oP '\d+\.\d+\.\d+\.\d+' | sort | uniq -c | sort -rn
```

#### 检测异常操作 / Detect Unusual Operations

```bash
# 查找删除操作 / Find deletion operations
grep "删除" logs/admin.log

# 查找深夜操作（00:00-06:00）/ Find late-night operations (00:00-06:00)
grep -E " 0[0-5]:[0-9]{2}:[0-9]{2}\]" logs/admin.log
```

---

### 4. 日志可视化 / Log Visualization

#### 生成每日报告 / Generate Daily Report

```bash
#!/bin/bash
# daily_report.sh

DATE=$(date +%Y-%m-%d)
REPORT="logs/report_$DATE.txt"

echo "Stellarsis 日志报告 - $DATE" > $REPORT
echo "==============================" >> $REPORT
echo "" >> $REPORT

echo "错误统计:" >> $REPORT
grep "$DATE" logs/system.log | grep -c "ERROR" >> $REPORT
echo "" >> $REPORT

echo "登录统计:" >> $REPORT
grep "$DATE" logs/admin.log | grep -c "用户登录:" >> $REPORT
echo "" >> $REPORT

echo "管理操作统计:" >> $REPORT
grep "$DATE" logs/admin.log | wc -l >> $REPORT
echo "" >> $REPORT

echo "前 10 个错误:" >> $REPORT
grep "$DATE" logs/system.log | grep "ERROR" | head -10 >> $REPORT
```

**定时任务 / Cron Job**:

```bash
# 每天 23:59 生成报告 / Generate report daily at 23:59
59 23 * * * /path/to/stellarsis/daily_report.sh
```

---

## 最佳实践 / Best Practices

### 1. 日志记录建议 / Logging Recommendations

✅ **应该记录 / Should Log**:
- 所有管理员操作 / All admin operations
- 用户认证事件 / User authentication events
- 错误和异常 / Errors and exceptions
- 重要的业务事件 / Important business events
- 性能问题 / Performance issues

❌ **不应记录 / Should Not Log**:
- 密码（明文或哈希）/ Passwords (plaintext or hashed)
- 敏感个人信息 / Sensitive personal information
- 过于频繁的调试信息（生产环境）/ Too frequent debug info (production)
- 完整的数据库查询结果 / Full database query results

### 2. 日志安全 / Log Security

```bash
# 设置日志文件权限 / Set log file permissions
chmod 640 logs/*.log  # 只有所有者和组可读 / Owner and group read only
chown www-data:adm logs/*.log  # 设置适当的所有者 / Set appropriate owner

# 防止未授权访问 / Prevent unauthorized access
# 确保 logs/ 目录不在 Web 服务器的公开目录中
# Ensure logs/ is not in web server's public directory
```

### 3. 日志保留策略 / Log Retention Policy

**开发环境 / Development**:
- system.log: 保留 7 天（约 70 MB）/ Keep 7 days (~70 MB)
- admin.log: 保留 30 天 / Keep 30 days

**生产环境 / Production**:
- system.log: 保留 30 天（约 300 MB）/ Keep 30 days (~300 MB)
- admin.log: 保留 90 天（用于审计）/ Keep 90 days (for audit)
- 定期归档到长期存储 / Regularly archive to long-term storage

### 4. 性能优化 / Performance Optimization

```python
# 避免在循环中频繁记录日志 / Avoid logging frequently in loops
# ❌ 不推荐 / Not recommended
for user in users:
    logger.info(f"处理用户: {user.username}")  # 可能产生数千条日志 / May produce thousands of logs

# ✅ 推荐 / Recommended
logger.info(f"开始处理 {len(users)} 个用户")
# ... 处理逻辑 / processing logic
logger.info(f"完成处理 {len(users)} 个用户")
```

---

## 故障排除 / Troubleshooting

### 1. 日志文件不存在 / Log File Doesn't Exist

**问题 / Problem**: 应用启动后没有创建日志文件。

Application doesn't create log files after startup.

**解决方案 / Solution**:

```bash
# 检查 logs/ 目录是否存在 / Check if logs/ directory exists
ls -la logs/

# 如果不存在，手动创建 / If not exists, create manually
mkdir -p logs
chmod 755 logs

# 检查文件权限 / Check file permissions
ls -la logs/system.log

# 如果权限不足，修改权限 / If insufficient permissions, change permissions
chmod 644 logs/system.log
```

---

### 2. 日志编码错误 / Log Encoding Error

**问题 / Problem**: 日志中的中文显示为乱码。

Chinese characters in logs display as garbled text.

**解决方案 / Solution**:

```python
# 确保使用 UTF-8 编码 / Ensure UTF-8 encoding
handler = RotatingFileHandler(
    'logs/system.log',
    encoding='utf-8'  # 重要 / Important
)
```

查看日志时使用正确的编码：

Use correct encoding when viewing logs:

```bash
# Linux/Mac
tail -f logs/system.log

# Windows PowerShell
Get-Content logs\system.log -Encoding UTF8 -Wait
```

---

### 3. 日志文件过大 / Log File Too Large

**问题 / Problem**: 日志文件增长过快，占用大量磁盘空间。

Log file grows too fast, consuming too much disk space.

**解决方案 / Solution**:

```python
# 1. 减小日志文件大小限制 / Reduce log file size limit
handler = RotatingFileHandler(
    'logs/system.log',
    maxBytes=5*1024*1024,  # 改为 5 MB / Change to 5 MB
    backupCount=3          # 减少备份数 / Reduce backup count
)

# 2. 提高日志级别 / Increase log level
logger.setLevel(logging.WARNING)  # 只记录警告及以上 / Only WARNING and above

# 3. 手动清理旧日志 / Manually clean old logs
find logs/ -name "*.log.*" -mtime +7 -delete  # 删除 7 天前的备份 / Delete backups older than 7 days
```

---

## 版本信息 / Version Information

- **文档版本 / Document Version**: 1.0
- **应用版本 / Application Version**: Stellarsis (Flask 3.1.2)
- **日志框架 / Logging Framework**: Python logging (标准库 / Standard library)
- **最后更新 / Last Updated**: 2025-02-10

---

## 参考资料 / References

- [Python logging 官方文档](https://docs.python.org/3/library/logging.html)
- [Python RotatingFileHandler 文档](https://docs.python.org/3/library/logging.handlers.html#rotatingfilehandler)
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 后端架构文档 / Backend architecture
- [DATABASE.md](./DATABASE.md) - 数据库文档 / Database documentation
- [API.md](./API.md) - API 文档 / API documentation
