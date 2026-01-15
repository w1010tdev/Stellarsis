# 权限系统说明 / Permission System Documentation

本文档详细描述 Stellarsis 的四级权限系统及其实现机制。

## 概览 / Overview

Stellarsis 实现了一套灵活的四级权限系统，支持对聊天室和论坛分区进行细粒度的访问控制。

**权限级别（4 级）**:
- `su` (Super User) - 超级用户
- `777` (Read-Write) - 读写权限
- `444` (Read-Only) - 只读权限
- `Null` (No Access) - 无权限

**权限范围**:
- 聊天室权限（ChatPermission）
- 论坛分区权限（ForumPermission）

---

## 权限级别详解

### 1. su (Super User) - 超级用户

**拥有权限**:
- ✅ 查看内容
- ✅ 发送消息/发帖
- ✅ 删除他人消息/帖子
- ✅ 管理区域设置

**适用场景**:
- 管理员（自动拥有所有区域 su 权限）
- 聊天室/论坛版主

**代码常量**:
```python
CHAT_SEND_PERMISSIONS = {'su', '777'}
CHAT_VIEW_PERMISSIONS = {'su', '777', '444'}
```

---

### 2. 777 (Read-Write) - 读写权限

**拥有权限**:
- ✅ 查看内容
- ✅ 发送消息/发帖
- ❌ 删除他人内容
- ❌ 管理区域设置

**适用场景**:
- 普通活跃用户
- 已验证用户

**限制**:
- 只能删除自己的消息/帖子
- 无法修改区域设置

---

### 3. 444 (Read-Only) - 只读权限

**拥有权限**:
- ✅ 查看内容
- ❌ 发送消息/发帖
- ❌ 删除内容
- ❌ 管理区域设置

**适用场景**:
- 新注册用户
- 受限用户（被禁言但允许查看）
- 公告类只读房间/分区

**限制**:
- 无法参与讨论
- 仅能浏览历史消息和帖子

---

### 4. Null (No Access) - 无权限

**拥有权限**:
- ❌ 查看内容
- ❌ 发送消息/发帖
- ❌ 删除内容
- ❌ 管理区域设置

**适用场景**:
- 未分配权限的用户
- 私密房间/分区

**行为**:
- 无法访问该区域
- 页面会返回 403 Forbidden

---

## 权限判断流程

### 聊天室权限判断

```python
def get_chat_permission_value(user, room_id):
    """获取用户在指定聊天室的权限"""
    # 1. 未登录或无效房间
    if not user or room_id is None:
        return 'Null'
    
    # 2. 管理员自动拥有 su 权限
    if user.is_admin():
        return 'su'
    
    # 3. 查询数据库中的权限记录
    perm = db_session.query(ChatPermission)\
        .filter_by(user_id=user.id, room_id=room_id)\
        .first()
    
    # 4. 标准化权限值
    return normalize_permission_value(perm.perm) if perm else 'Null'
```

### 论坛权限判断

```python
def get_forum_permission_value(user, section_id):
    """获取用户在指定论坛分区的权限"""
    # 逻辑同聊天室权限
    if not user or section_id is None:
        return 'Null'
    if user.is_admin():
        return 'su'
    perm = db_session.query(ForumPermission)\
        .filter_by(user_id=user.id, section_id=section_id)\
        .first()
    return normalize_permission_value(perm.perm) if perm else 'Null'
```

---

## 权限检查函数

### 聊天室权限检查

```python
def user_can_view_chat(user, room_id):
    """检查用户是否有权限查看指定聊天室"""
    perm = get_chat_permission_value(user, room_id)
    return perm in CHAT_VIEW_PERMISSIONS  # {'su', '777', '444'}

def user_can_send_chat(user, room_id):
    """检查用户是否有权限发送消息到指定聊天室"""
    perm = get_chat_permission_value(user, room_id)
    return perm in CHAT_SEND_PERMISSIONS  # {'su', '777'}
```

### 论坛权限检查

```python
def user_can_view_forum(user, section_id):
    """检查用户是否有权限查看指定贴吧分区"""
    perm = get_forum_permission_value(user, section_id)
    return perm in FORUM_VIEW_PERMISSIONS  # {'su', '777', '444'}

def user_can_post_forum(user, section_id):
    """检查用户是否有权限在指定贴吧分区发帖"""
    perm = get_forum_permission_value(user, section_id)
    return perm in FORUM_POST_PERMISSIONS  # {'su', '777'}
```

---

## 权限常量定义

