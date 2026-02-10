"""
Socket.IO event handlers.
"""

import re
from datetime import timedelta

from flask import session, current_app
from flask_login import current_user
from flask_socketio import emit, join_room, leave_room

from stellarsis.extensions import db_session, socketio
from stellarsis.models import ChatMessage, ChatLastView
from stellarsis.permissions import user_can_view_chat, user_can_send_chat, get_chat_permission_value
from stellarsis.utils import (
    utcnow, sanitize_content, update_room_online_count,
    broadcast_global_online_count, notify_followers_user_online,
    get_online_users,
)


def register_events(sio):
    """Register all Socket.IO event handlers on *sio*."""

    @sio.on('connect')
    def handle_connect():
        if not current_user.is_authenticated:
            return False
        current_user.last_seen = utcnow()
        db_session.commit()
        join_room(f"user_{current_user.id}")
        session['receive_count'] = session.get('receive_count', 0) + 1
        emit('my_response', {'count': session['receive_count']})

    @sio.on('join')
    def on_join(data):
        if not current_user.is_authenticated:
            return
        try:
            room_id = int(data.get('room'))
        except (TypeError, ValueError):
            return
        if not user_can_view_chat(current_user, room_id):
            emit('permission_denied', {'message': '当前权限无法进入该聊天室', 'room_id': room_id})
            return

        room_name = f"room_{room_id}"
        join_room(room_name)
        current_user.last_seen = utcnow()

        now = utcnow()
        last = db_session.query(ChatLastView).filter_by(user_id=current_user.id, room_id=room_id).first()
        if last:
            last.last_view = now
        else:
            db_session.add(ChatLastView(user_id=current_user.id, room_id=room_id, last_view=now))
        db_session.commit()

        emit('user_join', {
            'user_id': current_user.id,
            'username': current_user.username,
            'nickname': current_user.nickname or current_user.username,
            'room_id': room_id,
        }, room=room_name)
        update_room_online_count(room_id)

    @sio.on('leave')
    def on_leave(data):
        if not current_user.is_authenticated:
            return
        try:
            room_id = int(data.get('room'))
        except (TypeError, ValueError):
            return
        room_name = f"room_{room_id}"
        leave_room(room_name)
        emit('user_leave', {
            'user_id': current_user.id,
            'username': current_user.username,
            'nickname': current_user.nickname or current_user.username,
            'room_id': room_id,
        }, room=room_name)

    @sio.on('send_message')
    def handle_message(data):
        if not current_user.is_authenticated:
            return
        try:
            room_id = int(data.get('room_id'))
        except (TypeError, ValueError):
            emit('error', {'message': '参数错误'})
            return
        content = data.get('message', '').strip()
        if not content:
            emit('error', {'message': '参数错误'})
            return
        if not user_can_send_chat(current_user, room_id):
            emit('error', {'message': '当前权限无法发送消息'})
            return
        if len(content) > 2000:
            emit('error', {'message': '消息过长'})
            return

        # Validate quote references
        quote_ids = [int(i) for i in re.findall(r'@quote\{(\d+)\}', content)]
        if quote_ids:
            valid = {
                m.id for m in db_session.query(ChatMessage.id).filter(
                    ChatMessage.id.in_(quote_ids), ChatMessage.room_id == room_id
                ).all()
            }
            if any(qid not in valid for qid in quote_ids):
                emit('error', {'message': '不能引用不存在的消息'})
                return

        content = sanitize_content(content, room_id)
        msg = ChatMessage(content=content, user_id=current_user.id, room_id=room_id)
        try:
            db_session.add(msg)
            db_session.commit()
        except Exception:
            db_session.rollback()
            mgr = current_app.config.get('_logger_manager')
            if mgr:
                mgr.chat.exception('保存聊天消息失败')
            emit('error', {'message': '服务器保存消息失败'})
            return

        room_name = f"room_{room_id}"
        client_id = data.get('client_id')
        payload = {
            'id': msg.id,
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat() + 'Z',
            'user_id': current_user.id,
            'username': current_user.username,
            'nickname': current_user.nickname or current_user.username,
            'color': current_user.color,
            'badge': current_user.badge,
        }
        if client_id:
            payload['client_id'] = client_id
        emit('message', payload, room=room_name, include_self=True)
        if client_id:
            from flask_socketio import emit as _emit
            from flask import request as flask_request
            _emit('message_id_response', {'client_id': client_id, 'server_id': msg.id}, to=flask_request.sid)

    @sio.on('delete_message')
    def handle_delete_message(data):
        if not current_user.is_authenticated:
            return
        try:
            message_id = int(data.get('message_id'))
            room_id = int(data.get('room_id'))
        except (TypeError, ValueError):
            emit('error', {'message': '参数错误'})
            return

        msg = db_session.query(ChatMessage).filter_by(id=message_id, room_id=room_id).first()
        if not msg:
            emit('error', {'message': '消息未找到'})
            return

        if current_user.is_admin():
            allowed = True
        else:
            perm = get_chat_permission_value(current_user, room_id)
            allowed = perm == 'su' or (perm == '777' and msg.user_id == current_user.id)

        if not allowed:
            emit('error', {'message': '权限不足'})
            return

        try:
            db_session.delete(msg)
            db_session.commit()
            mgr = current_app.config.get('_logger_manager')
            if mgr:
                mgr.chat.info(
                    f"用户 {current_user.id} 通过socket删除了聊天室消息 {message_id} 在房间 {room_id}"
                )
            emit('message_deleted', {
                'id': message_id, 'message_id': message_id,
                'room_id': room_id, 'deleted_by': current_user.id,
                'timestamp': utcnow().isoformat() + 'Z',
            }, room=f"room_{room_id}", include_self=True)
        except Exception:
            db_session.rollback()
            emit('error', {'message': '删除失败'})

    @sio.on('get_online_users')
    def handle_get_online_users(data):
        if not current_user.is_authenticated:
            return
        try:
            room_id = int(data.get('room_id'))
        except (TypeError, ValueError):
            return
        if not user_can_view_chat(current_user, room_id):
            emit('permission_denied', {'message': '当前权限无法查看该聊天室', 'room_id': room_id})
            return
        emit('online_users', {'users': get_online_users(room_id)})

    @sio.on('heartbeat_chat')
    def handle_heartbeat_chat(data):
        room_id = data.get('room_id')
        if current_user.is_authenticated and room_id:
            try:
                room_id = int(room_id)
                current_user.last_seen = utcnow()
                now = utcnow()
                last = db_session.query(ChatLastView).filter_by(
                    user_id=current_user.id, room_id=room_id,
                ).first()
                if last:
                    last.last_view = now
                else:
                    db_session.add(ChatLastView(user_id=current_user.id, room_id=room_id, last_view=now))
                db_session.commit()
                update_room_online_count(room_id)
            except Exception:
                db_session.rollback()

    @sio.on('heartbeat')
    def handle_heartbeat():
        if current_user.is_authenticated:
            cutoff = utcnow() - timedelta(seconds=current_app.config.get('ONLINE_TIMEOUT', 30))
            was_offline = current_user.last_seen is None or current_user.last_seen < cutoff
            current_user.last_seen = utcnow()
            db_session.commit()
            if was_offline:
                notify_followers_user_online(current_user)
            broadcast_global_online_count()
