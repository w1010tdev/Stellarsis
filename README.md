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
PORT=5000 python app.py
```

推荐开发访问：`http://localhost:5000`  
应用端口默认由 `PORT` 控制（默认值 80）；开发环境建议显式使用 `PORT=5000`，生产按实际网络与权限配置端口（可使用 80）。

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

### systemd service（保留）

仓库提供了 `stellarsis.service` 示例，可按需链接到系统目录：

```bash
sudo ln -sf "$(pwd)/stellarsis.service" /etc/systemd/system/stellarsis.service
sudo systemctl daemon-reload
sudo systemctl enable stellarsis
sudo systemctl start stellarsis
```

> 请根据你的部署路径与用户权限修改 service 文件中的配置。

## 从旧版升级（v1 -> v2）

如果你是从旧版单文件结构升级，请先备份数据库并执行迁移脚本：

```bash
cp stellarsis.db stellarsis_backup.db
python migrate_to_v2.py
export STELLARSIS_ADMIN_PASSWORD="your_secure_password"
python app.py
```

说明：
- `migrate_to_v2.py` 会补齐必要字段/权限表，并为 admin 同步 `su` 权限。
- 若数据库路径不在默认位置，可传参：`python migrate_to_v2.py /path/to/stellarsis.db`。

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
