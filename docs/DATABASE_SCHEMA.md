# 数据库架构文档 / Database Schema Documentation

本文档详细描述 Stellarsis 系统的数据库模型和表结构。

## 概览 / Overview

Stellarsis 使用 SQLAlchemy ORM 进行数据库操作，默认使用 SQLite，但支持 PostgreSQL 和 MySQL。

**数据库表（12 个）**:
- User - 用户
- ChatRoom - 聊天室
- ChatMessage - 聊天消息
- ChatPermission - 聊天室权限
- ChatLastView - 聊天室最后查看时间
- ForumSection - 论坛分区
- ForumThread - 论坛主题帖
- ForumReply - 论坛回复
- ForumPermission - 论坛权限
- ForumLastView - 论坛最后查看时间
- UserFollow - 用户关注关系
- UserImage - 用户上传图片

---

## 表结构详细说明

### 1. User（用户表）

存储系统所有用户的基本信息和设置。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 用户唯一标识 |
| username | String(64) | UNIQUE, INDEX | - | 用户名，登录凭证 |
| password_hash | String(128) | NOT NULL | - | 密码哈希（建议使用 werkzeug.security） |
| nickname | String(64) | - | '' | 显示昵称 |
| color | String(7) | - | #000000 | 昵称显示颜色（十六进制） |
| badge | String(32) | - | '' | 用户徽章 |
| last_seen | DateTime | - | utcnow() | 最后活动时间（用于在线状态判断） |
| role | String(20) | - | 'user' | 用户角色：'user' 或 'admin' |
| upload_used | Integer | - | 0 | 已使用的上传配额（字节） |

**索引**:
- `username` - UNIQUE INDEX（快速用户名查找）

**关系**:
- `chat_messages` - 一对多关系，用户发送的聊天消息
- `forum_threads` - 一对多关系，用户创建的主题帖
- `forum_replies` - 一对多关系，用户的论坛回复
- `chat_permissions` - 一对多关系，用户的聊天室权限
- `forum_permissions` - 一对多关系，用户的论坛权限
- `following` - 多对多关系（通过 UserFollow），用户关注的其他用户
- `followers` - 多对多关系（通过 UserFollow），关注该用户的其他用户
- `images` - 一对多关系，用户上传的图片

**方法**:
- `is_admin()` - 检查是否为管理员
- `set_password(password)` - 设置密码哈希
- `check_password(password)` - 验证密码

---

### 2. ChatRoom（聊天室表）

存储聊天室基本信息。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 聊天室唯一标识 |
| name | String(64) | UNIQUE | - | 聊天室名称 |
| description | Text | - | - | 聊天室描述 |

**关系**:
- `messages` - 一对多关系，该聊天室的所有消息

---

### 3. ChatMessage（聊天消息表）

存储所有聊天室消息。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 消息唯一标识 |
| content | Text | NOT NULL | - | 消息内容（支持 Markdown 和 LaTeX） |
| timestamp | DateTime | INDEX | utcnow() | 消息发送时间 |
| user_id | Integer | FOREIGN KEY | - | 发送者 ID（关联 User.id） |
| room_id | Integer | FOREIGN KEY | - | 所属聊天室 ID（关联 ChatRoom.id） |

**索引**:
- `timestamp` - INDEX（按时间排序和过滤）

**关系**:
- `user` - 多对一关系，消息发送者
- `room` - 多对一关系，消息所属聊天室

---

### 4. ChatPermission（聊天室权限表）

存储用户在各聊天室的权限设置。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 权限记录唯一标识 |
| user_id | Integer | FOREIGN KEY, NOT NULL | - | 用户 ID（关联 User.id） |
| room_id | Integer | FOREIGN KEY, NOT NULL | - | 聊天室 ID（关联 ChatRoom.id） |
| perm | String(10) | - | 'Null' | 权限级别：'su', '777', '444', 'Null' |

**权限说明**:
- `su` - 超级用户，完全权限
- `777` - 读写权限，可发送和查看消息
- `444` - 只读权限，只能查看
- `Null` - 无权限，无法访问

**关系**:
- `user` - 多对一关系，权限所属用户
- `room` - 多对一关系，权限所属聊天室

---

### 5. ChatLastView（聊天室最后查看表）

记录用户最后查看各聊天室的时间，用于计算未读消息数。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 记录唯一标识 |
| user_id | Integer | FOREIGN KEY, NOT NULL | - | 用户 ID（关联 User.id） |
| room_id | Integer | FOREIGN KEY, NOT NULL | - | 聊天室 ID（关联 ChatRoom.id） |
| last_view | DateTime | - | utcnow() | 最后查看时间 |

