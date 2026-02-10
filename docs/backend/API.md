# Stellarsis API 文档 / API Documentation

本文档详细描述 Stellarsis 系统的所有 HTTP API 端点和 WebSocket 事件。

This document provides comprehensive documentation for all Stellarsis HTTP API endpoints and WebSocket events.

---

## 目录 / Table of Contents

1. [API 概览 / API Overview](#api-概览--api-overview)
2. [认证 API / Authentication API](#认证-api--authentication-api)
3. [用户 API / User API](#用户-api--user-api)
4. [聊天室 API / Chat Room API](#聊天室-api--chat-room-api)
5. [论坛 API / Forum API](#论坛-api--forum-api)
6. [文件上传 API / File Upload API](#文件上传-api--file-upload-api)
7. [管理 API / Admin API](#管理-api--admin-api)
8. [WebSocket 事件 / WebSocket Events](#websocket-事件--websocket-events)
9. [错误处理 / Error Handling](#错误处理--error-handling)
10. [速率限制 / Rate Limiting](#速率限制--rate-limiting)

---

## API 概览 / API Overview

### 基础信息 / Basic Information

- **基础 URL / Base URL**: `http://your-domain.com` 或 `https://your-domain.com`
- **协议 / Protocol**: HTTP/HTTPS for REST API, WebSocket for real-time
- **认证方式 / Authentication**: Session-based (Flask-Login)
- **数据格式 / Data Format**: JSON (Content-Type: application/json)
- **字符编码 / Character Encoding**: UTF-8

### 通用响应格式 / Common Response Format

#### 成功响应 / Success Response

```json
{
  "success": true,
  "message": "操作成功",
  "data": { /* 数据 / data */ }
}
```

#### 错误响应 / Error Response

```json
{
  "success": false,
  "message": "错误信息 / Error message",
  "error": "ERROR_CODE"
}
```

### HTTP 状态码 / HTTP Status Codes

| 状态码 / Code | 说明 / Description |
|---|---|
| 200 | 成功 / Success |
| 201 | 创建成功 / Created |
| 400 | 请求错误 / Bad Request |
| 401 | 未认证 / Unauthorized |
| 403 | 无权限 / Forbidden |
| 404 | 资源不存在 / Not Found |
| 413 | 文件过大 / Payload Too Large |
| 429 | 请求过快 / Too Many Requests |
| 500 | 服务器错误 / Internal Server Error |

---

## 认证 API / Authentication API

### 1. 登录 / Login

**端点 / Endpoint**: `POST /api/auth/login`

**说明 / Description**: 用户登录，返回会话 Cookie。

User login, returns session cookie.

**速率限制 / Rate Limit**: 5 次/分钟 per IP

**请求体 / Request Body**:

```json
{
  "username": "alice",
  "password": "password123"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "登录成功",
  "user": {
    "id": 1,
    "username": "alice",
    "nickname": "爱丽丝",
    "role": "user",
    "color": "#FF6B6B",
    "badge": "VIP"
  }
}
```

**错误响应 / Error Response** (401):

```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

**示例 / Example**:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}' \
  -c cookies.txt
```

---

### 2. 登出 / Logout

**端点 / Endpoint**: `GET /logout`

**说明 / Description**: 用户登出，清除会话。

User logout, clear session.

**认证 / Authentication**: 需要登录 / Login required

**响应 / Response**: 重定向到登录页 / Redirect to login page

---

### 3. 修改密码 / Change Password

**端点 / Endpoint**: `POST /change_password`

**说明 / Description**: 修改当前用户密码。

Change current user's password.

**认证 / Authentication**: 需要登录 / Login required

**请求体 / Request Body** (form-data):

```
old_password: 旧密码 / Old password
new_password: 新密码 / New password
confirm_password: 确认新密码 / Confirm new password
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "密码已成功修改"
}
```

**错误响应 / Error Response** (400):

```json
{
  "success": false,
  "message": "旧密码错误"
}
```

---

### 4. SU 验证 / SU Verification

**端点 / Endpoint**: `POST /admin/su`

**说明 / Description**: 管理员二次验证，有效期 5 分钟。

Admin re-verification, valid for 5 minutes.

**认证 / Authentication**: 需要管理员权限 / Admin required

**请求体 / Request Body** (form-data):

```
password: 管理员密码 / Admin password
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "SU验证成功"
}
```

---

## 用户 API / User API

### 1. 获取用户资料 / Get User Profile

**端点 / Endpoint**: `GET /profile`

**说明 / Description**: 获取当前用户资料页面。

Get current user profile page.

**认证 / Authentication**: 需要登录 / Login required

**响应 / Response**: HTML 页面 / HTML page

---

### 2. 更新用户资料 / Update User Profile

**端点 / Endpoint**: `POST /profile`

**说明 / Description**: 更新当前用户资料。

Update current user profile.

**认证 / Authentication**: 需要登录 / Login required

**请求体 / Request Body** (form-data):

```
nickname: 昵称 / Nickname (max 64 chars)
color: 颜色 / Color (hex format, e.g., #FF6B6B)
badge: 徽章 / Badge (max 32 chars)
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "个人资料已更新",
  "user": {
    "nickname": "新昵称",
    "color": "#FF6B6B",
    "badge": "新徽章"
  }
}
```

---

### 3. 搜索用户 / Search Users

**端点 / Endpoint**: `GET /api/search_users`

**说明 / Description**: 模糊搜索用户（用于关注功能）。

Fuzzy search users (for follow feature).

**认证 / Authentication**: 需要登录 / Login required

**查询参数 / Query Parameters**:

| 参数 / Parameter | 类型 / Type | 必需 / Required | 说明 / Description |
|---|---|---|---|
| `username` | string | 是 / Yes | 用户名搜索关键字 / Username search keyword |

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "users": [
    {
      "id": 2,
      "username": "alice",
      "nickname": "爱丽丝",
      "badge": "VIP"
    },
    {
      "id": 3,
      "username": "alice123",
      "nickname": "小爱",
      "badge": ""
    }
  ]
}
```

**限制 / Limit**: 最多返回 20 个用户 / Maximum 20 users

---

### 4. 获取关注列表 / Get Following List

**端点 / Endpoint**: `GET /api/follow/following`

**说明 / Description**: 获取当前用户关注的人列表。

Get list of users that current user follows.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "following": [
    {
      "id": 2,
      "username": "bob",
      "nickname": "鲍勃",
      "is_online": true
    }
  ]
}
```

---

### 5. 关注/取消关注用户 / Follow/Unfollow User

**端点 / Endpoint**: `POST /api/follow/toggle`

**说明 / Description**: 关注或取消关注用户。

Follow or unfollow a user.

**认证 / Authentication**: 需要登录 / Login required

**请求体 / Request Body**:

```json
{
  "user_id": 2
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "action": "follow"  // 或 "unfollow"
}
```

---

### 6. 获取在线人数 / Get Online Count

**端点 / Endpoint**: `GET /api/online_count`

**说明 / Description**: 获取全局在线用户数。

Get global online user count.

**无需认证 / No authentication required**

**成功响应 / Success Response** (200):

```json
{
  "count": 15
}
```

---

## 聊天室 API / Chat Room API

### 1. 获取聊天历史 / Get Chat History

**端点 / Endpoint**: `GET /api/chat/<room_id>/history`

**说明 / Description**: 获取聊天室历史消息（分页）。

Get chat room history messages (paginated).

**认证 / Authentication**: 需要登录 + 房间查看权限 / Login + room view permission required

**路径参数 / Path Parameters**:

| 参数 / Parameter | 类型 / Type | 说明 / Description |
|---|---|---|
| `room_id` | integer | 聊天室 ID / Room ID |

**查询参数 / Query Parameters**:

| 参数 / Parameter | 类型 / Type | 必需 / Required | 默认值 / Default | 说明 / Description |
|---|---|---|---|---|
| `limit` | integer | 否 / No | 100 | 每页消息数（最大 100）/ Messages per page (max 100) |
| `page` | integer | 否 / No | 0 | 页码（从 0 开始）/ Page number (0-indexed) |
| `offset` | integer | 否 / No | - | 偏移量（可替代 page）/ Offset (alternative to page) |

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "content": "你好！",
      "timestamp": "2025-02-10T12:34:56+08:00",
      "user_id": 1,
      "username": "alice",
      "nickname": "爱丽丝",
      "color": "#FF6B6B",
      "badge": "VIP"
    },
    {
      "id": 2,
      "content": "大家好！",
      "timestamp": "2025-02-10T12:35:10+08:00",
      "user_id": 2,
      "username": "bob",
      "nickname": "鲍勃",
      "color": "#4ECDC4",
      "badge": ""
    }
  ],
  "has_more": true,
  "total": 250
}
```

**示例 / Example**:

```bash
curl http://localhost:5000/api/chat/1/history?limit=50&page=0 \
  -b cookies.txt
```

---

### 2. 发送聊天消息 (HTTP) / Send Chat Message (HTTP)

**端点 / Endpoint**: `POST /api/chat/send`

**说明 / Description**: 通过 HTTP 发送聊天消息（也可使用 WebSocket）。

Send chat message via HTTP (WebSocket is also available).

**认证 / Authentication**: 需要登录 + 房间发送权限 / Login + room send permission required

**请求体 / Request Body**:

```json
{
  "room_id": 1,
  "message": "你好，世界！"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message_id": 123,
  "timestamp": "2025-02-10T12:36:00+08:00"
}
```

**错误响应 / Error Response** (403):

```json
{
  "success": false,
  "message": "您没有发送权限"
}
```

---

### 3. 删除聊天消息 / Delete Chat Message

**端点 / Endpoint**: `DELETE /api/chat/<room_id>/messages/<message_id>`

**说明 / Description**: 删除聊天消息（仅限消息作者或管理员）。

Delete chat message (message author or admin only).

**认证 / Authentication**: 需要登录 / Login required

**路径参数 / Path Parameters**:

| 参数 / Parameter | 类型 / Type | 说明 / Description |
|---|---|---|
| `room_id` | integer | 聊天室 ID / Room ID |
| `message_id` | integer | 消息 ID / Message ID |

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "删除成功"
}
```

**错误响应 / Error Response** (403):

```json
{
  "success": false,
  "message": "您没有权限删除此消息"
}
```

---

### 4. 获取单条消息详情 / Get Single Message

**端点 / Endpoint**: `GET /api/chat/message/<message_id>`

**说明 / Description**: 获取单条消息的详细信息。

Get detailed information of a single message.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": {
    "id": 123,
    "content": "你好！",
    "timestamp": "2025-02-10T12:34:56+08:00",
    "room_id": 1,
    "room_name": "大厅",
    "user": {
      "id": 1,
      "username": "alice",
      "nickname": "爱丽丝",
      "color": "#FF6B6B",
      "badge": "VIP"
    }
  }
}
```

---

### 5. 验证引用消息 / Validate Quote Messages

**端点 / Endpoint**: `POST /api/chat/validate_quotes`

**说明 / Description**: 验证引用的消息是否存在于指定房间。

Validate if quoted messages exist in specified room.

**认证 / Authentication**: 需要登录 / Login required

**请求体 / Request Body**:

```json
{
  "room_id": 1,
  "quote_ids": [10, 20, 30]
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "valid_quotes": [
    {
      "id": 10,
      "content": "这是第一条引用",
      "username": "alice"
    },
    {
      "id": 20,
      "content": "这是第二条引用",
      "username": "bob"
    }
  ],
  "invalid_ids": [30]
}
```

---

### 6. 获取房间在线人数 / Get Room Online Count

**端点 / Endpoint**: `GET /api/chat/<room_id>/online_count`

**说明 / Description**: 获取指定聊天室的在线人数。

Get online user count for specified chat room.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "count": 8,
  "room_id": 1
}
```

---

### 7. 获取未读消息数 / Get Unread Counts

**端点 / Endpoint**: `GET /api/last_views/unread_counts`

**说明 / Description**: 获取所有有权限的房间和分区的未读消息数。

Get unread message counts for all accessible rooms and sections.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "chat": {
    "1": 5,   // 聊天室 ID: 未读消息数
    "2": 0,
    "3": 12
  },
  "forum": {
    "1": 3,   // 分区 ID: 未读帖子数
    "2": 7
  }
}
```

---

### 8. 标记房间已读 / Mark Room as Read

**端点 / Endpoint**: `POST /api/spa/chat/<room_id>/mark_read`

**说明 / Description**: 更新用户在指定房间的最后查看时间。

Update user's last view timestamp for specified room.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true
}
```

---

## 论坛 API / Forum API

### 1. 获取分区详情 / Get Section Details

**端点 / Endpoint**: `GET /api/spa/forum/section/<section_id>`

**说明 / Description**: 获取论坛分区详情及主题帖列表。

Get forum section details and thread list.

**认证 / Authentication**: 需要登录 + 分区查看权限 / Login + section view permission required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "section": {
    "id": 1,
    "name": "公告区",
    "description": "官方公告"
  },
  "threads": [
    {
      "id": 1,
      "title": "欢迎来到 Stellarsis！",
      "timestamp": "2025-02-10T10:00:00+08:00",
      "user": {
        "id": 1,
        "username": "admin",
        "nickname": "管理员"
      },
      "reply_count": 5
    }
  ],
  "permission": "777"
}
```

---

### 2. 获取主题帖详情 / Get Thread Details

**端点 / Endpoint**: `GET /api/spa/forum/thread/<thread_id>`

**说明 / Description**: 获取主题帖详情（不含回复）。

Get thread details (excluding replies).

**认证 / Authentication**: 需要登录 + 分区查看权限 / Login + section view permission required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "thread": {
    "id": 1,
    "title": "欢迎来到 Stellarsis！",
    "content": "这是一个测试帖子。",
    "timestamp": "2025-02-10T10:00:00+08:00",
    "section_id": 1,
    "section_name": "公告区",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "color": "#000000",
      "badge": "Admin"
    }
  },
  "permission": "777",
  "can_delete": true
}
```

---

### 3. 获取主题帖回复列表 / Get Thread Replies

**端点 / Endpoint**: `GET /api/forum/thread/<thread_id>/replies`

**说明 / Description**: 获取主题帖的回复列表（分页）。

Get reply list for a thread (paginated).

**认证 / Authentication**: 需要登录 + 分区查看权限 / Login + section view permission required

**查询参数 / Query Parameters**:

| 参数 / Parameter | 类型 / Type | 必需 / Required | 默认值 / Default | 说明 / Description |
|---|---|---|---|---|
| `page` | integer | 否 / No | 1 | 页码（从 1 开始）/ Page number (1-indexed) |

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "replies": [
    {
      "id": 10,
      "content": "感谢分享！",
      "timestamp": "2025-02-10T11:00:00+08:00",
      "user_id": 2,
      "username": "alice",
      "nickname": "爱丽丝",
      "color": "#FF6B6B",
      "badge": "VIP",
      "can_delete": false
    }
  ],
  "page": 1,
  "per_page": 20,
  "total": 45,
  "has_next": true,
  "has_prev": false
}
```

---

### 4. 创建主题帖 / Create Thread

**端点 / Endpoint**: `POST /api/spa/forum/thread`

**说明 / Description**: 在论坛分区创建新主题帖。

Create new thread in forum section.

**认证 / Authentication**: 需要登录 + 分区发帖权限 / Login + section post permission required

**请求体 / Request Body**:

```json
{
  "section_id": 1,
  "title": "新帖标题",
  "content": "帖子内容支持 **Markdown** 和 $\\LaTeX$ 公式。"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "发帖成功",
  "thread_id": 123
}
```

**错误响应 / Error Response** (403):

```json
{
  "success": false,
  "message": "您没有发帖权限"
}
```

---

### 5. 回复主题帖 / Reply to Thread

**端点 / Endpoint**: `POST /api/forum/reply`

**说明 / Description**: 回复主题帖。

Reply to a thread.

**认证 / Authentication**: 需要登录 + 分区发帖权限 / Login + section post permission required

**请求体 / Request Body** (form-data):

```
thread_id: 主题帖 ID / Thread ID
content: 回复内容 / Reply content
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "回复成功",
  "reply": {
    "id": 45,
    "content": "感谢分享！",
    "timestamp": "2025-02-10T12:00:00+08:00",
    "user_id": 2,
    "username": "alice",
    "nickname": "爱丽丝",
    "color": "#FF6B6B",
    "badge": "VIP"
  }
}
```

---

### 6. 删除主题帖 / Delete Thread

**端点 / Endpoint**: `DELETE /api/forum/thread/<thread_id>`

**说明 / Description**: 删除主题帖（帖子作者或管理员）。

Delete thread (thread author or admin only).

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "删除成功",
  "redirect": "/forum/section/1"
}
```

