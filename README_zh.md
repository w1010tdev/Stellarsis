# Stellarsis - 群星议会

Stellarsis（群星议会）是一个功能丰富的在线社区平台，集成了聊天、论坛、用户管理等多种功能。该系统为用户提供了一个安全、高效、可扩展的交流环境，支持多房间聊天、分区论坛、用户关注等功能。

## 功能总览

详细功能说明请参见我们的 [Wiki](wiki_zh.md) (中文) 或 [Wiki](wiki.md) (English)。

## 技术架构

- **后端**：Python Flask 框架
- **数据库**：SQLite
- **实时通信**：Flask-SocketIO
- **前端**：HTML/CSS/JavaScript
- **模板引擎**：Jinja2

## 安装与部署

1. 克隆项目到本地
2. 安装依赖：`pip install -r requirements.txt`
3. 运行应用：`python app.py`
4. 访问 `http://localhost:5000`

## 默认账户

- **用户名**：admin
- **密码**：admin123（首次运行时自动创建）

## 开发与维护

系统具有良好的扩展性，支持：

- 新功能模块的添加
- 权限系统的扩展
- 前端界面的定制
- 数据库结构的升级
