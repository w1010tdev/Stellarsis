# app.py
import os
import time
import json
import sys
import shutil
import threading
from datetime import datetime, timedelta
from pathlib import Path
import sqlite3
import logging
from flask import (
    Flask, render_template, request, redirect, url_for, 
    flash, session, send_from_directory, send_file, jsonify, abort,
    make_response
)
from flask import __version__ as flask_version
from werkzeug.utils import secure_filename
try:
    from PIL import Image
except Exception:
    Image = None
import tempfile
import zipfile
from flask_login import (
    LoginManager, UserMixin, login_user, 
    logout_user, current_user, login_required
)
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField
from wtforms.validators import DataRequired, Length, EqualTo, Regexp
from flask_socketio import SocketIO, emit, join_room, leave_room
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship
from markupsafe import escape, Markup
import re
import html
from flask_cors import CORS
from logging.handlers import RotatingFileHandler
# 配置
from config import Config
# ----------
# 初始化
# ----------

# 初始化应用
app = Flask(__name__)
app.config.from_object(Config)
# 创建logs目录
log_dir = Path(app.root_path) / 'logs'
log_dir.mkdir(exist_ok=True)

# 创建上传目录
upload_dir = Path(app.root_path) / app.config.get('UPLOAD_FOLDER', 'static/uploads')
upload_dir.mkdir(parents=True, exist_ok=True)

# 配置日志
try:
    log_file = log_dir / 'system.log'
    
    # 确保新日志使用UTF-8
    handler = RotatingFileHandler(
        log_file, 
        maxBytes=10*1024*1024,  # 10 MB
        backupCount=5,
        encoding='utf-8'  # 关键：强制使用UTF-8编码
    )
    
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    logger = logging.getLogger('stellarsis')
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)
except Exception as e:
    print(f"配置日志失败: {str(e)}")
    # 备用方案
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger('stellarsis')

# 初始化数据库
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
Base = declarative_base()
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
app.teardown_appcontext(lambda exc: db_session.remove())

# 初始化Socket.IO
socketio = SocketIO(app, async_mode=app.config['SOCKETIO_ASYNC_MODE'], cors_allowed_origins='*')

# 简单的内存结构用于跟踪用户发送速度与验证码
# 键：captcha_id -> {'answer': int, 'expires': float, 'user_id': int, 'pending': dict}
captcha_store = {}
# 键：user_id -> last_send_time (float seconds)
last_send_times = {}
captcha_lock = threading.Lock()

# 初始化登录管理
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# ----------
# 模型定义
# ----------

# 模型定义
class User(UserMixin, Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, index=True)
    password_hash = Column(String(128))
    nickname = Column(String(64), default='')
    color = Column(String(7), default='#000000')
    badge = Column(String(32), default='')
    last_seen = Column(DateTime, default=datetime.utcnow)
    role = Column(String(20), default='user')  # 新增权限字段：user, admin
    
    def is_admin(self):
        """检查用户是否为管理员"""
        return self.role == 'admin'
    
    def set_password(self, password):
        # 实际应用中应使用安全的哈希算法
        # 这里仅演示，实际应使用werkzeug.security.generate_password_hash
        self.password_hash = password #Need to change
    
    def check_password(self, password):
        return self.password_hash == password

class ChatRoom(Base):
    __tablename__ = 'chat_rooms'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    description = Column(Text)

class ChatMessage(Base):
    __tablename__ = 'chat_messages'
    
    id = Column(Integer, primary_key=True)
    content = Column(Text)  # 只存储原始Markdown
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    room_id = Column(Integer, ForeignKey('chat_rooms.id'))
    
    user = relationship('User', backref='chat_messages')
    room = relationship('ChatRoom', backref='messages')

class ForumSection(Base):
    __tablename__ = 'forum_sections'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    description = Column(Text)

class ForumThread(Base):
    __tablename__ = 'forum_threads'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(128))
    content = Column(Text)  # 只存储原始Markdown
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    section_id = Column(Integer, ForeignKey('forum_sections.id'))
    
    user = relationship('User', backref='forum_threads')
    section = relationship('ForumSection', backref='threads')
    replies = relationship('ForumReply', backref='thread', lazy='dynamic')

class ForumReply(Base):
    __tablename__ = 'forum_replies'
    
    id = Column(Integer, primary_key=True)
    content = Column(Text)  # 只存储原始Markdown
    timestamp = Column(DateTime, index=True, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    thread_id = Column(Integer, ForeignKey('forum_threads.id'))
    
    user = relationship('User', backref='forum_replies')


class ChatPermission(Base):
    __tablename__ = 'chat_permissions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    perm = Column(String(10), default='Null')  # su, 777, 444, Null

    user = relationship('User', backref='chat_permissions')
    room = relationship('ChatRoom')


class ForumPermission(Base):
    __tablename__ = 'forum_permissions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('forum_sections.id'), nullable=False)
    perm = Column(String(10), default='Null')  # su, 777, 444, Null

    user = relationship('User', backref='forum_permissions')
    section = relationship('ForumSection')

class UserFollow(Base):
    __tablename__ = 'user_follows'
    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # 关注者
    followed_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # 被关注者
    created_at = Column(DateTime, default=datetime.utcnow)

    follower = relationship('User', foreign_keys=[follower_id], backref='following')
    followed = relationship('User', foreign_keys=[followed_id], backref='followers')

# 记录用户最后查看时间的表：聊天室与贴吧分区
class ChatLastView(Base):
    __tablename__ = 'chat_last_views'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    last_view = Column(DateTime, default=datetime.utcnow)

    user = relationship('User')
    room = relationship('ChatRoom')


class ForumLastView(Base):
    __tablename__ = 'forum_last_views'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('forum_sections.id'), nullable=False)
    last_view = Column(DateTime, default=datetime.utcnow)

    user = relationship('User')
    section = relationship('ForumSection')

class UserImage(Base):
    __tablename__ = 'user_images'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    filename = Column(String(255), nullable=False)  # 存储文件名
    filepath = Column(String(512), nullable=False)  # 存储完整路径
    file_size = Column(Integer, nullable=False)  # 文件大小（字节）
    upload_time = Column(DateTime, default=datetime.utcnow)  # 上传时间
    file_type = Column(String(50), nullable=False)  # 文件类型

    user = relationship('User', backref='images')

Base.metadata.create_all(bind=engine)


PERMISSION_VALUES = {'su', '777', '444', 'Null'}
CHAT_SEND_PERMISSIONS = {'su', '777'}
CHAT_VIEW_PERMISSIONS = {'su', '777', '444'}
FORUM_POST_PERMISSIONS = {'su', '777'}
FORUM_VIEW_PERMISSIONS = {'su', '777', '444'}


def normalize_permission_value(value):
    """标准化权限值，返回 su/777/444/Null 之一"""
    if value is None:
        return 'Null'
    value_str = str(value).strip()
    lower = value_str.lower()
    if lower == 'su':
        return 'su'
    if value_str in ('777', '444'):
        return value_str
    if lower == 'null':
        return 'Null'
    return None


def get_chat_permission_value(user, room_id):
    """获取用户在指定聊天室的权限"""
    # 明确只对 None 做空值判断，避免 0 或者其他可判断值被错误当作空
    if not user or room_id is None:
        return 'Null'
    if user.is_admin():
        return 'su'
    perm = db_session.query(ChatPermission).filter_by(user_id=user.id, room_id=room_id).first()
    # 规范化权限值以避免数据库中存储格式差异导致的比较失败
    return normalize_permission_value(perm.perm) if perm else 'Null'


def get_forum_permission_value(user, section_id):
    """获取用户在指定贴吧分区的权限"""
    # 明确只对 None 做空值判断，避免 0 或者其他可判断值被错误当作空
    if not user or section_id is None:
        return 'Null'
    if user.is_admin():
        return 'su'
    perm = db_session.query(ForumPermission).filter_by(user_id=user.id, section_id=section_id).first()
    # 规范化权限值以避免数据库中存储格式差异导致的比较失败
    return normalize_permission_value(perm.perm) if perm else 'Null'


def user_can_view_chat(user, room_id):
    return get_chat_permission_value(user, room_id) in CHAT_VIEW_PERMISSIONS


def user_can_send_chat(user, room_id):
    return get_chat_permission_value(user, room_id) in CHAT_SEND_PERMISSIONS


def user_can_view_forum(user, section_id):
    return get_forum_permission_value(user, section_id) in FORUM_VIEW_PERMISSIONS


def user_can_post_forum(user, section_id):
    return get_forum_permission_value(user, section_id) in FORUM_POST_PERMISSIONS


# 检查并更新数据库结构
def update_database_schema():
    """检查并更新数据库结构，添加缺失的列"""
    try:
        conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        cursor = conn.cursor()
        
        # 检查用户表是否已有role列
        cursor.execute("PRAGMA table_info(users);")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'role' not in columns:
            # 添加role列，默认为'user'
            cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';")
            conn.commit()
        
        conn.close()
    except Exception as e:
        logger.error(f"数据库结构更新失败: {str(e)}")


def ensure_permission_tables():
    """确保权限表存在并且为所有 admin 用户分配 su 权限"""
    try:
        conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        cursor = conn.cursor()

        # 检查表是否存在；若不存在，创建表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_permissions';")
        if not cursor.fetchone():
            cursor.execute('''
                CREATE TABLE chat_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    room_id INTEGER NOT NULL,
                    perm VARCHAR(10) DEFAULT 'Null'
                )
            ''')

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='forum_permissions';")
        if not cursor.fetchone():
            cursor.execute('''
                CREATE TABLE forum_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    section_id INTEGER NOT NULL,
                    perm VARCHAR(10) DEFAULT 'Null'
                )
            ''')

        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"确保权限表失败: {str(e)}")


# 确保权限表存在
ensure_permission_tables()

# 应用启动时更新数据库结构
update_database_schema()

# 确保admin用户是管理员
def ensure_admin_user():
    """确保admin用户是管理员角色"""
    try:
        # 查找用户名为admin的用户
        admin_user = db_session.query(User).filter_by(username='admin').first()
        if admin_user:
            # 如果admin用户存在但不是管理员，则设置为管理员
            if admin_user.role != 'admin':
                admin_user.role = 'admin'
                db_session.commit()
        else:
            # 如果admin用户不存在，创建一个默认的admin用户
            new_admin = User(
                username='admin',
                nickname='管理员',
                role='admin'
            )
            new_admin.set_password('admin123')  # 默认密码
            db_session.add(new_admin)
            db_session.commit()
    except Exception as e:
        logger.error(f"设置管理员用户失败: {str(e)}")

# 应用启动时确保admin用户是管理员
ensure_admin_user()

# 自动为所有管理员用户分配所有分区的 su 权限
def grant_su_to_admins():
    try:
        admins = db_session.query(User).filter_by(role='admin').all()
        rooms = db_session.query(ChatRoom).all()
        sections = db_session.query(ForumSection).all()

        for admin in admins:
            # 聊天室权限
            for room in rooms:
                existing = db_session.query(ChatPermission).filter_by(user_id=admin.id, room_id=room.id).first()
                if not existing:
                    db_session.add(ChatPermission(user_id=admin.id, room_id=room.id, perm='su'))
                else:
                    existing.perm = 'su'

            # 贴吧分区权限
            for section in sections:
                existing = db_session.query(ForumPermission).filter_by(user_id=admin.id, section_id=section.id).first()
                if not existing:
                    db_session.add(ForumPermission(user_id=admin.id, section_id=section.id, perm='su'))
                else:
                    existing.perm = 'su'

        db_session.commit()
    except Exception as e:
        logger.error(f"为管理员分配权限失败: {str(e)}")


grant_su_to_admins()
# 用户加载函数
@login_manager.user_loader
def load_user(user_id):
    return db_session.query(User).get(int(user_id))
@app.context_processor
def inject_app_info():
    """将应用信息注入到所有模板中"""
    return {
        'app_info': {
            'debug': app.debug,
            'name': app.name,
            'config': app.config
        }
    }
# 表单定义
class LoginForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(message="用户名不能为空"),
        Length(min=3, max=64, message="用户名长度需在3-64字符之间")
    ])
    password = PasswordField('密码', validators=[
        DataRequired(message="密码不能为空")
    ])
    submit = SubmitField('登录')

class ChangePasswordForm(FlaskForm):
    old_password = PasswordField('当前密码', validators=[
        DataRequired(message="请输入当前密码")
    ])
    new_password = PasswordField('新密码', validators=[
        DataRequired(message="新密码不能为空"),
        Length(min=6, message="密码至少6个字符"),
        EqualTo('confirm_password', message='两次输入的密码必须一致')
    ])
    confirm_password = PasswordField('确认新密码', validators=[
        DataRequired(message="请确认新密码")
    ])
    submit = SubmitField('修改密码')

