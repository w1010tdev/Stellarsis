# Stellarsis 数据库文档 / Database Documentation

本文档详细描述 Stellarsis 系统的数据库架构、表结构、关系和操作指南。

This document provides comprehensive documentation of the Stellarsis database architecture, table structures, relationships, and operation guides.

---

## 目录 / Table of Contents

1. [数据库概览 / Database Overview](#数据库概览--database-overview)
2. [表结构详解 / Table Structures](#表结构详解--table-structures)
3. [关系与外键 / Relationships and Foreign Keys](#关系与外键--relationships-and-foreign-keys)
4. [索引与性能 / Indexes and Performance](#索引与性能--indexes-and-performance)
5. [业务逻辑 / Business Logic](#业务逻辑--business-logic)
6. [数据库操作示例 / Database Operation Examples](#数据库操作示例--database-operation-examples)
7. [迁移指南 / Migration Guide](#迁移指南--migration-guide)

---

## 数据库概览 / Database Overview

### 技术栈 / Technology Stack

- **ORM**: SQLAlchemy 3.1.1
- **默认数据库 / Default**: SQLite
- **支持的数据库 / Supported Databases**: SQLite, PostgreSQL, MySQL/MariaDB

### 数据库连接 / Database Connection

```python
# SQLite (开发环境 / Development)
SQLALCHEMY_DATABASE_URI = 'sqlite:///stellarsis.db'

# PostgreSQL (生产环境 / Production)
SQLALCHEMY_DATABASE_URI = 'postgresql://user:password@localhost/stellarsis'

# MySQL (可选 / Optional)
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://user:password@localhost/stellarsis'
```

### 数据库表清单 / Database Tables

Stellarsis 系统包含 12 个核心数据表：

Stellarsis system contains 12 core database tables:

| # | 表名 / Table Name | 中文名称 | 说明 / Description |
|---|---|---|---|
| 1 | `users` | 用户表 | 存储用户账户信息 / Store user account information |
| 2 | `chat_rooms` | 聊天室表 | 存储聊天室信息 / Store chat room information |
| 3 | `chat_messages` | 聊天消息表 | 存储聊天消息 / Store chat messages |
| 4 | `chat_permissions` | 聊天室权限表 | 用户聊天室权限 / User chat room permissions |
| 5 | `chat_last_views` | 聊天室查看记录表 | 用户最后查看时间 / User last view timestamps |
| 6 | `forum_sections` | 论坛分区表 | 存储论坛分区 / Store forum sections |
| 7 | `forum_threads` | 论坛主题帖表 | 存储主题帖 / Store forum threads |
| 8 | `forum_replies` | 论坛回复表 | 存储帖子回复 / Store thread replies |
| 9 | `forum_permissions` | 论坛权限表 | 用户论坛分区权限 / User forum section permissions |
| 10 | `forum_last_views` | 论坛查看记录表 | 用户最后查看时间 / User last view timestamps |
| 11 | `user_follows` | 用户关注表 | 用户关注关系 / User follow relationships |
| 12 | `user_images` | 用户图片表 | 用户上传的图片 / User uploaded images |

---

## 表结构详解 / Table Structures

### 1. users（用户表）

存储系统所有用户的基本信息和设置。

Stores basic information and settings for all system users.

#### 表结构 / Table Structure

```python
class User(UserMixin, Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, index=True)
    password_hash = Column(String(128))
    nickname = Column(String(64), default='')
    color = Column(String(7), default='#000000')
    badge = Column(String(32), default='')
    last_seen = Column(DateTime, default=utcnow)
    role = Column(String(20), default='user')
    upload_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 默认值 / Default | 说明 / Description |
|---|---|---|---|---|
| `id` | Integer | PRIMARY KEY, AUTO INCREMENT | - | 用户唯一标识 / Unique user identifier |
| `username` | String(64) | UNIQUE, NOT NULL, INDEX | - | 登录用户名，唯一索引 / Login username, unique index |
| `password_hash` | String(128) | NOT NULL | - | 密码哈希（PBKDF2-SHA256）/ Password hash (PBKDF2-SHA256) |
| `nickname` | String(64) | - | `''` | 显示昵称 / Display nickname |
| `color` | String(7) | - | `'#000000'` | 昵称颜色（十六进制）/ Nickname color (hex) |
| `badge` | String(32) | - | `''` | 用户徽章文本 / User badge text |
| `last_seen` | DateTime | - | `utcnow()` | 最后活动时间（UTC）/ Last activity time (UTC) |
| `role` | String(20) | - | `'user'` | 用户角色：`'user'` 或 `'admin'` / User role: `'user'` or `'admin'` |
| `upload_used` | Integer | - | `0` | 已使用上传配额（字节）/ Upload quota used (bytes) |
| `created_at` | DateTime | - | `utcnow()` | 账户创建时间（UTC）/ Account creation time (UTC) |

#### 业务方法 / Business Methods

```python
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

#### 关系 / Relationships

- `chat_messages` → ChatMessage (一对多 / One-to-many)
- `forum_threads` → ForumThread (一对多 / One-to-many)
- `forum_replies` → ForumReply (一对多 / One-to-many)
- `chat_permissions` → ChatPermission (一对多 / One-to-many)
- `forum_permissions` → ForumPermission (一对多 / One-to-many)
- `following` → User (多对多，通过 UserFollow / Many-to-many via UserFollow)
- `followers` → User (多对多，通过 UserFollow / Many-to-many via UserFollow)
- `images` → UserImage (一对多 / One-to-many)

---

### 2. chat_rooms（聊天室表）

存储聊天室基本信息。

Stores basic information for chat rooms.

#### 表结构 / Table Structure

```python
class ChatRoom(Base):
    __tablename__ = 'chat_rooms'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    description = Column(Text)
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 聊天室唯一标识 / Unique room identifier |
| `name` | String(64) | UNIQUE, NOT NULL | 聊天室名称，唯一 / Room name, unique |
| `description` | Text | - | 聊天室描述 / Room description |

#### 关系 / Relationships

- `messages` → ChatMessage (一对多 / One-to-many)
- `permissions` → ChatPermission (一对多 / One-to-many)
- `last_views` → ChatLastView (一对多 / One-to-many)

---

### 3. chat_messages（聊天消息表）

存储所有聊天室消息。

Stores all chat room messages.

#### 表结构 / Table Structure

```python
class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, index=True, default=utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    room_id = Column(Integer, ForeignKey('chat_rooms.id'))
    
    user = relationship('User', backref='chat_messages')
    room = relationship('ChatRoom', backref='messages')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 消息唯一标识 / Unique message identifier |
| `content` | Text | NOT NULL | 消息内容（支持 Markdown 和 LaTeX）/ Message content (supports Markdown and LaTeX) |
| `timestamp` | DateTime | INDEX, DEFAULT utcnow() | 消息发送时间（UTC）/ Message timestamp (UTC) |
| `user_id` | Integer | FOREIGN KEY → `users.id` | 发送者用户 ID / Sender user ID |
| `room_id` | Integer | FOREIGN KEY → `chat_rooms.id` | 所属聊天室 ID / Room ID |

#### 索引建议 / Index Recommendations

```sql
-- 复合索引用于按房间和时间查询 / Composite index for room and time queries
CREATE INDEX idx_chat_messages_room_time ON chat_messages(room_id, timestamp DESC);
```

---

### 4. chat_permissions（聊天室权限表）

存储用户在各聊天室的权限设置。

Stores user permissions for each chat room.

#### 表结构 / Table Structure

```python
class ChatPermission(Base):
    __tablename__ = 'chat_permissions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    perm = Column(String(10), default='Null')
    
    user = relationship('User', backref='chat_permissions')
    room = relationship('ChatRoom', backref='permissions')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 默认值 / Default | 说明 / Description |
|---|---|---|---|---|
| `id` | Integer | PRIMARY KEY | - | 权限记录唯一标识 / Unique permission record identifier |
| `user_id` | Integer | FOREIGN KEY, NOT NULL | - | 用户 ID / User ID |
| `room_id` | Integer | FOREIGN KEY, NOT NULL | - | 聊天室 ID / Room ID |
| `perm` | String(10) | - | `'Null'` | 权限级别 / Permission level |

#### 权限级别 / Permission Levels

| 权限值 / Permission | 说明 / Description | 能力 / Capabilities |
|---|---|---|
| `'su'` | 超级用户 / Super User | 完全权限：读、写、删除他人消息、管理 / Full access: read, write, delete others' messages, manage |
| `'777'` | 读写权限 / Read-Write | 读、写，仅能删除自己的消息 / Read, write, delete only own messages |
| `'444'` | 只读权限 / Read-Only | 仅读取 / Read only |
| `'Null'` | 无权限 / No Access | 无法访问 / No access |

#### 唯一约束建议 / Unique Constraint Recommendation

```sql
-- 防止同一用户在同一房间有多条权限记录
-- Prevent multiple permission records for same user in same room
ALTER TABLE chat_permissions ADD UNIQUE (user_id, room_id);
```

---

### 5. chat_last_views（聊天室查看记录表）

记录用户最后查看各聊天室的时间，用于计算未读消息数。

Records when users last viewed each chat room, used for calculating unread message counts.

#### 表结构 / Table Structure

```python
class ChatLastView(Base):
    __tablename__ = 'chat_last_views'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    last_view = Column(DateTime, default=utcnow)
    
    user = relationship('User')
    room = relationship('ChatRoom')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 记录唯一标识 / Unique record identifier |
| `user_id` | Integer | FOREIGN KEY, NOT NULL | 用户 ID / User ID |
| `room_id` | Integer | FOREIGN KEY, NOT NULL | 聊天室 ID / Room ID |
| `last_view` | DateTime | DEFAULT utcnow() | 最后查看时间（UTC）/ Last view timestamp (UTC) |

---

### 6. forum_sections（论坛分区表）

存储论坛分区信息。

Stores forum section information.

#### 表结构 / Table Structure

```python
class ForumSection(Base):
    __tablename__ = 'forum_sections'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    description = Column(Text)
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 分区唯一标识 / Unique section identifier |
| `name` | String(64) | UNIQUE, NOT NULL | 分区名称，唯一 / Section name, unique |
| `description` | Text | - | 分区描述 / Section description |

#### 关系 / Relationships

- `threads` → ForumThread (一对多 / One-to-many)
- `permissions` → ForumPermission (一对多 / One-to-many)
- `last_views` → ForumLastView (一对多 / One-to-many)

---

### 7. forum_threads（论坛主题帖表）

存储论坛主题帖。

Stores forum threads.

#### 表结构 / Table Structure

```python
class ForumThread(Base):
    __tablename__ = 'forum_threads'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(128), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, index=True, default=utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    section_id = Column(Integer, ForeignKey('forum_sections.id'))
    
    user = relationship('User', backref='forum_threads')
    section = relationship('ForumSection', backref='threads')
    replies = relationship('ForumReply', backref='thread', lazy='dynamic')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 主题帖唯一标识 / Unique thread identifier |
| `title` | String(128) | NOT NULL | 帖子标题 / Thread title |
| `content` | Text | NOT NULL | 帖子内容（支持 Markdown 和 LaTeX）/ Thread content (supports Markdown and LaTeX) |
| `timestamp` | DateTime | INDEX, DEFAULT utcnow() | 发帖时间（UTC）/ Post timestamp (UTC) |
| `user_id` | Integer | FOREIGN KEY → `users.id` | 发帖者 ID / Thread author ID |
| `section_id` | Integer | FOREIGN KEY → `forum_sections.id` | 所属分区 ID / Section ID |

#### 索引建议 / Index Recommendations

```sql
-- 复合索引用于按分区和时间查询 / Composite index for section and time queries
CREATE INDEX idx_forum_threads_section_time ON forum_threads(section_id, timestamp DESC);
```

---

### 8. forum_replies（论坛回复表）

存储论坛回复。

Stores forum replies.

#### 表结构 / Table Structure

```python
class ForumReply(Base):
    __tablename__ = 'forum_replies'
    
    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, index=True, default=utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    thread_id = Column(Integer, ForeignKey('forum_threads.id'))
    
    user = relationship('User', backref='forum_replies')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 回复唯一标识 / Unique reply identifier |
| `content` | Text | NOT NULL | 回复内容（支持 Markdown 和 LaTeX）/ Reply content (supports Markdown and LaTeX) |
| `timestamp` | DateTime | INDEX, DEFAULT utcnow() | 回复时间（UTC）/ Reply timestamp (UTC) |
| `user_id` | Integer | FOREIGN KEY → `users.id` | 回复者 ID / Reply author ID |
| `thread_id` | Integer | FOREIGN KEY → `forum_threads.id` | 所属主题帖 ID / Thread ID |

#### 索引建议 / Index Recommendations

```sql
-- 复合索引用于按主题帖和时间查询 / Composite index for thread and time queries
CREATE INDEX idx_forum_replies_thread_time ON forum_replies(thread_id, timestamp DESC);
```

---

### 9. forum_permissions（论坛权限表）

存储用户在各论坛分区的权限设置。

Stores user permissions for each forum section.

#### 表结构 / Table Structure

```python
class ForumPermission(Base):
    __tablename__ = 'forum_permissions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('forum_sections.id'), nullable=False)
    perm = Column(String(10), default='Null')
    
    user = relationship('User', backref='forum_permissions')
    section = relationship('ForumSection', backref='permissions')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 默认值 / Default | 说明 / Description |
|---|---|---|---|---|
| `id` | Integer | PRIMARY KEY | - | 权限记录唯一标识 / Unique permission record identifier |
| `user_id` | Integer | FOREIGN KEY, NOT NULL | - | 用户 ID / User ID |
| `section_id` | Integer | FOREIGN KEY, NOT NULL | - | 分区 ID / Section ID |
| `perm` | String(10) | - | `'Null'` | 权限级别（同聊天室权限）/ Permission level (same as chat permissions) |

#### 权限级别 / Permission Levels

同 `chat_permissions` 表的权限级别。

Same as `chat_permissions` permission levels.

---

### 10. forum_last_views（论坛查看记录表）

记录用户最后查看各分区的时间，用于计算未读帖子数。

Records when users last viewed each forum section, used for calculating unread thread counts.

#### 表结构 / Table Structure

```python
class ForumLastView(Base):
    __tablename__ = 'forum_last_views'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('forum_sections.id'), nullable=False)
    last_view = Column(DateTime, default=utcnow)
    
    user = relationship('User')
    section = relationship('ForumSection')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 记录唯一标识 / Unique record identifier |
| `user_id` | Integer | FOREIGN KEY, NOT NULL | 用户 ID / User ID |
| `section_id` | Integer | FOREIGN KEY, NOT NULL | 分区 ID / Section ID |
| `last_view` | DateTime | DEFAULT utcnow() | 最后查看时间（UTC）/ Last view timestamp (UTC) |

---

### 11. user_follows（用户关注表）

存储用户之间的关注关系。

Stores follow relationships between users.

#### 表结构 / Table Structure

```python
class UserFollow(Base):
    __tablename__ = 'user_follows'
    
    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    followed_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    
    follower = relationship('User', foreign_keys=[follower_id], backref='following')
    followed = relationship('User', foreign_keys=[followed_id], backref='followers')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 关注记录唯一标识 / Unique follow record identifier |
| `follower_id` | Integer | FOREIGN KEY → `users.id`, NOT NULL | 关注者用户 ID / Follower user ID |
| `followed_id` | Integer | FOREIGN KEY → `users.id`, NOT NULL | 被关注者用户 ID / Followed user ID |
| `created_at` | DateTime | DEFAULT utcnow() | 关注时间（UTC）/ Follow timestamp (UTC) |

#### 唯一约束建议 / Unique Constraint Recommendation

```sql
-- 防止重复关注 / Prevent duplicate follows
ALTER TABLE user_follows ADD UNIQUE (follower_id, followed_id);

-- 检查约束：防止自己关注自己 / Check constraint: prevent self-follow
ALTER TABLE user_follows ADD CHECK (follower_id != followed_id);
```

---

### 12. user_images（用户图片表）

存储用户上传的图片信息。

Stores user uploaded image information.

#### 表结构 / Table Structure

```python
class UserImage(Base):
    __tablename__ = 'user_images'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_time = Column(DateTime, default=utcnow)
    file_type = Column(String(50), nullable=False)
    
    user = relationship('User', backref='images')
```

#### 字段说明 / Field Descriptions

| 字段名 / Field | 类型 / Type | 约束 / Constraints | 说明 / Description |
|---|---|---|---|
| `id` | Integer | PRIMARY KEY | 图片唯一标识 / Unique image identifier |
| `user_id` | Integer | FOREIGN KEY → `users.id`, NOT NULL | 上传者用户 ID / Uploader user ID |
| `filename` | String(255) | NOT NULL | 原始文件名 / Original filename |
| `filepath` | String(512) | NOT NULL | 文件存储路径（相对于 UPLOAD_FOLDER）/ File storage path (relative to UPLOAD_FOLDER) |
| `file_size` | Integer | NOT NULL | 文件大小（字节）/ File size (bytes) |
| `upload_time` | DateTime | DEFAULT utcnow() | 上传时间（UTC）/ Upload timestamp (UTC) |
| `file_type` | String(50) | NOT NULL | MIME 类型（如 `image/png`）/ MIME type (e.g., `image/png`) |

---

## 关系与外键 / Relationships and Foreign Keys

### 实体关系图 / Entity Relationship Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       ├─────── chat_messages (user_id)
       ├─────── forum_threads (user_id)
       ├─────── forum_replies (user_id)
       ├─────── chat_permissions (user_id)
       ├─────── forum_permissions (user_id)
       ├─────── chat_last_views (user_id)
       ├─────── forum_last_views (user_id)
       ├─────── user_follows (follower_id, followed_id)
       └─────── user_images (user_id)

┌─────────────┐
│  ChatRoom   │
└──────┬──────┘
       │
       ├─────── chat_messages (room_id)
       ├─────── chat_permissions (room_id)
       └─────── chat_last_views (room_id)

┌─────────────────┐
│ ForumSection    │
└────────┬────────┘
         │
         ├─────── forum_threads (section_id)
         ├─────── forum_permissions (section_id)
         └─────── forum_last_views (section_id)

┌─────────────────┐
│ ForumThread     │
└────────┬────────┘
         │
         └─────── forum_replies (thread_id)
```

### 外键级联规则 / Foreign Key Cascade Rules

**当前实现 / Current Implementation**: 无级联删除（需手动处理）

**No cascade delete (manual handling required)**

**建议配置 / Recommended Configuration**:

```python
# 删除用户时级联删除相关内容
# Cascade delete related content when deleting user
user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))

# 删除房间/分区时级联删除相关内容
# Cascade delete related content when deleting room/section
room_id = Column(Integer, ForeignKey('chat_rooms.id', ondelete='CASCADE'))
section_id = Column(Integer, ForeignKey('forum_sections.id', ondelete='CASCADE'))
```

---

## 索引与性能 / Indexes and Performance

### 现有索引 / Existing Indexes

| 表 / Table | 字段 / Field | 索引类型 / Index Type | 说明 / Description |
|---|---|---|---|
| `users` | `username` | UNIQUE INDEX | 快速用户名查找、登录验证 / Fast username lookup, login verification |
| `chat_messages` | `timestamp` | INDEX | 按时间排序消息 / Sort messages by time |
| `forum_threads` | `timestamp` | INDEX | 按时间排序主题帖 / Sort threads by time |
| `forum_replies` | `timestamp` | INDEX | 按时间排序回复 / Sort replies by time |

### 推荐添加的索引 / Recommended Additional Indexes

```sql
-- 聊天消息按房间和时间查询
-- Chat messages query by room and time
CREATE INDEX idx_chat_messages_room_time 
ON chat_messages(room_id, timestamp DESC);

-- 论坛主题帖按分区和时间查询
-- Forum threads query by section and time
CREATE INDEX idx_forum_threads_section_time 
ON forum_threads(section_id, timestamp DESC);

-- 论坛回复按主题帖和时间查询
-- Forum replies query by thread and time
CREATE INDEX idx_forum_replies_thread_time 
ON forum_replies(thread_id, timestamp DESC);

-- 用户最后活动时间查询（在线状态）
-- User last activity time query (online status)
CREATE INDEX idx_users_last_seen 
ON users(last_seen DESC);

-- 权限查询优化
-- Permission query optimization
CREATE INDEX idx_chat_permissions_user_room 
ON chat_permissions(user_id, room_id);

CREATE INDEX idx_forum_permissions_user_section 
ON forum_permissions(user_id, section_id);

-- 关注关系查询优化
-- Follow relationship query optimization
CREATE INDEX idx_user_follows_follower 
ON user_follows(follower_id);

CREATE INDEX idx_user_follows_followed 
ON user_follows(followed_id);
```

### 性能优化建议 / Performance Optimization Recommendations

#### 1. 查询优化 / Query Optimization

```python
# ❌ 不推荐：N+1 查询问题
# Not recommended: N+1 query problem
threads = db_session.query(ForumThread).all()
for thread in threads:
    author = thread.user  # 每次都查询数据库 / Queries database each time

# ✅ 推荐：使用预加载
# Recommended: Use eager loading
from sqlalchemy.orm import joinedload

threads = db_session.query(ForumThread)\
    .options(joinedload(ForumThread.user))\
    .all()
```

#### 2. 分页查询 / Pagination Queries

```python
# 聊天消息分页 / Chat message pagination
messages = db_session.query(ChatMessage)\
    .filter_by(room_id=room_id)\
    .order_by(ChatMessage.timestamp.desc())\
    .limit(100)\
    .offset(page * 100)\
    .all()

# 论坛帖子分页 / Forum thread pagination
threads = db_session.query(ForumThread)\
    .filter_by(section_id=section_id)\
    .order_by(ForumThread.timestamp.desc())\
    .limit(20)\
    .offset(page * 20)\
    .all()
```

#### 3. 批量操作 / Batch Operations

```python
# ❌ 不推荐：逐条插入
# Not recommended: Insert one by one
for i in range(100):
    msg = ChatMessage(content=f"Message {i}", room_id=1, user_id=1)
    db_session.add(msg)
    db_session.commit()  # 每次提交 / Commit each time

# ✅ 推荐：批量插入
# Recommended: Bulk insert
messages = [
    ChatMessage(content=f"Message {i}", room_id=1, user_id=1)
    for i in range(100)
]
db_session.bulk_save_objects(messages)
db_session.commit()  # 一次提交 / Commit once
```

---

## 业务逻辑 / Business Logic

### 1. 用户在线状态判断 / User Online Status

```python
from datetime import datetime, timedelta

def get_online_users(room_id):
    """获取聊天室在线用户 / Get online users in chat room"""
    online_threshold = datetime.utcnow() - timedelta(seconds=ONLINE_TIMEOUT)
    
    # 查询有权限且在线的用户
    # Query users with permission and online
    users = db_session.query(User)\
        .join(ChatPermission)\
        .filter(
            ChatPermission.room_id == room_id,
            ChatPermission.perm.in_(['su', '777', '444']),
            User.last_seen >= online_threshold
        )\
        .all()
    
    return users
```

### 2. 未读消息计数 / Unread Message Count

```python
def get_unread_count(user_id, room_id):
    """获取用户在某聊天室的未读消息数 / 
    Get unread message count for user in room"""
    
    # 查询最后查看时间
    # Query last view time
    last_view = db_session.query(ChatLastView)\
        .filter_by(user_id=user_id, room_id=room_id)\
        .first()
    
    if not last_view:
        # 从未查看过，返回总消息数
        # Never viewed, return total message count
        return db_session.query(ChatMessage)\
            .filter_by(room_id=room_id)\
            .count()
    
    # 返回最后查看后的新消息数
    # Return new message count after last view
    return db_session.query(ChatMessage)\
        .filter(
            ChatMessage.room_id == room_id,
            ChatMessage.timestamp > last_view.last_view
        )\
        .count()
```

### 3. 权限检查 / Permission Check

```python
def user_can_send_chat(user, room_id):
    """检查用户是否有权限发送消息 / 
    Check if user can send message"""
    
    # 管理员自动拥有 su 权限
    # Admin automatically has su permission
    if user.is_admin():
        return True
    
    # 查询用户权限
    # Query user permission
    perm = db_session.query(ChatPermission)\
        .filter_by(user_id=user.id, room_id=room_id)\
        .first()
    
    if not perm:
        return False
    
    # 检查权限级别
    # Check permission level
    SEND_PERMISSIONS = {'su', '777'}
    return perm.perm in SEND_PERMISSIONS
```

### 4. 用户配额管理 / User Quota Management

```python
def check_upload_quota(user, file_size):
    """检查用户上传配额 / Check user upload quota"""
    
    # 计算剩余配额
    # Calculate remaining quota
    remaining = USER_UPLOAD_QUOTA - user.upload_used
    
    if file_size > remaining:
        raise QuotaExceededError(f"配额不足，剩余 {remaining} 字节")
    
    return True

def update_upload_quota(user, file_size):
    """更新用户上传配额 / Update user upload quota"""
    user.upload_used += file_size
    db_session.commit()
```

---

## 数据库操作示例 / Database Operation Examples

### 创建用户 / Create User

```python
from werkzeug.security import generate_password_hash

# 创建普通用户 / Create regular user
new_user = User(
    username='alice',
    password_hash=generate_password_hash('password123'),
    nickname='爱丽丝',
    color='#FF6B6B',
    role='user'
)
db_session.add(new_user)
db_session.commit()

# 创建管理员 / Create admin
admin_user = User(
    username='admin',
    password_hash=generate_password_hash('admin123'),
    nickname='管理员',
    role='admin'
)
db_session.add(admin_user)
db_session.commit()
```

### 创建聊天室并设置权限 / Create Chat Room and Set Permissions

```python
# 创建聊天室 / Create chat room
new_room = ChatRoom(
    name='大厅',
    description='欢迎来到大厅'
)
db_session.add(new_room)
db_session.commit()

# 为用户分配权限 / Assign permissions to users
# 管理员：su 权限 / Admin: su permission
admin_perm = ChatPermission(
    user_id=admin_user.id,
    room_id=new_room.id,
    perm='su'
)

# 普通用户：读写权限 / Regular user: read-write permission
user_perm = ChatPermission(
    user_id=new_user.id,
    room_id=new_room.id,
    perm='777'
)

db_session.add(admin_perm)
db_session.add(user_perm)
db_session.commit()
```

### 发送消息 / Send Message

```python
# 创建消息 / Create message
new_message = ChatMessage(
    content='你好，世界！',
    user_id=new_user.id,
    room_id=new_room.id
)
db_session.add(new_message)
db_session.commit()

# 获取消息及关联信息 / Get message with related info
message = db_session.query(ChatMessage)\
    .filter_by(id=new_message.id)\
    .first()

print(f"{message.user.nickname}: {message.content}")
```

### 查询聊天历史 / Query Chat History

```python
# 查询最近 100 条消息 / Query last 100 messages
messages = db_session.query(ChatMessage)\
    .filter_by(room_id=room_id)\
    .order_by(ChatMessage.timestamp.desc())\
    .limit(100)\
    .all()

# 反转顺序以从旧到新显示 / Reverse to show old to new
messages = messages[::-1]

for msg in messages:
    print(f"[{msg.timestamp}] {msg.user.nickname}: {msg.content}")
```

### 用户关注操作 / User Follow Operations

```python
# 关注用户 / Follow user
follow = UserFollow(
    follower_id=alice.id,
    followed_id=bob.id
)
db_session.add(follow)
db_session.commit()

# 查询关注列表 / Query following list
following = db_session.query(User)\
    .join(UserFollow, User.id == UserFollow.followed_id)\
    .filter(UserFollow.follower_id == alice.id)\
    .all()

# 查询粉丝列表 / Query followers list
followers = db_session.query(User)\
    .join(UserFollow, User.id == UserFollow.follower_id)\
    .filter(UserFollow.followed_id == bob.id)\
    .all()

# 取消关注 / Unfollow
db_session.query(UserFollow)\
    .filter_by(follower_id=alice.id, followed_id=bob.id)\
    .delete()
db_session.commit()
```

---

## 迁移指南 / Migration Guide

### SQLite → PostgreSQL 迁移 / Migration

#### 方法 1：使用 pgloader / Method 1: Using pgloader

```bash
# 安装 pgloader / Install pgloader
sudo apt-get install pgloader

# 创建 PostgreSQL 数据库 / Create PostgreSQL database
createdb stellarsis

# 迁移数据 / Migrate data
pgloader sqlite:///path/to/stellarsis.db postgresql://user:password@localhost/stellarsis
```

#### 方法 2：导出/导入 / Method 2: Export/Import

```bash
# 1. 导出 SQLite 数据 / Export SQLite data
sqlite3 stellarsis.db .dump > stellarsis_dump.sql

# 2. 编辑 SQL 文件，调整 PostgreSQL 兼容性
# Edit SQL file for PostgreSQL compatibility
# - 修改自增字段：AUTOINCREMENT → SERIAL
# - 修改布尔值：0/1 → false/true
# - 调整时间戳格式

# 3. 导入到 PostgreSQL / Import to PostgreSQL
psql -U user -d stellarsis < stellarsis_dump_edited.sql
```

#### 方法 3：使用 SQLAlchemy（推荐）/ Method 3: Using SQLAlchemy (Recommended)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 源数据库 / Source database
source_engine = create_engine('sqlite:///stellarsis.db')
SourceSession = sessionmaker(bind=source_engine)
source = SourceSession()

# 目标数据库 / Target database
target_engine = create_engine('postgresql://user:password@localhost/stellarsis')
Base.metadata.create_all(target_engine)
TargetSession = sessionmaker(bind=target_engine)
target = TargetSession()

# 迁移每个表 / Migrate each table
for user in source.query(User).all():
    target.merge(user)

target.commit()
```

### 数据库备份 / Database Backup

#### SQLite 备份 / SQLite Backup

```bash
# 方法 1：直接复制文件 / Method 1: Direct file copy
cp stellarsis.db stellarsis_backup_$(date +%Y%m%d_%H%M%S).db

# 方法 2：SQL 导出 / Method 2: SQL export
sqlite3 stellarsis.db .dump > stellarsis_backup.sql

# 方法 3：使用备份 API / Method 3: Using backup API
sqlite3 stellarsis.db "VACUUM INTO 'stellarsis_backup.db'"
```

#### PostgreSQL 备份 / PostgreSQL Backup

```bash
# 完整备份 / Full backup
pg_dump stellarsis > stellarsis_backup.sql

# 压缩备份 / Compressed backup
pg_dump stellarsis | gzip > stellarsis_backup.sql.gz

# 自定义格式备份（可选择性恢复）/ Custom format (selective restore)
pg_dump -Fc stellarsis > stellarsis_backup.dump
```

### 数据库恢复 / Database Restore

#### SQLite 恢复 / SQLite Restore

```bash
# 从文件恢复 / Restore from file
cp stellarsis_backup.db stellarsis.db

# 从 SQL 恢复 / Restore from SQL
sqlite3 stellarsis_new.db < stellarsis_backup.sql
```

#### PostgreSQL 恢复 / PostgreSQL Restore

```bash
# 从 SQL 恢复 / Restore from SQL
psql stellarsis < stellarsis_backup.sql

# 从自定义格式恢复 / Restore from custom format
pg_restore -d stellarsis stellarsis_backup.dump
```

---

## 数据库维护 / Database Maintenance

### SQLite 维护 / SQLite Maintenance

```bash
# 优化数据库（减小文件大小）/ Optimize database (reduce file size)
sqlite3 stellarsis.db "VACUUM;"

# 分析查询优化器 / Analyze query optimizer
sqlite3 stellarsis.db "ANALYZE;"

# 重建索引 / Rebuild indexes
sqlite3 stellarsis.db "REINDEX;"

# 检查完整性 / Check integrity
sqlite3 stellarsis.db "PRAGMA integrity_check;"
```

### PostgreSQL 维护 / PostgreSQL Maintenance

```bash
# 清理垃圾数据 / Clean up dead tuples
vacuumdb stellarsis

# 完全清理并分析 / Full vacuum and analyze
vacuumdb --full --analyze stellarsis

# 重建索引 / Rebuild indexes
reindexdb stellarsis
```

---

## 常见问题 / FAQ

### 1. 如何查看所有表？ / How to view all tables?

```bash
# SQLite
sqlite3 stellarsis.db
.tables

# PostgreSQL
psql stellarsis
\dt
```

### 2. 如何查看表结构？ / How to view table structure?

```bash
# SQLite
sqlite3 stellarsis.db
.schema users

# PostgreSQL
psql stellarsis
\d users
```

### 3. 如何重置数据库？ / How to reset database?

```bash
# 备份当前数据库 / Backup current database
mv stellarsis.db stellarsis_old.db

# 重新启动应用，会自动创建新数据库
# Restart application, it will create new database automatically
python app.py
```

### 4. 如何直接修改数据？ / How to modify data directly?

```bash
# SQLite
sqlite3 stellarsis.db
UPDATE users SET role='admin' WHERE username='alice';
SELECT * FROM users WHERE role='admin';
.quit

# PostgreSQL
psql stellarsis
UPDATE users SET role='admin' WHERE username='alice';
SELECT * FROM users WHERE role='admin';
\q
```

### 5. 数据库锁定如何处理？ / How to handle database locked?

**SQLite 锁定问题 / SQLite Lock Issue**:
- 增加超时时间 / Increase timeout:
  ```python
  engine = create_engine('sqlite:///stellarsis.db', 
                         connect_args={'timeout': 15})
  ```
- 迁移到 PostgreSQL（生产环境推荐）/ Migrate to PostgreSQL (recommended for production)

---

## 版本信息 / Version Information

- **文档版本 / Document Version**: 1.0
- **数据库版本 / Database Version**: 最新（自动迁移）/ Latest (auto-migration)
- **SQLAlchemy 版本 / SQLAlchemy Version**: 3.1.1
- **最后更新 / Last Updated**: 2025-02-10

---

## 参考资料 / References

- [SQLAlchemy 官方文档](https://docs.sqlalchemy.org/)
- [Flask-SQLAlchemy 文档](https://flask-sqlalchemy.palletsprojects.com/)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
