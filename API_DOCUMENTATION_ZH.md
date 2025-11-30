# API文档 / API Documentation

## 目录 / Table of Contents
- [介绍 / Introduction](#介绍--introduction)
- [认证 / Authentication](#认证--authentication)
- [基础URL / Base URL](#基础url--base-url)
- [响应格式 / Response Format](#响应格式--response-format)
- [端点 / Endpoints](#端点--endpoints)
  - [用户管理 / User Management](#用户管理--user-management)
  - [内容管理 / Content Management](#内容管理--content-management)
  - [聊天和论坛 / Chat & Forum](#聊天和论坛--chat--forum)
- [错误码 / Error Codes](#错误码--error-codes)
- [示例 / Examples](#示例--examples)

## 介绍 / Introduction

此API提供对我们应用程序核心功能的访问，包括用户管理、内容创建、聊天和论坛功能。API遵循RESTful原则并返回JSON响应。

This API provides access to the core functionality of our application, including user management, content creation, chat, and forum features. The API follows RESTful principles and returns JSON responses.

## 认证 / Authentication

所有API请求都需要在Authorization头中使用Bearer令牌进行身份验证。

All API requests require authentication using a Bearer token in the Authorization header.

```
Authorization: Bearer {your_token_here}
```

## 基础URL / Base URL

```
https://api.yourdomain.com/v1
```

## 响应格式 / Response Format

所有API响应都遵循此标准格式：

All API responses follow this standard format:

```json
{
  "status": "success" | "error",
  "data": { ... } | null,
  "message": "Success message" | "Error message",
  "timestamp": "ISO 8601 timestamp"
}
```

## 端点 / Endpoints

### 用户管理 / User Management

#### 获取用户资料 / Get User Profile
- **端点**: `GET /users/profile`
- **描述**: 获取认证用户的基本资料信息。
- **Description**: Retrieve the authenticated user's profile information.
- **响应**:
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "User profile retrieved successfully"
}
```

#### 更新用户资料 / Update User Profile
- **端点**: `PUT /users/profile`
- **描述**: 更新认证用户的基本资料信息。
- **Description**: Update the authenticated user's profile information.
- **请求体**:
```json
{
  "username": "new_username",
  "email": "new_email@example.com"
}
```
- **响应**:
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "username": "new_username",
    "email": "new_email@example.com"
  },
  "message": "Profile updated successfully"
}
```

#### 修改密码 / Change Password
- **端点**: `POST /users/change-password`
- **描述**: 修改认证用户的密码。
- **Description**: Change the authenticated user's password.
- **请求体**:
```json
{
  "current_password": "current_password",
  "new_password": "new_password"
}
```
- **响应**:
```json
{
  "status": "success",
  "data": null,
  "message": "Password changed successfully"
}
```

### 内容管理 / Content Management

#### 获取所有帖子 / Get All Posts
- **端点**: `GET /posts`
- **描述**: 获取所有帖子的列表。
- **Description**: Retrieve a list of all posts.
- **查询参数**:
  - `page` (可选): 分页页码
  - `limit` (可选): 每页帖子数量
  - `category` (可选): 按类别筛选
- **Query Parameters**:
  - `page` (optional): Page number for pagination
  - `limit` (optional): Number of posts per page
  - `category` (optional): Filter by category
- **响应**:
```json
{
  "status": "success",
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "Sample Post",
        "content": "This is sample content",
        "author": "john_doe",
        "created_at": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50
    }
  },
  "message": "Posts retrieved successfully"
}
```

#### 创建新帖子 / Create New Post
- **端点**: `POST /posts`
- **描述**: 创建新帖子。
- **Description**: Create a new post.
- **请求体**:
```json
{
  "title": "New Post Title",
  "content": "This is the content of the new post",
  "category": "general"
}
```
- **响应**:
```json
{
  "status": "success",
  "data": {
    "id": 124,
    "title": "New Post Title",
    "content": "This is the content of the new post",
    "author": "john_doe",
    "created_at": "2023-01-01T00:00:00Z"
  },
  "message": "Post created successfully"
}
```

### 聊天和论坛 / Chat & Forum

#### 获取聊天消息 / Get Chat Messages
- **端点**: `GET /chat/messages`
- **描述**: 获取特定对话的聊天消息。
- **Description**: Retrieve chat messages from a specific conversation.
- **查询参数**:
  - `conversation_id`: 对话ID
  - `limit` (可选): 返回的消息数量
- **Query Parameters**:
  - `conversation_id`: ID of the conversation
  - `limit` (optional): Number of messages to return
- **响应**:
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": 1,
        "sender": "john_doe",
        "content": "Hello there!",
        "timestamp": "2023-01-01T00:00:00Z"
      }
    ]
  },
  "message": "Messages retrieved successfully"
}
```

#### 发送聊天消息 / Send Chat Message
- **端点**: `POST /chat/messages`
- **描述**: 发送新的聊天消息。
- **Description**: Send a new chat message.
- **请求体**:
```json
{
  "conversation_id": 123,
  "content": "This is my message"
}
```
- **响应**:
```json
{
  "status": "success",
  "data": {
    "id": 125,
    "sender": "john_doe",
    "content": "This is my message",
    "timestamp": "2023-01-01T00:00:00Z"
  },
  "message": "Message sent successfully"
}
```

## 错误码 / Error Codes

| 代码 | 消息 | 描述 | Code | Message | Description |
|------|------|------|------|---------|-------------|
| 400 | 请求无效或无法处理 | 请求无效或无法处理 | 400 | Bad Request | The request was invalid or cannot be served |
| 401 | 未授权 | 需要身份验证或验证失败 | 401 | Unauthorized | Authentication is required or has failed |
| 403 | 禁止访问 | 对请求资源的访问被禁止 | 403 | Forbidden | Access to the requested resource is forbidden |
| 404 | 未找到 | 找不到请求的资源 | 404 | Not Found | The requested resource could not be found |
| 422 | 无法处理的实体 | 请求格式正确但因语义错误无法处理 | 422 | Unprocessable Entity | The request was well-formed but was unable to be followed due to semantic errors |
| 500 | 内部服务器错误 | 服务器发生错误 | 500 | Internal Server Error | An error occurred on the server |

## 示例 / Examples

### JavaScript
```javascript
// 获取用户资料
fetch('https://api.yourdomain.com/v1/users/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your_token_here',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### Python
```python
import requests

headers = {
    'Authorization': 'Bearer your_token_here',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.yourdomain.com/v1/users/profile', headers=headers)
data = response.json()
print(data)
```

### cURL
```bash
curl -X GET \
  https://api.yourdomain.com/v1/users/profile \
  -H 'Authorization: Bearer your_token_here' \
  -H 'Content-Type: application/json'
```