```python
# app.py

# 有效权限值
PERMISSION_VALUES = {'su', '777', '444', 'Null'}

# 聊天室权限集合
CHAT_SEND_PERMISSIONS = {'su', '777'}      # 可发送消息
CHAT_VIEW_PERMISSIONS = {'su', '777', '444'}  # 可查看消息

# 论坛权限集合
FORUM_POST_PERMISSIONS = {'su', '777'}     # 可发帖/回复
FORUM_VIEW_PERMISSIONS = {'su', '777', '444'} # 可查看帖子
```

---

## 权限管理 API

### 查看用户权限

**端点**: `GET /api/admin/users/<user_id>/permissions`

**响应示例**:
```json
{
  "user_id": 2,
  "username": "alice",
  "chat_permissions": [
    {"room_id": 1, "room_name": "大厅", "perm": "777"},
    {"room_id": 2, "room_name": "技术讨论", "perm": "444"}
  ],
  "forum_permissions": [
    {"section_id": 1, "section_name": "公告", "perm": "444"},
    {"section_id": 2, "section_name": "自由讨论", "perm": "777"}
  ]
}
```

### 设置用户权限

**端点**: `PUT /api/admin/users/<user_id>/permissions`

**请求体**:
```json
{
  "scope": "chat",        // 或 "forum"
  "target_id": 1,         // room_id 或 section_id
  "perm": "777"          // 新权限值
}
```

**响应**:
```json
{
  "success": true,
  "message": "权限已更新"
}
```

---

## 管理员特权

### 自动 su 权限

所有 `role = 'admin'` 的用户自动在所有区域拥有 `su` 权限：

```python
# 应用启动时执行
def grant_su_to_admins():
    """为所有管理员自动分配 su 权限"""
    admins = db_session.query(User).filter_by(role='admin').all()
    rooms = db_session.query(ChatRoom).all()
    sections = db_session.query(ForumSection).all()
    
    for admin in admins:
        # 聊天室权限
        for room in rooms:
            existing = db_session.query(ChatPermission)\
                .filter_by(user_id=admin.id, room_id=room.id).first()
            if not existing:
                db_session.add(ChatPermission(
                    user_id=admin.id, room_id=room.id, perm='su'))
            else:
                existing.perm = 'su'
        
        # 论坛权限
        for section in sections:
            existing = db_session.query(ForumPermission)\
                .filter_by(user_id=admin.id, section_id=section.id).first()
            if not existing:
                db_session.add(ForumPermission(
                    user_id=admin.id, section_id=section.id, perm='su'))
            else:
                existing.perm = 'su'
    
    db_session.commit()
```

### SU 验证系统

管理员执行高危操作时需要 SU 验证（二次密码验证）：

```python
@su_required
def dangerous_operation():
    """需要 SU 验证的操作"""
    # 文件管理、数据库操作、服务器控制等
    pass
```

**验证流程**:
1. 检查用户是否为管理员
2. 检查 session 中的 `su_expires` 是否有效（5 分钟）
3. 如果过期，重定向到 `/admin/su` 验证页面
4. 验证成功后，设置 `session['su_expires'] = time.time() + 300`

---

## 权限使用示例

### 示例 1: 聊天室访问控制

```python
@app.route('/chat/<int:room_id>')
@login_required
def chat_room(room_id):
    room = db_session.query(ChatRoom).get(room_id)
    if not room:
        abort(404)
    
    # 检查查看权限
    if not user_can_view_chat(current_user, room_id):
        flash('您没有权限访问此聊天室', 'danger')
        return redirect(url_for('chat_index'))
    
    # 获取用户权限值（用于前端显示）
    perm = get_chat_permission_value(current_user, room_id)
    
    return render_template('chat/room.html', 
                         room=room, 
                         permission=perm)
```

### 示例 2: 消息发送权限

```python
@socketio.on('send_message')
def handle_send_message(data):
    room_id = data.get('room_id')
    message = data.get('message')
    
    # 检查发送权限
    if not user_can_send_chat(current_user, room_id):
        emit('error', {'message': '您没有发送权限'})
        return
    
    # 保存并广播消息
    msg = ChatMessage(
        content=message,
        user_id=current_user.id,
        room_id=room_id
    )
    db_session.add(msg)
    db_session.commit()
    
    emit('message', {
        'id': msg.id,
        'content': msg.content,
        'username': current_user.username,
        'nickname': current_user.nickname,
        'timestamp': msg.timestamp.isoformat()
    }, room=str(room_id))
```

### 示例 3: 论坛发帖权限

