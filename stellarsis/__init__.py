"""
Stellarsis – application factory.
"""

import logging
import os
import sqlite3
from pathlib import Path

from flask import Flask, render_template
from flask_cors import CORS
from flask_login import current_user

from config import Config
from stellarsis.extensions import (
    Base, init_db as init_db_engine, db_session,
    login_manager, socketio, limiter,
)
from stellarsis.models import (
    User, ChatRoom, ForumSection,
)
from stellarsis.permissions import grant_su_to_admins
from stellarsis.routes import register_blueprints
from stellarsis.events import register_events


def create_app(config_class=Config):
    project_root = str(Path(__file__).resolve().parent.parent)
    app = Flask(
        __name__,
        template_folder=os.path.join(project_root, 'templates'),
        static_folder=os.path.join(project_root, 'static'),
    )
    app.config.from_object(config_class)

    # Use the project root as root_path so all helpers resolve paths correctly
    app.root_path = project_root

    # Upload directory
    upload_dir = Path(app.root_path) / app.config.get('UPLOAD_FOLDER', 'static/uploads')
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Logging
    _init_logging(app)

    # Extensions
    init_db_engine(app)
    login_manager.init_app(app)
    socketio.init_app(app, async_mode=app.config.get('SOCKETIO_ASYNC_MODE', 'eventlet'),
                      cors_allowed_origins='*')
    limiter.init_app(app)

    # Blueprints
    register_blueprints(app)

    # Socket.IO events
    register_events(socketio)

    # Context processors
    _register_context_processors(app)

    # Error handlers
    _register_error_handlers(app)

    # DB bootstrap
    with app.app_context():
        _bootstrap_db(app)

    return app


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------

def _init_logging(app):
    """Set up the logger manager and store references on the app config."""
    from logger_utils import init_logger_manager, AdminActionLogger

    try:
        mgr = init_logger_manager(app.root_path)
        lgr = mgr.system
        admin_lgr = AdminActionLogger(mgr)
        lgr.info("=" * 50)
        lgr.info("Stellarsis 系统启动 / System Starting")
        lgr.info("=" * 50)
        app.config['_logger_manager'] = mgr
        app.config['_admin_logger'] = admin_lgr
        app.config['_logger'] = lgr
    except Exception as e:
        print(f"配置日志失败: {e}")
        logging.basicConfig(level=logging.INFO)
        app.config['_logger_manager'] = None
        app.config['_admin_logger'] = None
        app.config['_logger'] = logging.getLogger('stellarsis')


@login_manager.user_loader
def load_user(user_id):
    return db_session.get(User, int(user_id))


def _register_context_processors(app):
    from stellarsis.utils import utcnow, get_global_online_count
    from datetime import timedelta

    @app.context_processor
    def inject_app_info():
        return {
            'app_info': {
                'debug': app.debug,
                'name': app.name,
                'config': app.config,
            }
        }

    @app.context_processor
    def inject_user():
        return dict(current_user=current_user)

    @app.context_processor
    def inject_online_count():
        return dict(online_count=get_global_online_count())


def _register_error_handlers(app):
    @app.errorhandler(403)
    def forbidden(error):
        return render_template('errors/403.html'), 403

    @app.errorhandler(404)
    def not_found(error):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def server_error(error):
        return render_template('errors/500.html'), 500


def _bootstrap_db(app):
    """Run migrations, create seed data and set up admin permissions."""
    _migrate_database(app)
    _ensure_permission_tables(app)
    _update_database_schema(app)
    _ensure_admin_user()
    grant_su_to_admins()
    _init_seed_data()

    if app.config.get('DEBUG'):
        _create_test_data()


def _migrate_database(app):
    """Add missing columns to existing databases."""
    lgr = app.config.get('_logger') or logging.getLogger('stellarsis')
    try:
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(users)")
        cols = [c[1] for c in cur.fetchall()]
        if 'created_at' not in cols:
            lgr.info("迁移数据库：添加 users.created_at 列")
            cur.execute("ALTER TABLE users ADD COLUMN created_at DATETIME")
            cur.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL")
            conn.commit()
            lgr.info("数据库迁移完成：users.created_at 列已添加")
        conn.close()
    except Exception as e:
        lgr.error(f"数据库迁移失败: {e}")


