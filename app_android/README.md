# Stellarsis Android App

一个用于 Stellarsis 聊天论坛系统的 Android 客户端应用。

## 功能

- 🔐 用户登录/登出
- 📬 获取未读消息通知
- 🔔 推送通知（新消息提醒）

## 项目结构

```
app_android/
├── app/
│   ├── src/main/
│   │   ├── java/com/stellarsis/app/
│   │   │   ├── MainActivity.kt          # 主活动
│   │   │   ├── LoginActivity.kt          # 登录界面
│   │   │   ├── api/
│   │   │   │   └── ApiService.kt         # API 服务
│   │   │   ├── models/
│   │   │   │   └── Models.kt             # 数据模型
│   │   │   ├── utils/
│   │   │   │   ├── TokenManager.kt       # Token 管理
│   │   │   │   └── NotificationHelper.kt # 通知工具
│   │   │   └── services/
│   │   │       └── NotificationService.kt # 通知服务
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

1. 在 `app/src/main/java/com/stellarsis/app/api/ApiService.kt` 中修改 `BASE_URL` 为你的服务器地址

2. 构建并安装应用

## 依赖

- Kotlin
- Retrofit2 (网络请求)
- OkHttp3 (HTTP 客户端)
- Gson (JSON 解析)
- AndroidX (兼容库)
- WorkManager (后台任务)

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

## API 接口

应用使用以下后端 API：

- `POST /api/auth/login` - 登录获取 token
- `POST /api/auth/logout` - 登出
- `GET /api/auth/validate` - 验证 token
- `GET /api/notifications/unread` - 获取未读消息数

## 使用说明

1. 首次启动应用，进入登录界面
2. 输入 Stellarsis 账号的用户名和密码
3. 登录成功后，应用会定期检查未读消息
4. 当有新消息时，会发送系统通知

## 许可证

MIT License
