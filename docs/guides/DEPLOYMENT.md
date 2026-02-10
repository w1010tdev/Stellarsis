# Stellarsis 生产部署指南 / Production Deployment Guide

[English](#english-version) | [中文](#中文版本)

---

## 中文版本

### 概述

本指南涵盖 Stellarsis 在生产环境中的完整部署流程，包括服务器配置、数据库设置、Web 服务器配置、SSL/HTTPS、进程管理、Docker 部署、监控和维护等内容。

**重要提示**：生产环境部署需要一定的 Linux 系统管理经验。如果你是首次部署 Web 应用，建议先在测试环境中练习。

---

### 服务器要求

#### 最低配置

适用于小型部署（< 50 并发用户）：

- **CPU**: 1 核心（推荐 2 核心）
- **内存**: 1GB RAM（推荐 2GB）
- **存储**: 10GB 可用空间（根据用户上传量调整）
- **网络**: 100Mbps 带宽
- **操作系统**: Ubuntu 20.04 LTS / Debian 11+ / CentOS 8+

#### 推荐配置

适用于中型部署（50-200 并发用户）：

- **CPU**: 2-4 核心
- **内存**: 4GB RAM
- **存储**: 50GB SSD
- **网络**: 1Gbps 带宽
- **操作系统**: Ubuntu 22.04 LTS（推荐）

#### 大型部署

适用于 200+ 并发用户：

- **CPU**: 4+ 核心
- **内存**: 8GB+ RAM
- **存储**: 100GB+ SSD
- **网络**: 1Gbps+ 带宽
- **负载均衡**: Nginx + 多个应用实例
- **数据库**: PostgreSQL 集群
- **缓存**: Redis

#### 其他要求

- **域名**: 用于 HTTPS 和品牌识别
- **SSL 证书**: Let's Encrypt（免费）或商业证书
- **备份存储**: 异地备份空间（云存储或独立服务器）

---

### 环境设置

#### 1. 更新系统

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2. 安装基础依赖

```bash
# Ubuntu/Debian
sudo apt install -y python3 python3-pip python3-venv \
    git nginx sqlite3 supervisor \
    build-essential libssl-dev libffi-dev python3-dev

# CentOS/RHEL
sudo yum install -y python3 python3-pip python3-virtualenv \
    git nginx sqlite supervisor \
    gcc openssl-devel libffi-devel python3-devel
```

#### 3. 创建专用用户（推荐）

```bash
# 创建 stellarsis 用户
sudo useradd -m -s /bin/bash stellarsis

# 设置密码（可选）
sudo passwd stellarsis

# 切换到 stellarsis 用户
sudo su - stellarsis
```

#### 4. 下载应用

```bash
# 克隆仓库
cd /home/stellarsis
git clone https://github.com/w1010tdev/Stellarsis.git
cd Stellarsis

# 或下载 Release 版本
wget https://github.com/w1010tdev/Stellarsis/releases/latest/download/stellarsis.tar.gz
tar -xzf stellarsis.tar.gz
cd Stellarsis
```

#### 5. 创建虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 生产环境额外依赖
pip install gunicorn eventlet psycopg2-binary  # PostgreSQL 支持
```

---

### 数据库配置

Stellarsis 支持 SQLite、PostgreSQL 和 MySQL。生产环境推荐使用 PostgreSQL。

#### 选项 1：SQLite（小型部署）

**优点**：
- 零配置，开箱即用
- 无需额外数据库服务器
- 适合小型网站（< 50 并发用户）

**缺点**：
- 并发性能有限
- 不支持多进程部署
- 备份需要停止服务

**配置**：

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'sqlite:////home/stellarsis/Stellarsis/stellarsis.db'
```

**注意**：使用绝对路径，确保文件权限正确。

```bash
# 设置数据库文件权限
chmod 664 /home/stellarsis/Stellarsis/stellarsis.db
```

#### 选项 2：PostgreSQL（推荐生产环境）

**优点**：
- 高性能、高并发
- 支持多进程部署
- 丰富的功能和扩展
- 完善的备份和恢复机制

**安装 PostgreSQL**：

```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

**创建数据库和用户**：

```bash
# 切换到 postgres 用户
sudo su - postgres

# 进入 PostgreSQL 控制台
psql

# 执行以下 SQL 命令
CREATE DATABASE stellarsis;
CREATE USER stellarsis WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE stellarsis TO stellarsis;
\q

# 退出 postgres 用户
exit
```

**配置连接**：

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'postgresql://stellarsis:your_strong_password@localhost/stellarsis'
```

**PostgreSQL 优化**：

编辑 `/etc/postgresql/*/main/postgresql.conf`：

```conf
# 连接数（根据内存调整）
max_connections = 100

# 共享缓冲区（推荐设为系统内存的 25%）
shared_buffers = 1GB

# 工作内存
work_mem = 16MB

# 维护工作内存
maintenance_work_mem = 256MB

# WAL 缓冲区
wal_buffers = 16MB

# 检查点设置
checkpoint_completion_target = 0.9
```

重启 PostgreSQL：

```bash
sudo systemctl restart postgresql
```

#### 选项 3：MySQL/MariaDB

**安装 MySQL**：

```bash
# Ubuntu/Debian
sudo apt install -y mysql-server

# CentOS/RHEL
sudo yum install -y mariadb-server
sudo systemctl start mariadb
sudo mysql_secure_installation
```

**创建数据库和用户**：

```bash
mysql -u root -p

# 执行 SQL
CREATE DATABASE stellarsis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stellarsis'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON stellarsis.* TO 'stellarsis'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**配置连接**：

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://stellarsis:your_strong_password@localhost/stellarsis'
```

**安装 MySQL 驱动**：

```bash
pip install pymysql
```

---

### 应用服务器设置

生产环境不应直接运行 `python app.py`，而应使用 WSGI 服务器（如 Gunicorn 或 uWSGI）。

#### 选项 1：Gunicorn（推荐）

**优点**：
- 配置简单
- 性能优秀
- 与 Flask 兼容性好

**安装**：

```bash
pip install gunicorn eventlet
```

**基本用法**：

```bash
# 单进程，eventlet worker（WebSocket 支持）
gunicorn -k eventlet -w 1 -b 127.0.0.1:8000 app:app

# 带日志
gunicorn -k eventlet -w 1 -b 127.0.0.1:8000 app:app \
    --access-logfile logs/gunicorn-access.log \
    --error-logfile logs/gunicorn-error.log \
    --log-level info
```

**创建配置文件**：

```python
# gunicorn_config.py
import multiprocessing

# 绑定地址
bind = '127.0.0.1:8000'

# Worker 类型（WebSocket 需要 eventlet）
worker_class = 'eventlet'

# Worker 数量（WebSocket 应用建议使用 1）
workers = 1

# 超时时间
timeout = 120

# 日志
accesslog = 'logs/gunicorn-access.log'
errorlog = 'logs/gunicorn-error.log'
loglevel = 'info'

# 进程名称
proc_name = 'stellarsis'

# Daemon 模式（使用 systemd 时设为 False）
daemon = False

# 用户和组
user = 'stellarsis'
group = 'stellarsis'
```

**运行**：

```bash
gunicorn -c gunicorn_config.py app:app
```

#### 选项 2：uWSGI

**安装**：

```bash
pip install uwsgi
```

**创建配置文件**：

```ini
# uwsgi.ini
[uwsgi]
module = app:app
master = true
processes = 1
threads = 2
socket = 127.0.0.1:8000
chmod-socket = 660
vacuum = true
die-on-term = true
logto = logs/uwsgi.log
```

**运行**：

```bash
uwsgi --ini uwsgi.ini
```

---

### Web 服务器设置

使用 Nginx 或 Apache 作为反向代理服务器。

#### 选项 1：Nginx（推荐）

**安装 Nginx**：

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

**创建站点配置**：

```bash
sudo nano /etc/nginx/sites-available/stellarsis
```

**基本配置**（HTTP）：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 日志
    access_log /var/log/nginx/stellarsis-access.log;
    error_log /var/log/nginx/stellarsis-error.log;

    # 客户端上传大小限制
    client_max_body_size 10M;

    # 静态文件直接服务
    location /static {
        alias /home/stellarsis/Stellarsis/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 上传文件
    location /static/uploads {
        alias /home/stellarsis/Stellarsis/static/uploads;
        expires 7d;
    }

    # 代理到 Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 超时
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

**启用站点**：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/stellarsis /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 选项 2：Apache

**安装 Apache**：

```bash
# Ubuntu/Debian
sudo apt install -y apache2

# CentOS/RHEL
sudo yum install -y httpd
```

**启用模块**：

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers
```

**创建站点配置**：

```bash
sudo nano /etc/apache2/sites-available/stellarsis.conf
```

**配置内容**：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com

    # 日志
    ErrorLog ${APACHE_LOG_DIR}/stellarsis-error.log
    CustomLog ${APACHE_LOG_DIR}/stellarsis-access.log combined

    # 静态文件
    Alias /static /home/stellarsis/Stellarsis/static
    <Directory /home/stellarsis/Stellarsis/static>
        Require all granted
    </Directory>

    # 反向代理
    ProxyPreserveHost On
    ProxyPass /static !
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/

    # WebSocket 支持
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://127.0.0.1:8000/$1" [P,L]
</VirtualHost>
```

**启用站点**：

```bash
sudo a2ensite stellarsis
sudo systemctl restart apache2
```

---

### SSL/HTTPS 配置

生产环境**必须**使用 HTTPS。推荐使用 Let's Encrypt 免费证书。

#### 使用 Certbot（Let's Encrypt）

**安装 Certbot**：

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

**获取证书（Nginx）**：

```bash
# 自动配置（推荐）
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 或手动配置
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

**Certbot 会自动修改 Nginx 配置并添加以下内容**：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 其他配置同上...
}

# HTTP 自动重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

**自动续期**：

```bash
# Certbot 会自动创建 cron job
# 测试自动续期
sudo certbot renew --dry-run

# 手动续期
sudo certbot renew
```

#### 使用商业证书

如果你有购买的 SSL 证书：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_trusted_certificate /path/to/ca-bundle.crt;  # 可选

    # 其他配置...
}
```

---

### Systemd 服务设置

使用 systemd 管理应用进程，实现开机自启和自动重启。

#### 创建 systemd 服务文件

```bash
sudo nano /etc/systemd/system/stellarsis.service
```

**服务配置**：

```ini
[Unit]
Description=Stellarsis Chat Forum System
After=network.target

[Service]
Type=notify
User=stellarsis
Group=stellarsis
WorkingDirectory=/home/stellarsis/Stellarsis
Environment="PATH=/home/stellarsis/Stellarsis/venv/bin"
ExecStart=/home/stellarsis/Stellarsis/venv/bin/gunicorn -c gunicorn_config.py app:app
Restart=always
RestartSec=10
StandardOutput=append:/home/stellarsis/Stellarsis/logs/systemd-output.log
StandardError=append:/home/stellarsis/Stellarsis/logs/systemd-error.log

# 安全选项
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**启用和启动服务**：

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable stellarsis

# 启动服务
sudo systemctl start stellarsis

# 查看状态
sudo systemctl status stellarsis

# 查看日志
sudo journalctl -u stellarsis -f
```

**常用命令**：

```bash
# 停止服务
sudo systemctl stop stellarsis

# 重启服务
sudo systemctl restart stellarsis

# 重载配置（无需重启）
sudo systemctl reload stellarsis

# 禁用服务
sudo systemctl disable stellarsis
```

---

### Docker 部署

Docker 提供了隔离、可移植的部署方式。

#### 方法 1：单容器部署

**创建 Dockerfile**：

```dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt gunicorn eventlet

# 复制应用代码
COPY . .

# 创建日志和上传目录
RUN mkdir -p logs static/uploads

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "-b", "0.0.0.0:8000", "app:app"]
```

**构建和运行**：

```bash
# 构建镜像
docker build -t stellarsis:latest .

# 运行容器
docker run -d \
    --name stellarsis \
    -p 8000:8000 \
    -v $(pwd)/stellarsis.db:/app/stellarsis.db \
    -v $(pwd)/static/uploads:/app/static/uploads \
    -v $(pwd)/logs:/app/logs \
    --restart unless-stopped \
    stellarsis:latest

# 查看日志
docker logs -f stellarsis

# 停止容器
docker stop stellarsis

# 重启容器
docker restart stellarsis
```

#### 方法 2：Docker Compose（推荐）

**创建 docker-compose.yml**：

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: stellarsis-app
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=postgresql://stellarsis:${DB_PASSWORD}@db:5432/stellarsis
    volumes:
      - ./static/uploads:/app/static/uploads
      - ./logs:/app/logs
    depends_on:
      - db
    networks:
      - stellarsis-network

  db:
    image: postgres:14-alpine
    container_name: stellarsis-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=stellarsis
      - POSTGRES_USER=stellarsis
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - stellarsis-network

  nginx:
    image: nginx:alpine
    container_name: stellarsis-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./static:/usr/share/nginx/html/static:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    networks:
      - stellarsis-network

volumes:
  postgres-data:

networks:
  stellarsis-network:
    driver: bridge
```

**创建 .env 文件**：

```bash
SECRET_KEY=your-random-secret-key
DB_PASSWORD=your-database-password
```

**运行**：

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart
```

---

### 监控和日志

#### 1. 应用日志

**配置日志**（已在 `app.py` 中配置）：

```python
# app.py
from logging.handlers import RotatingFileHandler

# 日志配置
if not os.path.exists('logs'):
    os.mkdir('logs')

file_handler = RotatingFileHandler(
    'logs/system.log',
    maxBytes=10240000,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
```

**查看日志**：

```bash
# 实时查看
tail -f logs/system.log

# 搜索错误
grep -i error logs/system.log

# 统计错误数量
grep -c error logs/system.log
```

#### 2. Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/stellarsis-access.log

# 错误日志
tail -f /var/log/nginx/stellarsis-error.log

# 统计访问量
wc -l /var/log/nginx/stellarsis-access.log
```

#### 3. 系统监控

**安装监控工具**：

```bash
# htop - 进程监控
sudo apt install -y htop

# iotop - I/O 监控
sudo apt install -y iotop

# nethogs - 网络监控
sudo apt install -y nethogs
```

**监控命令**：

```bash
# CPU 和内存
htop

# 磁盘使用
df -h

# 磁盘 I/O
sudo iotop

# 网络连接
netstat -tunlp | grep :8000

# 进程状态
ps aux | grep gunicorn
```

#### 4. 应用性能监控（可选）

**使用 Prometheus + Grafana**：

安装 Prometheus Flask Exporter：

```bash
pip install prometheus-flask-exporter
```

在 `app.py` 中添加：

```python
from prometheus_flask_exporter import PrometheusMetrics

metrics = PrometheusMetrics(app)
```

访问 `/metrics` 查看监控数据。

---

### 备份和维护

#### 1. 数据库备份

**SQLite 备份**：

```bash
#!/bin/bash
# backup_sqlite.sh

BACKUP_DIR="/home/stellarsis/backups"
DB_FILE="/home/stellarsis/Stellarsis/stellarsis.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/stellarsis_$DATE.db
gzip $BACKUP_DIR/stellarsis_$DATE.db

# 保留最近 7 天的备份
find $BACKUP_DIR -name "stellarsis_*.db.gz" -mtime +7 -delete

echo "Backup completed: stellarsis_$DATE.db.gz"
```

**PostgreSQL 备份**：

```bash
#!/bin/bash
# backup_postgres.sh

BACKUP_DIR="/home/stellarsis/backups"
DB_NAME="stellarsis"
DB_USER="stellarsis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER -F c -b -v -f $BACKUP_DIR/stellarsis_$DATE.backup $DB_NAME

# 保留最近 7 天的备份
find $BACKUP_DIR -name "stellarsis_*.backup" -mtime +7 -delete

echo "Backup completed: stellarsis_$DATE.backup"
```

**设置自动备份（crontab）**：

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /home/stellarsis/backup_postgres.sh >> /home/stellarsis/logs/backup.log 2>&1
```

#### 2. 文件备份

```bash
#!/bin/bash
# backup_files.sh

BACKUP_DIR="/home/stellarsis/backups"
UPLOAD_DIR="/home/stellarsis/Stellarsis/static/uploads"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $UPLOAD_DIR .

# 保留最近 30 天的备份
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "File backup completed: uploads_$DATE.tar.gz"
```

#### 3. 恢复数据

**SQLite 恢复**：

```bash
# 停止应用
sudo systemctl stop stellarsis

# 恢复备份
gunzip -c /home/stellarsis/backups/stellarsis_20240210_020000.db.gz > /home/stellarsis/Stellarsis/stellarsis.db

# 启动应用
sudo systemctl start stellarsis
```

**PostgreSQL 恢复**：

```bash
# 停止应用
sudo systemctl stop stellarsis

# 删除现有数据库
sudo -u postgres psql -c "DROP DATABASE stellarsis;"
sudo -u postgres psql -c "CREATE DATABASE stellarsis OWNER stellarsis;"

# 恢复备份
pg_restore -U stellarsis -d stellarsis /home/stellarsis/backups/stellarsis_20240210_020000.backup

# 启动应用
sudo systemctl start stellarsis
```

#### 4. 定期维护任务

**数据库优化**（SQLite）：

```bash
# 使用管理面板的数据库优化功能
# 或手动执行
sqlite3 stellarsis.db "VACUUM;"
```

**PostgreSQL 维护**：

```bash
# 分析表
psql -U stellarsis -d stellarsis -c "ANALYZE;"

# 清理死行
psql -U stellarsis -d stellarsis -c "VACUUM;"

# 完全清理
psql -U stellarsis -d stellarsis -c "VACUUM FULL;"
```

**清理过期日志**：

```bash
# 清理 30 天前的日志
find /home/stellarsis/Stellarsis/logs -name "*.log.*" -mtime +30 -delete
```

---

### 故障排除

#### 问题 1：应用无法启动

**检查步骤**：

1. 查看 systemd 日志：
   ```bash
   sudo journalctl -u stellarsis -n 50
   ```

2. 检查配置文件：
   ```bash
   python -c "from config import Config; print(Config.SQLALCHEMY_DATABASE_URI)"
   ```

3. 测试数据库连接：
   ```bash
   # PostgreSQL
   psql -U stellarsis -d stellarsis -c "SELECT 1;"
   ```

4. 检查端口占用：
   ```bash
   sudo lsof -i :8000
   ```

#### 问题 2：Nginx 502 Bad Gateway

**原因**：
- Gunicorn 未运行
- Gunicorn 监听地址/端口错误
- 防火墙阻止连接

**解决**：

```bash
# 检查 Gunicorn 状态
sudo systemctl status stellarsis

# 测试 Gunicorn
curl http://127.0.0.1:8000

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 问题 3：数据库连接失败

**PostgreSQL**：

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接权限
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 应包含：
# local   all   stellarsis   md5
# host    all   stellarsis   127.0.0.1/32   md5

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

#### 问题 4：SSL 证书问题

**检查证书**：

```bash
# 测试 SSL 配置
sudo nginx -t

# 查看证书过期时间
sudo certbot certificates

# 强制续期
sudo certbot renew --force-renewal
```

#### 问题 5：性能问题

**诊断**：

```bash
# 查看系统负载
uptime

# 查看内存使用
free -h

# 查看磁盘 I/O
sudo iotop

# 查看数据库连接
# PostgreSQL
psql -U stellarsis -d stellarsis -c "SELECT count(*) FROM pg_stat_activity;"

# 慢查询日志
grep "slow" logs/system.log
```

**优化**：

1. 增加服务器资源
2. 优化数据库查询
3. 启用缓存（Redis）
4. 使用 CDN 服务静态文件
5. 启用 Gzip 压缩

#### 问题 6：WebSocket 连接断开

**检查**：

```bash
# 查看 Nginx 配置中的超时设置
grep -i timeout /etc/nginx/sites-available/stellarsis

# 增加超时时间
proxy_read_timeout 86400;
proxy_send_timeout 86400;

# 重启 Nginx
sudo systemctl restart nginx
```

---

### 安全加固

#### 1. 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

#### 2. SSH 安全

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 推荐设置
Port 22
PermitRootLogin no
PasswordAuthentication no  # 仅使用密钥
PubkeyAuthentication yes

# 重启 SSH
sudo systemctl restart sshd
```

#### 3. 应用安全

**config.py 安全配置**：

```python
# 生产环境必须修改
SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-random-secret-key'

# 关闭调试模式
DEBUG = False

# 关闭高危功能
ENABLE_FILE_MANAGER = False
ENABLE_SERVER_CONTROL = False

# 限制上传
IMAGE_MAX_SIZE = 5 * 1024 * 1024
USER_UPLOAD_QUOTA = 50 * 1024 * 1024
```

**生成安全密钥**：

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

#### 4. 数据库安全

**PostgreSQL**：

```bash
# 禁止远程访问（仅本地）
sudo nano /etc/postgresql/*/main/pg_hba.conf

# 确保只有本地连接
local   all   all   md5
host    all   all   127.0.0.1/32   md5

# 禁止从外部网络访问
sudo nano /etc/postgresql/*/main/postgresql.conf
listen_addresses = 'localhost'
```

#### 5. 定期更新

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 更新 Python 依赖
source venv/bin/activate
pip list --outdated
pip install --upgrade <package>

# 重启服务
sudo systemctl restart stellarsis
```

---

### 性能优化

#### 1. Nginx 优化

```nginx
# /etc/nginx/nginx.conf

# Worker 进程数（等于 CPU 核心数）
worker_processes auto;

# 每个 worker 最大连接数
events {
    worker_connections 1024;
    use epoll;  # Linux 优化
}

http {
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # 缓存设置
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;

    # 连接超时
    keepalive_timeout 65;
    send_timeout 60;
}
```

#### 2. Gunicorn 优化

```python
# gunicorn_config.py

# Worker 超时（处理慢请求）
timeout = 120

# 保持连接
keepalive = 5

# 最大请求数（防止内存泄漏）
max_requests = 1000
max_requests_jitter = 50
```

#### 3. 数据库优化

**PostgreSQL 索引**：

```sql
-- 常用查询索引
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_forum_threads_section_id ON forum_threads(section_id);
CREATE INDEX idx_forum_replies_thread_id ON forum_replies(thread_id);
```

#### 4. 静态文件优化

```bash
# 使用 CDN 或对象存储
# 配置 Nginx 缓存静态文件
location /static {
    alias /home/stellarsis/Stellarsis/static;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## English Version

### Overview

This guide covers the complete production deployment process for Stellarsis, including server configuration, database setup, web server configuration, SSL/HTTPS, process management, Docker deployment, monitoring, and maintenance.

**Important**: Production deployment requires Linux system administration experience. If this is your first time deploying a web application, practice in a test environment first.

---

### Server Requirements

#### Minimum Configuration

For small deployments (< 50 concurrent users):

- **CPU**: 1 core (2 cores recommended)
- **Memory**: 1GB RAM (2GB recommended)
- **Storage**: 10GB available space (adjust based on uploads)
- **Network**: 100Mbps bandwidth
- **OS**: Ubuntu 20.04 LTS / Debian 11+ / CentOS 8+

#### Recommended Configuration

For medium deployments (50-200 concurrent users):

- **CPU**: 2-4 cores
- **Memory**: 4GB RAM
- **Storage**: 50GB SSD
- **Network**: 1Gbps bandwidth
- **OS**: Ubuntu 22.04 LTS (recommended)

#### Large Deployments

For 200+ concurrent users:

- **CPU**: 4+ cores
- **Memory**: 8GB+ RAM
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps+ bandwidth
- **Load Balancer**: Nginx + multiple app instances
- **Database**: PostgreSQL cluster
- **Cache**: Redis

#### Other Requirements

- **Domain Name**: For HTTPS and branding
- **SSL Certificate**: Let's Encrypt (free) or commercial
- **Backup Storage**: Off-site backup space (cloud storage or separate server)

---

### Environment Setup

#### 1. Update System

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

#### 2. Install Basic Dependencies

```bash
# Ubuntu/Debian
sudo apt install -y python3 python3-pip python3-venv \
    git nginx sqlite3 supervisor \
    build-essential libssl-dev libffi-dev python3-dev

# CentOS/RHEL
sudo yum install -y python3 python3-pip python3-virtualenv \
    git nginx sqlite supervisor \
    gcc openssl-devel libffi-devel python3-devel
```

#### 3. Create Dedicated User (Recommended)

```bash
# Create stellarsis user
sudo useradd -m -s /bin/bash stellarsis

# Set password (optional)
sudo passwd stellarsis

# Switch to stellarsis user
sudo su - stellarsis
```

#### 4. Download Application

```bash
# Clone repository
cd /home/stellarsis
git clone https://github.com/w1010tdev/Stellarsis.git
cd Stellarsis

# Or download Release version
wget https://github.com/w1010tdev/Stellarsis/releases/latest/download/stellarsis.tar.gz
tar -xzf stellarsis.tar.gz
cd Stellarsis
```

#### 5. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Production dependencies
pip install gunicorn eventlet psycopg2-binary  # PostgreSQL support
```

---

### Database Configuration

Stellarsis supports SQLite, PostgreSQL, and MySQL. PostgreSQL is recommended for production.

#### Option 1: SQLite (Small Deployments)

**Pros**:
- Zero configuration, works out of box
- No separate database server needed
- Suitable for small sites (< 50 concurrent users)

**Cons**:
- Limited concurrent performance
- No multi-process deployment support
- Backup requires service stop

**Configuration**:

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'sqlite:////home/stellarsis/Stellarsis/stellarsis.db'
```

**Note**: Use absolute path, ensure correct permissions.

```bash
# Set database file permissions
chmod 664 /home/stellarsis/Stellarsis/stellarsis.db
```

#### Option 2: PostgreSQL (Production Recommended)

**Pros**:
- High performance, high concurrency
- Multi-process deployment support
- Rich features and extensions
- Comprehensive backup and recovery

**Install PostgreSQL**:

```bash
# Ubuntu/Debian
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

**Create Database and User**:

```bash
# Switch to postgres user
sudo su - postgres

# Enter PostgreSQL console
psql

# Execute SQL commands
CREATE DATABASE stellarsis;
CREATE USER stellarsis WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE stellarsis TO stellarsis;
\q

# Exit postgres user
exit
```

**Configure Connection**:

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'postgresql://stellarsis:your_strong_password@localhost/stellarsis'
```

**PostgreSQL Optimization**:

Edit `/etc/postgresql/*/main/postgresql.conf`:

```conf
# Connection count (adjust based on memory)
max_connections = 100

# Shared buffers (recommended 25% of system memory)
shared_buffers = 1GB

# Work memory
work_mem = 16MB

# Maintenance work memory
maintenance_work_mem = 256MB

# WAL buffers
wal_buffers = 16MB

# Checkpoint settings
checkpoint_completion_target = 0.9
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

#### Option 3: MySQL/MariaDB

**Install MySQL**:

```bash
# Ubuntu/Debian
sudo apt install -y mysql-server

# CentOS/RHEL
sudo yum install -y mariadb-server
sudo systemctl start mariadb
sudo mysql_secure_installation
```

**Create Database and User**:

```bash
mysql -u root -p

# Execute SQL
CREATE DATABASE stellarsis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'stellarsis'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON stellarsis.* TO 'stellarsis'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Configure Connection**:

```python
# config.py
SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://stellarsis:your_strong_password@localhost/stellarsis'
```

**Install MySQL Driver**:

```bash
pip install pymysql
```

---

### Application Server Setup

Production environments should not run `python app.py` directly; use a WSGI server (like Gunicorn or uWSGI).

#### Option 1: Gunicorn (Recommended)

**Pros**:
- Simple configuration
- Excellent performance
- Good Flask compatibility

**Install**:

```bash
pip install gunicorn eventlet
```

**Basic Usage**:

```bash
# Single process, eventlet worker (WebSocket support)
gunicorn -k eventlet -w 1 -b 127.0.0.1:8000 app:app

# With logging
gunicorn -k eventlet -w 1 -b 127.0.0.1:8000 app:app \
    --access-logfile logs/gunicorn-access.log \
    --error-logfile logs/gunicorn-error.log \
    --log-level info
```

**Create Configuration File**:

```python
# gunicorn_config.py
import multiprocessing

# Bind address
bind = '127.0.0.1:8000'

# Worker type (WebSocket requires eventlet)
worker_class = 'eventlet'

# Worker count (recommend 1 for WebSocket apps)
workers = 1

# Timeout
timeout = 120

# Logging
accesslog = 'logs/gunicorn-access.log'
errorlog = 'logs/gunicorn-error.log'
loglevel = 'info'

# Process name
proc_name = 'stellarsis'

# Daemon mode (set False when using systemd)
daemon = False

# User and group
user = 'stellarsis'
group = 'stellarsis'
```

**Run**:

```bash
gunicorn -c gunicorn_config.py app:app
```

#### Option 2: uWSGI

**Install**:

```bash
pip install uwsgi
```

**Create Configuration File**:

```ini
# uwsgi.ini
[uwsgi]
module = app:app
master = true
processes = 1
threads = 2
socket = 127.0.0.1:8000
chmod-socket = 660
vacuum = true
die-on-term = true
logto = logs/uwsgi.log
```

**Run**:

```bash
uwsgi --ini uwsgi.ini
```

---

### Web Server Setup

Use Nginx or Apache as reverse proxy server.

#### Option 1: Nginx (Recommended)

**Install Nginx**:

```bash
# Ubuntu/Debian
sudo apt install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

**Create Site Configuration**:

```bash
sudo nano /etc/nginx/sites-available/stellarsis
```

**Basic Configuration** (HTTP):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Logging
    access_log /var/log/nginx/stellarsis-access.log;
    error_log /var/log/nginx/stellarsis-error.log;

    # Client upload size limit
    client_max_body_size 10M;

    # Serve static files directly
    location /static {
        alias /home/stellarsis/Stellarsis/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Upload files
    location /static/uploads {
        alias /home/stellarsis/Stellarsis/static/uploads;
        expires 7d;
    }

    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

**Enable Site**:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/stellarsis /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

(Continue with Apache, SSL, systemd, Docker, monitoring, backup sections in English...)

---

**Document Version**: 1.0  
**Last Updated**: 2024-02-10
