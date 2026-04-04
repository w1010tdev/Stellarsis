# Stellarsis

轻量实时聊天 + 论坛系统，后端基于 Flask + Socket.IO，前端为无构建步骤的 Vue 3 SPA。

## 亮点功能

- **四级权限体系**：`su / 777 / 444 / Null`，聊天室与论坛分区独立控制。  
- **关注通知系统**：可关注用户并接收上线/离线通知，通知自动合并避免刷屏。  
- **Markdown + LaTeX + 代码高亮**：聊天与论坛统一渲染能力。  
- **命令面板**：按 `:` 打开，支持页面跳转与主题等快捷命令。  
- **图片上传配额管理**：支持拖拽/粘贴上传，用户侧可查看与清理配额。

## 技术栈

- **后端**：Python 3.8+、Flask 3.x、Flask-SocketIO、SQLAlchemy
- **前端**：Vue 3（CDN + 本地 vendor 回退）、Element Plus、Vanilla JS SPA
- **数据库**：默认 SQLite（可通过 `DATABASE_URL` 切换）

## 快速开始

```bash
git clone https://github.com/w1010tdev/Stellarsis.git
cd Stellarsis
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

默认访问：`http://localhost:80`  
可通过 `PORT` 环境变量修改端口。

## 常用环境变量

- `STELLARSIS_ADMIN_PASSWORD`：初始化/重置默认管理员密码
- `PORT`：监听端口（默认 80）
- `DATABASE_URL`：数据库连接串
- `ENABLE_FILE_UPLOAD`：是否启用文件上传
- `ENABLE_FILE_MANAGER`：是否启用管理端文件管理（高风险）
- `ENABLE_SERVER_CONTROL`：是否启用管理端重启/关机入口（高风险）

## 生产部署（简要）

建议使用 Gunicorn + Nginx：

```bash
gunicorn -k eventlet -w 1 -b 0.0.0.0:80 "stellarsis:create_app()"
```

## 项目结构

```text
Stellarsis/
├── app.py
├── config.py
├── requirements.txt
├── static/
│   ├── spa/
│   ├── css/vendor/
│   └── js/vendor/
├── templates/
│   ├── spa.html
│   └── errors/
└── stellarsis/
    ├── routes/
    ├── models.py
    ├── events.py
    └── ...
```

## 许可证

MIT License，见 [LICENSE](LICENSE)。