class ProfileForm(FlaskForm):
    nickname = StringField('昵称', validators=[
        Length(max=64, message="昵称不能超过64个字符")
    ])
    color = StringField('名字颜色', validators=[
        Regexp(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', message="颜色格式必须是#RGB或#RRGGBB")
    ])
    badge = StringField('徽章', validators=[
        Length(max=32, message="徽章不能超过32个字符")
    ])
    submit = SubmitField('保存设置')

# 全局工具函数
def sanitize_content(content):
    """
    增强XSS防护 - 使用更智能的过滤方法，保留Markdown和LaTeX标签，但过滤掉HTML标签
    核心逻辑：
    1. 保留Markdown语法（**bold**, *italic*, , 等）
    2. 保留LaTeX语法（$...$, 37...37, \\(...\), \\[...\]等）
    3. 保留@quote{...}等自定义标签
    4. 过滤掉潜在危险的HTML标签和脚本
    """
    # 1. 空值/非字符串处理
    if not content:
        return ""
    # 确保输入为字符串类型（防止非字符串输入导致异常）
    if not isinstance(content, str):
        try:
            content = str(content)
        except Exception:
            return ""

    # 2. 解码HTML实体（避免双重转义）
    try:
        content = html.unescape(content)
    except Exception:
        pass

    # 3. 临时替换安全的标签（Markdown、LaTeX、自定义标签）
    # 存储临时替换的标记
    temp_placeholders = {}
    
    # 保存LaTeX表达式：$...$, 37...37, \\(...\), \\[...\]
    latex_pattern = r'($[^$]*$|[$]{2}[^......[\s\S]*?[^|@quote\{\d+\})'
    def replace_code(match):
        key = f"__CODE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    content = re.sub(code_pattern, replace_code, content, flags=re.MULTILINE)

    # 4. 移除所有HTML标签
    content = re.sub(
        r'<[^>]*?>',          # 匹配所有<...>结构（非贪婪匹配）
        '',                   # 直接移除
        content,
        flags=re.IGNORECASE | re.DOTALL | re.MULTILINE
    )

    # 5. 移除脚本相关危险内容（即使是文本中的残留）
    # 移除各类脚本协议前缀
    script_protocols = [
        r'javascript:', r'jscript:', r'vbscript:', r'vbs:',
        r'data:', r'blob:', r'file:', r'about:', r'chrome:',
        r'ms-script:', r'ms-javascript:'
    ]
    for protocol in script_protocols:
        content = re.sub(
            re.escape(protocol),
            '',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

    # 移除危险脚本关键词（避免文本中残留执行逻辑）
    dangerous_keywords = [
        r'eval\(', r'expression\(', r'setTimeout\(', r'setInterval\(',
        r'Function\(', r'alert\(', r'prompt\(', r'confirm\('
    ]
    for keyword in dangerous_keywords:
        content = re.sub(
            keyword,
            '',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )

    # 6. 恢复之前保存的安全标签
    for key, original in temp_placeholders.items():
        content = content.replace(key, original)

    # 7. 转义其他HTML特殊字符（最终确保安全）
    content = html.escape(
        content,
        quote=True
    )

    return content
def update_room_online_count(room_id):
    """更新特定房间的在线人数"""
    socketio.emit('online_users', {
        'users': get_room_users_data(room_id)
    }, room=f"room_{room_id}")

def get_room_users_data(room_id):
    """获取房间中用户的详细信息"""
    users_data = []
    # 获取在指定聊天室最后活动时间在超时时间内的用户
    cutoff_time = datetime.utcnow() - timedelta(seconds=app.config.get('ONLINE_TIMEOUT', 30))
    online_users = db_session.query(ChatLastView).filter(
        ChatLastView.room_id == room_id,
        ChatLastView.last_view >= cutoff_time
    ).all()
    
    user_ids = [view.user_id for view in online_users]
    if user_ids:
        users = db_session.query(User).filter(User.id.in_(user_ids)).all()
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'nickname': user.nickname or user.username,
                'color': user.color,
                'badge': user.badge
            })
    return users_data

def allowed_image_extension(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in app.config.get('ALLOWED_IMAGE_EXTENSIONS', set())


def get_image_type(stream):
    """Detect image type in a stream without reading the whole file into memory.

    Prefer a lightweight header-based detection using `imghdr` on the first
    few kilobytes. This avoids loading large uploads into memory.
    """
    try:
        import imghdr
        stream.seek(0)
        header = stream.read(2048)
        stream.seek(0)
        t = imghdr.what(None, h=header)
        if t:
            return t
    except Exception:
        try:
            # Fallback to Pillow but avoid passing a stream that requires full read.
            if Image:
                stream.seek(0)
                img = Image.open(stream)
                fmt = img.format.lower() if img.format else None
                stream.seek(0)
                return fmt
        except Exception:
            pass
    return None

def get_online_users(room_id):
    """获取指定房间的在线用户"""
    # 获取最近ONLINE_TIMEOUT秒内在该聊天室有活动的用户
    cutoff_time = datetime.utcnow() - timedelta(seconds=app.config.get('ONLINE_TIMEOUT', 30))
    
    # 从ChatLastView表中获取最近活动的用户
    online_users = db_session.query(ChatLastView).filter(
        ChatLastView.room_id == room_id,
        ChatLastView.last_view >= cutoff_time
    ).all()
    
    users_data = []
    user_ids = [view.user_id for view in online_users]
    if user_ids:
        users = db_session.query(User).filter(User.id.in_(user_ids)).all()
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'nickname': user.nickname or user.username,
                'color': user.color,
                'badge': user.badge
            })
    
    return users_data

