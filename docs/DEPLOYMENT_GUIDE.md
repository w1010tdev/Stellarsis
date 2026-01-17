# Stellarsis 部署指南

本指南提供了 Stellarsis 聊天论坛系统的完整部署说明，包括服务端部署、Android 客户端编译以及 Windows 客户端（Electron）编译。

## 目录

1. [服务端部署（后端）](#1-服务端部署后端)
   - [环境要求](#环境要求)
   - [克隆仓库](#克隆仓库)
   - [创建虚拟环境](#创建虚拟环境)
   - [安装依赖](#安装依赖)
   - [配置服务端](#配置服务端)
   - [启动服务端](#启动服务端)
   - [生产环境部署](#生产环境部署)
2. [Android 客户端编译](#2-android-客户端编译)
   - [环境要求](#环境要求-1)
   - [安装 Android Studio](#安装-android-studio)
   - [打开项目](#打开项目)
   - [配置服务器地址](#配置服务器地址)
   - [编译 APK](#编译-apk)
   - [安装到设备](#安装到设备)
3. [Windows 客户端编译（Electron）](#3-windows-客户端编译electron)
   - [环境要求](#环境要求-2)
   - [安装依赖](#安装依赖-1)
   - [配置服务器地址](#配置服务器地址-1)
   - [开发模式运行](#开发模式运行)
   - [打包为可执行文件](#打包为可执行文件)
4. [配置客户端连接服务端](#4-配置客户端连接服务端)
   - [确保服务端可访问](#确保服务端可访问)
   - [WebSocket 配置](#websocket-配置)
   - [HTTPS 配置](#https-配置)
5. [常见问题（FAQ）](#5-常见问题faq)
6. [更多资源](#6-更多资源)

---

## 1. 服务端部署（后端）

### 环境要求

- **Python**: 3.7 或更高版本
- **操作系统**: Linux、macOS 或 Windows
- **依赖包管理**: pip
- **可选**: 
  - PostgreSQL 或 MySQL（用于生产环境，默认使用 SQLite）
  - Nginx（用于生产环境反向代理）
  - Gunicorn（用于生产环境 WSGI 服务器）

### 克隆仓库

```bash
# 克隆主仓库
git clone https://github.com/w1010tdev/Stellarsis.git
cd Stellarsis

# 查看当前分支
git branch
```

**注意**: Android 和 Windows 客户端代码已集成在主分支的 `app_android` 和 `windows_app` 目录中。

### 创建虚拟环境

#### Linux / macOS

```bash
# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 确认 Python 版本
python --version
```

#### Windows

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 确认 Python 版本
python --version
```

### 安装依赖

#### 使用国内镜像（推荐，加速下载）

```bash
# 清华大学镜像
pip install -r requirements.txt -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple

# 阿里云镜像（备选）
pip install -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# 中国科技大学镜像（备选）
pip install -r requirements.txt -i https://pypi.mirrors.ustc.edu.cn/simple/
```

#### 不使用镜像

```bash
pip install -r requirements.txt
```

#### 离线安装包

如果因网络问题无法在线安装，可以下载离线安装包：

- **下载地址**: https://pan.huang1111.cn/s/zMm6ZcM
- 下载后运行 `Scripts` 内的 `activate.bat` 激活虚拟环境

### 配置服务端

#### 配置 config.py

编辑 `config.py` 文件以修改配置：

```python
# config.py
class Config:
    # 密钥配置（生产环境必须修改）
    SECRET_KEY = 'your-secret-key-here'  # 请使用强随机密钥
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = 'sqlite:///stellarsis.db'  # SQLite（开发）
    # SQLALCHEMY_DATABASE_URI = 'postgresql://user:pass@localhost/stellarsis'  # PostgreSQL（生产）
    
    # 调试模式（生产环境必须关闭）
    DEBUG = True  # 开发：True，生产：False
    
    # 在线超时时间（秒）
    ONLINE_TIMEOUT = 30
    
    # Socket.IO 异步模式
    SOCKETIO_ASYNC_MODE = 'eventlet'
    
    # 图片上传配置
    UPLOAD_FOLDER = 'static/uploads'
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 5MB
    USER_UPLOAD_QUOTA = 50 * 1024 * 1024  # 50MB
    
    # 文件上传配置（可选，默认关闭）
    ENABLE_FILE_UPLOAD = False
    ALLOWED_FILE_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'zip', 'md'}
    FILE_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    
    # 管理面板高级功能（生产环境建议关闭）
    ENABLE_FILE_MANAGER = False  # 文件管理器
    ENABLE_SERVER_CONTROL = False  # 服务器控制（重启/关闭）
```

#### 配置 .env 文件（可选）

创建 `.env` 文件以使用环境变量配置：

```bash
# .env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///stellarsis.db
UPLOAD_FOLDER=static/uploads
ENABLE_FILE_MANAGER=False
ENABLE_SERVER_CONTROL=False
DEBUG=False
```

**安全提示**:
- 生产环境必须修改 `SECRET_KEY` 为强随机密钥
- 生产环境必须将 `DEBUG` 设置为 `False`
- 建议禁用 `ENABLE_FILE_MANAGER` 和 `ENABLE_SERVER_CONTROL`

### 启动服务端

#### 开发模式

```bash
# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# 启动服务器
python app.py

# 或使用启动脚本（Linux/Mac）
bash start.sh
```

服务器将在 `http://0.0.0.0:5000` 上运行。

#### 访问应用

- **本地访问**: http://localhost:5000
- **局域网访问**: http://YOUR-IP:5000
- **默认管理员账户**:
  - 用户名: `admin`
  - 密码: `admin123`

**⚠️ 首次登录后请立即修改默认密码！**

### 生产环境部署

#### 方案一：使用 Gunicorn + Nginx

##### 1. 安装 Gunicorn 和 Eventlet

```bash
pip install gunicorn eventlet
```

##### 2. 启动 Gunicorn

```bash
# 基本启动
gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app

# 后台运行（使用 nohup）
nohup gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app > gunicorn.log 2>&1 &

# 或使用 systemd 服务（推荐）
```

**注意**: 
- `-k eventlet` 指定使用 eventlet worker（支持 WebSocket）
- `-w 1` 指定单个 worker（eventlet 不支持多 worker）

##### 3. 创建 systemd 服务（推荐）

创建 `/etc/systemd/system/stellarsis.service`:

```ini
[Unit]
Description=Stellarsis Chat Forum System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Stellarsis
Environment="PATH=/path/to/Stellarsis/venv/bin"
ExecStart=/path/to/Stellarsis/venv/bin/gunicorn -k eventlet -w 1 -b 0.0.0.0:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start stellarsis
sudo systemctl enable stellarsis  # 开机自启
sudo systemctl status stellarsis  # 查看状态
```

##### 4. 配置 Nginx 反向代理

创建 Nginx 配置文件 `/etc/nginx/sites-available/stellarsis`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名

    # 客户端最大上传大小
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件直接由 Nginx 服务（可选，提升性能）
    location /static/ {
        alias /path/to/Stellarsis/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/stellarsis /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

##### 5. 配置 HTTPS（Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置 Nginx
sudo certbot --nginx -d your-domain.com

# 证书自动续期
sudo certbot renew --dry-run
```

#### 方案二：使用 Docker（可选）

##### 创建 Dockerfile

```dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["python", "app.py"]
```

##### 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  stellarsis:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./stellarsis.db:/app/stellarsis.db
      - ./static/uploads:/app/static/uploads
    environment:
      - SECRET_KEY=your-secret-key-here
      - DEBUG=False
    restart: unless-stopped
```

##### 运行

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## 2. Android 客户端编译

### 环境要求

- **Android Studio**: 最新稳定版（建议 Arctic Fox 或更高版本）
- **JDK**: 11 或更高版本
- **Android SDK**: 
  - SDK Platform: Android 8.0 (API 26) 或更高
  - Build Tools: 30.0.0 或更高
- **Gradle**: 7.0+ （Android Studio 自带）
- **操作系统**: Windows、macOS 或 Linux

### 安装 Android Studio

#### Windows

1. 访问 [Android Studio 官网](https://developer.android.com/studio)
2. 下载 Windows 版本的安装包
3. 运行安装程序，按照向导安装
4. 首次启动时，下载必要的 SDK 组件

#### macOS

```bash
# 使用 Homebrew 安装（推荐）
brew install --cask android-studio

# 或从官网下载 DMG 文件安装
```

#### Linux (Ubuntu/Debian)

```bash
# 下载官方 tar.gz 包
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/[VERSION]/android-studio-[VERSION]-linux.tar.gz

# 解压
tar -xzf android-studio-*-linux.tar.gz

# 移动到 /opt
sudo mv android-studio /opt/

# 启动
/opt/android-studio/bin/studio.sh
```

**国内镜像加速（可选）**:

在 Android Studio 中配置国内镜像：

1. 打开 `File` → `Settings` → `Appearance & Behavior` → `System Settings` → `HTTP Proxy`
2. 或编辑 `~/.gradle/gradle.properties` (Linux/Mac) 或 `C:\Users\YourName\.gradle\gradle.properties` (Windows):

```properties
# 阿里云镜像
systemProp.http.proxyHost=mirrors.aliyun.com
systemProp.http.proxyPort=80
systemProp.https.proxyHost=mirrors.aliyun.com
systemProp.https.proxyPort=443
```

或修改项目的 `build.gradle` 使用国内 Maven 仓库：

```gradle
allprojects {
    repositories {
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/jcenter' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        google()
        mavenCentral()
    }
}
```

### 打开项目

1. 启动 Android Studio
2. 选择 `Open an Existing Project`
3. 导航到 Stellarsis 仓库的 `app_android` 目录
4. 点击 `OK` 打开项目
5. 等待 Gradle 同步完成（首次同步可能需要较长时间）

**Gradle 同步失败解决方法**:
- 检查网络连接
- 使用国内镜像（见上文）
- 清除 Gradle 缓存: `File` → `Invalidate Caches / Restart`
- 手动下载依赖: `./gradlew build --refresh-dependencies`

### 配置服务器地址

编辑 `app/src/main/java/com/stellarsis/app/api/ApiClient.kt`:

```kotlin
object ApiClient {
    // 修改为你的服务器地址
    private const val BASE_URL = "http://your-server-ip:5000/"
    
    // 或使用域名
    // private const val BASE_URL = "https://your-domain.com/"
    
    // ...
}
```

**注意**:
- 如果服务器使用 HTTPS，URL 应以 `https://` 开头
- 如果在局域网测试，使用服务器的局域网 IP 地址
- 确保 Android 设备可以访问该地址

### 编译 APK

#### 编译 Debug 版本

##### 使用 Android Studio

1. 点击 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 等待编译完成
3. 点击通知中的 `locate` 查看生成的 APK
4. APK 位置: `app/build/outputs/apk/debug/app-debug.apk`

##### 使用命令行

```bash
# 进入 app_android 目录
cd app_android

# 清理并构建
./gradlew clean assembleDebug

# 生成的 APK 位置
# app/build/outputs/apk/debug/app-debug.apk
```

#### 编译 Release 版本（签名）

##### 1. 生成密钥库

```bash
keytool -genkey -v -keystore stellarsis.keystore -alias stellarsis -keyalg RSA -keysize 2048 -validity 10000
```

按提示输入密钥库密码和密钥信息。

##### 2. 配置签名

编辑 `app/build.gradle`:

```gradle
android {
    // ...
    
    signingConfigs {
        release {
            storeFile file("../stellarsis.keystore")
            storePassword "your-keystore-password"
            keyAlias "stellarsis"
            keyPassword "your-key-password"
        }
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

**安全提示**: 不要将密钥库文件和密码提交到版本控制系统。

##### 3. 构建 Release APK

```bash
# 使用命令行
./gradlew assembleRelease

# 生成的 APK 位置
# app/build/outputs/apk/release/app-release.apk
```

### 安装到设备

#### 使用 ADB (Android Debug Bridge)

```bash
# 确保设备已连接并启用 USB 调试
adb devices

# 安装 APK
adb install app/build/outputs/apk/debug/app-debug.apk

# 或安装 Release 版本
adb install app/build/outputs/apk/release/app-release.apk

# 覆盖安装（保留数据）
adb install -r app-debug.apk
```

#### 直接在设备上安装

1. 将 APK 文件传输到 Android 设备
2. 在设备上打开文件管理器
3. 点击 APK 文件
4. 允许安装未知来源应用（如提示）
5. 按照提示完成安装

#### 使用 Android Studio 直接运行

1. 连接 Android 设备或启动模拟器
2. 点击工具栏的 `Run` 按钮（绿色三角形）
3. 选择目标设备
4. 应用将自动安装并运行

---

## 3. Windows 客户端编译（Electron）

### 环境要求

- **Node.js**: 16.x 或更高版本（建议使用 LTS 版本）
- **npm**: 7.x 或更高版本（随 Node.js 安装）
- **或 yarn**: 1.22.x 或更高版本
- **操作系统**: Windows、macOS 或 Linux

### 安装 Node.js

#### Windows

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本安装包
3. 运行安装程序，按照向导安装
4. 验证安装:

```bash
node --version
npm --version
```

#### macOS

```bash
# 使用 Homebrew（推荐）
brew install node

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
```

#### Linux (Ubuntu/Debian)

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 安装依赖

进入 `windows_app` 目录并安装依赖：

```bash
# 进入 windows_app 目录
cd windows_app

# 使用 npm 安装
npm install

# 或使用 yarn
yarn install
```

#### 使用国内镜像（可选，加速下载）

##### npm 镜像配置

```bash
# 使用淘宝镜像（npmmirror）
npm config set registry https://registry.npmmirror.com

# 或单次使用镜像
npm install --registry=https://registry.npmmirror.com

# 恢复默认镜像
npm config set registry https://registry.npmjs.org
```

##### yarn 镜像配置

```bash
# 使用淘宝镜像
yarn config set registry https://registry.npmmirror.com

# 恢复默认
yarn config set registry https://registry.yarnpkg.com
```

##### 使用 cnpm（备选）

```bash
# 安装 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com

# 使用 cnpm 安装依赖
cnpm install
```

### 配置服务器地址

Windows 客户端支持在登录界面配置服务器地址，默认为 `http://localhost:5000`。

如需修改默认地址，编辑 `renderer/login.js`:

```javascript
// renderer/login.js

// 默认服务器地址
const DEFAULT_SERVER_URL = 'http://your-server-ip:5000';

// 或使用域名
// const DEFAULT_SERVER_URL = 'https://your-domain.com';
```

**注意**: 用户可在登录页面底部手动修改服务器地址，配置会保存到本地存储。

### 开发模式运行

```bash
# 确保在 windows_app 目录下
cd windows_app

# 启动开发模式
npm start

# 或使用 yarn
yarn start
```

应用窗口将打开，可以进行测试和调试。

**开发提示**:
- 按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (macOS) 打开开发者工具
- 修改代码后需要重启应用查看更改

### 打包为可执行文件

#### 打包所有平台

```bash
npm run build

# 或使用 yarn
yarn build
```

#### 打包特定平台

```bash
# Windows 可执行文件
npm run build:win

# macOS 应用
npm run build:mac

# Linux AppImage
npm run build:linux
```

#### 打包输出

打包后的文件位于 `dist` 目录:

```
windows_app/dist/
├── Stellarsis Setup 1.0.0.exe        # Windows 安装程序
├── Stellarsis-1.0.0.dmg              # macOS 磁盘映像
└── Stellarsis-1.0.0.AppImage         # Linux AppImage
```

#### 自定义打包配置

编辑 `package.json` 中的 `build` 部分:

```json
{
  "build": {
    "appId": "com.stellarsis.desktop",
    "productName": "Stellarsis",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns",
      "category": "public.app-category.social-networking"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png",
      "category": "Network"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

#### 跨平台打包注意事项

- **在 Windows 上**: 可以打包 Windows 和 Linux 版本，无法打包 macOS 版本
- **在 macOS 上**: 可以打包所有平台
- **在 Linux 上**: 可以打包 Windows 和 Linux 版本，无法打包 macOS 版本

#### npm install 卡住解决方法

如果 `npm install` 长时间无响应：

```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 使用镜像重新安装
npm install --registry=https://registry.npmmirror.com

# 或使用 --verbose 查看详细进度
npm install --verbose

# 或增加超时时间
npm install --fetch-timeout=60000
```

---

## 4. 配置客户端连接服务端

### 确保服务端可访问

#### 监听地址配置

确保服务端监听 `0.0.0.0` 而不是 `127.0.0.1`，以允许外部连接。

编辑 `app.py` 最后一行:

```python
# app.py
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    #                      ^^^^^^^^^^
    #                      监听所有网络接口
```

#### 防火墙配置

##### Linux (UFW)

```bash
# 允许端口 5000
sudo ufw allow 5000/tcp

# 查看防火墙状态
sudo ufw status
```

##### Linux (iptables)

```bash
# 允许端口 5000
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT

# 保存规则
sudo iptables-save > /etc/iptables/rules.v4
```

##### Windows 防火墙

```powershell
# 管理员权限运行 PowerShell
New-NetFirewallRule -DisplayName "Stellarsis Server" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

或通过图形界面:
1. 打开 `控制面板` → `系统和安全` → `Windows Defender 防火墙`
2. 点击 `高级设置`
3. 选择 `入站规则` → `新建规则`
4. 选择 `端口`，输入 `5000`，允许连接

#### 云服务器安全组配置

如果使用云服务器（阿里云、腾讯云、AWS 等），需要在安全组中开放端口:

1. 登录云服务商控制台
2. 进入实例的安全组设置
3. 添加入站规则:
   - 协议: TCP
   - 端口: 5000
   - 来源: 0.0.0.0/0 (或指定 IP 范围)

#### 测试连接

```bash
# 从客户端机器测试服务器是否可达
curl http://your-server-ip:5000

# 或使用 telnet 测试端口
telnet your-server-ip 5000

# Windows 使用
Test-NetConnection -ComputerName your-server-ip -Port 5000
```

### WebSocket 配置

#### 服务端配置

确保 Socket.IO 正确配置，编辑 `app.py`:

```python
from flask_socketio import SocketIO
from flask_cors import CORS

# 启用 CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# 配置 Socket.IO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",  # 生产环境应限制为特定域名
    async_mode='eventlet',
    logger=True,
    engineio_logger=True
)
```

**生产环境配置**:

```python
# 限制 CORS 来源
CORS(app, resources={r"/*": {"origins": ["https://your-domain.com"]}})

socketio = SocketIO(
    app,
    cors_allowed_origins=["https://your-domain.com"],
    async_mode='eventlet'
)
```

#### 客户端配置

客户端会自动处理 WebSocket 连接，如果 WebSocket 不可用会降级到轮询模式。

### HTTPS 配置

生产环境强烈建议使用 HTTPS 保护数据传输。

#### Nginx 反向代理（推荐）

创建或编辑 Nginx 配置:

```nginx
# /etc/nginx/sites-available/stellarsis-ssl

server {
    listen 80;
    server_name your-domain.com;
    
    # HTTP 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 客户端最大上传大小
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # 超时设置（WebSocket 长连接）
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;  # 5分钟
    }
    
    # 静态文件直接服务（可选）
    location /static/ {
        alias /path/to/Stellarsis/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置:

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/stellarsis-ssl /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

#### Let's Encrypt SSL 证书

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书（自动配置 Nginx）
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run

# 查看证书状态
sudo certbot certificates
```

证书有效期为 90 天，Certbot 会自动续期。

#### 使用自签名证书（仅测试）

```bash
# 生成自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/stellarsis-selfsigned.key \
  -out /etc/ssl/certs/stellarsis-selfsigned.crt

# 在 Nginx 配置中使用
ssl_certificate /etc/ssl/certs/stellarsis-selfsigned.crt;
ssl_certificate_key /etc/ssl/private/stellarsis-selfsigned.key;
```

**注意**: 自签名证书会在浏览器中显示警告，仅用于测试环境。

---

## 5. 常见问题（FAQ）

### Python 依赖安装相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `pip install` 速度慢或超时 | 网络问题或 PyPI 源速度慢 | 使用国内镜像: `pip install -r requirements.txt -i https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple` |
| `No module named 'eventlet'` | 依赖未正确安装 | 重新安装: `pip install eventlet` |
| `Microsoft Visual C++ 14.0 is required` (Windows) | 缺少 C++ 编译器 | 下载并安装 [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| 虚拟环境激活失败 | 路径或权限问题 | Windows: `venv\Scripts\activate.bat`<br>Linux/Mac: `source venv/bin/activate` |
| `pip: command not found` | pip 未安装或不在 PATH 中 | 安装 pip: `python -m ensurepip --upgrade`<br>或使用 `python -m pip` 代替 `pip` |

### Android Gradle 同步相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Gradle 同步失败或超时 | 网络问题，无法下载依赖 | 1. 使用国内镜像（见上文配置）<br>2. 清除缓存: `File` → `Invalidate Caches / Restart`<br>3. 手动同步: `./gradlew build --refresh-dependencies` |
| `SDK location not found` | Android SDK 路径未配置 | 创建 `local.properties` 文件，添加:<br>`sdk.dir=/path/to/Android/sdk` |
| `Could not find com.android.tools.build:gradle:X.X.X` | Gradle 插件版本不匹配 | 检查 `build.gradle` 中的 Gradle 插件版本是否与 Android Studio 版本兼容 |
| JDK 版本不匹配 | 项目需要特定 JDK 版本 | `File` → `Project Structure` → `SDK Location`，选择 JDK 11 或更高版本 |
| 编译时内存不足 | Gradle 内存分配不足 | 编辑 `gradle.properties`，添加:<br>`org.gradle.jvmargs=-Xmx2048m` |

### npm install 相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `npm install` 卡住不动 | 网络问题或 npm 源慢 | 1. 使用国内镜像: `npm install --registry=https://registry.npmmirror.com`<br>2. 清除缓存: `npm cache clean --force`<br>3. 删除 `node_modules` 和 `package-lock.json` 后重新安装 |
| `EACCES: permission denied` | 权限不足 | 不要使用 `sudo npm install`，修复 npm 权限:<br>`sudo chown -R $USER /usr/local/lib/node_modules` |
| `gyp ERR! build error` | 缺少编译工具 | Windows: 安装 `npm install --global windows-build-tools`<br>Linux: `sudo apt install build-essential`<br>macOS: 安装 Xcode Command Line Tools |
| 依赖版本冲突 | package-lock.json 冲突 | 删除 `package-lock.json` 和 `node_modules`，重新 `npm install` |
| Electron 下载失败 | 网络问题 | 设置 Electron 镜像:<br>`npm config set electron_mirror https://npmmirror.com/mirrors/electron/` |

### WebSocket 连接相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| WebSocket 连接失败 | 防火墙、网络或配置问题 | 1. 检查服务器防火墙是否开放端口<br>2. 检查服务器监听 `0.0.0.0` 而非 `127.0.0.1`<br>3. 检查 CORS 配置<br>4. 系统会自动降级到轮询模式 |
| `ERR_CONNECTION_REFUSED` | 服务器未启动或地址错误 | 1. 确认服务器已启动: `netstat -an \| grep 5000`<br>2. 检查客户端配置的服务器地址是否正确<br>3. 测试连接: `curl http://server-ip:5000` |
| CORS 错误 | 跨域请求被阻止 | 服务端启用 CORS:<br>`CORS(app, resources={r"/*": {"origins": "*"}})` |
| WebSocket 频繁断线 | 代理或网络不稳定 | 1. 使用 Nginx 反向代理<br>2. 增加超时时间<br>3. 启用心跳机制（已内置） |
| 443 端口 WebSocket 失败 | HTTPS 配置问题 | 确保 Nginx 正确配置 WebSocket 升级:<br>`proxy_set_header Upgrade $http_upgrade;`<br>`proxy_set_header Connection "upgrade";` |

### 客户端登录相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 客户端无法登录 | 服务器地址错误或服务器未运行 | 1. 检查服务器地址配置<br>2. 确认服务器已启动<br>3. 测试网络连接: `ping server-ip`<br>4. 检查用户名和密码是否正确 |
| 登录后立即退出 | Token 验证失败 | 1. 清除客户端存储数据<br>2. 检查服务器日志<br>3. 确认 SECRET_KEY 配置正确 |
| Android 客户端白屏 | WebView 加载失败 | 1. 检查服务器地址<br>2. 查看 Logcat 日志<br>3. 启用 WebView 调试 |
| Windows 客户端无响应 | Electron 渲染进程崩溃 | 1. 打开开发者工具查看错误<br>2. 检查控制台日志<br>3. 重新安装应用 |
| 密码错误但确认正确 | 密码哈希方式改变 | 使用管理员账户重置密码，或直接修改数据库 |

### 服务器运行相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `Address already in use` | 端口被占用 | 1. 查找占用进程: `lsof -i :5000` (Linux/Mac)<br>2. 杀死进程: `kill -9 <PID>`<br>3. 或更改端口 |
| 数据库锁定错误 | SQLite 并发访问限制 | 生产环境迁移到 PostgreSQL 或 MySQL |
| 文件上传失败 | 权限或配额问题 | 1. 检查 `static/uploads` 目录权限<br>2. 检查用户上传配额<br>3. 检查磁盘空间 |
| 服务器崩溃或重启 | 未捕获的异常 | 1. 查看日志: `logs/system.log`<br>2. 使用 systemd 或 supervisord 自动重启<br>3. 检查内存使用情况 |
| Gunicorn 启动失败 | Worker 类型错误 | 必须使用 eventlet worker: `gunicorn -k eventlet -w 1 app:app` |

### 部署和性能相关

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 页面加载缓慢 | 未优化配置 | 1. 使用 Nginx 缓存静态文件<br>2. 启用 gzip 压缩<br>3. 使用 CDN<br>4. 优化数据库查询 |
| 内存占用过高 | SQLite 缓存或未清理的连接 | 1. 定期 VACUUM 数据库<br>2. 迁移到 PostgreSQL<br>3. 限制并发连接数 |
| SSL 证书错误 | 证书过期或配置错误 | 1. 检查证书有效期: `sudo certbot certificates`<br>2. 手动续期: `sudo certbot renew`<br>3. 检查 Nginx 配置 |
| 日志文件过大 | 日志轮转未生效 | 应用已配置日志轮转（10MB），检查 `logs/system.log.*` 备份文件 |

---

## 6. 更多资源

### 项目链接

- **GitHub 仓库**: [https://github.com/w1010tdev/Stellarsis](https://github.com/w1010tdev/Stellarsis)
- **主分支**: [https://github.com/w1010tdev/Stellarsis/tree/main](https://github.com/w1010tdev/Stellarsis/tree/main)
- **Release 下载**: [https://github.com/w1010tdev/Stellarsis/releases](https://github.com/w1010tdev/Stellarsis/releases)

### 客户端目录

Android 和 Windows 客户端已集成在主分支中：

- **Android 客户端**: [app_android/](https://github.com/w1010tdev/Stellarsis/tree/main/app_android)
- **Windows 客户端**: [windows_app/](https://github.com/w1010tdev/Stellarsis/tree/main/windows_app)

### 文档

- **README**: [README.md](../README.md)
- **API 文档**: [docs/ROUTES_AND_WEBSOCKETS.md](ROUTES_AND_WEBSOCKETS.md)
- **数据库架构**: [docs/DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **权限系统**: [docs/PERMISSION_SYSTEM.md](PERMISSION_SYSTEM.md)
- **命令面板**: [docs/COMMAND_PALETTE.md](COMMAND_PALETTE.md)
- **Markdown & LaTeX**: [docs/Markdown_LaTeX_Quickstart.md](Markdown_LaTeX_Quickstart.md)

### 相关技术文档

#### Python / Flask
- [Flask 官方文档](https://flask.palletsprojects.com/)
- [Flask-SocketIO 文档](https://flask-socketio.readthedocs.io/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)

#### Android 开发
- [Android 开发者文档](https://developer.android.com/docs)
- [Kotlin 官方文档](https://kotlinlang.org/docs/home.html)
- [Gradle 用户指南](https://docs.gradle.org/current/userguide/userguide.html)

#### Electron 开发
- [Electron 官方文档](https://www.electronjs.org/docs/latest)
- [Electron Builder 文档](https://www.electron.build/)
- [Socket.IO Client 文档](https://socket.io/docs/v4/client-api/)

### 社区支持

- **Issues**: [GitHub Issues](https://github.com/w1010tdev/Stellarsis/issues)
- **Discussions**: 如有问题或建议，欢迎在 Issues 中讨论

### 贡献

欢迎提交 Issue 和 Pull Request！详见 [README.md](../README.md) 中的贡献指南。

---

**文档版本**: 1.0  
**最后更新**: 2026-01-17  
**适用版本**: Stellarsis 2.0+

如有问题或建议，请访问 [GitHub Issues](https://github.com/w1010tdev/Stellarsis/issues)。
