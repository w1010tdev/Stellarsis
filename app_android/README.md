# Stellarsis Android App

一个用于 Stellarsis 聊天论坛系统的 Android 客户端应用。

采用 Material Design 风格界面，使用 WebSocket 实现实时消息推送。

## 功能

- 🔐 用户登录/登出
- 📬 WebSocket 实时消息推送
- 🔔 系统通知（新消息提醒）
- 🎨 Material Design 界面

## 项目结构

```
app_android/
├── app/
│   ├── src/main/
│   │   ├── java/com/stellarsis/app/
│   │   │   ├── MainActivity.kt          # 主活动（WebSocket 通信）
│   │   │   ├── LoginActivity.kt          # 登录界面
│   │   │   ├── api/
│   │   │   │   ├── ApiService.kt         # REST API 服务
│   │   │   │   ├── ApiClient.kt          # API 客户端
│   │   │   │   └── SocketManager.kt      # WebSocket 管理器
│   │   │   ├── models/
│   │   │   │   └── Models.kt             # 数据模型
│   │   │   ├── utils/
│   │   │   │   ├── TokenManager.kt       # Token 管理
│   │   │   │   └── NotificationHelper.kt # 通知工具
│   │   │   └── services/
│   │   │       ├── NotificationWorker.kt # 后台通知检查
│   │   │       └── BootReceiver.kt       # 开机启动接收器
│   │   ├── res/
│   │   │   ├── layout/                   # 布局文件
│   │   │   ├── values/                   # 资源值
│   │   │   └── drawable/                 # 图标资源
│   │   └── AndroidManifest.xml           # 应用清单
│   └── build.gradle                      # 模块构建配置
├── build.gradle                          # 项目构建配置
├── settings.gradle                       # 设置文件
└── gradle.properties                     # Gradle 属性
```

## 配置

1. 在 `app/src/main/java/com/stellarsis/app/api/ApiClient.kt` 中修改 `BASE_URL` 为你的服务器地址

2. 构建并安装应用

## 依赖

- Kotlin
- Retrofit2 (REST API 请求)
- Socket.IO Client (WebSocket 通信)
- OkHttp3 (HTTP 客户端)
- Gson (JSON 解析)
- AndroidX (兼容库)
- WorkManager (后台任务备用)

## 构建

```bash
# 使用 Android Studio 打开项目
# 或使用命令行
./gradlew assembleDebug
```

## 安装 APK

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 通信方式

### WebSocket 事件

应用主要使用 WebSocket 进行实时通信：

- `get_unread_notifications` - 请求未读消息数
- `unread_notifications` - 接收未读消息数据
- `new_message_notification` - 接收新消息通知
- `heartbeat` - 心跳保活

### REST API (登录/登出)

- `POST /api/auth/login` - 登录获取 token
- `POST /api/auth/logout` - 登出

## 使用说明

1. 首次启动应用，进入登录界面
2. 输入 Stellarsis 账号的用户名和密码
3. 登录成功后，WebSocket 自动连接服务器
4. 实时接收新消息通知
5. 当应用在后台时，会发送系统通知

## 许可证

MIT License