---

### 7. 删除回复 / Delete Reply

**端点 / Endpoint**: `DELETE /api/forum/reply/<reply_id>`

**说明 / Description**: 删除回复（回复作者或管理员）。

Delete reply (reply author or admin only).

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "删除成功"
}
```

---

## 文件上传 API / File Upload API

### 1. 上传图片 / Upload Image

**端点 / Endpoint**: `POST /api/upload/image`

**说明 / Description**: 上传图片文件（支持拖拽和粘贴）。

Upload image file (supports drag-and-drop and paste).

**认证 / Authentication**: 需要登录 / Login required

**请求体 / Request Body** (multipart/form-data):

```
file: 图片文件 / Image file
```

**支持格式 / Supported Formats**: PNG, JPG, JPEG, GIF, WebP

**大小限制 / Size Limit**: 5 MB per image

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "url": "/static/uploads/images/user_1/20250210_123456_abc123.png",
  "markdown": "![image](/static/uploads/images/user_1/20250210_123456_abc123.png)",
  "id": 42,
  "filename": "screenshot.png",
  "size": 102400
}
```

**错误响应 / Error Response** (413):

```json
{
  "success": false,
  "message": "图片大小超过限制（最大 5 MB）"
}
```

**配额超限 / Quota Exceeded** (413):

