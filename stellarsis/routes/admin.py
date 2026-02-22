"""
Admin routes (user management, chat/forum management, system, database, quotes).
"""

import csv
import io
import json
import os
import shutil
import sqlite3
import sys
import tempfile
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path

import importlib.metadata
from flask import (
    Blueprint, request, redirect, jsonify, session, send_file,
    send_from_directory, flash, current_app,
)
from flask_login import current_user, login_required

from stellarsis.extensions import db_session
from stellarsis.models import (
    User, ChatRoom, ChatMessage, ChatPermission,
    ForumSection, ForumThread, ForumReply, ForumPermission,
    UserFollow, ChatLastView, ForumLastView, UserImage,
)
from stellarsis.decorators import su_required
from stellarsis.permissions import (
    normalize_permission_value, PERMISSION_VALUES, grant_su_to_admins,
)
from stellarsis.utils import utcnow, log_admin_action, get_recent_logs, to_utc_isoformat

try:
    _flask_version = importlib.metadata.version("flask")
except importlib.metadata.PackageNotFoundError:
    _flask_version = "unknown"

bp = Blueprint('admin', __name__)


# ------------------------------------------------------------------
# SU verification
# ------------------------------------------------------------------

@bp.route('/admin/su', methods=['GET', 'POST'])
@login_required
def admin_su():
    su_expires = session.get('su_expires')
    if su_expires and time.time() <= su_expires:
        if request.method == 'POST':
            return jsonify({'success': True, 'message': 'SU验证有效'}), 200
        return redirect(request.args.get('next') or '/spa#/admin')

    if request.method == 'POST':
        password = request.form.get('password')
        if current_user.check_password(password):
            session['su_expires'] = time.time() + 300
            log_admin_action("SU验证成功")
            mgr = current_app.config.get('_logger_manager')
            if mgr:
                mgr.security.info(
                    f"管理员 {current_user.username}(ID:{current_user.id}) SU验证成功"
                )
            return jsonify({'success': True, 'message': 'SU验证成功'}), 200
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.security.warning(
                f"管理员 {current_user.username}(ID:{current_user.id}) SU验证失败（密码错误）"
            )
        return jsonify({'success': False, 'message': '密码错误'}), 401

    next_url = request.args.get('next') or '/spa#/admin'
    return redirect('/spa#/admin/su?next=' + next_url)


# ------------------------------------------------------------------
# System
# ------------------------------------------------------------------

@bp.route('/api/admin/system-info')
@login_required
@su_required
def get_system_info():
    try:
        try:
            import psutil
            mem = psutil.Process(os.getpid()).memory_info()
            memory_usage = f"{mem.rss / 1024 / 1024:.2f} MB"
        except ImportError:
            memory_usage = "psutil未安装"
        return jsonify(
            success=True,
            memory_usage=memory_usage,
            server_time=to_utc_isoformat(utcnow()),
            python_version=sys.version,
            flask_version=_flask_version,
        )
    except Exception as e:
        log_admin_action(f"获取系统信息失败: {e}")
        return jsonify(success=False, message='获取系统信息失败', error=str(e)), 500


@bp.route('/api/admin/clear-cache', methods=['POST'])
@login_required
@su_required
def clear_cache():
    try:
        db_session.expire_all()
        log_admin_action("管理员清除了系统缓存")
        return jsonify(success=True, message="缓存清除成功")
    except Exception as e:
        log_admin_action(f"清除缓存失败: {e}")
        return jsonify(success=False, message=f"清除缓存失败: {e}"), 500


@bp.route('/api/admin/restart', methods=['POST'])
@login_required
@su_required
def restart_server():
    if not current_app.config.get('ENABLE_SERVER_CONTROL', False):
        return jsonify(success=False, message="服务器重启已被管理员禁用"), 403
    try:
        log_admin_action("管理员请求重启服务器")

        def _restart():
            time.sleep(2)
            os._exit(0)

        threading.Thread(target=_restart).start()
        return jsonify(success=True, message="服务器正在重启")
    except Exception as e:
        log_admin_action(f"重启服务器失败: {e}")
        return jsonify(success=False, message=f"重启服务器失败: {e}"), 500


@bp.route('/api/admin/shutdown', methods=['POST'])
@login_required
@su_required
def shutdown_server():
    if not current_app.config.get('ENABLE_SERVER_CONTROL', False):
        return jsonify(success=False, message="服务器关停已被管理员禁用"), 403
    try:
        reason = (request.get_json() or {}).get('reason', '未指定原因')
        log_admin_action(f"服务器关停，原因: {reason}")

        def _shutdown():
            time.sleep(2)
            os._exit(0)

        threading.Thread(target=_shutdown).start()
        return jsonify(success=True, message="服务器正在关停", reason=reason)
    except Exception as e:
        log_admin_action(f"关停服务器失败: {e}")
        return jsonify(success=False, message=f"关停服务器失败: {e}"), 500


