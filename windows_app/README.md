# Stellarsis Windows App (Electron)

一个用于 Stellarsis 聊天论坛系统的 Windows/macOS/Linux 桌面客户端应用。

使用 Electron 构建，采用 Material Design 风格界面。

## 功能

- 🔐 用户登录/登出
- 📬 WebSocket 实时消息推送
- 🔔 系统通知（新消息提醒）
- 🖥️ 系统托盘运行

## 安装依赖

```bash
npm install
```

## 运行开发版本

```bash
npm start
```

## 打包发布版本

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# 所有平台
npm run build
```

打包后的文件将在 `dist` 目录下。

## 配置服务器地址

在登录页面底部可以配置服务器地址，默认为 `http://localhost:5000`。

## 项目结构

```
windows_app/
├── main.js              # Electron 主进程
├── preload.js           # 预加载脚本（安全桥接）
├── package.json         # 项目配置
├── renderer/            # 渲染进程（前端）
│   ├── login.html       # 登录页面
│   ├── login.js         # 登录逻辑
│   ├── main.html        # 主页面
│   ├── main.js          # 主页逻辑（含 WebSocket）
│   └── styles.css       # Material Design 样式
├── assets/              # 资源文件
│   └── icon.png         # 应用图标
└── README.md            # 说明文档
```

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **Socket.IO Client** - WebSocket 实时通信
- **Material Components Web** - Material Design 组件库

## WebSocket 事件

应用使用以下 WebSocket 事件：

- `get_unread_notifications` - 请求未读消息数
- `unread_notifications` - 接收未读消息数据
- `new_message_notification` - 接收新消息通知
- `heartbeat` - 心跳保活

## 使用说明

1. 运行程序，进入登录界面
2. 配置服务器地址（如需要）
3. 输入 Stellarsis 账号的用户名和密码
4. 登录成功后，WebSocket 连接服务器
5. 当有新消息时，会发送系统通知
6. 关闭窗口时，程序最小化到系统托盘

## 许可证

MIT License