```json
{
  "success": false,
  "message": "上传配额已用完，剩余 0 MB"
}
```

**示例 / Example**:

```bash
curl -X POST http://localhost:5000/api/upload/image \
  -b cookies.txt \
  -F "file=@screenshot.png"
```

---

### 2. 获取上传配额 / Get Upload Quota

**端点 / Endpoint**: `GET /api/upload/quota`

**说明 / Description**: 获取当前用户的上传配额信息。

Get current user's upload quota information.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "total": 52428800,      // 总配额（字节）/ Total quota (bytes)
  "used": 10485760,       // 已使用（字节）/ Used (bytes)
  "remaining": 41943040,  // 剩余（字节）/ Remaining (bytes)
  "used_mb": "10.00",     // 已使用（MB）/ Used (MB)
  "total_mb": "50.00",    // 总配额（MB）/ Total (MB)
  "remaining_mb": "40.00" // 剩余（MB）/ Remaining (MB)
}
```

---

### 3. 列出用户图片 / List User Images

**端点 / Endpoint**: `GET /api/upload/images`

**说明 / Description**: 列出当前用户上传的所有图片。

List all images uploaded by current user.

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "images": [
    {
      "id": 42,
      "filename": "screenshot.png",
      "filepath": "/static/uploads/images/user_1/20250210_123456_abc123.png",
      "file_size": 102400,
      "file_size_mb": "0.10",
      "upload_time": "2025-02-10T12:34:56+08:00",
      "file_type": "image/png"
    }
  ],
  "total_count": 15,
  "total_size": 10485760,
  "total_size_mb": "10.00"
}
```