@bp.route('/api/admin/backup-database', methods=['POST'])
@login_required
@su_required
def backup_database():
    try:
        db_path = Path(current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        backup_dir = Path(current_app.root_path) / 'backups'
        backup_dir.mkdir(exist_ok=True)
        ts = utcnow().strftime('%Y%m%d_%H%M%S')
        backup_path = backup_dir / f"backup_{ts}.db"
        shutil.copy2(db_path, backup_path)
        log_admin_action(f"数据库备份成功: {backup_path}")
        return jsonify(success=True, message="数据库备份成功", backup_path=str(backup_path))
    except Exception as e:
        log_admin_action(f"数据库备份失败: {e}")
        return jsonify(success=False, message=f"数据库备份失败: {e}"), 500


@bp.route('/api/admin/system-log')
@login_required
@su_required
def get_system_log():
    try:
        logs = get_recent_logs(50)
        return jsonify(success=True, logs=[
            {'timestamp': l.timestamp.isoformat() + 'Z', 'message': l.message} for l in logs
        ])
    except Exception as e:
        return jsonify(success=False, message=f"获取系统日志失败: {e}"), 500


@bp.route('/api/admin/optimize-database', methods=['POST'])
@login_required
@su_required
def optimize_database():
    try:
        db_path = current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        conn.execute("VACUUM")
        conn.commit()
        conn.close()
        log_admin_action("数据库优化成功")
        return jsonify(success=True, message="数据库优化成功")
    except Exception as e:
        log_admin_action(f"数据库优化失败: {e}")
        return jsonify(success=False, message=f"数据库优化失败: {e}"), 500


# ------------------------------------------------------------------
# Download
# ------------------------------------------------------------------

@bp.route('/down')
@login_required
@su_required
def download_root_zip():
    try:
        root = Path(current_app.root_path)
        exclude = {'venv', '.venv', 'node_modules', '.git', 'logs',
                    current_app.config.get('UPLOAD_FOLDER', 'static/uploads')}
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        tmp.close()
        import zipfile
        try:
            with zipfile.ZipFile(tmp.name, 'w', zipfile.ZIP_DEFLATED) as zf:
                for base, dirs, files in os.walk(root):
                    rel = os.path.relpath(base, root)
                    if any(
                        rel == ex
                        or rel.startswith(ex + os.sep)
                        or rel.split(os.sep)[0] == ex
                        for ex in exclude
                    ):
                        continue
                    for fname in files:
                        if fname.endswith(('.pyc', '.pyo')):
                            continue
                        zf.write(os.path.join(base, fname), os.path.relpath(os.path.join(base, fname), root))
            resp = send_file(tmp.name, as_attachment=True, download_name='project-root.zip')

            def _cleanup(p=tmp.name):
                time.sleep(10)
                try:
                    os.remove(p)
                except Exception:
                    # Best-effort temp file cleanup; OS will reclaim on reboot.
                    pass

            threading.Thread(target=_cleanup, daemon=True).start()
            return resp
        except Exception:
            try:
                os.remove(tmp.name)
            except Exception:
                # Best-effort temp file cleanup before re-raising.
                pass
            raise
    except Exception as e:
        current_app.logger.exception('打包项目根目录失败')
        return jsonify(success=False, message=str(e)), 500


@bp.route('/downdb')
@login_required
@su_required
def download_db_file():
    try:
        uri = current_app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if not uri.startswith('sqlite:///'):
            return jsonify(success=False, message='仅支持 SQLite 数据库下载'), 400
        db_path = uri.replace('sqlite:///', '')
        if not os.path.isabs(db_path):
            db_path = os.path.join(current_app.root_path, db_path)
        if not os.path.exists(db_path):
            return jsonify(success=False, message='数据库文件不存在'), 404
        log_admin_action(f"管理员 {current_user.username} 下载了数据库文件")
        return send_from_directory(os.path.dirname(db_path), os.path.basename(db_path), as_attachment=True)
    except Exception as e:
        current_app.logger.exception('下载数据库失败')
        return jsonify(success=False, message=str(e)), 500


# ------------------------------------------------------------------
# User management
# ------------------------------------------------------------------

@bp.route('/api/admin/users', methods=['GET'])
@login_required
@su_required
def list_all_users():
    try:
        users = db_session.query(User).order_by(User.id).all()
        return jsonify(success=True, users=[
            {
                'id': u.id, 'username': u.username, 'nickname': u.nickname,
                'color': u.color, 'badge': u.badge, 'role': u.role,
                'created_at': (u.created_at.isoformat() + 'Z') if u.created_at else None,
            }
            for u in users
        ])
    except Exception as e:
        current_app.logger.exception('获取用户列表失败')
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/admin/users', methods=['POST'])
@login_required
@su_required
def create_user():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        nickname = data.get('nickname', '').strip()
        color = data.get('color', '#000000')
        badge = data.get('badge', '').strip()
        role = data.get('role', 'user').lower()

        if not username or len(username) < 3:
            return jsonify(success=False, message="用户名至少3个字符"), 400
        if not password or len(password) < 6:
            return jsonify(success=False, message="密码至少6个字符"), 400
        if db_session.query(User).filter_by(username=username).first():
            return jsonify(success=False, message="用户名已存在"), 400
        if role not in ('user', 'admin'):
            return jsonify(success=False, message="角色必须是 'user' 或 'admin'"), 400

        new_user = User(username=username, nickname=nickname, color=color, badge=badge, role=role)
        new_user.set_password(password)
        db_session.add(new_user)
        db_session.commit()
        if new_user.role == 'admin':
            grant_su_to_admins()
        log_admin_action(f"创建了新用户: {username}")
        return jsonify(success=True, message=f"用户 {username} 创建成功", user_id=new_user.id)
    except Exception as e:
        current_app.logger.error(f"创建用户失败: {e}")
        return jsonify(success=False, message=f"创建用户失败: {e}"), 500


@bp.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@login_required
@su_required
def update_user(user_id):
    try:
        user = db_session.get(User, user_id)
        if not user:
            return jsonify(success=False, message="用户不存在"), 404
        data = request.get_json()
        if data.get('username'):
            user.username = data['username']
        if data.get('nickname'):
            user.nickname = data['nickname']
        if data.get('color'):
            user.color = data['color']
        if data.get('badge'):
            user.badge = data['badge']
        db_session.commit()
        log_admin_action(f"更新了用户 {user.username} 的信息")
        return jsonify(success=True, message="用户信息更新成功")
    except Exception as e:
        return jsonify(success=False, message=f"更新用户失败: {e}"), 500


@bp.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@login_required
@su_required
def delete_user(user_id):
    try:
        ok, msg = remove_user_and_related(user_id)
        if ok:
            log_admin_action(f"删除了用户 {msg}")
            return jsonify(success=True, message="用户删除成功")
        return jsonify(success=False, message=msg), 400
    except Exception as e:
        return jsonify(success=False, message=f"删除用户失败: {e}"), 500


@bp.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@login_required
@su_required
def update_user_role(user_id):
    try:
        user = db_session.get(User, user_id)
        if not user:
            return jsonify(success=False, message="用户不存在"), 404
        new_role = (request.get_json() or {}).get('role', '').lower()
        if new_role not in ('user', 'admin'):
            return jsonify(success=False, message="角色必须是 'user' 或 'admin'"), 400
        if user.id == 1 and new_role != 'admin':
            return jsonify(success=False, message="不能修改超级管理员的角色"), 400
        old_role = user.role
        user.role = new_role
        if old_role == 'admin' and new_role != 'admin':
            for p in db_session.query(ChatPermission).filter_by(user_id=user.id).all():
                p.perm = 'Null'
            for p in db_session.query(ForumPermission).filter_by(user_id=user.id).all():
                p.perm = 'Null'
        db_session.commit()
        if new_role == 'admin':
            grant_su_to_admins()
        log_admin_action(f"修改用户 {user.username} 的角色: {old_role} -> {new_role}")
        return jsonify(success=True, message=f"用户 {user.username} 的角色已更新为 {new_role}")
    except Exception as e:
        current_app.logger.error(f"更新用户角色失败: {e}")
        return jsonify(success=False, message=f"更新用户角色失败: {e}"), 500


@bp.route('/api/admin/users/<int:user_id>/permissions', methods=['GET'])
@login_required
@su_required
def get_user_permissions_detail(user_id):
    user = db_session.get(User, user_id)
    if not user:
        return jsonify(success=False, message="用户不存在"), 404
    cp = {p.room_id: p.perm for p in db_session.query(ChatPermission).filter_by(user_id=user_id).all()}
    fp = {p.section_id: p.perm for p in db_session.query(ForumPermission).filter_by(user_id=user_id).all()}
    chat_data = [{'id': r.id, 'name': r.name, 'description': r.description, 'perm': cp.get(r.id, 'Null')}
                 for r in db_session.query(ChatRoom).all()]
    forum_data = [{'id': s.id, 'name': s.name, 'description': s.description, 'perm': fp.get(s.id, 'Null')}
                  for s in db_session.query(ForumSection).all()]
    return jsonify(success=True, user={'id': user.id, 'username': user.username, 'role': user.role},
                   chat=chat_data, forum=forum_data)


@bp.route('/api/admin/users/<int:user_id>/permissions', methods=['PUT'])
@login_required
@su_required
def update_user_permissions(user_id):
    user = db_session.get(User, user_id)
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
        if not db_session.get(ChatRoom, target_id):
            return jsonify(success=False, message="聊天室不存在"), 404
        existing = db_session.query(ChatPermission).filter_by(user_id=user.id, room_id=target_id).first()
        if perm_value == 'Null':
            if existing:
                db_session.delete(existing)
        elif existing:
            existing.perm = perm_value
        else:
            db_session.add(ChatPermission(user_id=user.id, room_id=target_id, perm=perm_value))
    else:
        if not db_session.get(ForumSection, target_id):
            return jsonify(success=False, message="贴吧分区不存在"), 404
        existing = db_session.query(ForumPermission).filter_by(user_id=user.id, section_id=target_id).first()
        if perm_value == 'Null':
            if existing:
                db_session.delete(existing)
        elif existing:
            existing.perm = perm_value
        else:
            db_session.add(ForumPermission(user_id=user.id, section_id=target_id, perm=perm_value))

    db_session.commit()
    log_admin_action(f"管理员 {current_user.username} 更新用户 {user.username} 的 {scope} 权限")
    return jsonify(success=True, message="权限已更新", perm=perm_value)


@bp.route('/api/search_users')
@login_required
def api_search_users():
    q = (request.args.get('username') or '').strip()
    if not q:
        return jsonify(success=True, users=[])
    try:
        pattern = f"%{q}%"
        users = db_session.query(User).filter(
            (User.username.ilike(pattern)) | (User.nickname.ilike(pattern))
        ).limit(20).all()
        return jsonify(success=True, users=[
            {'id': u.id, 'username': u.username, 'nickname': u.nickname} for u in users
        ])
    except Exception as e:
        current_app.logger.exception('搜索用户失败')
        return jsonify(success=False, message=str(e)), 500


@bp.route('/admin/import_users', methods=['POST'])
@login_required
@su_required
def admin_import_users():
    if 'file' not in request.files:
        flash('未选择文件', 'danger')
        return redirect('/spa#/admin')
    file = request.files['file']
    if file.filename == '':
        flash('未选择文件', 'danger')
        return redirect('/spa#/admin')

    success_list, failed_list = [], []
    try:
        stream = io.StringIO(file.stream.read().decode('utf-8'))
        for row in csv.DictReader(stream):
            username = row.get('username', '').strip()
            password = row.get('password', '').strip()
            nickname = row.get('nickname', '').strip()
            role = row.get('role', 'user').strip().lower()
            if not username or not password:
                failed_list.append({'username': username, 'reason': '用户名或密码缺失'})
                continue
            if role not in ('user', 'admin'):
                failed_list.append({'username': username, 'reason': '角色无效'})
                continue
            if db_session.query(User).filter_by(username=username).first():
                failed_list.append({'username': username, 'reason': '用户名已存在'})
                continue
            try:
                cutoff = current_app.config.get('ONLINE_TIMEOUT', 300)
                new_user = User(
                    username=username, nickname=nickname, role=role,
                    last_seen=utcnow() - timedelta(seconds=cutoff + 1),
                )
                new_user.set_password(password)
                db_session.add(new_user)
                db_session.commit()
                success_list.append(username)
            except Exception as e:
                db_session.rollback()
                failed_list.append({'username': username, 'reason': str(e)})
        flash(
            f'成功导入 {len(success_list)} 个用户，失败 {len(failed_list)} 个',
            'success' if not failed_list else 'warning',
        )
        log_admin_action(
            f"批量导入用户: 成功={len(success_list)}, 失败={len(failed_list)}, "
            f"成功列表={success_list}"
        )
        if failed_list:
            session['import_failed'] = failed_list
        else:
            session.pop('import_failed', None)
    except Exception as e:
        flash(f'导入失败: {e}', 'danger')
    return redirect('/spa#/admin')


# ------------------------------------------------------------------
# Chat room management
# ------------------------------------------------------------------

@bp.route('/api/admin/chat/rooms', methods=['GET'])
@login_required
@su_required
def get_chat_rooms():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        rooms = db_session.query(ChatRoom).order_by(ChatRoom.id.asc()).all()
        return jsonify(success=True, rooms=[
            {'id': r.id, 'name': r.name, 'description': r.description or ''} for r in rooms
        ])
    except Exception as e:
        current_app.logger.error(f"获取聊天室列表失败: {e}")
        return jsonify(success=False, message=f"获取聊天室列表失败: {e}"), 500


@bp.route('/api/admin/chat/rooms', methods=['POST'])
@login_required
@su_required
def create_chat_room():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        if not name:
            return jsonify(success=False, message="聊天室名称不能为空"), 400
        if db_session.query(ChatRoom).filter_by(name=name).first():
            return jsonify(success=False, message="聊天室名称已存在"), 400
        room = ChatRoom(name=name, description=description)
        db_session.add(room)
        db_session.commit()
        grant_su_to_admins()
        log_admin_action(f"创建了聊天室 {room.name}")
        return jsonify(success=True, message=f"聊天室 {room.name} 创建成功",
                       room={'id': room.id, 'name': room.name, 'description': room.description})
    except Exception as e:
        current_app.logger.error(f"创建聊天室失败: {e}")
        return jsonify(success=False, message=f"创建聊天室失败: {e}"), 500


@bp.route('/api/admin/chat/rooms/<int:room_id>', methods=['PUT'])
@login_required
@su_required
def update_chat_room(room_id):
    try:
        room = db_session.get(ChatRoom, room_id)
        if not room:
            return jsonify(success=False, message="聊天室不存在"), 404
        data = request.get_json()
        name = data.get('name', '').strip()
        if not name:
            return jsonify(success=False, message="聊天室名称不能为空"), 400
        old = room.name
        room.name = name
        room.description = data.get('description', '').strip()
        db_session.commit()
        log_admin_action(f"修改聊天室 {old} -> {name}")
        return jsonify(success=True, message=f"聊天室 {name} 更新成功")
    except Exception as e:
        current_app.logger.error(f"更新聊天室失败: {e}")
        return jsonify(success=False, message=f"更新聊天室失败: {e}"), 500


@bp.route('/api/admin/chat/rooms/<int:room_id>', methods=['DELETE'])
@login_required
@su_required
def delete_chat_room(room_id):
    try:
        room = db_session.get(ChatRoom, room_id)
        if not room:
            return jsonify(success=False, message="聊天室不存在"), 404
        if room.id == 1:
            return jsonify(success=False, message="不能删除默认聊天室"), 400
        name = room.name
        db_session.delete(room)
        db_session.commit()
        log_admin_action(f"删除了聊天室: {name}")
        return jsonify(success=True, message=f"聊天室 {name} 删除成功")
    except Exception as e:
        current_app.logger.error(f"删除聊天室失败: {e}")
        return jsonify(success=False, message=f"删除聊天室失败: {e}"), 500


@bp.route('/api/admin/chat/messages', methods=['DELETE'])
@login_required
@su_required
def delete_chat_messages():
    try:
        room_id = request.args.get('room_id', type=int)
        before_date = request.args.get('before', type=str)
        q = db_session.query(ChatMessage)
        if room_id:
            q = q.filter(ChatMessage.room_id == room_id)
        if before_date:
            before_dt = datetime.fromisoformat(before_date.replace('Z', '+00:00'))
            q = q.filter(ChatMessage.timestamp < before_dt)
        deleted = q.delete()
        db_session.commit()
        log_admin_action(f"清空聊天消息: {deleted} 条消息被删除")
        return jsonify(success=True, message=f"成功删除 {deleted} 条聊天消息")
    except Exception as e:
        current_app.logger.error(f"删除聊天消息失败: {e}")
        return jsonify(success=False, message=f"删除聊天消息失败: {e}"), 500


@bp.route('/api/admin/chat/room-users/<int:room_id>')
@login_required
@su_required
def api_admin_chat_room_users(room_id):
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        users = db_session.query(User).order_by(User.id.asc()).all()
        perms = {p.user_id: p.perm for p in db_session.query(ChatPermission).filter_by(room_id=room_id).all()}
        return jsonify(success=True, users=[
            {'id': u.id, 'username': u.username, 'nickname': u.nickname or u.username, 'perm': perms.get(u.id, 'Null')}
            for u in users
        ])
    except Exception as e:
        current_app.logger.exception('获取聊天室用户失败')
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/admin/chat/section-users/<int:room_id>')
@login_required
@su_required
def api_admin_chat_section_users(room_id):
    """Alias endpoint for admin UI symmetry."""
    return api_admin_chat_room_users(room_id)


# ------------------------------------------------------------------
# Forum section management
# ------------------------------------------------------------------

@bp.route('/api/admin/forum/sections', methods=['GET'])
@login_required
@su_required
def api_admin_forum_sections_list():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        sections = db_session.query(ForumSection).order_by(ForumSection.id.asc()).all()
        return jsonify(success=True, sections=[
            {'id': s.id, 'name': s.name, 'description': s.description or ''} for s in sections
        ])
    except Exception as e:
        current_app.logger.exception('获取分区列表失败')
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/admin/forum/sections', methods=['POST'])
@login_required
@su_required
def create_forum_section():
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        if not name:
            return jsonify(success=False, message="分区名称不能为空"), 400
        if db_session.query(ForumSection).filter_by(name=name).first():
            return jsonify(success=False, message="分区名称已存在"), 400
        sec = ForumSection(name=name, description=description)
        db_session.add(sec)
        db_session.commit()
        grant_su_to_admins()
        log_admin_action(f"创建了贴吧分区 {sec.name}")
        return jsonify(success=True, message=f"贴吧分区 {sec.name} 创建成功",
                       section={'id': sec.id, 'name': sec.name, 'description': sec.description})
    except Exception as e:
        return jsonify(success=False, message=f"创建贴吧分区失败: {e}"), 500


@bp.route('/api/admin/forum/sections/<int:section_id>', methods=['PUT'])
@login_required
@su_required
def update_forum_section(section_id):
    if not current_user.is_admin():
        return jsonify(success=False, message="权限不足"), 403
    try:
        sec = db_session.get(ForumSection, section_id)
        if not sec:
            return jsonify(success=False, message="贴吧分区不存在"), 404
        data = request.get_json()
        if data.get('name'):
            sec.name = data['name']
        if data.get('description'):
            sec.description = data['description']
        db_session.commit()
        log_admin_action(f"更新了贴吧分区 {sec.name} 的信息")
        return jsonify(success=True, message="贴吧分区信息更新成功")
    except Exception as e:
        return jsonify(success=False, message=f"更新贴吧分区失败: {e}"), 500


@bp.route('/api/admin/forum/sections/<int:section_id>', methods=['DELETE'])
@login_required
@su_required
def delete_forum_section(section_id):
    try:
        sec = db_session.get(ForumSection, section_id)
        if not sec:
            return jsonify(success=False, message="贴吧分区不存在"), 404
        if sec.id == 1:
            return jsonify(success=False, message="不能删除默认贴吧分区"), 400
        for t in db_session.query(ForumThread).filter_by(section_id=section_id).all():
            db_session.query(ForumReply).filter_by(thread_id=t.id).delete()
        db_session.query(ForumThread).filter_by(section_id=section_id).delete()
        db_session.delete(sec)
        db_session.commit()
        log_admin_action(f"删除了贴吧分区 {sec.name}")
        return jsonify(success=True, message="贴吧分区删除成功")
    except Exception as e:
        return jsonify(success=False, message=f"删除贴吧分区失败: {e}"), 500


@bp.route('/api/admin/forum/posts/<int:post_id>', methods=['DELETE'])
@login_required
@su_required
def delete_forum_post(post_id):
    try:
        thread = db_session.get(ForumThread, post_id)
        if thread:
            db_session.query(ForumReply).filter_by(thread_id=thread.id).delete()
            db_session.delete(thread)
            msg = f"删除了贴吧主题帖: {thread.title}"
        else:
            reply = db_session.get(ForumReply, post_id)
            if not reply:
                return jsonify(success=False, message="帖子或回复不存在"), 404
            db_session.delete(reply)
            msg = "删除了贴吧回复"
        db_session.commit()
        log_admin_action(msg)
        return jsonify(success=True, message="删除成功")
    except Exception as e:
        return jsonify(success=False, message=f"删除失败: {e}"), 500


@bp.route('/api/admin/forum/section-users/<int:section_id>')
@login_required
@su_required
def api_admin_forum_section_users(section_id):
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        sec = db_session.get(ForumSection, section_id)
        if not sec:
            return jsonify(success=False, message='分区不存在'), 404
        users = db_session.query(User).order_by(User.id.asc()).all()
        perms = {p.user_id: p.perm for p in db_session.query(ForumPermission).filter_by(section_id=section_id).all()}
        return jsonify(success=True, users=[
            {'id': u.id, 'username': u.username, 'nickname': u.nickname or u.username, 'perm': perms.get(u.id, 'Null')}
            for u in users
        ])
    except Exception as e:
        current_app.logger.exception('获取分区用户失败')
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/admin/recount-file-size', methods=['POST'])
@login_required
@su_required
def api_admin_recount_file_size():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        images = db_session.query(UserImage).all()
        totals: dict[int, int] = {}
        updated = set()
        total_files = 0
        for im in images:
            total_files += 1
            try:
                actual = Path(im.filepath).stat().st_size if Path(im.filepath).exists() else 0
            except Exception:
                actual = 0
            if im.file_size != actual:
                im.file_size = actual
                db_session.add(im)
                updated.add(im.user_id)
            totals[im.user_id] = totals.get(im.user_id, 0) + actual
        db_session.commit()
        return jsonify(success=True, totals=totals, updated_users=len(updated), total_files=total_files)
    except Exception as e:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('按文件重新统计失败')
        return jsonify(success=False, message=str(e)), 500


# ------------------------------------------------------------------
# Database browser
# ------------------------------------------------------------------

@bp.route('/api/admin/db/tables')
@login_required
@su_required
def get_db_tables():
    try:
        conn = sqlite3.connect(current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        tables = [r[0] for r in cur.fetchall()]
        conn.close()
        return jsonify(success=True, tables=tables)
    except Exception as e:
        return jsonify(success=False, message=f'获取表列表失败: {e}'), 500


@bp.route('/api/admin/db/tables/<table_name>')
@login_required
@su_required
def db_table_data(table_name):
    conn = sqlite3.connect(current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid = [r[0] for r in cur.fetchall()]
    if table_name not in valid:
        conn.close()
        return jsonify(success=False, message="表不存在"), 404
    offset = request.args.get('offset', 0, type=int)
    limit = min(request.args.get('limit', 50, type=int), 100)
    cur.execute(f"PRAGMA table_info({table_name});")
    cols = [c[1] for c in cur.fetchall()]
    cur.execute(f"SELECT * FROM {table_name} ORDER BY id DESC LIMIT {limit} OFFSET {offset};")
    rows = cur.fetchall()
    conn.close()
    data = [dict(zip(cols, row)) for row in rows]
    return jsonify(success=True, data=data, columns=cols)


@bp.route('/admin/db/table/<table_name>/data')
@login_required
@su_required
def db_table_data_legacy(table_name):
    return db_table_data(table_name)


@bp.route('/admin/db/table/<table_name>/edit', methods=['POST'])
@login_required
@su_required
def db_table_edit(table_name):
    conn = sqlite3.connect(current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid = [r[0] for r in cur.fetchall()]
    if table_name not in valid:
        conn.close()
        return jsonify(success=False, message="表不存在"), 404
    data = request.get_json()
    if not data:
        conn.close()
        return jsonify(success=False, message="无效数据"), 400
    record_id = data.get('id')
    if not record_id:
        conn.close()
        return jsonify(success=False, message="记录ID不能为空"), 400
    cur.execute(f"PRAGMA table_info({table_name});")
    pk = next((c[1] for c in cur.fetchall() if c[5] == 1), 'id')
    updates, values = [], []
    for k, v in data.items():
        if k != 'id':
            updates.append(f"{k} = ?")
            values.append(v)
    if not updates:
        conn.close()
        return jsonify(success=False, message="没有要更新的字段"), 400
    values.append(record_id)
    try:
        cur.execute(f"UPDATE {table_name} SET {', '.join(updates)} WHERE {pk} = ?", values)
        conn.commit()
        log_admin_action(f"修改了表 {table_name} 中ID为 {record_id} 的记录")
        return jsonify(success=True, message="记录更新成功")
    except Exception as e:
        conn.rollback()
        return jsonify(success=False, message=f"更新失败: {e}"), 500
    finally:
        conn.close()


@bp.route('/admin/db/table/<table_name>/delete', methods=['POST'])
@login_required
@su_required
def db_table_delete(table_name):
    conn = sqlite3.connect(current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    valid = [r[0] for r in cur.fetchall()]
    if table_name not in valid:
        conn.close()
        return jsonify(success=False, message="表不存在"), 404
    data = request.get_json()
    if not data or not data.get('id'):
        conn.close()
        return jsonify(success=False, message="记录ID不能为空"), 400
    cur.execute(f"PRAGMA table_info({table_name});")
    pk = next((c[1] for c in cur.fetchall() if c[5] == 1), 'id')
    try:
        cur.execute(f"DELETE FROM {table_name} WHERE {pk} = ?", (data['id'],))
        conn.commit()
        log_admin_action(f"删除了表 {table_name} 中ID为 {data['id']} 的记录")
        return jsonify(success=True, message="记录删除成功")
    except Exception as e:
        conn.rollback()
        return jsonify(success=False, message=f"删除失败: {e}"), 500
    finally:
        conn.close()


# ------------------------------------------------------------------
# Quotes management
# ------------------------------------------------------------------

def _quotes_path():
    """Return the absolute path to quotes.json."""
    return os.path.join(current_app.root_path, 'quotes.json')


@bp.route('/api/admin/quotes', methods=['GET'])
@login_required
@su_required
def api_get_quotes():
    try:
        with open(_quotes_path(), 'r', encoding='utf-8') as f:
            return jsonify(success=True, quotes=json.load(f).get('quotes', []))
    except FileNotFoundError:
        return jsonify(success=False, message="quotes.json文件不存在")
    except json.JSONDecodeError:
        return jsonify(success=False, message="quotes.json文件格式错误")


@bp.route('/api/admin/quotes', methods=['POST'])
@login_required
@su_required
def api_add_quote():
    data = request.get_json()
    text = data.get('text', '').strip()
    author = data.get('author', '').strip()
    if not text or not author:
        return jsonify(success=False, message="名言内容和作者不能为空")
    try:
        qp = _quotes_path()
        with open(qp, 'r', encoding='utf-8') as f:
            qd = json.load(f)
        qd['quotes'].append({'text': text, 'author': author})
        with open(qp, 'w', encoding='utf-8') as f:
            json.dump(qd, f, ensure_ascii=False, indent=2)
        log_admin_action(f"添加名言: {text} - {author}")
        return jsonify(success=True, message="名言添加成功")
    except Exception as e:
        current_app.logger.error(f"添加名言失败: {e}")
        return jsonify(success=False, message=f"添加名言失败: {e}")


@bp.route('/api/admin/quotes/<int:idx>', methods=['PUT'])
@login_required
@su_required
def api_update_quote(idx):
    data = request.get_json()
    text = data.get('text', '').strip()
    author = data.get('author', '').strip()
    if not text or not author:
        return jsonify(success=False, message="名言内容和作者不能为空")
    try:
        qp = _quotes_path()
        with open(qp, 'r', encoding='utf-8') as f:
            qd = json.load(f)
        quotes = qd.get('quotes', [])
        if idx < 0 or idx >= len(quotes):
            return jsonify(success=False, message="名言索引超出范围")
        old = quotes[idx]
        quotes[idx] = {'text': text, 'author': author}
        with open(qp, 'w', encoding='utf-8') as f:
            json.dump(qd, f, ensure_ascii=False, indent=2)
        log_admin_action(f"更新名言: {old['text']} -> {text}")
        return jsonify(success=True, message="名言更新成功")
    except Exception as e:
        current_app.logger.error(f"更新名言失败: {e}")
        return jsonify(success=False, message=f"更新名言失败: {e}")


@bp.route('/api/admin/quotes/<int:idx>', methods=['DELETE'])
@login_required
@su_required
def api_delete_quote(idx):
    try:
        qp = _quotes_path()
        with open(qp, 'r', encoding='utf-8') as f:
            qd = json.load(f)
        quotes = qd.get('quotes', [])
        if idx < 0 or idx >= len(quotes):
            return jsonify(success=False, message="名言索引超出范围")
        deleted = quotes.pop(idx)
        with open(qp, 'w', encoding='utf-8') as f:
            json.dump(qd, f, ensure_ascii=False, indent=2)
        log_admin_action(f"删除名言: {deleted['text']} - {deleted['author']}")
        return jsonify(success=True, message="名言删除成功")
    except Exception as e:
        current_app.logger.error(f"删除名言失败: {e}")
        return jsonify(success=False, message=f"删除名言失败: {e}")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def remove_user_and_related(user_id, sess=None):
    """Delete a user and all related data.

    Returns ``(True, username)`` or ``(False, error_message)``.
    """
    import logging
    sess = sess or db_session
    user = sess.get(User, user_id)
    if not user:
        return False, "用户不存在"
    if user.id == 1:
        return False, "不能删除超级管理员"
    try:
        sess.query(ChatMessage).filter_by(user_id=user_id).delete()
        sess.query(ForumThread).filter_by(user_id=user_id).delete()
        sess.query(ForumReply).filter_by(user_id=user_id).delete()
        sess.query(ChatPermission).filter_by(user_id=user_id).delete()
        sess.query(ForumPermission).filter_by(user_id=user_id).delete()
        sess.query(UserFollow).filter(
            (UserFollow.follower_id == user_id) | (UserFollow.followed_id == user_id)
        ).delete(synchronize_session=False)
        sess.query(ChatLastView).filter_by(user_id=user_id).delete()
        sess.query(ForumLastView).filter_by(user_id=user_id).delete()
        for ui in sess.query(UserImage).filter_by(user_id=user_id).all():
            try:
                p = Path(ui.filepath)
                if p.exists():
                    p.unlink()
            except Exception as e:
                logging.warning(f"Failed to delete user image file '{ui.filepath}': {e}")
        sess.query(UserImage).filter_by(user_id=user_id).delete()
        username = user.username
        sess.delete(user)
        sess.commit()
        return True, username
    except Exception as e:
        sess.rollback()
        return False, f"删除用户失败: {e}"