```python
@app.route('/forum/new/<int:section_id>', methods=['GET', 'POST'])
@login_required
def new_thread(section_id):
    section = db_session.query(ForumSection).get(section_id)
    if not section:
        abort(404)
    
    # 检查发帖权限
    if not user_can_post_forum(current_user, section_id):
        flash('您没有发帖权限', 'danger')
        return redirect(url_for('forum_section', section_id=section_id))
    
    if request.method == 'POST':
        title = request.form.get('title')
        content = request.form.get('content')
        
        thread = ForumThread(
            title=title,
            content=content,
            user_id=current_user.id,
            section_id=section_id
        )
        db_session.add(thread)
        db_session.commit()
        
        flash('发帖成功', 'success')
        return redirect(url_for('forum_thread', thread_id=thread.id))
    
    return render_template('forum/new_post.html', section=section)
```

---

## 权限迁移场景

### 场景 1: 新建房间/分区时

新建聊天室或论坛分区后，管理员自动获得 su 权限：

```python
@app.route('/api/admin/chat/rooms', methods=['POST'])
@login_required
@su_required
def create_chat_room():
    data = request.get_json()
    room = ChatRoom(name=data['name'], description=data['description'])
    db_session.add(room)
    db_session.commit()
    
    # 为所有管理员分配 su 权限
    grant_su_to_admins()
    
    return jsonify({'success': True, 'room_id': room.id})
```

### 场景 2: 用户升级为管理员

```python
@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@login_required
@su_required
def update_user_role(user_id):
    data = request.get_json()
    new_role = data.get('role')
    
    user = db_session.query(User).get(user_id)
    user.role = new_role
    db_session.commit()
    
    # 如果升级为管理员，自动分配所有区域 su 权限
    if new_role == 'admin':
        grant_su_to_admins()
    
    return jsonify({'success': True})
```

### 场景 3: 批量设置权限

```python
# 为所有用户设置某房间的默认权限
def set_default_room_permission(room_id, default_perm='444'):
    """为所有用户设置房间默认权限"""
    users = db_session.query(User).filter_by(role='user').all()
    for user in users:
        existing = db_session.query(ChatPermission)\
            .filter_by(user_id=user.id, room_id=room_id).first()
        if not existing:
            db_session.add(ChatPermission(
                user_id=user.id, room_id=room_id, perm=default_perm))
    db_session.commit()
```

---

## 前端权限显示

### 聊天室页面

```html
<!-- templates/chat/room.html -->
<div class="permission-badge">
  {% if permission == 'su' %}
    <span class="badge badge-danger">管理员</span>
  {% elif permission == '777' %}
    <span class="badge badge-success">可发言</span>
  {% elif permission == '444' %}
    <span class="badge badge-warning">只读</span>
  {% else %}
    <span class="badge badge-secondary">无权限</span>
  {% endif %}
</div>

<!-- 根据权限控制输入框显示 -->
{% if permission in ['su', '777'] %}
  <textarea id="message-text"></textarea>
  <button onclick="sendMessage()">发送</button>
{% else %}
  <p class="text-muted">您没有发送权限</p>
{% endif %}
```

### JavaScript 权限检查

```javascript
// static/js/chat.js
let roomPermission = 'Null';  // 从后端传入

function canSendMessage() {
    return ['su', '777'].includes(roomPermission);
}

function sendMessage() {
    if (!canSendMessage()) {
        alert('您没有发送权限');
        return;
    }
    // 发送消息逻辑
}
```

---

## 常见问题

### 1. 如何为新用户设置默认权限？

在用户注册后，可以为其设置默认权限：

```python
# 新用户注册后
new_user = User(username='newuser')
db_session.add(new_user)
db_session.commit()

# 为新用户设置默认房间权限（例如公共房间）
public_rooms = [1, 2, 3]  # 公共房间 ID
for room_id in public_rooms:
    db_session.add(ChatPermission(
        user_id=new_user.id, room_id=room_id, perm='777'))
db_session.commit()
```

### 2. 如何撤销用户权限？

```python
# 撤销聊天室权限
perm = db_session.query(ChatPermission)\
    .filter_by(user_id=user_id, room_id=room_id).first()
if perm:
    perm.perm = 'Null'
    db_session.commit()
```

### 3. 如何查询某用户的所有权限？

```python
# 查询用户的所有聊天室权限
chat_perms = db_session.query(ChatPermission)\
    .filter_by(user_id=user_id).all()

for perm in chat_perms:
    print(f"Room {perm.room_id}: {perm.perm}")
```

---

## 最佳实践

1. **默认无权限**: 新用户对新建房间/分区默认无权限（Null）
2. **管理员自动 su**: 管理员始终拥有所有区域的 su 权限
3. **权限分离**: 聊天室和论坛权限独立管理
4. **谨慎使用 su**: 仅为版主和管理员分配 su 权限
5. **权限审计**: 定期检查和清理不必要的权限
6. **SU 验证**: 高危操作需要 SU 二次验证

---

**文档版本**: 1.0  
**最后更新**: 2026-01-15
