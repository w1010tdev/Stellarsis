# Stellarsis Windows App

一个用于 Stellarsis 聊天论坛系统的 Windows 桌面客户端应用。

## 功能

- 🔐 用户登录/登出
- 📬 获取未读消息通知
- 🔔 Windows 系统通知（新消息提醒）
- 🖥️ 系统托盘运行

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行

```bash
python main.py
```

或者双击 `run.bat` (Windows)

## 配置

在 `config.py` 中修改 `SERVER_URL` 为你的服务器地址：

```python
SERVER_URL = "http://localhost:5000"
```

## 打包为可执行文件

使用 PyInstaller 打包：

```bash
pip install pyinstaller
pyinstaller --onefile --windowed --icon=icon.ico main.py
```

打包后的 `.exe` 文件将在 `dist` 目录下。

## 项目结构

```
windows_app/
├── main.py              # 主程序入口
├── config.py            # 配置文件
├── api.py               # API 服务
├── ui/
│   ├── login_window.py  # 登录窗口
│   └── main_window.py   # 主窗口
├── utils/
│   ├── token_manager.py # Token 管理
│   └── notification.py  # 通知工具
├── requirements.txt     # 依赖列表
├── run.bat              # Windows 运行脚本
└── README.md            # 说明文档
```

## API 接口

应用使用以下后端 API：

- `POST /api/auth/login` - 登录获取 token
- `POST /api/auth/logout` - 登出
- `GET /api/auth/validate` - 验证 token
- `GET /api/notifications/unread` - 获取未读消息数

## 使用说明

1. 运行程序，进入登录界面
2. 输入 Stellarsis 账号的用户名和密码
3. 登录成功后，程序会定期检查未读消息
4. 当有新消息时，会发送 Windows 系统通知
5. 程序可以最小化到系统托盘

## 许可证

MIT License