def _ensure_permission_tables(app):
    lgr = app.config.get('_logger') or logging.getLogger('stellarsis')
    try:
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_permissions';")
        if not cur.fetchone():
            cur.execute('''CREATE TABLE chat_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                room_id INTEGER NOT NULL,
                perm VARCHAR(10) DEFAULT 'Null'
            )''')
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='forum_permissions';")
        if not cur.fetchone():
            cur.execute('''CREATE TABLE forum_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                section_id INTEGER NOT NULL,
                perm VARCHAR(10) DEFAULT 'Null'
            )''')
        conn.commit()
        conn.close()
    except Exception as e:
        lgr.error(f"确保权限表失败: {e}")


def _update_database_schema(app):
    lgr = app.config.get('_logger') or logging.getLogger('stellarsis')
    try:
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("PRAGMA table_info(users);")
        cols = [c[1] for c in cur.fetchall()]
        if 'role' not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';")
            lgr.info("Added 'role' column to users table")
            conn.commit()
        if 'upload_used' not in cols:
            cur.execute("ALTER TABLE users ADD COLUMN upload_used INTEGER DEFAULT 0;")
            lgr.info("Added 'upload_used' column to users table")
            conn.commit()
        conn.close()
    except Exception as e:
        lgr.error(f"数据库结构更新失败: {e}")


def _ensure_admin_user():
    lgr = logging.getLogger('stellarsis')
    try:
        admin = db_session.query(User).filter_by(username='admin').first()
        if admin:
            if admin.role != 'admin':
                admin.role = 'admin'
                db_session.commit()
        else:
            u = User(username='admin', nickname='管理员', role='admin')
            u.set_password('admin123')
            db_session.add(u)
            db_session.commit()
    except Exception as e:
        lgr.error(f"设置管理员用户失败: {e}")


def _init_seed_data():
    from stellarsis.utils import log_admin_action

    admin = db_session.query(User).filter_by(id=1).first()
    if not admin:
        admin = User(id=1, username='admin', nickname='WTX', color='#ff0000', badge='ADMIN')
        admin.set_password('admin')
        db_session.add(admin)

    if not db_session.query(ChatRoom).filter_by(name='公共聊天室').first():
        db_session.add(ChatRoom(name='公共聊天室', description='欢迎来到公共聊天室'))

    if not db_session.query(ForumSection).filter_by(name='公告区').first():
        db_session.add(ForumSection(name='公告区', description='系统公告和重要通知'))

    db_session.commit()
    log_admin_action("数据库初始化完成")


def _create_test_data():
    """Create test data in DEBUG mode."""
    from datetime import timedelta
    from stellarsis.models import ChatMessage, ForumThread, ForumReply
    from stellarsis.utils import utcnow, log_admin_action

    try:
        test_room = db_session.query(ChatRoom).filter_by(name='test').first()
        if not test_room:
            test_room = ChatRoom(name='test', description='测试分页功能的聊天室')
            db_session.add(test_room)
            db_session.commit()
            log_admin_action("创建了测试聊天室")

        admin = db_session.query(User).filter_by(id=1).first()
        if admin:
            existing = db_session.query(ChatMessage).filter_by(room_id=test_room.id).count()
            if existing < 100:
                base = utcnow() - timedelta(minutes=100)
                for i in range(existing + 1, 101):
                    db_session.add(ChatMessage(
                        content=f"测试消息 #{i}", user_id=admin.id,
                        room_id=test_room.id, timestamp=base + timedelta(minutes=i),
                    ))
                db_session.commit()
                log_admin_action(f"向测试聊天室添加了 {100 - existing} 条测试消息")

        test_sec = db_session.query(ForumSection).filter_by(name='test').first()
        if not test_sec:
            test_sec = ForumSection(name='test', description='测试分页功能的论坛分区')
            db_session.add(test_sec)
            db_session.commit()
            log_admin_action("创建了测试论坛分区")

        test_thread = db_session.query(ForumThread).filter_by(title='测试分页').first()
        if not test_thread and admin:
            test_thread = ForumThread(
                title='测试分页', content='这个帖子用于测试分页功能',
                user_id=admin.id, section_id=test_sec.id,
                timestamp=utcnow() - timedelta(minutes=110),
            )
            db_session.add(test_thread)
            db_session.commit()
            base_reply = utcnow() - timedelta(minutes=100)
            for i in range(1, 505):
                db_session.add(ForumReply(
                    content=f"测试回复 #{i}", user_id=admin.id,
                    thread_id=test_thread.id, timestamp=base_reply + timedelta(minutes=i),
                ))
            db_session.commit()
            log_admin_action("创建了测试帖子和504条回复")
    except Exception as e:
        logging.getLogger('stellarsis').error(f"创建测试数据失败: {e}")
        db_session.rollback()