---

### 4. 删除图片 / Delete Image

**端点 / Endpoint**: `DELETE /api/upload/image/<image_id>`

**说明 / Description**: 删除图片（图片所有者或管理员）。

Delete image (image owner or admin only).

**认证 / Authentication**: 需要登录 / Login required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "图片删除成功",
  "freed_space": 102400
}
```

---

### 5. 上传文件 / Upload File (可选功能)

**端点 / Endpoint**: `POST /api/upload/file`

**说明 / Description**: 上传任意文件（需要在配置中启用）。

Upload arbitrary file (requires enabling in config).

**配置 / Configuration**: `ENABLE_FILE_UPLOAD = True`

**认证 / Authentication**: 需要登录 / Login required

**支持格式 / Supported Formats** (默认 / Default): PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, RAR, 7Z, MD

**大小限制 / Size Limit**: 10 MB per file

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "url": "/static/uploads/files/user_1/document.pdf",
  "filename": "document.pdf",
  "size": 2048000
}
```

---

## 管理 API / Admin API

所有管理 API 端点需要管理员权限。部分高危操作需要 SU 验证。

All admin API endpoints require admin permission. Some sensitive operations require SU verification.

### 用户管理 / User Management

#### 1. 列出所有用户 / List All Users

**端点 / Endpoint**: `GET /api/admin/users`

