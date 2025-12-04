# Stellarsis API 文档（根据 `app.py` 自动生成）

下面列出应用在 `app.py` 中实现的主要 HTTP REST 接口与 WebSocket 事件。大多数接口需要登录（基于 session），管理员接口需要 `current_user.is_admin()`。

注意：此文档为简明参考，示例响应仅展示关键字段。

## 认证
- 登录页面（表单）: `GET /login` 以及 `POST /login`（表单字段：`username`,`password`）。
- 登出: `GET /logout`。

## 用户与设置
- 修改密码: `GET/POST /change_password`（表单）。
- 个人资料: `GET/POST /profile`（表单，字段示例：`nickname`,`color`,`badge`）。

## 聊天（HTTP API）
- 获取聊天室历史（按时间升序，返回原始 Markdown）
  - `GET /api/chat/<room_id>/history`
  - 查询参数：`limit`（默认50，最大100），`offset`（偏移）
  - 返回：`{ messages: [{id, content, timestamp, user_id, username, nickname, color, badge}, ...] }

- 发送消息（HTTP POST 备用）
  - `POST /api/chat/send`（支持 JSON 或表单）
  - 请求示例 JSON：`{ "room_id": 1, "message": "..." }`
  - 返回：`{ success: true }` 或错误码（403/400）

- 删除消息（HTTP）
  - `DELETE /api/chat/<room_id>/messages/<message_id>`
  - 说明：管理员或具有相应权限的用户可删除；777 可删除自己的消息。

- 全局在线计数：`GET /api/online_count`

- 未读计数：`GET /api/last_views/unread_counts`（返回当前用户在可访问聊天室与分区上的未读数映射）

## 论坛（HTTP API）
- 列表/页面：`GET /forum`, `GET /forum/section/<section_id>`, `GET /forum/thread/<thread_id>`（页面视图）
- 发布主题：`POST /forum/new/<section_id>`（表单）
- 回复：`POST /api/forum/reply`（表单，字段 `thread_id`,`content`）
- 删除主题或回复（管理员权限或分区权限）：
  - 删除主题: `DELETE /api/forum/thread/<thread_id>`
  - 删除回复: `DELETE /api/forum/reply/<reply_id>`

## 上传图片
- 上传图片（登录）
  - `POST /api/upload/image`（multipart/form-data, 字段名 `file`）
  - 行为：文件流式写入磁盘 -> 读取头部判断类型 -> 如果合法，写入 `user_images` 并返回 URL 和 Markdown。
  - 返回示例：`{ success: true, url: "/static/..., markdown: "![alt](url)", id: <image_id>, filename: "..." }`

- 列出当前用户图片：`GET /api/upload/images` 返回 `images: [{id, filename, url, markdown, uploaded}, ...]`
- 删除图片：`DELETE /api/upload/image/<image_id>`（图片所有者或管理员）

## 管理员 REST API（需管理员权限）
（列出常用管理接口，均以 JSON 返回）

- 管理界面页面：
  - `GET /admin/index`（渲染 admin 页面）
  - `GET /admin/chat`, `GET /admin/forum`, `GET /admin/users`, `GET /admin/db/`

- 聊天室管理：
  - 列表: `GET /api/admin/chat/rooms` -> `{ success: true, rooms: [{id,name,description}, ...] }`
  - 创建: `POST /api/admin/chat/rooms`（JSON `{name,description}`）
  - 更新: `PUT /api/admin/chat/rooms/<room_id>`（JSON `{name,description}`）
  - 删除: `DELETE /api/admin/chat/rooms/<room_id>`（注意：默认聊天室ID=1 受保护，无法删除）
  - 删除消息批量: `DELETE /api/admin/chat/messages` 可带 `room_id` 与 `before` 参数
  - 房间用户列表（两种可用路径，文档推荐使用 section-users 以保持与论坛一致）：
    - `GET /api/admin/chat/room-users/<room_id>`
    - `GET /api/admin/chat/section-users/<room_id>` (别名，返回相同数据结构：`{ success:true, users: [{id,username,nickname,perm}, ...] }`)

- 论坛管理：
  - 列表: `GET /api/admin/forum/sections` -> `{ success:true, sections: [{id,name,description}, ...] }`
  - 创建: `POST /api/admin/forum/sections`（JSON `{name,description}`）
  - 更新: `PUT /api/admin/forum/sections/<section_id>`
  - 删除: `DELETE /api/admin/forum/sections/<section_id>`（默认分区ID=1 受保护）
  - 分区用户列表: `GET /api/admin/forum/section-users/<section_id>` -> `{ success:true, users: [{id,username,nickname,perm}, ...] }`

- 用户管理与权限：
  - 获取用户权限详情: `GET /api/admin/users/<user_id>/permissions` -> 返回该用户在所有聊天室与分区的权限
  - 更新用户权限: `PUT /api/admin/users/<user_id>/permissions`（JSON `{scope:'chat'|'forum', target_id:<id>, perm:'su'|'777'|'444'|'Null'}`）
  - 更新用户信息: `PUT /api/admin/users/<user_id>`（JSON 可含 username,nickname,color,badge）
  - 删除用户: `DELETE /api/admin/users/<user_id>`（注意：ID=1 的超级管理员受保护）
  - 创建用户: `POST /api/admin/users`（JSON `{username,password,nickname,color,badge,role}`）
  - 修改角色: `PUT /api/admin/users/<user_id>/role`（JSON `{role:'user'|'admin'}`）

- 系统与维护：
  - 获取系统信息: `GET /api/admin/system-info`（内存/时间等）
  - 清除缓存: `POST /api/admin/clear-cache`
  - 优化数据库(VACUUM): `POST /api/admin/optimize-database`
  - 备份数据库（创建备份文件）: `POST /api/admin/backup-database`
  - 重启服务器: `POST /api/admin/restart`
  - 关机: `POST /api/admin/shutdown`（JSON `{reason: '...'}'`）

- 管理员文件/下载：
  - 下载 uploads 压缩包: `GET /admin/download-images-zip`（返回 uploads.zip）
  - 打包项目根目录下载（排除大目录）: `GET /down` 或者另一路径 `/down`（根据部署两个路由均存在）
  - 下载数据库文件 (SQLite): `GET /downdb`

- 上传统计/校正：
  - 通过记录统计：`POST /api/admin/recalculate-upload-sizes`（返回每用户上传总和）
  - 按文件扫描并更新文件大小字段：`POST /api/admin/recount-file-size`（返回 `totals`, `updated_users`, `total_files`）

## WebSocket 事件（Socket.IO）
- 连接/断开：`connect` / `disconnect`（认证后连接会为用户更新时间戳）
- 加入/离开房间：`join`（数据 `{room: <id>}`） / `leave`
- 发送消息（实时）：`send_message`（数据 `{room_id, message, client_id?}`）
  - 服务器会将消息保存到数据库并在房间内 emit `message`（包含服务器分配的 `id`）
- 在线用户列表请求：`get_online_users`（返回 `online_users` 事件）
- 全局在线数请求：`get_global_online_count` -> `global_online_count`
- 用户加入/离开广播：`user_join` / `user_leave`
- 删除消息广播：`message_deleted`（当服务器删除一条消息后广播）

## 权限说明
- 权限值：`su`（超级）、`777`（发送）、`444`（只读）、`Null`（无权限）

## 错误码
- `200` 成功
- `400` 请求参数错误
- `401` 未认证（页面重定向到登录）
- `403` 权限不足
- `404` 未找到资源
- `413` 请求实体过大（上传）
- `500` 服务器错误

---

如果你希望我把这份文档进一步导出为 OpenAPI/Swagger 规范（yaml/json），或将其插入到站点的 `/admin/api` 页面，我可以继续生成对应的文件并修改模板。

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
