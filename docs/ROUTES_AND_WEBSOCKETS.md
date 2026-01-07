# 路由与 WebSocket 事件索引 ✅

说明：本文件整理了项目中当前所有的 HTTP 路由（含 path 参数、query/body 参数、允许的方法）和 Socket.IO 事件（事件名与事件参数）。如需进一步生成 OpenAPI / Swagger 格式或把参数类型补全为更精确的描述，我可以继续完善。💡

---

## 目录
- 页面路由（Render 页面）
- 公共 API（/api）
- 管理页面与管理 API（/admin）
- 文件 / 数据库 管理路由
- WebSocket 事件

---

## 1. 页面路由（模板渲染） 🔧
| 路径 | 方法 | 参数 | 说明 |
|---|---:|---|---|
| `/` | GET | — | 主页，需已登录，返回 index 模板并包含名言、房间/分区计数 |
| `/login` | GET, POST | POST body: `username`, `password` | 登录页/登录动作（POST 限制速率） |
| `/logout` | GET | — | 注销并重定向到登录页 |
| `/change_password` | GET, POST | POST form: `old_password`, `new_password`, `confirm_password` | 修改密码 |
| `/profile` | GET, POST | POST form: `nickname`, `color`, `badge` | 编辑个人资料 |
| `/chat` | GET | — | 聊天房间列表页 |
| `/chat/<int:room_id>` | GET | path: `room_id` | 聊天房间页面 |
| `/settings` | GET | — | 设置页 |
| `/settings/follows` | GET | — | 设置 -> 关注列表页 |
| `/settings/images` | GET | — | 设置 -> 图片管理页 |
| `/forum` | GET | — | 贴吧分区列表页 |
| `/forum/section/<int:section_id>` | GET | path: `section_id` | 分区页面 |
| `/forum/thread/<int:thread_id>` | GET | path: `thread_id` | 主题帖页面 |
| `/forum/new/<int:section_id>` | GET, POST | path: `section_id`; POST form: `title`, `content` | 新帖（POST 创建） |
| `/admin/index` | GET | — | 管理首页（仅 admin） |
| `/admin/users` | GET | — | 管理用户页面 |
| `/admin/chat` | GET | — | 管理聊天室页面 |
| `/admin/forum` | GET | — | 管理贴吧页面 |
| `/admin/file_manager` | GET | query: `path` | 文件管理视图 |
| `/admin/file_manager/read` | GET | query: `path` | 读取文件内容（返回 JSON） |
| `/admin/file_manager/write` | POST | form: `path`, `content` | 写回文件（仅 admin） |
| `/admin/quotes` | GET | — | 名言管理页面 |
| `/down` | GET | — | 管理员下载项目压缩包（存在多个类似实现，视 context 返回 ZIP） |
| `/downdb` | GET | — | 管理员下载数据库文件（仅 SQLite 支持） |

---

## 2. 公共 API（以 `/api` 开头） 📡
| 路径 | 方法 | 参数（path / query / body） | 说明 |
|---|---:|---|---|
| `/api/chat/<int:room_id>/history` | GET | path: `room_id`; query: `limit` (int, max100), `page` 或 `offset` | 获取聊天室历史消息（支持分页或 offset） |
| `/api/chat/send` | POST | JSON or form: `room_id` (int), `message` (str) | 通过 HTTP 发送聊天消息，保存到 DB |
| `/api/chat/<int:room_id>/messages/<int:message_id>` | DELETE | path: `room_id`, `message_id` | 删除聊天室消息（权限控制） |
| `/api/chat/message/<int:message_id>` | GET | path: `message_id` | 获取单条消息详情 |
| `/api/chat/validate_quotes` | POST | JSON: `room_id`, `quote_ids`(list) | 验证引用消息是否存在于指定房间 |
| `/api/online_count` | GET | — | 获取全局在线人数（基于 last_seen） |
| `/api/random_quote` | GET | — | 返回随机名言（读取 quotes.json） |
| `/api/chat/<int:room_id>/online_count` | GET | path: `room_id` | 获取指定房间在线人数（用于轮询） |
| `/api/last_views/unread_counts` | GET | — | 返回当前用户在可访问房间/分区的未读数 |
| `/api/follows` | GET, POST | GET 无；POST JSON: `username` or `user_id` | 获取/添加关注 |
| `/api/follows/<int:followed_id>` | DELETE | path: `followed_id` | 取消关注 |
| `/api/upload/image` | POST | form-file: `file` | 上传图片，返回 `url`, `markdown`, `id` |
| `/api/upload/images` | GET | — | 列出当前用户已上传图片 |
| `/api/upload/quota` | GET | — | 获取用户上传配额信息 |
| `/api/upload/image/<int:image_id>` | DELETE | path: `image_id` | 删除图片（图片所有者或管理员） |
| `/api/admin/recalculate-upload-sizes` | POST | — | 管理接口，重新统计用户上传使用量 |
| `/api/forum/reply/<int:reply_id>` | DELETE | path: `reply_id` | 删除论坛回复（权限控制） |
| `/api/forum/thread/<int:thread_id>` | DELETE | path: `thread_id` | 删除主题帖（权限控制） |
| `/api/forum/thread/<int:thread_id>/replies` | GET | path: `thread_id`; query: `page` | 获取主题回复（分页） |
| `/api/forum/reply` | POST | form: `thread_id`, `content` | 回复主题帖 |
| `/api/follow/following` | GET | — | 获取当前用户关注的人列表 |
| `/api/follow/toggle` | POST | JSON: `user_id` | 关注或取消关注某用户 |
| `/api/search_users` | GET | query: `username` | 模糊搜索用户，最多返回20条 |