**认证 / Authentication**: 管理员 / Admin required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "nickname": "管理员",
      "role": "admin",
      "color": "#000000",
      "badge": "Admin",
      "upload_used": 0,
      "created_at": "2025-01-01T00:00:00+08:00"
    }
  ],
  "total": 100
}
```

---

#### 2. 创建用户 / Create User

**端点 / Endpoint**: `POST /api/admin/users`

**认证 / Authentication**: 管理员 / Admin required

**请求体 / Request Body**:

```json
{
  "username": "newuser",
  "password": "password123",
  "nickname": "新用户",
  "color": "#4ECDC4",
  "badge": "",
  "role": "user"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "用户 newuser 创建成功",
  "user_id": 101
}
```

---

#### 3. 更新用户信息 / Update User

**端点 / Endpoint**: `PUT /api/admin/users/<user_id>`

**认证 / Authentication**: 管理员 / Admin required

**请求体 / Request Body**:

```json
{
  "username": "alice2",
  "nickname": "新昵称",
  "color": "#FF6B6B",
  "badge": "VIP"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "用户信息更新成功"
}
```

---

#### 4. 删除用户 / Delete User

**端点 / Endpoint**: `DELETE /api/admin/users/<user_id>`

**认证 / Authentication**: 管理员 / Admin required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "用户删除成功"
}
```

**保护机制 / Protection**: 不能删除 ID=1 的超级管理员 / Cannot delete super admin (ID=1)

---

#### 5. 修改用户角色 / Update User Role

**端点 / Endpoint**: `PUT /api/admin/users/<user_id>/role`

**认证 / Authentication**: 管理员 / Admin required

**请求体 / Request Body**:

```json
{
  "role": "admin"  // "user" 或 "admin"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "用户 alice 的角色已更新为 admin"
}
```

---

#### 6. 查看用户权限 / View User Permissions

**端点 / Endpoint**: `GET /api/admin/users/<user_id>/permissions`

**认证 / Authentication**: 管理员 / Admin required

**成功响应 / Success Response** (200):

```json
{
  "user_id": 2,
  "username": "alice",
  "chat_permissions": [
    {
      "room_id": 1,
      "room_name": "大厅",
      "perm": "777"
    }
  ],
  "forum_permissions": [
    {
      "section_id": 1,
      "section_name": "公告",
      "perm": "444"
    }
  ]
}
```

---

#### 7. 设置用户权限 / Set User Permission

**端点 / Endpoint**: `PUT /api/admin/users/<user_id>/permissions`

**认证 / Authentication**: 管理员 / Admin required

**请求体 / Request Body**:

```json
{
  "scope": "chat",      // "chat" 或 "forum"
  "target_id": 1,       // room_id 或 section_id
  "perm": "777"        // "su", "777", "444", "Null"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "权限已更新",
  "perm": "777"
}
```

---

### 聊天室管理 / Chat Room Management

#### 1. 列出所有聊天室 / List All Rooms

**端点 / Endpoint**: `GET /api/admin/chat/rooms`