**关系**:
- `user` - 多对一关系
- `room` - 多对一关系

---

### 6. ForumSection（论坛分区表）

存储论坛分区信息。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 分区唯一标识 |
| name | String(64) | UNIQUE | - | 分区名称 |
| description | Text | - | - | 分区描述 |

**关系**:
- `threads` - 一对多关系，该分区的所有主题帖

---

### 7. ForumThread（论坛主题帖表）

存储论坛主题帖。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 帖子唯一标识 |
| title | String(128) | NOT NULL | - | 帖子标题 |
| content | Text | NOT NULL | - | 帖子内容（支持 Markdown 和 LaTeX） |
| timestamp | DateTime | INDEX | utcnow() | 发帖时间 |
| user_id | Integer | FOREIGN KEY | - | 发帖者 ID（关联 User.id） |
| section_id | Integer | FOREIGN KEY | - | 所属分区 ID（关联 ForumSection.id） |

**索引**:
- `timestamp` - INDEX（按时间排序）

**关系**:
- `user` - 多对一关系，帖子作者
- `section` - 多对一关系，帖子所属分区
- `replies` - 一对多关系（动态加载），帖子的所有回复

---

### 8. ForumReply（论坛回复表）

存储论坛回复。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 回复唯一标识 |
| content | Text | NOT NULL | - | 回复内容（支持 Markdown 和 LaTeX） |
| timestamp | DateTime | INDEX | utcnow() | 回复时间 |
| user_id | Integer | FOREIGN KEY | - | 回复者 ID（关联 User.id） |
| thread_id | Integer | FOREIGN KEY | - | 所属主题帖 ID（关联 ForumThread.id） |

**索引**:
- `timestamp` - INDEX（按时间排序）

**关系**:
- `user` - 多对一关系，回复作者
- `thread` - 多对一关系，回复所属主题帖

---

### 9. ForumPermission（论坛权限表）

存储用户在各论坛分区的权限设置。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 权限记录唯一标识 |
| user_id | Integer | FOREIGN KEY, NOT NULL | - | 用户 ID（关联 User.id） |
| section_id | Integer | FOREIGN KEY, NOT NULL | - | 分区 ID（关联 ForumSection.id） |
| perm | String(10) | - | 'Null' | 权限级别：'su', '777', '444', 'Null' |

**权限说明**（同聊天室权限）:
- `su` - 超级用户，完全权限
- `777` - 读写权限，可发帖和查看
- `444` - 只读权限，只能查看
- `Null` - 无权限，无法访问

**关系**:
- `user` - 多对一关系，权限所属用户
- `section` - 多对一关系，权限所属分区

---

### 10. ForumLastView（论坛最后查看表）

记录用户最后查看各分区的时间，用于计算未读帖子数。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 记录唯一标识 |
| user_id | Integer | FOREIGN KEY, NOT NULL | - | 用户 ID（关联 User.id） |
| section_id | Integer | FOREIGN KEY, NOT NULL | - | 分区 ID（关联 ForumSection.id） |
| last_view | DateTime | - | utcnow() | 最后查看时间 |

**关系**:
- `user` - 多对一关系
- `section` - 多对一关系

---

### 11. UserFollow（用户关注表）

存储用户之间的关注关系。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 关注记录唯一标识 |
| follower_id | Integer | FOREIGN KEY, NOT NULL | - | 关注者 ID（关联 User.id） |
| followed_id | Integer | FOREIGN KEY, NOT NULL | - | 被关注者 ID（关联 User.id） |
| created_at | DateTime | - | utcnow() | 关注时间 |

**关系**:
- `follower` - 多对一关系（外键 follower_id），关注者
- `followed` - 多对一关系（外键 followed_id），被关注者

**唯一约束建议**:
建议添加 `(follower_id, followed_id)` 组合唯一约束，防止重复关注。

---

### 12. UserImage（用户图片表）

存储用户上传的图片信息。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | Integer | PRIMARY KEY | AUTO | 图片唯一标识 |
| user_id | Integer | FOREIGN KEY, NOT NULL | - | 上传者 ID（关联 User.id） |
| filename | String(255) | NOT NULL | - | 文件名 |
| filepath | String(512) | NOT NULL | - | 文件路径（相对于 UPLOAD_FOLDER） |
| file_size | Integer | NOT NULL | - | 文件大小（字节） |
| upload_time | DateTime | - | utcnow() | 上传时间 |
| file_type | String(50) | NOT NULL | - | 文件类型（MIME type） |