def get_recent_logs(limit=10):
    """获取最近的系统日志"""
    logs = []
    log_file = Path(app.root_path) / 'logs' / 'system.log'
    
    if log_file.exists():
        with open(log_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()[-limit:]
            for line in lines:
                try:
                    # 简化解析
                    parts = line.split(' ', 3)
                    if len(parts) >= 4:
                        timestamp_str = f"{parts[0]} {parts[1]}"
                        message = parts[3].strip()
                        # 移除日志级别和模块名
                        message = message.split(' - ', 2)[-1] if ' - ' in message else message
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
                        logs.append(type('Log', (), {'timestamp': timestamp, 'message': message})())
                except Exception as e:
                    continue
    
    # 如果没有日志文件，创建一些模拟数据
    if not logs:
        for i in range(limit):
            logs.append(type('Log', (), {
                'timestamp': datetime.now(),
                'message': f"系统启动正常 - 模拟日志条目 {i+1}"
            })())
    
    return logs[:limit]

def log_admin_action(action):
    """记录管理员操作 - 安全版本"""
    try:
        log_dir = Path(app.root_path) / 'logs'
        log_dir.mkdir(exist_ok=True)
        log_file = log_dir / 'admin.log'
        
        with open(log_file, 'a', encoding='utf-8') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            # 安全检查：确保用户已认证
            if current_user and hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
                username = current_user.username
            else:
                username = 'system'  # 系统操作
            f.write(f"[{timestamp}] [管理员: {username}] {action}\n")
        
        # 同时记录到系统日志
        logger.info(f"管理员操作: {action}")
    except Exception as e:
        # 避免在错误处理中再次出错
        try:
            logger.error(f"记录管理员操作失败: {str(e)}")
        except Exception as e2:
            print(f"记录管理员操作失败(二次错误): {str(e2)}")

# 路由定义
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('chat_index'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('chat_index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = db_session.query(User).filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('无效的用户名或密码', 'danger')
            return redirect(url_for('login'))
        
        login_user(user)
        user.last_seen = datetime.utcnow()
        db_session.commit()
        log_admin_action(f"用户登录: {user.username}")
        return redirect(url_for('chat_index'))
    
    return render_template('login.html', form=form)

@app.route('/logout')
def logout():
    username = current_user.username if current_user.is_authenticated else '未知用户'
    logout_user()
    log_admin_action(f"用户登出: {username}")
    flash('您已成功登出', 'success')
    return redirect(url_for('login'))

@app.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    form = ChangePasswordForm()
    if form.validate_on_submit():
        if not current_user.check_password(form.old_password.data):
            flash('当前密码错误', 'danger')
            return redirect(url_for('change_password'))
        
        current_user.set_password(form.new_password.data)
        db_session.commit()
        log_admin_action(f"用户修改密码: {current_user.username}")
        flash('密码已成功修改', 'success')
        return redirect(url_for('chat_index'))
    
    return render_template('settings/change_password.html', form=form)

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    form = ProfileForm()
    if form.validate_on_submit():
        current_user.nickname = form.nickname.data
        current_user.color = form.color.data or '#000000'
        current_user.badge = form.badge.data
        db_session.commit()
        log_admin_action(f"用户更新个人资料: {current_user.username}")
        flash('个人资料已更新', 'success')
        return redirect(url_for('profile'))
    elif request.method == 'GET':
        form.nickname.data = current_user.nickname
        form.color.data = current_user.color
        form.badge.data = current_user.badge
    
    return render_template('settings/profile.html', form=form)

# 聊天相关路由
@app.route('/chat')
@login_required
def chat_index():
    rooms = db_session.query(ChatRoom).all()
    visible_rooms = []
    room_permissions = {}

    for room in rooms:
        perm = get_chat_permission_value(current_user, room.id)
        if perm != 'Null':
            visible_rooms.append(room)
            room_permissions[room.id] = perm

    return render_template('chat/index.html', rooms=visible_rooms, room_permissions=room_permissions)

@app.route('/chat/<int:room_id>')
@login_required
def chat_room(room_id):
    room = db_session.query(ChatRoom).get(room_id)
    if room is None:
        abort(404)

    permission = get_chat_permission_value(current_user, room_id)
    if permission == 'Null':
        abort(403)

    # 记录用户最后查看该聊天室的时间（用于未读统计）
    try:
        last = db_session.query(ChatLastView).filter_by(user_id=current_user.id, room_id=room_id).first()
        now = datetime.utcnow()
        if last:
            last.last_view = now
        else:
            db_session.add(ChatLastView(user_id=current_user.id, room_id=room_id, last_view=now))
        db_session.commit()
    except Exception:
        db_session.rollback()

    return render_template('chat/room.html', room=room, room_permission=permission)

@app.route('/api/chat/<int:room_id>/history')
@login_required
def chat_history(room_id):
    """获取聊天历史消息 - 只返回原始Markdown内容"""
    if not user_can_view_chat(current_user, room_id):
        return jsonify(success=False, message="权限不足"), 403

    limit = min(request.args.get('limit', 50, type=int), 100)
    # 支持 page 参数（0-based）或特殊值 'last'
    page_param = request.args.get('page')
    if page_param is None:
        # 使用 offset/limit 兼容旧客户端
        offset = request.args.get('offset', 0, type=int)
        # 按时间戳升序排列（最旧的在前），确保消息按时间顺序排列
        messages = db_session.query(ChatMessage).filter_by(room_id=room_id)\
            .order_by(ChatMessage.timestamp.asc()).limit(limit).offset(offset).all()
        messages_data = [{
            'id': msg.id,
            'content': html.unescape(msg.content) if isinstance(msg.content, str) else msg.content,
            'timestamp': msg.timestamp.isoformat(),
            'user_id': msg.user_id,
            'username': msg.user.username,
            'nickname': msg.user.nickname or msg.user.username,
            'color': msg.user.color,
            'badge': msg.user.badge
        } for msg in messages]
        return jsonify(messages=messages_data)
    else:
        # 计算分页信息并返回指定页（支持 page='last'）
        try:
            total_count = db_session.query(ChatMessage).filter_by(room_id=room_id).count()
        except Exception:
            total_count = 0
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        page = None
        if isinstance(page_param, str) and page_param.lower() == 'last':
            page = max(0, total_pages - 1)
        else:
            try:
                page = int(page_param)
            except Exception:
                page = 0
        if page < 0: page = 0
        if page >= total_pages: page = total_pages - 1
        offset = page * limit
        messages = db_session.query(ChatMessage).filter_by(room_id=room_id)\
            .order_by(ChatMessage.timestamp.asc()).limit(limit).offset(offset).all()
        messages_data = [{
            'id': msg.id,
            'content': html.unescape(msg.content) if isinstance(msg.content, str) else msg.content,
            'timestamp': msg.timestamp.isoformat(),
            'user_id': msg.user_id,
            'username': msg.user.username,
            'nickname': msg.user.nickname or msg.user.username,
            'color': msg.user.color,
            'badge': msg.user.badge
        } for msg in messages]
        return jsonify(messages=messages_data, page=page, total_pages=total_pages)

@app.route('/api/chat/send', methods=['POST'])
@login_required
def send_chat_message():
    data = request.get_json(silent=True)
    if data:
        room_id = data.get('room_id')
        message = data.get('message', '')
    else:
        room_id = request.form.get('room_id')
        message = request.form.get('message', '')

    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        room_id = None

    message = (message or '').strip()

    if not room_id or not message:
        return jsonify(success=False, message="参数错误"), 400

    if not user_can_send_chat(current_user, room_id):
        return jsonify(success=False, message="当前权限无法发送消息"), 403

    # XSS基础防护（保持与 WebSocket 路径一致）
    try:
        message = sanitize_content(message)
    except Exception:
        pass
    # 保存到数据库
    message_obj = ChatMessage(
        content=message,
        user_id=current_user.id,
        room_id=room_id
    )
    try:
        db_session.add(message_obj)
        db_session.commit()
    except Exception as e:
        try:
            db_session.rollback()
        except Exception:
            pass
        logger.exception('HTTP 保存聊天消息失败')
        return jsonify(success=False, message='服务器保存消息失败'), 500

    # 返回成功响应
    return jsonify(success=True)


@app.route('/api/chat/<int:room_id>/messages/<int:message_id>', methods=['DELETE'])
@login_required
def api_delete_chat_message(room_id, message_id):
    """删除聊天室消息：只有 su（或管理员）可以删除任意消息；777 可删除自己消息。"""
    try:
        msg = db_session.query(ChatMessage).filter_by(id=message_id, room_id=room_id).first()
        if not msg:
            return jsonify({'success': False, 'message': '消息未找到'}), 404

        # 管理员快捷通过
        if current_user.is_admin():
            allowed = True
        else:
            perm = get_chat_permission_value(current_user, room_id)
            if perm == 'su':
                allowed = True
            elif perm == '777' and msg.user_id == current_user.id:
                allowed = True
            else:
                allowed = False

        if not allowed:
            return jsonify({'success': False, 'message': '权限不足'}), 403

        # 执行删除
        db_session.delete(msg)
        db_session.commit()
        logger.info(f"用户 {current_user.id} 删除了聊天室消息 {message_id} 在房间 {room_id}")
        try:
                # 广播删除事件给所有客户端，客户端根据 room_id 决定是否处理
                payload = {
                    'id': message_id,
                    'room_id': room_id,
                    'deleted_by': getattr(current_user, 'id', None),
                    'timestamp': datetime.utcnow().isoformat()
                }
                # 某些 socketio/server 版本不接受 broadcast 参数；默认 emit() 不带 to/room 会推送给所有连接
                socketio.emit('message_deleted', payload)
        except Exception as e:
            # 记录广播失败但不影响原有删除流程
            logger.exception('广播 message_deleted 失败')
        return jsonify({'success': True, 'message': '消息已删除'})
    except Exception as e:
        db_session.rollback()
        logger.exception('删除聊天室消息时发生错误')
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@app.route('/api/chat/message/<int:message_id>', methods=['GET'])
@login_required
def api_get_chat_message(message_id):
    msg = db_session.query(ChatMessage).filter_by(id=message_id).first()
    if not msg:
        return jsonify(success=False, message='消息不存在'), 404
    user = msg.user
    return jsonify(success=True, message={
        'id': msg.id,
        'content': html.unescape(msg.content) if isinstance(msg.content, str) else msg.content,
        'timestamp': msg.timestamp.isoformat(),
        'user_id': msg.user_id,
        'username': user.username if user else None,
        'nickname': user.nickname if user else None,
        'color': user.color if user else None,
        'badge': user.badge if user else None
    })


@app.route('/api/chat/message/search', methods=['GET'])
@login_required
def api_search_chat_message():
    """通过内容和时间查询自己发送的消息ID"""
    content = request.args.get('content', '').strip()
    timestamp_str = request.args.get('timestamp', '').strip()  # ISO格式时间字符串
    
    if not content:
        return jsonify(success=False, message='内容不能为空'), 400
    
    query = db_session.query(ChatMessage).filter_by(user_id=current_user.id, content=content)
    
    if timestamp_str:
        try:
            # 尝试解析时间字符串
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            # 考虑到时间可能存在微小差异，允许±1分钟的误差
            time_lower = timestamp - timedelta(minutes=1)
            time_upper = timestamp + timedelta(minutes=1)
            query = query.filter(ChatMessage.timestamp >= time_lower, ChatMessage.timestamp <= time_upper)
        except ValueError:
            return jsonify(success=False, message='时间格式错误'), 400
    
    # 按时间倒序排列，取最新的消息
    msg = query.order_by(ChatMessage.timestamp.desc()).first()
    
    if not msg:
        return jsonify(success=False, message='消息不存在'), 404
    
    user = msg.user
    return jsonify(success=True, message={
        'id': msg.id,
        'content': html.unescape(msg.content) if isinstance(msg.content, str) else msg.content,
        'timestamp': msg.timestamp.isoformat(),
        'user_id': msg.user_id,
        'username': user.username if user else None,
        'nickname': user.nickname if user else None,
        'color': user.color if user else None,
        'badge': user.badge if user else None
    })


@app.route('/api/forum/reply/<int:reply_id>', methods=['DELETE'])
@login_required
def api_delete_forum_reply(reply_id):
    """删除论坛回复：su 或管理员可以删除任意回复；777 可删除自己回复。"""
    try:
        reply = db_session.query(ForumReply).filter_by(id=reply_id).first()
        if not reply:
            return jsonify({'success': False, 'message': '回复未找到'}), 404

        # 通过 ORM 关系获取关联主题（更可靠），并确保主题存在
        thread = getattr(reply, 'thread', None)
        if not thread:
            # 如果关系未加载，尝试按 id 查询（兼容性处理）
            thread = db_session.query(ForumThread).filter_by(id=reply.thread_id).first()
        if not thread:
            return jsonify({'success': False, 'message': '关联主题不存在'}), 400
        section_id = thread.section_id

        # 管理员快捷通过；get_forum_permission_value 已返回规范化值
        if current_user.is_admin():
            allowed = True
        else:
            perm = get_forum_permission_value(current_user, section_id)
            if perm == 'su':
                allowed = True
            elif perm == '777' and reply.user_id == current_user.id:
                allowed = True
            else:
                allowed = False

        if not allowed:
            return jsonify({'success': False, 'message': '权限不足'}), 403

        # 删除回复
        db_session.delete(reply)
        db_session.commit()
        logger.info(f"用户 {current_user.id} 删除了回复 {reply_id}")
        return jsonify({'success': True, 'message': '回复已删除'})
    except Exception as e:
        db_session.rollback()
        logger.exception('删除回复时发生错误')
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@app.route('/api/online_count')
@login_required
def get_online_count():
    """获取全局在线用户数"""
    cutoff_time = datetime.utcnow() - timedelta(seconds=app.config.get('ONLINE_TIMEOUT', 300))
    
    # 查询最近活动的用户数
    online_count = db_session.query(User).filter(User.last_seen >= cutoff_time).count()
    
    return jsonify(count=online_count)
@app.route('/api/chat/<int:room_id>/online_count')
@login_required
def get_room_online_count(room_id):
    """获取特定聊天室的在线人数（用于轮询模式）"""
    if not user_can_view_chat(current_user, room_id):
        return jsonify(success=False, message="权限不足"), 403
    
    # 获取房间在线用户
    users_data = get_room_users_data(room_id)
    
    return jsonify({
        'count': len(users_data),
        'users': users_data
    })

@app.route('/api/last_views/unread_counts')
@login_required
def api_unread_counts():
    """返回用户在可访问的聊天室和贴吧分区上的未读数量映射"""
    try:
        chat_counts = {}
        forum_counts = {}

        # 聊天室
        rooms = db_session.query(ChatRoom).all()
        for room in rooms:
            if get_chat_permission_value(current_user, room.id) == 'Null':
                continue
            last = db_session.query(ChatLastView).filter_by(user_id=current_user.id, room_id=room.id).first()
            if last:
                cnt = db_session.query(ChatMessage).filter(ChatMessage.room_id == room.id, ChatMessage.timestamp > last.last_view).count()
            else:
                cnt = db_session.query(ChatMessage).filter_by(room_id=room.id).count()
            chat_counts[room.id] = cnt

        # 贴吧分区
        sections = db_session.query(ForumSection).all()
        for section in sections:
            if get_forum_permission_value(current_user, section.id) == 'Null':
                continue
            last = db_session.query(ForumLastView).filter_by(user_id=current_user.id, section_id=section.id).first()
            if last:
                last_time = last.last_view
                cnt_threads = db_session.query(ForumThread).filter(ForumThread.section_id == section.id, ForumThread.timestamp > last_time).count()
                # 回复：需要关联 thread -> section
                cnt_replies = db_session.query(ForumReply).join(ForumThread, ForumReply.thread_id == ForumThread.id)\
                    .filter(ForumThread.section_id == section.id, ForumReply.timestamp > last_time).count()
            else:
                cnt_threads = db_session.query(ForumThread).filter_by(section_id=section.id).count()
                cnt_replies = db_session.query(ForumReply).join(ForumThread, ForumReply.thread_id == ForumThread.id)\
                    .filter(ForumThread.section_id == section.id).count()
            forum_counts[section.id] = cnt_threads + cnt_replies

        return jsonify(success=True, chat=chat_counts, forum=forum_counts)
    except Exception as e:
        logger.exception('计算未读数时发生错误')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/follows', methods=['GET', 'POST'])
@login_required
def api_follows():
    if request.method == 'GET':
        # 返回当前用户的关注列表
        follows = db_session.query(UserFollow).filter_by(follower_id=current_user.id).all()
        data = []
        for f in follows:
            data.append({
                'id': f.followed.id,
                'username': f.followed.username,
                'nickname': f.followed.nickname,
                'followed_at': f.created_at.isoformat()
            })
        return jsonify(success=True, follows=data)

    # POST - 添加关注
    data = request.get_json() or {}
    username = data.get('username')
    user_id = data.get('user_id')
    if not username and not user_id:
        return jsonify(success=False, message='需要指定 username 或 user_id'), 400

    try:
        if user_id:
            target = db_session.query(User).get(int(user_id))
        else:
            target = db_session.query(User).filter_by(username=username).first()

        if not target:
            return jsonify(success=False, message='目标用户不存在'), 404
        if target.id == current_user.id:
            return jsonify(success=False, message='不能关注自己'), 400

        existing = db_session.query(UserFollow).filter_by(follower_id=current_user.id, followed_id=target.id).first()
        if existing:
            return jsonify(success=False, message='已关注'), 400

        follow = UserFollow(follower_id=current_user.id, followed_id=target.id)
        db_session.add(follow)
        db_session.commit()
        return jsonify(success=True, message='关注成功', user={'id': target.id, 'username': target.username, 'nickname': target.nickname})
    except Exception as e:
        db_session.rollback()
        logger.exception('添加关注失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/follows/<int:followed_id>', methods=['DELETE'])
@login_required
def api_unfollow(followed_id):
    try:
        rel = db_session.query(UserFollow).filter_by(follower_id=current_user.id, followed_id=followed_id).first()
        if not rel:
            return jsonify(success=False, message='未找到关注关系'), 404
        db_session.delete(rel)
        db_session.commit()
        return jsonify(success=True, message='已取消关注')
    except Exception as e:
        db_session.rollback()
        logger.exception('取消关注失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/settings')
@login_required
def settings_index():
    return render_template('settings.html')


@app.route('/api/upload/image', methods=['POST'])
@login_required
def api_upload_image():
    """上传用户图片API，会返回图片的 URL 以及可直接复制的 Markdown 链接。
    安全措施包括：登录检查、文件类型检测、文件大小限制以及文件名清理。
    """
    if 'file' not in request.files:
        return jsonify(success=False, message='未找到文件'), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, message='文件名为空'), 400

    filename = file.filename
    if not allowed_image_extension(filename):
        return jsonify(success=False, message='不支持的文件扩展名'), 400

    # 首先使用 request.content_length 做一个快速大小检查，避免写入过大的文件
    max_size = app.config.get('IMAGE_MAX_SIZE', 5 * 1024 * 1024)
    if request.content_length and request.content_length > max_size:
        return jsonify(success=False, message='文件过大'), 413

    # 安全文件名及唯一后缀（先用上传文件名的后缀，后面会检测真实类型）
    base = secure_filename(os.path.splitext(filename)[0]) or 'img'
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'png'
    from uuid import uuid4
    unique_name = f"{base}_{int(time.time())}_{uuid4().hex}.{ext}"

    # 安全检查：确保上传目标目录位于应用的 static 目录之内
    static_root = Path(app.root_path) / 'static'
    upload_folder = (Path(app.root_path) / app.config.get('UPLOAD_FOLDER', 'static/uploads') / str(current_user.id)).resolve()
    if not str(upload_folder).startswith(str(static_root.resolve())):
        return jsonify(success=False, message='上传目录配置不合法'), 500
    upload_folder.mkdir(parents=True, exist_ok=True)
    filepath = upload_folder / unique_name

    # 保存文件到磁盘（流式写入，避免在内存中保存完整文件）
    try:
        # Werkzeug FileStorage 提供 save 方法，会使用临时文件或流式写入
        file.save(str(filepath))

        # 检测文件真实类型（只读取前几KB）
        with open(filepath, 'rb') as fh:
            header = fh.read(2048)
        import imghdr
        detected = imghdr.what(None, h=header)
        if not detected:
            # 非法图片，删除已写入的文件
            try:
                filepath.unlink()
            except Exception:
                pass
            return jsonify(success=False, message='无法识别的图片类型'), 400

        normalized = detected.replace('jpeg', 'jpg') if detected else None
        if normalized not in app.config.get('ALLOWED_IMAGE_EXTENSIONS', set()):
            try:
                filepath.unlink()
            except Exception:
                pass
            return jsonify(success=False, message=f'不被允许的图片类型: {detected}'), 400

        # 在数据库中记录文件信息
        ui = UserImage(
            user_id=current_user.id,
            filename=unique_name,
            filepath=str(filepath),
            file_size=filepath.stat().st_size,
            file_type=normalized or ext
        )
        db_session.add(ui)
        db_session.commit()

        # 返回静态资源URL
        relative_path = os.path.relpath(str(filepath), str(Path(app.root_path) / 'static'))
        # 去除反斜杠，构造 URL
        url = url_for('static', filename=relative_path.replace('\\', '/'))
        markdown_link = f"![{secure_filename(base)}]({url})"
        return jsonify(success=True, url=url, markdown=markdown_link, id=ui.id, filename=ui.filename)
    except Exception as e:
        db_session.rollback()
        logger.exception('保存用户上传图片失败')
        return jsonify(success=False, message='保存文件失败'), 500


@app.route('/api/upload/images', methods=['GET'])
@login_required
def api_list_user_images():
    """列出当前用户已上传的图片，支持前端展示和复制 Markdown 链接。"""
    try:
        images = db_session.query(UserImage).filter_by(user_id=current_user.id).order_by(UserImage.upload_time.desc()).all()
        results = []
        for im in images:
            rel = os.path.relpath(str(im.filepath), str(Path(app.root_path) / 'static'))
            url = url_for('static', filename=rel.replace('\\', '/'))
            results.append({'id': im.id, 'filename': im.filename, 'url': url, 'markdown': f'![{im.filename}]({url})', 'uploaded': im.upload_time.isoformat()})
        return jsonify(success=True, images=results)
    except Exception as e:
        logger.exception('列出用户图片失败')
        return jsonify(success=False, message='服务器错误'), 500


@app.route('/api/upload/image/<int:image_id>', methods=['DELETE'])
@login_required
def api_delete_image(image_id):
    try:
        ui = db_session.query(UserImage).get(image_id)
        if not ui:
            return jsonify(success=False, message='图片不存在'), 404
        # 权限：图片所有者或管理员可删除
        if not (current_user.is_admin() or ui.user_id == current_user.id):
            return jsonify(success=False, message='权限不足'), 403

        # 删除磁盘文件
        try:
            p = Path(ui.filepath)
            if p.exists():
                p.unlink()
        except Exception:
            pass

        db_session.delete(ui)
        db_session.commit()
        logger.info(f"用户 {current_user.username} 删除上传图片 {ui.filename} (ID:{ui.id})")
        return jsonify(success=True, message='图片已删除')
    except Exception as e:
        db_session.rollback()
        logger.exception('删除上传图片失败')
        return jsonify(success=False, message='服务器错误'), 500


@app.route('/api/admin/recalculate-upload-sizes', methods=['POST'])
@login_required
def api_admin_recalculate_upload_sizes():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        # 统计每个用户已上传的图片总大小
        rows = db_session.query(UserImage.user_id, UserImage.file_size).all()
        totals = {}
        for user_id, size in rows:
            try:
                totals[user_id] = totals.get(user_id, 0) + (size or 0)
            except Exception:
                totals[user_id] = totals.get(user_id, 0)
        # 可选：将结果写入日志或数据库；这里返回 JSON
        log_admin_action(f"管理员 {current_user.username} 重新统计了所有用户上传图片大小，共 {len(totals)} 个用户")
        return jsonify(success=True, totals=totals)
    except Exception as e:
        logger.exception('重新统计上传大小失败')
        return jsonify(success=False, message='服务器错误'), 500


@app.route('/admin/download-images-zip', methods=['GET'])
@login_required
def admin_download_images_zip():
    if not current_user.is_admin():
        abort(403)
    try:
        uploads_dir = Path(app.root_path) / app.config.get('UPLOAD_FOLDER', 'static/uploads')
        if not uploads_dir.exists():
            return jsonify(success=False, message='上传目录不存在'), 404

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        tmp_file.close()
        try:
            with zipfile.ZipFile(tmp_file.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root_dir, dirs, files in os.walk(uploads_dir):
                    for fname in files:
                        full_path = os.path.join(root_dir, fname)
                        arcname = os.path.relpath(full_path, uploads_dir)
                        try:
                            zipf.write(full_path, arcname)
                        except Exception:
                            continue
            # Stream file
            resp = send_file(tmp_file.name, as_attachment=True, download_name='uploads.zip')
            # Cleanup in background
            def cleanup(path=tmp_file.name):
                try:
                    time.sleep(10)
                    os.remove(path)
                except Exception:
                    pass
            threading.Thread(target=cleanup, daemon=True).start()
            return resp
        except Exception as e:
            try:
                os.remove(tmp_file.name)
            except Exception:
                pass
            raise
    except Exception as e:
        logger.exception('创建静态图片压缩包失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/down', methods=['GET'])
@login_required
def download_root_zip():
    """Admin-only: download a zip of the project root. Excludes common large folders.

    This writes the zip to a temporary file on disk (streaming) and serves it.
    """
    if not current_user.is_admin():
        abort(403)
    try:
        root_dir = Path(app.root_path)
        # Exclude virtual envs, node_modules, .git, logs and uploads to avoid massive zips
        exclude_dirs = {'venv', '.venv', 'node_modules', '.git', 'logs', app.config.get('UPLOAD_FOLDER', 'static/uploads')}

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        tmp_file.close()
        try:
            with zipfile.ZipFile(tmp_file.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for base, dirs, files in os.walk(root_dir):
                    # relative path
                    rel = os.path.relpath(base, root_dir)
                    # skip excluded dirs
                    parts = rel.split(os.sep)
                    if parts and parts[0] in exclude_dirs:
                        continue
                    for fname in files:
                        full = os.path.join(base, fname)
                        # skip obvious big files
                        if fname.endswith('.pyc') or fname.endswith('.pyo'):
                            continue
                        arcname = os.path.relpath(full, root_dir)
                        try:
                            zipf.write(full, arcname)
                        except Exception:
                            continue
            resp = send_file(tmp_file.name, as_attachment=True, download_name='project-root.zip')
            def cleanup(path=tmp_file.name):
                try:
                    time.sleep(10)
                    os.remove(path)
                except Exception:
                    pass
            threading.Thread(target=cleanup, daemon=True).start()
            return resp
        except Exception:
            try:
                os.remove(tmp_file.name)
            except Exception:
                pass
            raise
    except Exception as e:
        logger.exception('打包项目根目录失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/downdb', methods=['GET'])
@login_required
def download_db_file():
    """Admin-only: send the SQLite DB file if using sqlite. """
    if not current_user.is_admin():
        abort(403)
    try:
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '') or app.config.get('DATABASE_URL', '')
        if uri.startswith('sqlite:///'):
            db_path = uri.replace('sqlite:///', '')
            db_file = Path(db_path)
            if not db_file.exists():
                return jsonify(success=False, message='数据库文件不存在'), 404
            return send_file(str(db_file), as_attachment=True, download_name=db_file.name)
        else:
            return jsonify(success=False, message='仅支持 SQLite 数据库下载'), 400
    except Exception as e:
        logger.exception('下载数据库失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/admin/forum/section-users/<int:section_id>', methods=['GET'])
@login_required
def api_admin_forum_section_users(section_id):
    """Return list of users and their permission for given forum section."""
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        section = db_session.query(ForumSection).get(section_id)
        if not section:
            return jsonify(success=False, message='分区不存在'), 404
        users = db_session.query(User).order_by(User.id.asc()).all()
        perms = {p.user_id: p.perm for p in db_session.query(ForumPermission).filter_by(section_id=section_id).all()}
        result = []
        for u in users:
            result.append({'id': u.id, 'username': u.username, 'nickname': u.nickname or u.username, 'perm': perms.get(u.id, 'Null')})
        return jsonify(success=True, users=result)
    except Exception as e:
        logger.exception('获取分区用户失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/admin/forum/sections', methods=['GET'])
@login_required
def api_admin_forum_sections_list():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        sections = db_session.query(ForumSection).order_by(ForumSection.id.asc()).all()
        data = [{'id': s.id, 'name': s.name, 'description': s.description or ''} for s in sections]
        return jsonify(success=True, sections=data)
    except Exception as e:
        logger.exception('获取分区列表失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/admin/chat/rooms', methods=['GET'])
@login_required
def api_admin_chat_rooms_list():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        rooms = db_session.query(ChatRoom).order_by(ChatRoom.id.asc()).all()
        data = [{'id': r.id, 'name': r.name, 'description': r.description or ''} for r in rooms]
        return jsonify(success=True, rooms=data)
    except Exception as e:
        logger.exception('获取聊天室列表失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/admin/chat/room-users/<int:room_id>', methods=['GET'])
@login_required
def api_admin_chat_room_users(room_id):
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        users = db_session.query(User).order_by(User.id.asc()).all()
        perms = {p.user_id: p.perm for p in db_session.query(ChatPermission).filter_by(room_id=room_id).all()}
        result = []
        for u in users:
            result.append({'id': u.id, 'username': u.username, 'nickname': u.nickname or u.username, 'perm': perms.get(u.id, 'Null')})
        return jsonify(success=True, users=result)
    except Exception as e:
        logger.exception('获取聊天室用户失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/admin/chat/section-users/<int:room_id>', methods=['GET'])
@login_required
def api_admin_chat_section_users(room_id):
    """Alias endpoint for admin UI symmetry: return list of users and their permission for given chat room.
    Same response shape as `/api/admin/forum/section-users/<id>`.
    """
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        # re-use existing logic: collect all users and chat permissions for room
        users = db_session.query(User).order_by(User.id.asc()).all()
        perms = {p.user_id: p.perm for p in db_session.query(ChatPermission).filter_by(room_id=room_id).all()}
        result = []
        for u in users:
            result.append({'id': u.id, 'username': u.username, 'nickname': u.nickname or u.username, 'perm': perms.get(u.id, 'Null')})
        return jsonify(success=True, users=result)
    except Exception as e:
        logger.exception('获取聊天室 section-users 失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/api/admin/recount-file-size', methods=['POST'])
@login_required
def api_admin_recount_file_size():
    """Scan files on disk and update UserImage.file_size accordingly. Returns totals per user."""
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        images = db_session.query(UserImage).all()
        totals = {}
        updated_users = set()
        total_files = 0
        for im in images:
            total_files += 1
            try:
                p = Path(im.filepath)
                actual = p.stat().st_size if p.exists() else 0
            except Exception:
                actual = 0
            if im.file_size != actual:
                im.file_size = actual
                db_session.add(im)
                updated_users.add(im.user_id)
            totals[im.user_id] = totals.get(im.user_id, 0) + actual
        db_session.commit()
        return jsonify(success=True, totals=totals, updated_users=len(updated_users), total_files=total_files)
    except Exception as e:
        db_session.rollback()
        logger.exception('按文件重新统计失败')
        return jsonify(success=False, message=str(e)), 500


@app.route('/settings/follows')
@login_required
def settings_follows():
    follows = db_session.query(UserFollow).filter_by(follower_id=current_user.id).all()
    return render_template('settings/follows.html', follows=follows)


@app.route('/settings/images')
@login_required
def settings_images():
    return render_template('settings/images.html')

# 贴吧相关路由
@app.route('/forum')
@login_required
def forum_index():
    sections = db_session.query(ForumSection).all()
    visible_sections = []
    section_permissions = {}

    for section in sections:
        perm = get_forum_permission_value(current_user, section.id)
        if perm != 'Null':
            visible_sections.append(section)
            section_permissions[section.id] = perm

    return render_template('forum/index.html', sections=visible_sections, section_permissions=section_permissions)

@app.route('/forum/section/<int:section_id>')
@login_required
def forum_section(section_id):
    section = db_session.query(ForumSection).get(section_id)
    if section is None:
        abort(404)
    permission = get_forum_permission_value(current_user, section_id)
    if permission == 'Null':
        abort(403)
    threads = db_session.query(ForumThread).filter_by(section_id=section_id)\
        .order_by(ForumThread.timestamp.desc()).all()
    # 记录用户最后查看该分区的时间（用于未读统计）
    try:
        last = db_session.query(ForumLastView).filter_by(user_id=current_user.id, section_id=section_id).first()
        now = datetime.utcnow()
        if last:
            last.last_view = now
        else:
            db_session.add(ForumLastView(user_id=current_user.id, section_id=section_id, last_view=now))
        db_session.commit()
    except Exception:
        db_session.rollback()

    # 解码历史数据中的实体，避免在列表中显示 &lt; 等实体
    try:
        for th in threads:
            if th.content and isinstance(th.content, str):
                th.content = html.unescape(th.content)
    except Exception:
        pass

    return render_template(
        'forum/section.html',
        section=section,
        threads=threads,
        section_permission=permission,
        can_post=permission in FORUM_POST_PERMISSIONS
    )

@app.route('/forum/thread/<int:thread_id>')
@login_required
def forum_thread(thread_id):
    thread = db_session.query(ForumThread).get(thread_id)
    if thread is None:
        abort(404)
    section_permission = get_forum_permission_value(current_user, thread.section_id)
    if section_permission == 'Null':
        abort(403)
    # 分页加载：每页 50 条，默认展示最后一页（最近的 50 条）
    try:
        total_count = thread.replies.count()
    except Exception:
        # 兼容非-dynamic 关系
        total_count = db_session.query(ForumReply).filter_by(thread_id=thread.id).count()
    PAGE_SIZE = 50
    total_pages = (total_count + PAGE_SIZE - 1) // PAGE_SIZE if total_count > 0 else 1
    # 页面使用 0-based page index，默认加载最后一页
    current_page = 0
    offset = current_page * PAGE_SIZE
    replies = thread.replies.order_by(ForumReply.timestamp.asc()).offset(offset).limit(PAGE_SIZE).all()
    # 解码已存在的实体，保证客户端渲染时能正确还原 code block 内容
    try:
        if thread.content and isinstance(thread.content, str):
            thread.content = html.unescape(thread.content)
    except Exception:
        pass
    for r in replies:
        try:
            if r.content and isinstance(r.content, str):
                r.content = html.unescape(r.content)
        except Exception:
            pass
    return render_template(
        'forum/thread.html',
        thread=thread,
        replies=replies,
        section_permission=section_permission,
        can_reply=section_permission in FORUM_POST_PERMISSIONS,
        forum_thread_total_pages=total_pages,
        forum_thread_current_page=current_page,
        forum_thread_page_size=PAGE_SIZE
    )


@app.route('/api/forum/thread/<int:thread_id>', methods=['DELETE'])
@login_required
def api_delete_thread(thread_id):
    """删除论坛主题帖（与其他 API 保持一致，使用 DELETE 方法）。
    允许：
      - 管理员（is_admin）或具有 su 权限的用户删除任意主题；
      - 在分区为 777 时，帖子作者可删除自己的主题。
    """
    try:
        thread = db_session.query(ForumThread).get(thread_id)
        if not thread:
            return jsonify(success=False, message='帖子不存在'), 404

        section_perm = get_forum_permission_value(current_user, thread.section_id)

        # 权限判定：管理员优先，其次 su，或 777 且为作者
        if current_user.is_admin() or section_perm == 'su' or (section_perm == '777' and thread.user_id == current_user.id):
            # 执行删除：先删除回复，再删除主题
            db_session.query(ForumReply).filter_by(thread_id=thread.id).delete()
            db_session.delete(thread)
            db_session.commit()

            message = f"删除了主题帖: {thread.title} (ID:{thread.id})"
            log_admin_action(message)
            logger.info(f"用户 {current_user.id} 删除了主题帖 {thread.id}")
            return jsonify(success=True, message='删除成功', redirect=url_for('forum_section', section_id=thread.section_id))

        else:
            return jsonify(success=False, message='权限不足'), 403
    except Exception as e:
        db_session.rollback()
        logger.exception('删除主题帖时发生错误')
        return jsonify(success=False, message='服务器错误'), 500


@app.route('/api/forum/thread/<int:thread_id>/replies', methods=['GET'])
@login_required
def api_get_thread_replies(thread_id):
    """按页获取指定主题的回复，query 参数 page 可选（0-based），默认 0（最早一页）。"""
    thread = db_session.query(ForumThread).get(thread_id)
    if thread is None:
        return jsonify(success=False, message='主题不存在'), 404
    page = 0
    try:
        page = int(request.args.get('page', 0))
    except Exception:
        page = 0
    PAGE_SIZE = 1145141919810 # 关闭分页，返回所有回复
    try:
        total_count = thread.replies.count()
    except Exception:
        total_count = db_session.query(ForumReply).filter_by(thread_id=thread.id).count()
    total_pages = (total_count + PAGE_SIZE - 1) // PAGE_SIZE if total_count > 0 else 1
    # 保证 page 合法
    if page < 0:
        page = 0
    if page >= total_pages:
        page = total_pages - 1
    offset = page * PAGE_SIZE
    replies = thread.replies.order_by(ForumReply.timestamp.asc()).offset(offset).limit(PAGE_SIZE).all()
    result = []
    for r in replies:
        result.append({
            'id': r.id,
            'thread_id': r.thread_id,
            'user_id': r.user_id,
            'username': r.user.username if r.user else None,
            'nickname': r.user.nickname if r.user else None,
            'color': r.user.color if r.user else None,
            'content': r.content,
            'timestamp': r.timestamp.isoformat() if hasattr(r.timestamp, 'isoformat') else str(r.timestamp)
        })
    return jsonify(success=True, replies=result, page=page, total_pages=total_pages)

@app.route('/forum/new/<int:section_id>', methods=['GET', 'POST'])
@login_required
def new_post(section_id):
    section = db_session.query(ForumSection).get(section_id)
    if section is None:
        abort(404)
    
    permission = get_forum_permission_value(current_user, section_id)
    if permission == 'Null':
        abort(403)
    
    if request.method == 'POST':
        if permission not in FORUM_POST_PERMISSIONS:
            return jsonify(success=False, message="当前权限无法发帖"), 403
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        
        # 基础验证
        if not title or len(title) > 128:
            return jsonify(success=False, message="标题不能为空且不超过128字符"), 400
        
        # 内容长度限制
        if not content or len(content) > 100000:
            return jsonify(success=False, message="内容不能为空且不超过100000字符"), 400
        
        # XSS基础防护
        content = sanitize_content(content)
        
        thread = ForumThread(
            title=title,
            content=content,  # 存储原始Markdown
            user_id=current_user.id,
            section_id=section_id
        )
        db_session.add(thread)
        db_session.commit()
        
        log_admin_action(f"用户创建新帖: {current_user.username} - {title}")
        return redirect(url_for('forum_thread', thread_id=thread.id))
    
    return render_template('forum/new_post.html', section=section, can_post=permission in FORUM_POST_PERMISSIONS)

@app.route('/api/forum/reply', methods=['POST'])
@login_required
def reply_post():
    thread_id = request.form.get('thread_id', type=int)
    content = request.form.get('content', '').strip()
    
    # 验证
    if not thread_id:
        return jsonify(success=False, message="参数错误"), 400
    
    if not content or len(content) > 5000:
        return jsonify(success=False, message="内容不能为空且不超过5000字符"), 400
    
    # XSS基础防护
    content = sanitize_content(content)
    
    thread = db_session.query(ForumThread).get(thread_id)
    if not thread:
        return jsonify(success=False, message="帖子不存在"), 404
    
    if not user_can_post_forum(current_user, thread.section_id):
        return jsonify(success=False, message="当前权限无法回复"), 403
    
    reply = ForumReply(
        content=content,  # 存储原始Markdown
        user_id=current_user.id,
        thread_id=thread_id
    )
    db_session.add(reply)
    db_session.commit()
    
    log_admin_action(f"用户回复帖子: {current_user.username} - 帖子ID: {thread_id}")
    # 只返回原始内容，前端负责渲染
    return jsonify(
        success=True,
        reply_id=reply.id,
        user_id=current_user.id,
        username=current_user.username,
        nickname=current_user.nickname or current_user.username,
        color=current_user.color,
        badge=current_user.badge,
        timestamp=reply.timestamp.isoformat(),
        content=html.unescape(reply.content) if isinstance(reply.content, str) else reply.content  # 原始Markdown（解码旧数据）
    )

# 管理相关路由
@app.route('/admin/index')
@login_required
def admin_index():
    if not current_user.is_admin():  # 只有管理员才能访问
        abort(403)
    
    # 获取统计信息
    user_count = db_session.query(User).count()
    online_count = 1  # 简化实现，实际应查询最近活动的用户
    chat_messages_count = db_session.query(ChatMessage).count()
    forum_posts_count = db_session.query(ForumThread).count() + db_session.query(ForumReply).count()
    
    # 获取系统信息
    python_version = sys.version.split()[0]
    database_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    
    # 获取最近日志
    recent_logs = get_recent_logs(10)
    
    return render_template('admin/index.html',
                         user_count=user_count,
                         online_count=online_count,
                         chat_messages_count=chat_messages_count,
                         forum_posts_count=forum_posts_count,
                         python_version=python_version,
                         flask_version=flask_version,
                         database_path=database_path,
                         recent_logs=recent_logs)



@app.route('/admin/users')
@login_required
def user_management():
    if not current_user.is_admin():
        abort(403)
    
    users = db_session.query(User).all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/chat')
@login_required
def chat_management():
    if not current_user.is_admin():
        abort(403)
    
    rooms = db_session.query(ChatRoom).all()
    return render_template('admin/chat.html', rooms=rooms)

@app.route('/admin/forum')
@login_required
def forum_management():
    if not current_user.is_admin():
        abort(403)
    
    sections = db_session.query(ForumSection).all()

    # 为了避免在模板中对 SQLAlchemy 的动态关系调用 len()/count 导致错误，
    # 在后端预计算每个分区的主题数和回复数，并传递到模板。
    sections_data = []
    for section in sections:
        threads_obj = section.threads
        # 获取线程列表（兼容 dynamic relationship 或 InstrumentedList）
        try:
            if hasattr(threads_obj, 'all') and callable(getattr(threads_obj, 'all')):
                threads_list = threads_obj.all()
            else:
                threads_list = list(threads_obj)
        except Exception:
            try:
                threads_list = list(threads_obj)
            except Exception:
                threads_list = []

        thread_count = 0
        reply_count = 0
        try:
            thread_count = len(threads_list)
        except Exception:
            # 兜底：尝试调用 count()，若不是参数类型的 count 则会抛出 TypeError
            try:
                thread_count = threads_obj.count()
            except Exception:
                thread_count = 0

        for thread in threads_list:
            replies_obj = getattr(thread, 'replies', [])
            try:
                if hasattr(replies_obj, 'all') and callable(getattr(replies_obj, 'all')):
                    replies_list = replies_obj.all()
                else:
                    replies_list = list(replies_obj)
            except Exception:
                try:
                    replies_list = list(replies_obj)
                except Exception:
                    replies_list = []
            try:
                reply_count += len(replies_list)
            except Exception:
                reply_count += 0

        sections_data.append({
            'section': section,
            'thread_count': thread_count,
            'reply_count': reply_count,
            'threads_list': threads_list
        })

    return render_template('admin/forum.html', sections=sections_data)

@app.route('/admin/import_users', methods=['POST'])
@login_required
def admin_import_users():
    if not current_user.is_admin():
        abort(403)
    if 'file' not in request.files:
        flash('未选择文件', 'danger')
        return redirect(url_for('user_management'))
    file = request.files['file']
    if file.filename == '':
        flash('未选择文件', 'danger')
        return redirect(url_for('user_management'))
    import csv
    import io
    success, failed = [], []
    try:
        stream = io.StringIO(file.stream.read().decode('utf-8'))
        reader = csv.DictReader(stream)
        for row in reader:
            username = row.get('username', '').strip()
            password = row.get('password', '').strip()
            nickname = row.get('nickname', '').strip()
            role = row.get('role', 'user').strip().lower()
            if not username or not password:
                failed.append({'username': username, 'reason': '用户名或密码缺失'})
                continue
            if role not in ['user', 'admin']:
                failed.append({'username': username, 'reason': '角色无效'})
                continue
            if db_session.query(User).filter_by(username=username).first():
                failed.append({'username': username, 'reason': '用户名已存在'})
                continue
            try:
                # 保证批量导入的用户默认处于离线状态：将 last_seen 设置为比 ONLINE_TIMEOUT 更早的时间
                cutoff_seconds = app.config.get('ONLINE_TIMEOUT', 300)
                default_last_seen = datetime.utcnow() - timedelta(seconds=(cutoff_seconds + 1))

                new_user = User(
                    username=username,
                    nickname=nickname,
                    role=role,
                    last_seen=default_last_seen
                )
                new_user.set_password(password)
                db_session.add(new_user)
                db_session.commit()
                success.append(username)
            except Exception as e:
                db_session.rollback()
                failed.append({'username': username, 'reason': str(e)})
        flash(f'成功导入 {len(success)} 个用户，失败 {len(failed)} 个', 'success' if not failed else 'warning')
        if failed:
            # 可选：将失败信息传递到页面
            session['import_failed'] = failed
        else:
            session.pop('import_failed', None)
    except Exception as e:
        flash(f'导入失败: {str(e)}', 'danger')
    return redirect(url_for('user_management'))
@app.route('/admin/file_manager')
@login_required
def file_manager_view():
    if not current_user.is_admin():
        abort(403)
    
    path = request.args.get('path', '')
    try:
        items = list_directory(path)
        return render_template('admin/file_manager.html', 
                              items=items, 
                              current_path=path)
    except Exception as e:
        flash(f'错误: {str(e)}', 'danger')
        return redirect(url_for('admin_index'))

@app.route('/admin/file_manager/read')
@login_required
def read_file_view():
    if not current_user.is_admin():
        abort(403)
    
    path = request.args.get('path', '')
    try:
        root = Path(__file__).parent
        full_path = (root / path).resolve()
        
        # 安全检查
        if not str(full_path).startswith(str(root)):
            raise ValueError("非法路径访问")
        
        if not full_path.exists() or full_path.is_dir():
            raise ValueError("文件不存在或为目录")
        
        # 限制文件大小
        if full_path.stat().st_size > 1024 * 1024:  # 1MB
            return jsonify(success=False, message="文件过大，无法在浏览器中编辑"), 400
        
        with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        log_admin_action(f"读取文件: {path}")
        return jsonify(success=True, content=content)
    except Exception as e:
        log_admin_action(f"读取文件失败: {path} - {str(e)}")
        return jsonify(success=False, message=str(e)), 400

@app.route('/admin/file_manager/write', methods=['POST'])
@login_required
def write_file_view():
    if not current_user.is_admin():
        abort(403)
    
    path = request.form.get('path', '')
    content = request.form.get('content', '')
    
    try:
        root = Path(__file__).parent
        full_path = (root / path).resolve()
        
        # 安全检查
        if not str(full_path).startswith(str(root)):
            raise ValueError("非法路径访问")
        
        # 限制文件类型
        disallowed_extensions = ['.pyc', '.db', '.sqlite', '.exe', '.bat', '.sh']
        if any(full_path.name.lower().endswith(ext) for ext in disallowed_extensions):
            raise ValueError(f"禁止修改此类文件: {full_path.name}")
        
        # 备份原文件
        backup_path = None
        if full_path.exists():
            backup_path = full_path.with_suffix(full_path.suffix + '.bak')
            shutil.copy2(full_path, backup_path)
        
        # 确保目录存在
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        log_admin_action(f"修改文件: {path}" + (f", 备份已创建: {backup_path}" if backup_path else ""))
        return jsonify(success=True, message="文件已保存")
    except Exception as e:
        log_admin_action(f"修改文件失败: {path} - {str(e)}")
        return jsonify(success=False, message=str(e)), 400

# API端点
@app.route('/api/admin/system-info')
@login_required
def get_system_info():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        # 获取内存使用情况
        try:
            import psutil
            process = psutil.Process(os.getpid())
            memory_info = process.memory_info()
            memory_usage = f"{memory_info.rss / 1024 / 1024:.2f} MB"
        except ImportError:
            memory_usage = "psutil未安装"
        
        return jsonify({
            'success': True,
            'memory_usage': memory_usage,
            'server_time': datetime.now().isoformat(),
            'python_version': sys.version,
            'flask_version': flask_version
        })
    except Exception as e:
        log_admin_action(f"获取系统信息失败: {str(e)}")
        return jsonify({
            'success': False,
            'message': '获取系统信息失败',
            'error': str(e)
        }), 500

@app.route('/api/admin/clear-cache', methods=['POST'])
@login_required
def clear_cache():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        # 清除数据库查询缓存
        db_session.expire_all()
        
        log_admin_action("管理员清除了系统缓存")
        return jsonify(success=True, message="缓存清除成功")
    except Exception as e:
        log_admin_action(f"清除缓存失败: {str(e)}")
        return jsonify(success=False, message=f"清除缓存失败: {str(e)}"), 500

@app.route('/api/admin/restart', methods=['POST'])
@login_required
def restart_server():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        log_admin_action("管理员请求重启服务器")
        
        # 在新线程中重启服务器，给客户端响应
        def restart():
            time.sleep(2)  # 等待响应发送
            os._exit(0)  # 强制退出，由调试模式自动重启
        
        threading.Thread(target=restart).start()
        
        return jsonify(success=True, message="服务器正在重启")
    except Exception as e:
        log_admin_action(f"重启服务器失败: {str(e)}")
        return jsonify(success=False, message=f"重启服务器失败: {str(e)}"), 500

@app.route('/api/admin/backup-database', methods=['POST'])
@login_required
def backup_database():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        db_path = Path(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        backup_dir = Path(app.root_path) / 'backups'
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"backup_{timestamp}.db"
        backup_path = backup_dir / backup_name
        
        shutil.copy2(db_path, backup_path)
        
        log_admin_action(f"数据库备份成功: {backup_path}")
        return jsonify(success=True, message="数据库备份成功", backup_path=str(backup_path))
    except Exception as e:
        log_admin_action(f"数据库备份失败: {str(e)}")
        return jsonify(success=False, message=f"数据库备份失败: {str(e)}"), 500

@app.route('/api/admin/system-log')
@login_required
def get_system_log():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        logs = get_recent_logs(50)
        return jsonify({
            'success': True,
            'logs': [{
                'timestamp': log.timestamp.isoformat(),
                'message': log.message
            } for log in logs]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"获取系统日志失败: {str(e)}"
        }), 500

@app.route('/api/admin/optimize-database', methods=['POST'])
@login_required
def optimize_database():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("VACUUM")
        conn.commit()
        conn.close()
        
        log_admin_action("数据库优化成功")
        return jsonify(success=True, message="数据库优化成功")
    except Exception as e:
        log_admin_action(f"数据库优化失败: {str(e)}")
        return jsonify(success=False, message=f"数据库优化失败: {str(e)}"), 500


@app.route('/down', methods=['GET'])
@login_required
def download_app_archive():
    """为管理员打包当前应用目录并发送（压缩为 zip）。
    生成的压缩包会放在临时目录，并在后台清理。
    """
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        src_dir = os.path.dirname(os.path.abspath(__file__))
        tmp_dir = tempfile.mkdtemp(prefix='stellarsis_export_')
        base_name = os.path.join(tmp_dir, 'stellarsis_src')
        archive_path = shutil.make_archive(base_name, 'zip', root_dir=src_dir)

        # 异步清理临时目录（延迟一段时间，确保文件已发送）
        def _cleanup(path=archive_path, dirpath=tmp_dir):
            try:
                time.sleep(30)
                if os.path.exists(path):
                    os.remove(path)
                if os.path.exists(dirpath):
                    shutil.rmtree(dirpath)
            except Exception:
                pass

        threading.Thread(target=_cleanup, daemon=True).start()

        log_admin_action(f"管理员 {current_user.username} 下载了应用源码压缩包")
        # send_file 可以直接从路径发送
        return send_file(archive_path, as_attachment=True, download_name=os.path.basename(archive_path))
    except Exception as e:
        log_admin_action(f"生成应用压缩包失败: {str(e)}")
        return jsonify(success=False, message=f"打包失败: {str(e)}"), 500


@app.route('/downdb', methods=['GET'])
@login_required
def download_database_file():
    """为管理员直接发送数据库文件 stellarsis.db。
    支持以 sqlite:/// 开头的 SQLALCHEMY_DATABASE_URI。
    """
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        # 只处理 sqlite URI
        if not db_uri.startswith('sqlite:///'):
            return jsonify(success=False, message='不支持的数据库类型，只有 SQLite 文件可供下载'), 400

        db_path = db_uri.replace('sqlite:///', '')
        # 如果是相对路径，解析到应用目录下
        if not os.path.isabs(db_path):
            db_path = os.path.join(app.root_path, db_path)

        if not os.path.exists(db_path):
            return jsonify(success=False, message='数据库文件不存在'), 404

        dirpath = os.path.dirname(db_path)
        fname = os.path.basename(db_path)

        log_admin_action(f"管理员 {current_user.username} 下载了数据库文件 {fname}")
        return send_from_directory(directory=dirpath, path=fname, as_attachment=True)
    except Exception as e:
        log_admin_action(f"发送数据库文件失败: {str(e)}")
        return jsonify(success=False, message=f"发送数据库失败: {str(e)}"), 500

@app.route('/api/admin/shutdown', methods=['POST'])
@login_required
def shutdown_server():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        data = request.get_json()
        reason = data.get('reason', '未指定原因')
        
        log_admin_action(f"服务器关停，原因: {reason}")
        
        # 在新线程中关闭服务器
        def shutdown():
            time.sleep(2)
            os._exit(0)
        
        threading.Thread(target=shutdown).start()
        
        return jsonify(success=True, message="服务器正在关停", reason=reason)
    except Exception as e:
        log_admin_action(f"关停服务器失败: {str(e)}")
        return jsonify(success=False, message=f"关停服务器失败: {str(e)}"), 500

# 用户管理相关路由
@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        user = db_session.query(User).get(user_id)
        if not user:
            return jsonify(success=False, message="用户不存在"), 404
        
        data = request.get_json()
        if 'username' in data and data['username']:
            user.username = data['username']
        if 'nickname' in data and data['nickname']:
            user.nickname = data['nickname']
        if 'color' in data and data['color']:
            user.color = data['color']
        if 'badge' in data and data['badge']:
            user.badge = data['badge']
        
        db_session.commit()
        log_admin_action(f"更新了用户 {user.username} 的信息")
        return jsonify(success=True, message="用户信息更新成功")
    except Exception as e:
        return jsonify(success=False, message=f"更新用户失败: {str(e)}"), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        ok, msg = remove_user_and_related(user_id, session=db_session)
        if ok:
            log_admin_action(f"删除了用户 {msg}")
            return jsonify(success=True, message="用户删除成功")
        else:
            return jsonify(success=False, message=msg), 400
    except Exception as e:
        return jsonify(success=False, message=f"删除用户失败: {str(e)}"), 500


def remove_user_and_related(user_id, session=None):
    """删除用户以及相关数据（用于可测试化的内部函数）。
    返回 (True, username) 或 (False, message) 。
    """
    if session is None:
        session = db_session

    user = session.query(User).get(user_id)
    if not user:
        return False, "用户不存在"

    if user.id == 1:
        return False, "不能删除超级管理员"

    try:
        # 删除用户相关数据
        # - 消息、帖子、回复
        session.query(ChatMessage).filter_by(user_id=user_id).delete()
        session.query(ForumThread).filter_by(user_id=user_id).delete()
        session.query(ForumReply).filter_by(user_id=user_id).delete()
        # - 权限（聊天室/贴吧）
        session.query(ChatPermission).filter_by(user_id=user_id).delete()
        session.query(ForumPermission).filter_by(user_id=user_id).delete()
        # - 关注关系（既作为关注者也作为被关注者）
        session.query(UserFollow).filter((UserFollow.follower_id == user_id) | (UserFollow.followed_id == user_id)).delete(synchronize_session=False)
        # - 最后查看时间记录
        session.query(ChatLastView).filter_by(user_id=user_id).delete()
        session.query(ForumLastView).filter_by(user_id=user_id).delete()

        username = user.username
        session.delete(user)
        session.commit()
        return True, username
    except Exception as e:
        session.rollback()
        return False, f"删除用户失败: {str(e)}"

@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@login_required
def update_user_role(user_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        user = db_session.query(User).get(user_id)
        if not user:
            return jsonify(success=False, message="用户不存在"), 404
        
        data = request.get_json()
        new_role = data.get('role', '').lower()
        
        if new_role not in ['user', 'admin']:
            return jsonify(success=False, message="角色必须是 'user' 或 'admin'"), 400
        
        # 防止降级超级管理员（ID为1的用户）
        if user.id == 1 and new_role != 'admin':
            return jsonify(success=False, message="不能修改超级管理员的角色"), 400
        
        old_role = user.role
        user.role = new_role

        if old_role == 'admin' and new_role != 'admin':
            for perm in db_session.query(ChatPermission).filter_by(user_id=user.id).all():
                perm.perm = 'Null'
            for perm in db_session.query(ForumPermission).filter_by(user_id=user.id).all():
                perm.perm = 'Null'

        db_session.commit()

        if new_role == 'admin':
            grant_su_to_admins()
        
        log_admin_action(f"修改用户 {user.username} 的角色: {old_role} -> {new_role}")
        return jsonify(success=True, message=f"用户 {user.username} 的角色已更新为 {new_role}")
    except Exception as e:
        logger.error(f"更新用户角色失败: {str(e)}")
        return jsonify(success=False, message=f"更新用户角色失败: {str(e)}"), 500


@app.route('/api/admin/users/<int:user_id>/permissions', methods=['GET'])
@login_required
def get_user_permissions_detail(user_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    user = db_session.query(User).get(user_id)
    if not user:
        return jsonify(success=False, message="用户不存在"), 404

    chat_perms = {
        perm.room_id: perm.perm
        for perm in db_session.query(ChatPermission).filter_by(user_id=user_id).all()
    }
    forum_perms = {
        perm.section_id: perm.perm
        for perm in db_session.query(ForumPermission).filter_by(user_id=user_id).all()
    }

    chat_data = [{
        'id': room.id,
        'name': room.name,
        'description': room.description,
        'perm': chat_perms.get(room.id, 'Null')
    } for room in db_session.query(ChatRoom).all()]

    forum_data = [{
        'id': section.id,
        'name': section.name,
        'description': section.description,
        'perm': forum_perms.get(section.id, 'Null')
    } for section in db_session.query(ForumSection).all()]

    return jsonify(success=True, user={'id': user.id, 'username': user.username, 'role': user.role},
                   chat=chat_data, forum=forum_data)


@app.route('/api/admin/users/<int:user_id>/permissions', methods=['PUT'])
@login_required
def update_user_permissions(user_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    user = db_session.query(User).get(user_id)
    if not user:
        return jsonify(success=False, message="用户不存在"), 404

    if user.is_admin():
        return jsonify(success=False, message="管理员始终拥有 su 权限"), 400

    data = request.get_json() or {}
    scope = (data.get('scope') or '').lower()
    target_id = data.get('target_id')
    perm_value = normalize_permission_value(data.get('perm'))

    if scope not in ('chat', 'forum'):
        return jsonify(success=False, message="scope 必须为 chat 或 forum"), 400

    try:
        target_id = int(target_id)
    except (TypeError, ValueError):
        return jsonify(success=False, message="target_id 无效"), 400

    if perm_value not in PERMISSION_VALUES:
        return jsonify(success=False, message="无效的权限值"), 400

    if scope == 'chat':
        target = db_session.query(ChatRoom).get(target_id)
        if not target:
            return jsonify(success=False, message="聊天室不存在"), 404
        existing = db_session.query(ChatPermission).filter_by(user_id=user.id, room_id=target_id).first()
        if perm_value == 'Null':
            if existing:
                db_session.delete(existing)
        else:
            if existing:
                existing.perm = perm_value
            else:
                db_session.add(ChatPermission(user_id=user.id, room_id=target_id, perm=perm_value))
    else:
        target = db_session.query(ForumSection).get(target_id)
        if not target:
            return jsonify(success=False, message="贴吧分区不存在"), 404
        existing = db_session.query(ForumPermission).filter_by(user_id=user.id, section_id=target_id).first()
        if perm_value == 'Null':
            if existing:
                db_session.delete(existing)
        else:
            if existing:
                existing.perm = perm_value
            else:
                db_session.add(ForumPermission(user_id=user.id, section_id=target_id, perm=perm_value))

    db_session.commit()
    log_admin_action(f"管理员 {current_user.username} 更新用户 {user.username} 的 {scope} 权限")
    return jsonify(success=True, message="权限已更新", perm=perm_value)


@app.route('/api/admin/users', methods=['POST'])
@login_required
def create_user():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        nickname = data.get('nickname', '').strip()
        color = data.get('color', '#000000')
        badge = data.get('badge', '').strip()
        role = data.get('role', 'user').lower()

        # 验证必填字段
        if not username or len(username) < 3:
            return jsonify(success=False, message="用户名至少3个字符"), 400
        
        if not password or len(password) < 6:
            return jsonify(success=False, message="密码至少6个字符"), 400

        # 检查用户名是否已存在
        existing_user = db_session.query(User).filter_by(username=username).first()
        if existing_user:
            return jsonify(success=False, message="用户名已存在"), 400

        # 验证角色
        if role not in ['user', 'admin']:
            return jsonify(success=False, message="角色必须是 'user' 或 'admin'"), 400

        # 创建新用户
        new_user = User(
            username=username,
            nickname=nickname,
            color=color,
            badge=badge,
            role=role
        )
        new_user.set_password(password)
        
        db_session.add(new_user)
        db_session.commit()
        if new_user.role == 'admin':
            grant_su_to_admins()

        log_admin_action(f"创建了新用户: {username}")
        return jsonify(success=True, message=f"用户 {username} 创建成功", user_id=new_user.id)
    except Exception as e:
        logger.error(f"创建用户失败: {str(e)}")
        return jsonify(success=False, message=f"创建用户失败: {str(e)}"), 500


@app.route('/api/search_user')
@login_required
def api_search_user():
    q = request.args.get('username', '').strip()
    if not q:
        return jsonify(success=False, message='缺少查询字符串'), 400
    user = db_session.query(User).filter_by(username=q).first()
    if not user:
        # 支持昵称搜索
        user = db_session.query(User).filter(User.nickname == q).first()
    if not user:
        return jsonify(success=True, user=None)
    return jsonify(success=True, user={'id': user.id, 'username': user.username, 'nickname': user.nickname})


@app.route('/api/search_users')
@login_required
def api_search_users():
    """模糊搜索用户：在用户名或昵称中进行不区分大小写的子串匹配，返回最多20条结果"""
    q = (request.args.get('username') or '').strip()
    if not q:
        return jsonify(success=True, users=[])
    try:
        pattern = f"%{q}%"
        users = db_session.query(User).filter(
            (User.username.ilike(pattern)) | (User.nickname.ilike(pattern))
        ).limit(20).all()
        data = [{'id': u.id, 'username': u.username, 'nickname': u.nickname} for u in users]
        return jsonify(success=True, users=data)
    except Exception as e:
        logger.exception('搜索用户失败')
        return jsonify(success=False, message=str(e)), 500


# 聊天管理相关路由
@app.route('/api/admin/chat/rooms', methods=['GET'])
@login_required
def get_chat_rooms():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        rooms = db_session.query(ChatRoom).all()
        rooms_data = []
        for room in rooms:
            rooms_data.append({
                'id': room.id,
                'name': room.name,
                'description': room.description
            })
        
        return jsonify(success=True, rooms=rooms_data)
    except Exception as e:
        logger.error(f"获取聊天室列表失败: {str(e)}")
        return jsonify(success=False, message=f"获取聊天室列表失败: {str(e)}"), 500


@app.route('/api/admin/chat/rooms/<int:room_id>', methods=['PUT'])
@login_required
def update_chat_room(room_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        room = db_session.query(ChatRoom).get(room_id)
        if not room:
            return jsonify(success=False, message="聊天室不存在"), 404

        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()

        if not name:
            return jsonify(success=False, message="聊天室名称不能为空"), 400

        old_name = room.name
        room.name = name
        room.description = description
        db_session.commit()

        log_admin_action(f"修改聊天室 {old_name} -> {name}")
        return jsonify(success=True, message=f"聊天室 {name} 更新成功")
    except Exception as e:
        logger.error(f"更新聊天室失败: {str(e)}")
        return jsonify(success=False, message=f"更新聊天室失败: {str(e)}"), 500


@app.route('/api/admin/chat/rooms/<int:room_id>', methods=['DELETE'])
@login_required
def delete_chat_room(room_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        room = db_session.query(ChatRoom).get(room_id)
        if not room:
            return jsonify(success=False, message="聊天室不存在"), 404

        if room.id == 1:  # 默认聊天室不能删除
            return jsonify(success=False, message="不能删除默认聊天室"), 400

        room_name = room.name
        db_session.delete(room)
        db_session.commit()

        log_admin_action(f"删除了聊天室: {room_name}")
        return jsonify(success=True, message=f"聊天室 {room_name} 删除成功")
    except Exception as e:
        logger.error(f"删除聊天室失败: {str(e)}")
        return jsonify(success=False, message=f"删除聊天室失败: {str(e)}"), 500


@app.route('/api/admin/chat/messages', methods=['DELETE'])
@login_required
def delete_chat_messages():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    try:
        # 获取查询参数
        room_id = request.args.get('room_id', type=int)
        before_date = request.args.get('before', type=str)

        query = db_session.query(ChatMessage)
        
        if room_id:
            query = query.filter(ChatMessage.room_id == room_id)
        
        if before_date:
            # 将字符串转换为datetime对象
            before_datetime = datetime.fromisoformat(before_date.replace('Z', '+00:00'))
            query = query.filter(ChatMessage.timestamp < before_datetime)

        deleted_count = query.delete()
        db_session.commit()

        log_admin_action(f"清空聊天消息: {deleted_count} 条消息被删除")
        return jsonify(success=True, message=f"成功删除 {deleted_count} 条聊天消息")
    except Exception as e:
        logger.error(f"删除聊天消息失败: {str(e)}")
        return jsonify(success=False, message=f"删除聊天消息失败: {str(e)}"), 500


@app.route('/api/admin/chat/rooms', methods=['POST'])
@login_required
def create_chat_room():
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': "权限不足"}), 403

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()

        # 验证必填字段
        if not name:
            return jsonify({'success': False, 'message': "聊天室名称不能为空"}), 400

        # 检查聊天室名称是否已存在
        existing_room = db_session.query(ChatRoom).filter_by(name=name).first()
        if existing_room:
            return jsonify({'success': False, 'message': "聊天室名称已存在"}), 400

        # 创建新聊天室
        new_room = ChatRoom(
            name=name,
            description=description
        )
        db_session.add(new_room)
        db_session.commit()
        grant_su_to_admins()

        log_admin_action(f"创建了聊天室 {new_room.name}")
        return jsonify({
            'success': True,
            'message': f"聊天室 {new_room.name} 创建成功",
            'room': {
                'id': new_room.id,
                'name': new_room.name,
                'description': new_room.description
            }
        })
    except Exception as e:
        logger.error(f"创建聊天室失败: {str(e)}")
        return jsonify({'success': False, 'message': f"创建聊天室失败: {str(e)}"}), 500


# 贴吧管理相关路由
@app.route('/api/admin/forum/sections', methods=['POST'])
@login_required
def create_forum_section():
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': "权限不足"}), 403

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()

        # 验证必填字段
        if not name:
            return jsonify({'success': False, 'message': "分区名称不能为空"}), 400

        # 检查分区名称是否已存在
        existing_section = db_session.query(ForumSection).filter_by(name=name).first()
        if existing_section:
            return jsonify({'success': False, 'message': "分区名称已存在"}), 400

        # 创建新分区
        new_section = ForumSection(
            name=name,
            description=description
        )
        db_session.add(new_section)
        db_session.commit()
        grant_su_to_admins()

        log_admin_action(f"创建了贴吧分区 {new_section.name}")
        return jsonify({
            'success': True, 
            'message': f"贴吧分区 {new_section.name} 创建成功",
            'section': {
                'id': new_section.id,
                'name': new_section.name,
                'description': new_section.description
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f"创建贴吧分区失败: {str(e)}"}), 500


@app.route('/api/admin/forum/sections/<int:section_id>', methods=['PUT'])
@login_required
def update_forum_section(section_id):
    if not current_user.is_admin():
        return jsonify({'success': False, 'message': "权限不足"}), 403
    
    try:
        section = db_session.query(ForumSection).get(section_id)
        if not section:
            return jsonify({'success': False, 'message': "贴吧分区不存在"}), 404
        
        data = request.get_json()
        if 'name' in data and data['name']:
            section.name = data['name']
        if 'description' in data and data['description']:
            section.description = data['description']
        
        db_session.commit()
        log_admin_action(f"更新了贴吧分区 {section.name} 的信息")
        return jsonify({'success': True, 'message': "贴吧分区信息更新成功"})
    except Exception as e:
        return jsonify({'success': False, 'message': f"更新贴吧分区失败: {str(e)}"}), 500

@app.route('/api/admin/forum/sections/<int:section_id>', methods=['DELETE'])
@login_required
def delete_forum_section(section_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        section = db_session.query(ForumSection).get(section_id)
        if not section:
            return jsonify(success=False, message="贴吧分区不存在"), 404
        
        if section.id == 1:  # 保护默认分区
            return jsonify(success=False, message="不能删除默认贴吧分区"), 400
        
        # 删除分区下的帖子和回复
        threads = db_session.query(ForumThread).filter_by(section_id=section_id).all()
        for thread in threads:
            db_session.query(ForumReply).filter_by(thread_id=thread.id).delete()
        
        db_session.query(ForumThread).filter_by(section_id=section_id).delete()
        db_session.delete(section)
        db_session.commit()
        
        log_admin_action(f"删除了贴吧分区 {section.name}")
        return jsonify(success=True, message="贴吧分区删除成功")
    except Exception as e:
        return jsonify(success=False, message=f"删除贴吧分区失败: {str(e)}"), 500

@app.route('/api/admin/forum/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_forum_post(post_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    
    try:
        # 检查是主题帖还是回复
        thread = db_session.query(ForumThread).get(post_id)
        if thread:
            # 删除主题帖及其所有回复
            db_session.query(ForumReply).filter_by(thread_id=thread.id).delete()
            db_session.delete(thread)
            message = f"删除了贴吧主题帖: {thread.title}"
        else:
            reply = db_session.query(ForumReply).get(post_id)
            if not reply:
                return jsonify(success=False, message="帖子或回复不存在"), 404
            db_session.delete(reply)
            message = "删除了贴吧回复"
        
        db_session.commit()
        log_admin_action(message)
        return jsonify(success=True, message="删除成功")
    except Exception as e:
        return jsonify(success=False, message=f"删除失败: {str(e)}"), 500


# SQLite数据库管理相关路由
@app.route('/admin/db/')
@login_required
def db_admin():
    if not current_user.is_admin():
        abort(403)

    # 获取所有表名
    conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    return render_template('admin/db.html', tables=tables)


@app.route('/admin/db/table/<table_name>')
@login_required
def db_table_view(table_name):
    if not current_user.is_admin():
        abort(403)

    # 验证表名是否合法（防止SQL注入）
    conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid_tables = [row[0] for row in cursor.fetchall()]
    
    if table_name not in valid_tables:
        abort(404)
    
    # 获取表结构
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    # 获取前50条数据
    cursor.execute(f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT 50;")
    rows = cursor.fetchall()
    
    conn.close()

    return render_template('admin/db_table.html', 
                         table_name=table_name, 
                         columns=column_names, 
                         rows=rows)


@app.route('/admin/db/table/<table_name>/data')
@login_required
def db_table_data(table_name):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    # 验证表名是否合法（防止SQL注入）
    conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid_tables = [row[0] for row in cursor.fetchall()]
    
    if table_name not in valid_tables:
        return jsonify(success=False, message="表不存在"), 404
    
    # 获取分页参数
    offset = request.args.get('offset', 0, type=int)
    limit = min(request.args.get('limit', 50, type=int), 100)  # 限制最大返回100条
    
    # 获取表结构
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    
    # 获取数据
    cursor.execute(f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT {limit} OFFSET {offset};")
    rows = cursor.fetchall()
    
    conn.close()
    
    # 将数据转换为字典列表
    data = []
    for row in rows:
        row_dict = {}
        for i, col_name in enumerate(column_names):
            row_dict[col_name] = row[i]
        data.append(row_dict)

    return jsonify({
        'success': True,
        'data': data,
        'columns': column_names
    })


@app.route('/admin/db/table/<table_name>/edit', methods=['POST'])
@login_required
def db_table_edit(table_name):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    # 验证表名是否合法（防止SQL注入）
    conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid_tables = [row[0] for row in cursor.fetchall()]
    
    if table_name not in valid_tables:
        return jsonify(success=False, message="表不存在"), 404
    
    data = request.get_json()
    if not data:
        return jsonify(success=False, message="无效数据"), 400
    
    record_id = data.get('id')
    if not record_id:
        return jsonify(success=False, message="记录ID不能为空"), 400
    
    # 获取表结构，确定主键
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    primary_key = None
    for col in columns:
        if col[5] == 1:  # 主键标识
            primary_key = col[1]
            break
    
    if not primary_key:
        primary_key = 'id'  # 默认主键
    
    # 构建更新语句
    updates = []
    values = []
    for key, value in data.items():
        if key not in ['id']:  # 排除ID字段，因为它是主键
            updates.append(f"{key} = ?")
            values.append(value)
    
    if not updates:
        return jsonify(success=False, message="没有要更新的字段"), 400
    
    values.append(record_id)  # 主键值用于WHERE子句
    
    try:
        update_sql = f"UPDATE {table_name} SET {', '.join(updates)} WHERE {primary_key} = ?"
        cursor.execute(update_sql, values)
        conn.commit()
        
        log_admin_action(f"修改了表 {table_name} 中ID为 {record_id} 的记录")
        return jsonify(success=True, message="记录更新成功")
    except Exception as e:
        conn.rollback()
        return jsonify(success=False, message=f"更新失败: {str(e)}"), 500
    finally:
        conn.close()


@app.route('/admin/db/table/<table_name>/delete', methods=['POST'])
@login_required
def db_table_delete(table_name):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403

    # 验证表名是否合法（防止SQL注入）
    conn = sqlite3.connect(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid_tables = [row[0] for row in cursor.fetchall()]
    
    if table_name not in valid_tables:
        return jsonify(success=False, message="表不存在"), 404
    
    data = request.get_json()
    if not data:
        return jsonify(success=False, message="无效数据"), 400
    
    record_id = data.get('id')
    if not record_id:
        return jsonify(success=False, message="记录ID不能为空"), 400
    
    # 获取表结构，确定主键
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    primary_key = None
    for col in columns:
        if col[5] == 1:  # 主键标识
            primary_key = col[1]
            break
    
    if not primary_key:
        primary_key = 'id'  # 默认主键
    
    try:
        delete_sql = f"DELETE FROM {table_name} WHERE {primary_key} = ?"
        cursor.execute(delete_sql, (record_id,))
        conn.commit()
        
        log_admin_action(f"删除了表 {table_name} 中ID为 {record_id} 的记录")
        return jsonify(success=True, message="记录删除成功")
    except Exception as e:
        conn.rollback()
        return jsonify(success=False, message=f"删除失败: {str(e)}"), 500
    finally:
        conn.close()


# 文件管理工具函数
def list_directory(path):
    """列出目录内容（安全版）"""
    root = Path(__file__).parent
    full_path = (root / path).resolve()
    
    # 安全检查
    if not str(full_path).startswith(str(root)):
        raise ValueError("非法路径访问")
    
    if not full_path.exists() or not full_path.is_dir():
        raise ValueError("目录不存在")
    
    items = []
    for item in full_path.iterdir():
        # 跳过隐藏文件和特定目录
        if item.name.startswith('.') or item.name in ['__pycache__', 'logs', 'backups']:
            continue
        
        rel_path = item.relative_to(root)
        items.append({
            'name': item.name,
            'is_dir': item.is_dir(),
            'path': str(rel_path),
            'size': item.stat().st_size if item.is_file() else 0
        })
    
    return items

# Socket.IO 事件处理
@socketio.on('connect')
def handle_connect():
    """用户连接"""
    if not current_user.is_authenticated:
        return False  # 拒绝未认证用户
    
    if current_user.is_authenticated:
        current_user.last_seen = datetime.utcnow()
        db_session.commit()
    
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response', {'count': session['receive_count']})

@socketio.on('join')
def on_join(data):
    """加入聊天室"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room')
    if not room_id:
        return

    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        return

    if not user_can_view_chat(current_user, room_id):
        emit('permission_denied', {'message': '当前权限无法进入该聊天室', 'room_id': room_id})
        return
    
    room_name = f"room_{room_id}"
    join_room(room_name)
    # 更新用户最后活动时间
    current_user.last_seen = datetime.utcnow()
    
    # 在ChatLastView表中记录用户进入房间的时间
    last = db_session.query(ChatLastView).filter_by(
        user_id=current_user.id,
        room_id=room_id
    ).first()
    now = datetime.utcnow()
    if last:
        last.last_view = now
    else:
        db_session.add(ChatLastView(
            user_id=current_user.id,
            room_id=room_id,
            last_view=now
        ))
    db_session.commit()
    
    # 广播用户加入
    emit('user_join', {
        'user_id': current_user.id,
        'username': current_user.username,
        'nickname': current_user.nickname or current_user.username,
        'room_id': room_id
    }, room=room_name)
    
    # 更新在线人数
    update_room_online_count(room_id)


@socketio.on('leave')
def on_leave(data):
    """离开聊天室"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room')
    if not room_id:
        return

    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        return
    
    room_name = f"room_{room_id}"
    leave_room(room_name)
    
    # 不需要从内存中移除用户，因为我们现在使用数据库来跟踪在线状态
    emit('user_leave', {
        'user_id': current_user.id,
        'username': current_user.username,
        'nickname': current_user.nickname or current_user.username,
        'room_id': room_id
    }, room=room_name)
    
    # 更新在线人数
    update_room_online_count(room_id)

@socketio.on('send_message')
def handle_message(data):
    """处理发送消息"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    content = data.get('message', '').strip()
    
    # 验证
    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        room_id = None

    if not room_id or not content:
        emit('error', {'message': '参数错误'})
        return

    if not user_can_send_chat(current_user, room_id):
        emit('error', {'message': '当前权限无法发送消息'})
        return
    
    # 内容长度限制
    if len(content) > 2000:
        emit('error', {'message': '消息过长'})
        return
    
    # XSS基础防护
    content = sanitize_content(content)
    # 检查发送速度：如果两次发送间隔小于725ms，则触发验证码流程
    now_ts = time.time()
    with captcha_lock:
        last_ts = last_send_times.get(current_user.id)
        # 如果前一次发送时间存在且间隔短，并且本次没有携带 captcha_id，则要求验证码
        if last_ts and (now_ts - last_ts) < 0.725 and not data.get('captcha_id'):
            # 生成一个简单的算术验证码
            import secrets
            import random

            a = random.randint(1, 9)
            b = random.randint(1, 9)
            op = random.choice(['+', '-'])
            answer = a + b if op == '+' else a - b
            captcha_id = secrets.token_urlsafe(8)
            captcha_store[captcha_id] = {
                'answer': answer,
                'expires': now_ts + 300,
                'user_id': current_user.id,
                'pending': {
                    'room_id': room_id,
                    'content': content,
                    'client_id': data.get('client_id')
                }
            }
            # 只发送给当前连接的客户端，要求输入验证码
            emit('require_captcha', {
                'captcha_id': captcha_id,
                'question': f'{a}{op}{b} = ?'
            }, room=request.sid)
            return

    # 如果本次请求携带了 captcha_id 与 captcha_answer，进行验证（并允许通过）
    captcha_id = data.get('captcha_id')
    captcha_answer = data.get('captcha_answer')
    if captcha_id:
        with captcha_lock:
            info = captcha_store.get(captcha_id)
            # 验证存在性、过期以及归属
            if not info or info.get('user_id') != current_user.id:
                emit('error', {'message': '验证码无效或已过期'})
                return
            if time.time() > info.get('expires', 0):
                captcha_store.pop(captcha_id, None)
                emit('error', {'message': '验证码已过期'})
                return
            try:
                provided = int(captcha_answer)
            except Exception:
                emit('error', {'message': '验证码输入错误'})
                return
            if provided != info['answer']:
                emit('error', {'message': '验证码错误'})
                return
            # 验证通过：将待发送消息替换为存储的 pending（以服务器端为准）
            pending = info.get('pending', {})
            room_id = pending.get('room_id', room_id)
            content = pending.get('content', content)
            client_id = pending.get('client_id') or data.get('client_id')
            # 清理验证码条目
            captcha_store.pop(captcha_id, None)

    # 更新最后发送时间（通过验证或正常发送）
    with captcha_lock:
        last_send_times[current_user.id] = now_ts
    
    # 重复消息合并：如果上一条来自同一用户在同一房间且内容相同，则在上一条末尾增加 *2/*3...
    try:
        last_msg = db_session.query(ChatMessage).filter_by(
            user_id=current_user.id, room_id=room_id
        ).order_by(ChatMessage.id.desc()).first()
    except Exception:
        last_msg = None

    if last_msg and last_msg.content:
        # 提取可能的尾部乘数，例如 "hello*3"
        m = re.search(r"\*(\d+)$", last_msg.content)
        base = last_msg.content
        if m:
            base = last_msg.content[:m.start()]
        # 如果基础文本与当前内容相同，则合并计数
        if base == content:
            if m:
                try:
                    count = int(m.group(1)) + 1
                except Exception:
                    count = 2
            else:
                count = 2
            last_msg.content = f"{content}*{count}"
            db_session.add(last_msg)
            db_session.commit()

            payload = {
                'id': last_msg.id,
                'content': last_msg.content,
                'timestamp': last_msg.timestamp.isoformat(),
                'user_id': current_user.id,
                'username': current_user.username,
                'nickname': current_user.nickname or current_user.username,
                'color': current_user.color,
                'badge': current_user.badge
            }
            if client_id:
                payload['client_id'] = client_id
            emit('message_updated', payload, room=f'room_{room_id}', include_self=True)
            
            # 对于重复消息，也发送acknowledgement
            if client_id:
                emit('message_id_response', {'client_id': client_id, 'server_id': last_msg.id}, to=request.sid)
            return

    # 保存到数据库（非重复的常规消息）
    message = ChatMessage(
        content=content,
        user_id=current_user.id,
        room_id=room_id
    )
    try:
        db_session.add(message)
        db_session.commit()
    except Exception as e:
        try:
            db_session.rollback()
        except Exception:
            pass
        logger.exception('保存聊天消息失败')
        emit('error', {'message': '服务器保存消息失败'})
        return
    
    # 发送消息给房间内所有人（包括发送者），并携带 client_id（如果客户端发送了），
    # 这样发送者可以收到带有服务器 id 的确认消息以更新本地 pending 消息
    room_name = f"room_{room_id}"
    client_id = data.get('client_id')
    payload = {
        'id': message.id,
        'content': message.content,  # 原始Markdown
        'timestamp': message.timestamp.isoformat(),
        'user_id': current_user.id,
        'username': current_user.username,
        'nickname': current_user.nickname or current_user.username,
        'color': current_user.color,
        'badge': current_user.badge
    }

    # 如果前端传来了 client_id，包含在payload中以便发送者进行匹配
    if client_id:
        payload['client_id'] = client_id

    # include_self=True 使得发送者也能收到这条消息（用于将本地 pending 更新为服务器ID）
    emit('message', payload, room=room_name, include_self=True)
    
    # 发送acknowledgement响应，包含服务器消息ID
    if client_id:
        # 发送acknowledgement响应，包含服务器消息ID
        emit('message_id_response', {'client_id': client_id, 'server_id': message.id}, to=request.sid)

@socketio.on('get_online_users')
def handle_get_online_users(data):
    """获取在线用户列表"""
    if not current_user.is_authenticated:
        return
    
    room_id = data.get('room_id')
    if not room_id:
        return

    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        return

    if not user_can_view_chat(current_user, room_id):
        emit('permission_denied', {'message': '当前权限无法查看该聊天室', 'room_id': room_id})
        return
    
    # 获取在线用户
    online_users = get_online_users(room_id)
    
    emit('online_users', {'users': online_users})


@socketio.on('get_global_online_count')
def handle_get_global_online_count(data):
    """获取全局在线用户数"""
    if not current_user.is_authenticated:
        return
    
    cutoff_time = datetime.utcnow() - timedelta(seconds=app.config.get('ONLINE_TIMEOUT', 300))

    # 查询最近活动的用户数
    online_count = db_session.query(User).filter(User.last_seen >= cutoff_time).count()
    # 发送全局在线人数到客户端
    emit('global_online_count', {'count': online_count})

@socketio.on('heartbeat_chat')
def handle_heartbeat_chat(data):
    """处理聊天室客户端心跳，更新用户最后活动时间"""
    room_id = data.get('room_id')
    if current_user.is_authenticated and room_id:
        try:
            room_id = int(room_id)
            
            # 更新用户全局最后活动时间
            current_user.last_seen = datetime.utcnow()
            
            # 更新房间特定最后查看时间
            last = db_session.query(ChatLastView).filter_by(
                user_id=current_user.id, 
                room_id=room_id
            ).first()
            now = datetime.utcnow()
            if last:
                last.last_view = now
            else:
                db_session.add(ChatLastView(
                    user_id=current_user.id, 
                    room_id=room_id, 
                    last_view=now
                ))
            db_session.commit()
            
            # 触发在线人数更新
            update_room_online_count(room_id)
        except Exception as e:
            db_session.rollback()
            logger.error(f"处理心跳失败: {str(e)}")


# === 新增关注功能 API ===

@app.route('/api/follow/following')
@login_required
def get_following():
    """获取当前用户关注的用户列表"""
    following = db_session.query(UserFollow.followed_id).filter_by(follower_id=current_user.id).all()
    following_ids = [row[0] for row in following]
    users = db_session.query(User).filter(User.id.in_(following_ids)).all()
    user_list = [{
        'id': u.id,
        'username': u.username,
        'nickname': u.nickname or u.username,
        'color': u.color,
        'badge': u.badge
    } for u in users]
    return jsonify(success=True, following=user_list)


@app.route('/api/follow/toggle', methods=['POST'])
@login_required
def toggle_follow():
    """关注/取消关注某用户"""
    data = request.get_json()
    target_id = data.get('user_id')
    if not target_id or target_id == current_user.id:
        return jsonify(success=False, message="无效用户"), 400
    target_user = db_session.query(User).get(target_id)
    if not target_user:
        return jsonify(success=False, message="用户不存在"), 404

    existing = db_session.query(UserFollow).filter_by(
        follower_id=current_user.id,
        followed_id=target_id
    ).first()

    if existing:
        db_session.delete(existing)
        action = "unfollow"
    else:
        follow = UserFollow(follower_id=current_user.id, followed_id=target_id)
        db_session.add(follow)
        action = "follow"

    db_session.commit()
    log_admin_action(f"{current_user.username} {'关注' if action == 'follow' else '取消关注'} 用户 {target_user.username}")
    return jsonify(success=True, action=action)


# 广播用户进入
@socketio.on('join')
def on_join(data):
    if not current_user.is_authenticated:
        return
    room_id = data.get('room')
    if not room_id:
        return

    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        return

    if not user_can_view_chat(current_user, room_id):
        emit('permission_denied', {'message': '当前权限无法进入该聊天室', 'room_id': room_id})
        return

    room_name = f"room_{room_id}"
    join_room(room_name)
    current_user.last_seen = datetime.utcnow()
    db_session.commit()
    # 广播用户进入（供关注者监听）
    # emit to the room so only users in the room receive it (includes sender)
    try:
        socketio.emit('user_join', {
            'user_id': current_user.id,
            'username': current_user.username,
            'nickname': current_user.nickname or current_user.username,
            'room_id': room_id
        }, room=room_name)
    except Exception:
        # fallback to emit without room if socketio.emit signature differs
        try:
            emit('user_join', {
                'user_id': current_user.id,
                'username': current_user.username,
                'nickname': current_user.nickname or current_user.username,
                'room_id': room_id
            })
        except Exception:
            pass


# 广播用户离开
@socketio.on('leave')
def on_leave(data):
    if not current_user.is_authenticated:
        return
    room_id = data.get('room')
    if not room_id:
        return

    try:
        room_id = int(room_id)
    except (TypeError, ValueError):
        return

    room_name = f"room_{room_id}"
    leave_room(room_name)
    # 广播用户离开
    try:
        socketio.emit('user_leave', {
            'user_id': current_user.id,
            'username': current_user.username,
            'nickname': current_user.nickname or current_user.username,
            'room_id': room_id
        }, room=room_name)
    except Exception:
        try:
            emit('user_leave', {
                'user_id': current_user.id,
                'username': current_user.username,
                'nickname': current_user.nickname or current_user.username,
                'room_id': room_id
            })
        except Exception:
            pass

@socketio.on('heartbeat')
def handle_heartbeat():
    """处理客户端心跳，更新用户最后活动时间"""
    if current_user.is_authenticated:
        current_user.last_seen = datetime.utcnow()
        db_session.commit()
# 全局上下文处理器
@app.context_processor
def inject_user():
    """注入当前用户信息到模板"""
    return dict(current_user=current_user)

@app.context_processor
def inject_online_count():
    """注入在线用户数到模板"""
    cutoff_time = datetime.utcnow() - timedelta(seconds=app.config.get('ONLINE_TIMEOUT', 300))
    
    # 查询最近活动的用户数
    online_count = db_session.query(User).filter(User.last_seen >= cutoff_time).count()
    
    return dict(online_count=online_count)

# 错误处理
@app.errorhandler(403)
def forbidden(error):
    return render_template('errors/403.html'), 403

@app.errorhandler(404)
def not_found(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def server_error(error):
    return render_template('errors/500.html'), 500

# 初始化数据
def init_db():
    """初始化数据库"""
    # 创建默认用户（ID=1）
    admin = db_session.query(User).filter_by(id=1).first()
    if not admin:
        admin = User(
            id=1,
            username='admin',
            nickname='WTX',
            color='#ff0000',
            badge='ADMIN'
        )
        admin.set_password('admin')
        db_session.add(admin)
    
    # 创建默认聊天室
    if not db_session.query(ChatRoom).filter_by(name='公共聊天室').first():
        room = ChatRoom(
            name='公共聊天室',
            description='欢迎来到公共聊天室'
        )
        db_session.add(room)
    
    # 创建默认贴吧分区
    if not db_session.query(ForumSection).filter_by(name='公告区').first():
        section = ForumSection(
            name='公告区',
            description='系统公告和重要通知'
        )
        db_session.add(section)
    
    db_session.commit()
    log_admin_action("数据库初始化完成")


def create_test_data():
    """创建测试数据：聊天室消息和论坛帖子，仅在调试模式下执行"""
    if not app.config['DEBUG']:
        return
    
    try:
        # 1. 创建测试聊天室
        test_room = db_session.query(ChatRoom).filter_by(name='test').first()
        if not test_room:
            test_room = ChatRoom(
                name='test',
                description='测试分页功能的聊天室'
            )
            db_session.add(test_room)
            db_session.commit()
            log_admin_action("创建了测试聊天室")
        
        # 2. 向测试聊天室发送100条消息
        admin_user = db_session.query(User).filter_by(id=1).first()
        if admin_user:
            # 检查是否已有测试消息
            existing_count = db_session.query(ChatMessage).filter_by(room_id=test_room.id).count()
            if existing_count < 100:
                # 生成从旧到新的时间戳
                base_time = datetime.utcnow() - timedelta(minutes=100)
                for i in range(1, 101):
                    # 跳过已存在的消息
                    if i <= existing_count:
                        continue
                    msg_time = base_time + timedelta(minutes=i)
                    message = ChatMessage(
                        content=f"测试消息 #{i}",
                        user_id=admin_user.id,
                        room_id=test_room.id,
                        timestamp=msg_time
                    )
                    db_session.add(message)
                db_session.commit()
                log_admin_action(f"向测试聊天室添加了 {100-existing_count} 条测试消息")
        
        # 3. 创建测试论坛分区
        test_section = db_session.query(ForumSection).filter_by(name='test').first()
        if not test_section:
            test_section = ForumSection(
                name='test',
                description='测试分页功能的论坛分区'
            )
            db_session.add(test_section)
            db_session.commit()
            log_admin_action("创建了测试论坛分区")
        
        # 4. 在测试分区创建一个主题帖
        test_thread = db_session.query(ForumThread).filter_by(title='测试分页').first()
        if not test_thread:
            test_thread = ForumThread(
                title='测试分页',
                content='这个帖子用于测试分页功能',
                user_id=admin_user.id,
                section_id=test_section.id,
                timestamp=datetime.utcnow() - timedelta(minutes=110)
            )
            db_session.add(test_thread)
            db_session.commit()
            
            # 5. 为测试帖子添加505条回复
            base_reply_time = datetime.utcnow() - timedelta(minutes=100)
            for i in range(1, 505):
                reply_time = base_reply_time + timedelta(minutes=i)
                reply = ForumReply(
                    content=f"测试回复 #{i}",
                    user_id=admin_user.id,
                    thread_id=test_thread.id,
                    timestamp=reply_time
                )
                db_session.add(reply)
            db_session.commit()
            log_admin_action("创建了测试帖子和50条回复")
            
    except Exception as e:
        logger.error(f"创建测试数据失败: {str(e)}")
        db_session.rollback()

# 主程序
if __name__ == '__main__':
    init_db()
    CORS(app, resources={r"/socket.io/*": {"origins": "*"}})
    socketio.run(app, host='0.0.0.0', port=80,debug=app.config['DEBUG'])