**认证 / Authentication**: 管理员 / Admin required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "rooms": [
    {
      "id": 1,
      "name": "大厅",
      "description": "欢迎来到大厅"
    }
  ]
}
```

---

#### 2. 创建聊天室 / Create Room

**端点 / Endpoint**: `POST /api/admin/chat/rooms`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**请求体 / Request Body**:

```json
{
  "name": "新房间",
  "description": "房间描述"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "聊天室 新房间 创建成功",
  "room_id": 5
}
```

---

#### 3. 更新聊天室 / Update Room

**端点 / Endpoint**: `PUT /api/admin/chat/rooms/<room_id>`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

---

#### 4. 删除聊天室 / Delete Room

**端点 / Endpoint**: `DELETE /api/admin/chat/rooms/<room_id>`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

---

#### 5. 批量删除聊天消息 / Bulk Delete Messages

**端点 / Endpoint**: `DELETE /api/admin/chat/messages`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**查询参数 / Query Parameters**:

| 参数 / Parameter | 类型 / Type | 必需 / Required | 说明 / Description |
|---|---|---|---|
| `room_id` | integer | 否 / No | 指定房间 ID（省略则删除所有房间）/ Specify room ID (omit to delete all rooms) |
| `before` | ISO datetime | 是 / Yes | 删除此时间之前的消息 / Delete messages before this time |

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "成功删除 150 条聊天消息"
}
```

---

### 论坛管理 / Forum Management

#### 1. 列出所有分区 / List All Sections

**端点 / Endpoint**: `GET /api/admin/forum/sections`

**认证 / Authentication**: 管理员 / Admin required

---

#### 2. 创建分区 / Create Section

**端点 / Endpoint**: `POST /api/admin/forum/sections`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**请求体 / Request Body**:

```json
{
  "name": "新分区",
  "description": "分区描述"
}
```

---

#### 3. 更新分区 / Update Section

**端点 / Endpoint**: `PUT /api/admin/forum/sections/<section_id>`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

---

#### 4. 删除分区 / Delete Section

**端点 / Endpoint**: `DELETE /api/admin/forum/sections/<section_id>`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

---

### 系统管理 / System Management

#### 1. 获取系统信息 / Get System Info

**端点 / Endpoint**: `GET /api/admin/system-info`

**认证 / Authentication**: 管理员 / Admin required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "system": {
    "python_version": "3.10.0",
    "flask_version": "3.1.2",
    "os": "Linux",
    "cpu_count": 4,
    "memory_total": 8589934592,
    "memory_used": 4294967296,
    "disk_total": 107374182400,
    "disk_used": 53687091200
  },
  "database": {
    "type": "sqlite",
    "size": 10485760,
    "user_count": 100,
    "message_count": 50000
  }
}
```

---

#### 2. 备份数据库 / Backup Database

**端点 / Endpoint**: `POST /api/admin/backup-database`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "数据库备份成功",
  "backup_path": "/path/to/backup/stellarsis_backup_20250210_123456.db"
}
```

---

#### 3. 优化数据库 / Optimize Database

**端点 / Endpoint**: `POST /api/admin/optimize-database`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**说明 / Description**: 执行 VACUUM 优化（仅 SQLite）。

Execute VACUUM optimization (SQLite only).

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "数据库优化成功"
}
```

---

#### 4. 获取系统日志 / Get System Log

**端点 / Endpoint**: `GET /api/admin/system-log`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "logs": [
    "2025-02-10 12:34:56 - stellarsis - INFO - 应用启动",
    "2025-02-10 12:35:10 - stellarsis - INFO - 用户登录: alice"
  ]
}
```

---

#### 5. 重启服务器 / Restart Server

**端点 / Endpoint**: `POST /api/admin/restart`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**配置要求 / Config Requirement**: `ENABLE_SERVER_CONTROL = True`

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "服务器正在重启..."
}
```

---

#### 6. 关闭服务器 / Shutdown Server

**端点 / Endpoint**: `POST /api/admin/shutdown`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**配置要求 / Config Requirement**: `ENABLE_SERVER_CONTROL = True`

**请求体 / Request Body**:

```json
{
  "reason": "维护升级"
}
```

**成功响应 / Success Response** (200):

```json
{
  "success": true,
  "message": "服务器将在 5 秒后关闭"
}
```

---

### 名言管理 / Quotes Management

#### 1. 获取所有名言 / Get All Quotes

**端点 / Endpoint**: `GET /api/admin/quotes`

**认证 / Authentication**: 管理员 / Admin required

---

#### 2. 添加名言 / Add Quote

**端点 / Endpoint**: `POST /api/admin/quotes`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

**请求体 / Request Body**:

```json
{
  "text": "生活就像一盒巧克力",
  "author": "阿甘正传"
}
```

---

#### 3. 更新名言 / Update Quote

**端点 / Endpoint**: `PUT /api/admin/quotes/<quote_index>`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

---

#### 4. 删除名言 / Delete Quote

**端点 / Endpoint**: `DELETE /api/admin/quotes/<quote_index>`

**认证 / Authentication**: 管理员 + SU 验证 / Admin + SU required

---

#### 5. 获取随机名言 / Get Random Quote

**端点 / Endpoint**: `GET /api/random_quote`

**无需认证 / No authentication required**

**成功响应 / Success Response** (200):

```json
{
  "text": "生活就像一盒巧克力",
  "author": "阿甘正传"
}
```

---

## WebSocket 事件 / WebSocket Events

Stellarsis 使用 Socket.IO 进行实时通信。所有 WebSocket 事件都需要已登录用户。

Stellarsis uses Socket.IO for real-time communication. All WebSocket events require authenticated users.

### 连接 URL / Connection URL

```
ws://your-domain.com/socket.io/
```

### 客户端库 / Client Library

```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
<script>
  const socket = io();
