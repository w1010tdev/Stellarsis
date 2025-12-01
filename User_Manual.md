# Stellarsis 用户手册 / User Manual

## 目录 / Table of Contents
1. [快速入门 / Quick Start](#快速入门)
2. [用户功能 / User Functions](#用户功能)
3. [聊天室功能 / Chat Room Functions](#聊天室功能)
4. [论坛功能 / Forum Functions](#论坛功能)
5. [关注系统 / Following System](#关注系统)
6. [权限系统 / Permission System](#权限系统)
7. [管理功能 / Admin Functions](#管理功能)

## 快速入门 / Quick Start

### 登录 / Login
1. 访问网站
2. 点击"登录"按钮
3. 输入用户名和密码
4. 点击"登录"完成认证

### 注册 / Registration
1. 点击"注册"按钮（如果系统支持）
2. 填写注册信息
3. 完成注册流程

## 用户功能 / User Functions

### 个人资料管理 / Profile Management
- **修改个人资料**: 在设置页面可以修改昵称、颜色和徽章
- **修改密码**: 在设置页面可以更改登录密码
- **查看个人资料**: 浏览自己的账户信息

### 设置 / Settings
- 访问路径: `/settings`
- 功能包括:
  - 个人资料修改 (`/profile`)
  - 密码修改 (`/change_password`)
  - 关注管理 (`/settings/follows`)

## 聊天室功能 / Chat Room Functions

### 加入聊天室 / Joining Chat Rooms
1. 访问 `/chat` 查看可用聊天室列表
2. 点击想要加入的聊天室
3. 根据权限进入聊天室

### 发送消息 / Sending Messages
- 在消息输入框中输入内容
- 支持Markdown格式和LaTeX数学公式
- 点击"发送"按钮发送消息

### 权限说明 / Permission Guide
- **su**: 超级用户权限，拥有所有权限
- **777**: 发送权限，可以发送消息
- **444**: 只读权限，只能查看消息
- **Null**: 无权限，无法访问

### 在线状态 / Online Status
- 页面显示当前房间在线人数
- 点击"查看在线名单"查看详细在线用户列表
- 移动端可通过"👥"按钮快速访问

## 论坛功能 / Forum Functions

### 浏览分区 / Browsing Sections
1. 访问 `/forum` 查看论坛分区列表
2. 点击分区查看该分区下的帖子

### 发布帖子 / Creating Posts
1. 进入目标分区
2. 点击"发布新帖"按钮
3. 填写标题和内容
4. 提交发布

### 回复帖子 / Replying to Posts
1. 进入具体帖子页面
2. 在回复框中输入内容
3. 点击"回复"按钮

## 关注系统 / Following System

### 关注用户 / Following Users
1. 访问 `/settings/follows` 进入关注管理页面
2. 在搜索框中输入用户名
3. 点击搜索结果中的"关注"按钮
4. 也可以在聊天室的在线用户列表中点击"+"按钮关注

### 取消关注 / Unfollowing Users
1. 在关注管理页面
2. 点击已关注用户的"取消关注"按钮

### 关注通知 / Following Notifications
- 当你关注的用户进入聊天室时，你会收到通知
- 当你关注的用户离开聊天室时，你会收到通知
- 这些通知只显示在聊天室中

## 权限系统 / Permission System

### 权限级别 / Permission Levels
- **普通用户 (user)**: 默认权限，可以访问开放区域
- **管理员 (admin)**: 拥有最高权限，可以管理所有内容

### 权限管理 / Permission Management
- 管理员可以为用户分配不同区域的权限
- 权限包括聊天室权限和论坛权限
- 管理员自动获得所有区域的su权限

## 管理功能 / Admin Functions

### 管理面板 / Admin Panel
- 访问路径: `/admin`
- 包含用户管理、内容管理等功能

### 管理操作 / Administrative Actions
- **用户管理**: 查看、编辑、删除用户
- **房间管理**: 创建、编辑、删除聊天室
- **分区管理**: 创建、编辑、删除论坛分区
- **内容管理**: 删除不当消息或帖子

## 常见问题 / FAQ

### Q: 如何更改我的昵称和颜色？
A: 访问设置页面中的"修改个人资料"功能。

### Q: 我无法发送消息怎么办？
A: 检查当前聊天室的权限设置，可能需要777或以上权限才能发送消息。

### Q: 如何查看所有在线用户？
A: 在聊天室中点击"查看在线名单"按钮。

### Q: 我的关注用户上线了为什么没有通知？
A: 确保你在聊天室中，并且关注的用户确实加入了你所在的聊天室。

## 技术支持 / Technical Support

如遇到问题，请联系系统管理员或查看系统日志。