**关系**:
- `user` - 多对一关系，图片上传者

---

## 数据库关系图

```
User
├─> ChatMessage (user_id)
├─> ForumThread (user_id)
├─> ForumReply (user_id)
├─> ChatPermission (user_id)
├─> ForumPermission (user_id)
├─> ChatLastView (user_id)
├─> ForumLastView (user_id)
├─> UserFollow (follower_id, followed_id)
└─> UserImage (user_id)

ChatRoom
├─> ChatMessage (room_id)
├─> ChatPermission (room_id)
└─> ChatLastView (room_id)

ForumSection
├─> ForumThread (section_id)
├─> ForumPermission (section_id)
└─> ForumLastView (section_id)

ForumThread
└─> ForumReply (thread_id)
```

---

## 数据库初始化

应用启动时会自动执行以下操作：

1. **创建所有表**（`Base.metadata.create_all(bind=engine)`）
2. **更新数据库结构**（`update_database_schema()`）
   - 检查并添加 `role` 列到 users 表
   - 检查并添加 `upload_used` 列到 users 表
3. **确保权限表存在**（`ensure_permission_tables()`）
4. **确保 admin 用户存在**（`ensure_admin_user()`）
   - 如果 admin 用户不存在，创建默认管理员（username: admin, password: admin123）
   - 如果 admin 用户存在但不是管理员角色，升级为管理员
5. **为所有管理员分配 su 权限**（`grant_su_to_admins()`）

---

## 数据库查询优化建议

### 1. 添加索引

```sql
-- 聊天消息按房间和时间查询
CREATE INDEX idx_chat_messages_room_time ON chat_messages(room_id, timestamp DESC);

-- 论坛帖子按分区和时间查询
CREATE INDEX idx_forum_threads_section_time ON forum_threads(section_id, timestamp DESC);

-- 论坛回复按主题和时间查询
CREATE INDEX idx_forum_replies_thread_time ON forum_replies(thread_id, timestamp DESC);

-- 用户最后活动时间查询
CREATE INDEX idx_users_last_seen ON users(last_seen DESC);
```

### 2. 查询优化

**获取聊天历史（分页）**:
```python
messages = db_session.query(ChatMessage)\
    .filter(ChatMessage.room_id == room_id)\
    .order_by(ChatMessage.timestamp.desc())\
    .limit(limit)\
    .offset(offset)\
    .all()
```

**获取在线用户**:
```python
from datetime import datetime, timedelta
online_threshold = datetime.utcnow() - timedelta(seconds=ONLINE_TIMEOUT)
online_users = db_session.query(User)\
    .filter(User.last_seen >= online_threshold)\
    .all()
```

**获取未读消息数**:
```python
last_view = db_session.query(ChatLastView)\
    .filter_by(user_id=user_id, room_id=room_id)\
    .first()
if last_view:
    unread_count = db_session.query(ChatMessage)\
        .filter(ChatMessage.room_id == room_id,
                ChatMessage.timestamp > last_view.last_view)\
        .count()
```

---

## 数据库维护

### 定期优化（SQLite）

```bash
# 清理数据库碎片，减小文件大小
sqlite3 stellarsis.db "VACUUM;"

# 重建索引
sqlite3 stellarsis.db "REINDEX;"

# 分析查询优化器
sqlite3 stellarsis.db "ANALYZE;"
```

### 备份策略

```bash
# 备份数据库文件
cp stellarsis.db stellarsis_backup_$(date +%Y%m%d_%H%M%S).db

# 导出 SQL
sqlite3 stellarsis.db .dump > stellarsis_backup.sql

# 导出特定表
sqlite3 stellarsis.db ".dump users" > users_backup.sql
```

### 迁移到 PostgreSQL

```python
# 1. 修改 config.py
SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@localhost/stellarsis'

# 2. 导出 SQLite 数据
# 使用 pgloader 或手动导出/导入

# 3. 重建索引和优化
# PostgreSQL 会自动创建更优的执行计划
```

---

## 常见问题

### 1. 如何查看表结构？

```bash
sqlite3 stellarsis.db
.schema users
.schema chat_messages
.quit
```

### 2. 如何直接修改数据？

```bash
sqlite3 stellarsis.db
UPDATE users SET role='admin' WHERE username='testuser';
SELECT * FROM users WHERE role='admin';
.quit
```

### 3. 如何重置数据库？

```bash
# 备份
mv stellarsis.db stellarsis_old.db

# 重新启动应用，会自动创建新数据库
python app.py
```

---

**文档版本**: 1.0  
**最后更新**: 2026-01-15