</script>
```

---

### 1. connect（连接）

**方向 / Direction**: Client → Server

**说明 / Description**: 客户端连接到服务器时触发。

Triggered when client connects to server.

**认证检查 / Authentication Check**: 服务器自动验证登录状态，未登录返回 False。

Server automatically verifies login status, returns False if not logged in.

**响应事件 / Response Event**: `my_response`

```javascript
socket.on('connect', () => {
  console.log('已连接到服务器');
});

socket.on('my_response', (data) => {
  console.log(data.data); // "已连接"
});
```

---

### 2. join（加入房间）

**方向 / Direction**: Client → Server

**说明 / Description**: 加入聊天室，接收房间消息。

Join chat room to receive room messages.

**发送数据 / Emit Data**:

```javascript
socket.emit('join', {
  room: 1  // 聊天室 ID / Room ID
});
```

**权限检查 / Permission Check**: 需要房间查看权限 / Requires room view permission

**响应事件 / Response Events**:

- `user_join`: 广播到房间其他用户 / Broadcast to other users in room
- `online_count_update`: 更新房间在线人数 / Update room online count

```javascript
socket.on('user_join', (data) => {
  console.log(`${data.nickname} 加入了房间`);
  // data: { user_id, username, nickname, color, badge }
});

socket.on('online_count_update', (data) => {
  console.log(`在线人数: ${data.count}`);
  // data: { room_id, count }
});
```

---

### 3. leave（离开房间）

**方向 / Direction**: Client → Server

**说明 / Description**: 离开聊天室，停止接收房间消息。

Leave chat room, stop receiving room messages.

**发送数据 / Emit Data**:

```javascript
socket.emit('leave', {
  room: 1
});
```

**响应事件 / Response Events**:

- `user_leave`: 广播到房间其他用户 / Broadcast to other users
- `online_count_update`: 更新在线人数 / Update online count

---

### 4. send_message（发送消息）

**方向 / Direction**: Client → Server

**说明 / Description**: 发送聊天消息。

Send chat message.

**发送数据 / Emit Data**:

```javascript
socket.emit('send_message', {
  room_id: 1,
  message: '你好，世界！',
  client_id: 'msg_123456'  // 可选，用于去重 / Optional, for deduplication
});
```

**权限检查 / Permission Check**: 需要房间发送权限 / Requires room send permission

**响应事件 / Response Events**:

- `message`: 广播到房间所有用户（包括发送者）/ Broadcast to all users in room (including sender)
- `message_id_response`: 仅发送者收到，包含服务器生成的消息 ID / Only sender receives, contains server-generated message ID
- `error`: 发送失败时返回错误 / Returns error on failure

```javascript
// 成功时 / On success
socket.on('message', (data) => {
  console.log(`${data.nickname}: ${data.content}`);
  /*
  data: {
    id, content, timestamp, user_id, username, 
    nickname, color, badge, room_id
  }
  */
});

socket.on('message_id_response', (data) => {
  console.log(`消息 ID: ${data.server_id}`);
  // data: { client_id, server_id }
});

