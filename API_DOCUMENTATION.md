# API Documentation / API文档

## Table of Contents / 目录
- [Introduction / 介绍](#introduction--介绍)
- [Authentication / 认证](#authentication--认证)
- [Base URL / 基础URL](#base-url--基础url)
- [Response Format / 响应格式](#response-format--响应格式)
- [Endpoints / 端点](#endpoints--端点)
  - [User Management / 用户管理](#user-management--用户管理)
  - [Content Management / 内容管理](#content-management--内容管理)
  - [Chat & Forum / 聊天和论坛](#chat--forum--聊天和论坛)
- [Error Codes / 错误码](#error-codes--错误码)
- [Examples / 示例](#examples--示例)

## Introduction / 介绍

This API provides access to the core functionality of our application, including user management, content creation, chat, and forum features. The API follows RESTful principles and returns JSON responses.

此API提供对我们应用程序核心功能的访问，包括用户管理、内容创建、聊天和论坛功能。API遵循RESTful原则并返回JSON响应。

## Authentication / 认证

All API requests require authentication using a Bearer token in the Authorization header.

所有API请求都需要在Authorization头中使用Bearer令牌进行身份验证。

```
Authorization: Bearer {your_token_here}
```

## Base URL / 基础URL

```
https://api.yourdomain.com/v1
```

## Response Format / 响应格式

All API responses follow this standard format:

所有API响应都遵循此标准格式：

```json
{
  "status": "success" | "error",
  "data": { ... } | null,
  "message": "Success message" | "Error message",
  "timestamp": "ISO 8601 timestamp"
}
```

## Endpoints / 端点

### User Management / 用户管理

#### Get User Profile / 获取用户资料
- **Endpoint**: `GET /users/profile`
- **Description**: Retrieve the authenticated user's profile information.
- **描述**: 获取认证用户的基本资料信息。
- **Response**:
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

#### Update User Profile / 更新用户资料
- **Endpoint**: `PUT /users/profile`
- **Description**: Update the authenticated user's profile information.
- **描述**: 更新认证用户的基本资料信息。
- **Request Body**:
```json
{
  "username": "new_username",
  "email": "new_email@example.com"
}
```
- **Response**:
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

#### Change Password / 修改密码
- **Endpoint**: `POST /users/change-password`
- **Description**: Change the authenticated user's password.
- **描述**: 修改认证用户的密码。
- **Request Body**:
```json
{
  "current_password": "current_password",
  "new_password": "new_password"
}
```
- **Response**:
```json
{
  "status": "success",
  "data": null,
  "message": "Password changed successfully"
}
```

### Content Management / 内容管理

#### Get All Posts / 获取所有帖子
- **Endpoint**: `GET /posts`
- **Description**: Retrieve a list of all posts.
- **描述**: 获取所有帖子的列表。
- **Query Parameters**:
  - `page` (optional): Page number for pagination
  - `limit` (optional): Number of posts per page
  - `category` (optional): Filter by category
- **查询参数**:
  - `page` (可选): 分页页码
  - `limit` (可选): 每页帖子数量
  - `category` (可选): 按类别筛选
- **Response**:
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

#### Create New Post / 创建新帖子
- **Endpoint**: `POST /posts`
- **Description**: Create a new post.
- **描述**: 创建新帖子。
- **Request Body**:
```json
{
  "title": "New Post Title",
  "content": "This is the content of the new post",
  "category": "general"
}
```
- **Response**:
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

### Chat & Forum / 聊天和论坛

#### Get Chat Messages / 获取聊天消息
- **Endpoint**: `GET /chat/messages`
- **Description**: Retrieve chat messages from a specific conversation.
- **描述**: 获取特定对话的聊天消息。
- **Query Parameters**:
  - `conversation_id`: ID of the conversation
  - `limit` (optional): Number of messages to return
- **查询参数**:
  - `conversation_id`: 对话ID
  - `limit` (可选): 返回的消息数量
- **Response**:
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

#### Send Chat Message / 发送聊天消息
- **Endpoint**: `POST /chat/messages`
- **Description**: Send a new chat message.
- **描述**: 发送新的聊天消息。
- **Request Body**:
```json
{
  "conversation_id": 123,
  "content": "This is my message"
}
```
- **Response**:
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

## Error Codes / 错误码

| Code | Message | Description | 消息 | 描述 |
|------|---------|-------------|------|------|
| 400 | Bad Request | The request was invalid or cannot be served | 请求无效或无法处理 | 请求无效或无法处理 |
| 401 | Unauthorized | Authentication is required or has failed | 未授权 | 需要身份验证或验证失败 |
| 403 | Forbidden | Access to the requested resource is forbidden | 禁止访问 | 对请求资源的访问被禁止 |
| 404 | Not Found | The requested resource could not be found | 未找到 | 找不到请求的资源 |
| 422 | Unprocessable Entity | The request was well-formed but was unable to be followed due to semantic errors | 无法处理的实体 | 请求格式正确但因语义错误无法处理 |
| 500 | Internal Server Error | An error occurred on the server | 内部服务器错误 | 服务器发生错误 |

## Examples / 示例

### JavaScript / JavaScript
```javascript
// Get user profile
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

### Python / Python
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

### cURL / cURL
```bash
curl -X GET \
  https://api.yourdomain.com/v1/users/profile \
  -H 'Authorization: Bearer your_token_here' \
  -H 'Content-Type: application/json'
```