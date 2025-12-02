# Stellarsis API 文档 / API Documentation

## 概述 / Overview

本文档描述了Stellarsis系统的API接口，包括REST API和WebSocket事件。

This document describes the API interfaces of the Stellarsis system, including REST APIs and WebSocket events.

## 认证 / Authentication

大部分API需要用户认证，通过session进行验证。

Most APIs require user authentication via session.

## REST API

### 用户相关 / User Related

#### 登录 / Login
- **POST** `/login`
- **描述**: 用户登录
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "redirect": "/chat"
  }
  ```

#### 登出 / Logout
- **GET** `/logout`
- **描述**: 用户登出
- **响应**: 重定向到登录页

#### 修改密码 / Change Password
- **POST** `/change_password`
- **描述**: 修改用户密码
- **请求体**:
  ```json
  {
    "old_password": "string",
    "new_password": "string",
    "confirm_password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": "密码修改成功"
  }
  ```

#### 更新个人资料 / Update Profile
- **POST** `/profile`
- **描述**: 更新用户个人资料
- **请求体**:
  ```json
  {
    "nickname": "string",
    "color": "string",
    "badge": "string"
  }
  ```

### 聊天室相关 / Chat Room Related

#### 获取聊天室历史消息 / Get Chat Room History
- **GET** `/api/chat/{room_id}/history`
- **描述**: 获取指定聊天室的历史消息
- **参数**:
  - `room_id`: 聊天室ID
  - `page`: 页码 (可选, 默认1)
  - `limit`: 每页数量 (可选, 默认50)
- **响应**:
  ```json
  {
    "messages": [
      {
        "id": 1,
        "content": "消息内容",
        "timestamp": "2023-01-01T00:00:00Z",
        "user_id": 1,
        "username": "用户名",
        "nickname": "昵称",
        "color": "#颜色",
        "badge": "徽章"
      }
    ],
    "has_more": true,
    "page": 1
  }
  ```

#### 发送消息 / Send Message
- **POST** `/api/chat/send`
- **描述**: 发送聊天消息
- **请求体**:
  ```json
  {
    "room_id": 1,
    "message": "消息内容"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "message": {
      "id": 1,
      "content": "消息内容",
      "timestamp": "2023-01-01T00:00:00Z",
      "user_id": 1,
      "username": "用户名",
      "nickname": "昵称"
    }
  }
  ```

#### 删除消息 / Delete Message
- **DELETE** `/api/chat/{room_id}/messages/{message_id}`
- **描述**: 删除指定消息
- **参数**:
  - `room_id`: 聊天室ID
  - `message_id`: 消息ID
- **响应**:
  ```json
  {
    "success": true,
    "message": "消息已删除"
  }
  ```

### 论坛相关 / Forum Related

#### 发布帖子 / Create Post
- **POST** `/forum/new/{section_id}`
- **描述**: 在指定分区发布新帖子
- **参数**:
  - `section_id`: 分区ID
- **请求体**:
  ```json
  {
    "title": "帖子标题",
    "content": "帖子内容"
  }
  ```

#### 删除帖子 / Delete Post
- **DELETE** `/api/forum/thread/{thread_id}`
- **描述**: 删除指定帖子
- **参数**:
  - `thread_id`: 帖子ID

#### 发布回复 / Create Reply
- **POST** `/api/forum/reply`
- **描述**: 对帖子发布回复
- **请求体**:
  ```json
  {
    "thread_id": 1,
    "content": "回复内容"
  }
  ```

#### 删除回复 / Delete Reply
- **DELETE** `/api/forum/reply/{reply_id}`
- **描述**: 删除指定回复
- **参数**:
  - `reply_id`: 回复ID

### 关注系统 / Following System

#### 获取关注列表 / Get Following List
- **GET** `/api/follow/following`
- **描述**: 获取当前用户关注的用户列表
- **响应**:
  ```json
  {
    "success": true,
    "following": [
      {
        "id": 1,
        "username": "用户名",
        "nickname": "昵称",
        "color": "#颜色",
        "badge": "徽章"
      }
    ]
  }
  ```

#### 切换关注 / Toggle Follow
- **POST** `/api/follow/toggle`
- **描述**: 关注或取消关注用户
- **请求体**:
  ```json
  {
    "user_id": 1
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "action": "follow" // 或 "unfollow"
  }
  ```

#### 搜索用户 / Search Users
- **GET** `/api/search_users?q={query}`
- **描述**: 搜索用户
- **参数**:
  - `q`: 搜索关键词
- **响应**:
  ```json
  {
    "users": [
      {
        "id": 1,
        "username": "用户名",
        "nickname": "昵称"
      }
    ]
  }
  ```

### 在线状态 / Online Status

#### 获取在线人数 / Get Online Count
- **GET** `/api/online_count`
- **描述**: 获取全局在线用户数
- **响应**:
  ```json
  {
    "count": 5
  }
  ```

#### 获取未读计数 / Get Unread Counts
- **GET** `/api/last_views/unread_counts`
- **描述**: 获取聊天室和论坛的未读消息数
- **响应**:
  ```json
  {
    "chat_unreads": {
      "1": 3,
      "2": 1
    },
    "forum_unreads": {
      "1": 2,
      "3": 5
    }
  }
  ```

### 管理员相关 / Admin Related

#### 管理员面板 / Admin Panel
- **GET** `/admin`
- **描述**: 获取管理员面板数据

#### 管理员聊天室管理 / Admin Chat Room Management
- **GET** `/api/admin/chat/rooms`: 获取聊天室列表
- **POST** `/api/admin/chat/rooms`: 创建聊天室
- **PUT** `/api/admin/chat/rooms/{room_id}`: 更新聊天室
- **DELETE** `/api/admin/chat/rooms/{room_id}`: 删除聊天室

#### 管理员论坛管理 / Admin Forum Management
- **POST** `/api/admin/forum/sections`: 创建论坛分区
- **PUT** `/api/admin/forum/sections/{section_id}`: 更新论坛分区
- **DELETE** `/api/admin/forum/sections/{section_id}`: 删除论坛分区

## WebSocket 事件 / WebSocket Events

### 连接事件 / Connection Events

#### 连接 / Connect
- **事件**: `connect`
- **描述**: 客户端连接到服务器
- **触发**: 客户端连接时自动触发

#### 断开连接 / Disconnect
- **事件**: `disconnect`
- **描述**: 客户端断开连接
- **触发**: 客户端断开连接时触发

### 聊天事件 / Chat Events

#### 加入房间 / Join Room
- **事件**: `join`
- **发送**: 客户端 → 服务器
- **数据**:
  ```json
  {
    "room": 1
  }
  ```

#### 离开房间 / Leave Room
- **事件**: `leave`
- **发送**: 客户端 → 服务器
- **数据**:
  ```json
  {
    "room": 1
  }
  ```

#### 发送消息 / Send Message
- **事件**: `send_message`
- **发送**: 客户端 → 服务器
- **数据**:
  ```json
  {
    "room_id": 1,
    "message": "消息内容",
    "client_id": "客户端ID"
  }
  ```

#### 接收消息 / Receive Message
- **事件**: `message`
- **发送**: 服务器 → 客户端
- **数据**:
  ```json
  {
    "id": 1,
    "content": "消息内容",
    "timestamp": "2023-01-01T00:00:00Z",
    "user_id": 1,
    "username": "用户名",
    "nickname": "昵称",
    "color": "#颜色",
    "badge": "徽章",
    "client_id": "客户端ID" // 可选
  }
  ```

#### 用户加入 / User Join
- **事件**: `user_join`
- **发送**: 服务器 → 所有客户端
- **数据**:
  ```json
  {
    "user_id": 1,
    "username": "用户名",
    "nickname": "昵称",
    "room_id": 1
  }
  ```
- **描述**: 当用户加入聊天室时广播，用于关注系统

#### 用户离开 / User Leave
- **事件**: `user_leave`
- **发送**: 服务器 → 所有客户端
- **数据**:
  ```json
  {
    "user_id": 1,
    "username": "用户名",
    "nickname": "昵称",
    "room_id": 1
  }
  ```
- **描述**: 当用户离开聊天室时广播，用于关注系统

### 在线状态事件 / Online Status Events

#### 获取在线用户 / Get Online Users
- **事件**: `get_online_users`
- **发送**: 客户端 → 服务器
- **数据**:
  ```json
  {
    "room_id": 1
  }
  ```

#### 在线用户列表 / Online Users List
- **事件**: `online_users`
- **发送**: 服务器 → 客户端
- **数据**:
  ```json
  {
    "users": [
      {
        "id": 1,
        "username": "用户名",
        "nickname": "昵称",
        "color": "#颜色",
        "badge": "徽章",
        "last_seen": "2023-01-01T00:00:00Z"
      }
    ]
  }
  ```

#### 获取全局在线人数 / Get Global Online Count
- **事件**: `get_global_online_count`
- **发送**: 客户端 → 服务器
- **数据**: `{}`

#### 全局在线人数 / Global Online Count
- **事件**: `global_online_count`
- **发送**: 服务器 → 客户端
- **数据**:
  ```json
  {
    "count": 5
  }
  ```

## 错误处理 / Error Handling

### HTTP 错误码 / HTTP Error Codes
- `200`: 成功
- `400`: 请求错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器错误

### WebSocket 错误 / WebSocket Errors
- **事件**: `error`
- **数据**:
  ```json
  {
    "message": "错误信息"
  }
  ```

## 状态码说明 / Status Code Reference

- `su`: 超级用户权限
- `777`: 发送权限
- `444`: 只读权限
- `Null`: 无权限

## 版本信息 / Version Information

- **API 版本**: 1.0
- **最后更新**: 2023年

## 额外事件 / Additional WebSocket Events

### 请求删除消息 / delete_message (客户端 -> 服务器)
- **事件**: `delete_message`
- **描述**: 客户端请求服务器删除指定消息（优先使用 WebSocket，当不可用时可使用 HTTP DELETE）
- **数据**:
  ```json
  {
    "room_id": 1,
    "message_id": 123
  }
  ```

### 消息已删除广播 / message_deleted (服务器 -> 客户端)
- **事件**: `message_deleted`
- **描述**: 服务器在删除数据库中的消息后，广播该事件以便各客户端更新 UI
- **数据**:
  ```json
  {
    "id": 123,
    "room_id": 1,
    "deleted_by": 2,
    "timestamp": "2025-12-02T12:00:00Z"
  }
  ```

客户端实现说明:
- 推荐在具备 WebSocket 的情况下优先向服务器发送 `delete_message`，服务器验证并删除后广播 `message_deleted`，客户端收到后应把对应消息替换为“该消息已被删除”的占位元素；如果使用轮询/AJAX 的降级方案，轮询到服务器历史列表不包含某条消息时也应把该消息标记为已删除。

## 管理面板 - 直接浏览数据库

如果服务器安装了 `Flask-Admin`，系统会在 `/admin/db` 下开放一个只对管理员可见的数据库浏览和编辑界面（基于模型视图）。该界面允许通过浏览器直接查看、搜索和编辑数据表（用户、消息、分区、权限等）。

注意: 在生产环境中启用该界面时请确保仅允许受信任的管理员访问，并使用 HTTPS + 强密码以及 IP 白名单/额外多因素认证以降低风险。
