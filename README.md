# Stellarsis 聊天论坛系统 / Stellarsis Chat Forum System

## 项目概述 / Project Overview

Stellarsis (群星议会) 是一个功能丰富的实时聊天和论坛系统，结合了聊天室和论坛功能，支持用户关注、权限管理、实时消息通知等高级功能。

Stellarsis is a feature-rich real-time chat and forum system that combines chat rooms and forum functions, supporting advanced features such as user following, permission management, and real-time message notifications.

## 核心特性 / Core Features

### 独特功能 / Unique Features

1. **用户关注系统 (User Following System)**
   - 用户可以关注其他用户，实时接收关注用户的上线/离线通知
   - 在聊天室中能看到关注用户加入或离开的通知

2. **智能在线状态 (Smart Online Status)**
   - 实时显示在线用户列表
   - 支持全局在线人数统计
   - 基于最后活动时间的在线状态判断

3. **高级权限管理 (Advanced Permission Management)**
   - 聊天室权限：su(超级用户), 777(发送权限), 444(只读权限), Null(无权限)
   - 论坛权限：同样支持多级权限控制
   - 管理员自动获得所有区域的最高权限

4. **Markdown和LaTeX支持 (Markdown and LaTeX Support)**
   - 聊天消息和论坛帖子支持Markdown格式
   - 支持LaTeX数学公式渲染

5. **多房间聊天系统 (Multi-Room Chat System)**
   - 支持多个独立的聊天室
   - 用户可以自由切换聊天室
   - 每个房间有独立的权限设置

6. **多样式适配 (Multi-themes Support)**
   - 提供大量的样式可供选择
   - 可以通过命令或者设置修改

7. **命令面板 (Command Plaette)**
   - 通过命令快捷操作
   - 良好的兼容性

### 基础功能 / Basic Features

1. **用户认证系统 (User Authentication System)**
   - 用户注册/登录
   - 密码修改
   - 个人资料管理

2. **论坛系统 (Forum System)**
   - 创建/删除分区
   - 发布/回复帖子
   - 帖子管理

3. **聊天功能 (Chat Functions)**
   - 实时消息发送
   - 消息历史记录
   - 用户昵称和颜色设置

4. **管理后台 (Admin Panel)**
   - 用户管理
   - 房间管理
   - 内容管理

## 技术栈 / Tech Stack

- **后端**: Python Flask
- **实时通信**: Flask-SocketIO
- **数据库**: SQLite
- **前端**: HTML/CSS/JavaScript
- **实时消息**: WebSocket (降级到轮询)

## 安装与部署 / Installation and Deployment

1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

2. 运行应用：
   ```bash
   python app.py
   ```

3. 访问 `http://localhost:5000`

## 默认账户 / Default Account

- 用户名: `admin`
- 密码: `admin123`

## 许可证 / License

MIT License

## 上传图片 / Image Upload
系统默认启用了用户图片上传功能，配置可通过 `config.py` 修改：

- `UPLOAD_FOLDER`：文件保存目录，默认 `static/uploads`。
- `ALLOWED_IMAGE_EXTENSIONS`：允许的图片扩展名列表，默认 `{'png', 'jpg', 'jpeg', 'gif', 'webp'}`。
- `IMAGE_MAX_SIZE`：单张图片最大大小（字节），默认值为 5MB。

前端上传接口： `POST /api/upload/image`（multipart/form-data, 字段 `file`），返回 JSON 包含 `url` 和 `markdown` 字段，便于复制与插入。