---

## 3. 管理 API（`/api/admin/...`）🔒
| 路径 | 方法 | 参数 | 说明 |
|---|---:|---|---|
| `/api/admin/forum/section-users/<int:section_id>` | GET | path: `section_id` | 列出分区用户权限（仅 admin） |
| `/api/admin/forum/sections` | GET | — | 列出所有分区（仅 admin） |
| `/api/admin/chat/rooms` | GET | — | 列出聊天室（仅 admin） |
| `/api/admin/chat/room-users/<int:room_id>` | GET | path: `room_id` | 列出聊天室用户权限（仅 admin） |
| `/api/admin/chat/section-users/<int:room_id>` | GET | path: `room_id` | 列出聊天室对应 section users（别名） |
| `/api/admin/recount-file-size` | POST | — | 遍历文件系统并重新统计文件大小（仅 admin） |
| `/api/admin/chat/rooms` | POST | JSON: `name`, `description` | 创建聊天室（仅 admin） |
| `/api/admin/chat/rooms/<int:room_id>` | PUT | path: `room_id`; JSON: `name`, `description` | 更新聊天室（仅 admin） |
| `/api/admin/chat/rooms/<int:room_id>` | DELETE | path: `room_id` | 删除聊天室（仅 admin） |
| `/api/admin/chat/messages` | DELETE | query: `room_id` (int, optional), `before` (ISO datetime) | 批量删除聊天消息（仅 admin） |
| `/api/admin/forum/sections` | POST | JSON: `name`, `description` | 创建分区（仅 admin） |
| `/api/admin/forum/sections/<int:section_id>` | PUT, DELETE | path: `section_id` | 更新 / 删除分区（仅 admin） |
| `/api/admin/forum/posts/<int:post_id>` | DELETE | path: `post_id` | 删除帖子或回复（仅 admin） |
| `/api/admin/users/<int:user_id>` | PUT, DELETE | path: `user_id`; PUT JSON: 可选 `username`, `nickname`, `color`, `badge` | 更新/删除用户（仅 admin） |
| `/api/admin/users/<int:user_id>/role` | PUT | JSON: `role` ('user'|'admin') | 修改用户角色（含超级管理员保护） |
| `/api/admin/users/<int:user_id>/permissions` | GET, PUT | GET 返回权限；PUT JSON: `scope`('chat'|'forum'), `target_id`, `perm` | 查看/设置用户权限（仅 admin） |
| `/api/admin/users` | POST | JSON: `username`, `password`, ... | 创建用户（仅 admin） |
| `/api/admin/system-info` | GET | — | 返回系统信息（仅 admin） |
| `/api/admin/clear-cache` | POST | — | 清除缓存（仅 admin） |
| `/api/admin/restart` | POST | — | 重启服务器（仅 admin） |
| `/api/admin/backup-database` | POST | — | 备份数据库文件（仅 admin） |
| `/api/admin/system-log` | GET | — | 获取系统日志（仅 admin） |
| `/api/admin/optimize-database` | POST | — | 优化数据库（VACUUM）（仅 admin） |
| `/api/admin/shutdown` | POST | JSON: `reason` | 关停服务器（仅 admin） |

---

## 4. 文件 / DB 管理（Admin）🗂️
| 路径 | 方法 | 参数 | 说明 |
|---|---:|---|---|
| `/admin/file_manager/read` | GET | query: `path` | 返回文件内容（JSON） |
| `/admin/file_manager/write` | POST | form: `path`, `content` | 写文件（带备份） |
| `/admin/db/` | GET | — | 数据库管理首页，列出表 |
| `/admin/db/table/<table_name>` | GET | path: `table_name` | 表结构视图 |
| `/admin/db/table/<table_name>/data` | GET | query: `offset`, `limit` | 返回表数据（JSON） |
| `/admin/db/table/<table_name>/edit` | POST | JSON: 包含 `id` 与要更新字段 | 编辑表记录 |
| `/admin/db/table/<table_name>/delete` | POST | JSON: `id` | 删除表记录 |

---

## 5. WebSocket（Socket.IO）事件 🔁
说明：所有事件基于 Flask-SocketIO。事件发出/接收的负载（payload）在下面给出常见字段。

| 事件名 | 触发/接收 数据字段（示例） | 描述 |
|---|---|---|
| `connect` | — | 客户端连接。服务器端会检查用户是否已认证（未认证返回 False）。同时更新 last_seen 并返回 `my_response` 回执。|
| `join` | `{ 'room': <room_id> }` | 加入聊天室（检查权限），广播 `user_join`，并更新房间在线数。|
| `leave` | `{ 'room': <room_id> }` | 离开聊天室，广播 `user_leave`，更新在线数。|
| `send_message` | `{ 'room_id': <int>, 'message': <str>, optional 'client_id', optional captcha fields }` | 处理发送消息：验证权限、验证码、速度限制、合并重复消息，保存并广播 `message`，并发送 `message_id_response` 给发送者（含 server id）。|
| `get_online_users` | `{ 'room_id': <int> }` | 返回当前房间在线用户列表（`online_users` 事件） |
| `heartbeat_chat` | `{ 'room_id': <int> }` | 聊天房间心跳，更新最后活动时间并更新房间在线数 |
| `heartbeat` | (无 / 简短心跳) | 通用心跳，更新用户 last_seen |
| `get_online_users` (HTTP对应) | — | 也存在 HTTP 轮询对应接口 `/api/chat/<room>/online_count` |