// 失败时 / On failure
socket.on('error', (data) => {
  console.error(data.message);
});
```

---

### 5. delete_message（删除消息）

**方向 / Direction**: Client → Server

**说明 / Description**: 删除聊天消息（仅消息作者或管理员）。

Delete chat message (message author or admin only).

**发送数据 / Emit Data**:

```javascript
socket.emit('delete_message', {
  room_id: 1,
  message_id: 123
});
```

**响应事件 / Response Events**:

- `message_deleted`: 广播到房间所有用户 / Broadcast to all users in room
- `error`: 删除失败 / Deletion failed

```javascript
socket.on('message_deleted', (data) => {
  console.log(`消息 ${data.message_id} 已删除`);
  // data: { message_id, room_id }
});
```

---

### 6. get_online_users（获取在线用户）

**方向 / Direction**: Client → Server

**说明 / Description**: 获取房间在线用户列表。

Get list of online users in room.

**发送数据 / Emit Data**:

```javascript
socket.emit('get_online_users', {
  room_id: 1
});
```

**响应事件 / Response Event**: `online_users`

```javascript
socket.on('online_users', (data) => {
  console.log('在线用户:', data.users);
  /*
  data: {
    room_id: 1,
    users: [
      { id, username, nickname, color, badge },
      ...
    ]
  }
  */
});
```

---

### 7. heartbeat（心跳）

**方向 / Direction**: Client → Server

**说明 / Description**: 全局心跳，更新用户最后活动时间。

Global heartbeat, update user's last activity time.

**发送数据 / Emit Data**:

```javascript
// 每 10 秒发送一次 / Send every 10 seconds
setInterval(() => {
  socket.emit('heartbeat');
}, 10000);
```

**响应 / Response**: 无明确响应，服务器更新 `last_seen` / No explicit response, server updates `last_seen`

---

### 8. heartbeat_chat（聊天室心跳）

**方向 / Direction**: Client → Server

**说明 / Description**: 聊天室心跳，更新房间在线人数。

Chat room heartbeat, update room online count.

**发送数据 / Emit Data**:

```javascript
// 每 5 秒发送一次 / Send every 5 seconds
setInterval(() => {
  socket.emit('heartbeat_chat', {
    room_id: 1
  });
}, 5000);
```

**响应事件 / Response Event**: `online_count_update`

---

## 错误处理 / Error Handling

### 标准错误格式 / Standard Error Format

```json
{
  "success": false,
  "message": "错误描述 / Error description",
  "error": "ERROR_CODE"
}
```

### 常见错误码 / Common Error Codes

| HTTP 状态 / Status | 错误信息 / Error Message | 说明 / Description |
|---|---|---|
| 400 | `缺少必需参数` / `Missing required parameter` | 请求参数不完整 / Incomplete request parameters |
| 401 | `需要登录` / `Login required` | 用户未登录 / User not logged in |
| 401 | `需要 SU 验证` / `SU verification required` | 管理员需要二次验证 / Admin needs re-verification |
| 403 | `无权限` / `Permission denied` | 用户没有操作权限 / User lacks permission |
| 404 | `资源不存在` / `Resource not found` | 请求的资源不存在 / Requested resource doesn't exist |
| 413 | `文件过大` / `File too large` | 上传文件超过大小限制 / Uploaded file exceeds size limit |
| 413 | `配额不足` / `Quota exceeded` | 用户上传配额已用完 / User upload quota exhausted |
| 429 | `请求过快` / `Too many requests` | 触发速率限制 / Rate limit triggered |
| 500 | `服务器错误` / `Internal server error` | 服务器内部错误 / Server internal error |

### WebSocket 错误 / WebSocket Errors

```javascript
socket.on('error', (data) => {
  console.error(data.message);
  // data: { message: "错误描述" }
});
```

---

## 速率限制 / Rate Limiting

### 限制策略 / Rate Limit Policy

| 端点 / Endpoint | 限制 / Limit | 说明 / Description |
|---|---|---|
| `POST /api/auth/login` | 5 次/分钟 per IP | 防止暴力破解 / Prevent brute force |
| `POST /api/chat/send` | 默认无限制 / No limit by default | 可配置 / Configurable |
| `POST /api/upload/image` | 默认无限制 / No limit by default | 可配置 / Configurable |

### 限制响应 / Rate Limit Response

**HTTP 429 Too Many Requests**:

```json
{
  "success": false,
  "message": "请求过快，请稍后再试",
  "retry_after": 60
}
```

**响应头 / Response Headers**:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1707559200
```

---

## 最佳实践 / Best Practices

### 1. 认证 / Authentication

```javascript
// 保存会话 Cookie / Save session cookie
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // 重要：包含 Cookie / Important: include cookies
  body: JSON.stringify({ username: 'alice', password: 'pass123' })
});
```

### 2. WebSocket 连接 / WebSocket Connection

```javascript
// 等待认证后再连接 / Connect after authentication
await login();
const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5
});
```

### 3. 错误处理 / Error Handling

```javascript
// HTTP API 错误处理 / HTTP API error handling
fetch('/api/chat/send', { /* ... */ })
  .then(res => res.json())
  .then(data => {
    if (!data.success) {
      console.error(data.message);
      // 处理错误 / Handle error
    }
  })
  .catch(err => {
    console.error('网络错误:', err);
  });

// WebSocket 错误处理 / WebSocket error handling
socket.on('error', (data) => {
  if (data.message.includes('权限')) {
    // 权限错误 / Permission error
  }
});
```

### 4. 分页查询 / Pagination

```javascript
// 获取聊天历史（分页）/ Get chat history (paginated)
async function loadMoreMessages(roomId, page = 0) {
  const res = await fetch(`/api/chat/${roomId}/history?limit=100&page=${page}`);
  const data = await res.json();
  
  if (data.success) {
    displayMessages(data.messages);
    
    if (data.has_more) {
      // 有更多消息 / More messages available
      loadMoreButton.show();
    }
  }
}
```

---

## 版本信息 / Version Information

- **文档版本 / Document Version**: 1.0
- **API 版本 / API Version**: v1 (无版本前缀 / No version prefix)
- **最后更新 / Last Updated**: 2025-02-10

---

## 参考文档 / Reference Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 后端架构文档 / Backend architecture
- [DATABASE.md](./DATABASE.md) - 数据库文档 / Database documentation
- [LOGGING.md](./LOGGING.md) - 日志系统文档 / Logging documentation
- [Flask 官方文档](https://flask.palletsprojects.com/)
- [Socket.IO 官方文档](https://socket.io/docs/)
