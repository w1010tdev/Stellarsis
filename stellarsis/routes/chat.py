"""
Chat routes.
"""

import html
import re

from flask import Blueprint, request, redirect, jsonify, abort, current_app
from flask_login import current_user, login_required

from stellarsis.extensions import db_session, socketio
from stellarsis.models import ChatRoom, ChatMessage
from stellarsis.permissions import (
    get_chat_permission_value, user_can_view_chat, user_can_send_chat,
)
from stellarsis.utils import (
    utcnow, to_utc_isoformat, sanitize_content, log_user_action, _get_client_ip,
    create_user_notification, get_room_notification_recipient_ids, safe_utf8_preview,
)

bp = Blueprint('chat', __name__)
NOTIFICATION_PREVIEW_LEN = 80


@bp.route('/chat')
@login_required
def chat_index():
    return redirect('/spa#/chat')


@bp.route('/chat/<int:room_id>')
@login_required
def chat_room(room_id):
    room = db_session.get(ChatRoom, room_id)
    if room is None:
        abort(404)
    if get_chat_permission_value(current_user, room_id) == 'Null':
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.security.warning(
                f"聊天室权限拒绝: 用户 {current_user.username}(ID:{current_user.id}) "
                f"尝试访问聊天室 {room_id} IP={_get_client_ip()}"
            )
        abort(403)
    return redirect(f'/spa#/chat/{room_id}')


@bp.route('/api/chat/<int:room_id>/history')
@login_required
def chat_history(room_id):
    if not user_can_view_chat(current_user, room_id):
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.security.warning(
                f"聊天历史权限拒绝: 用户 {current_user.username}(ID:{current_user.id}) "
                f"尝试获取聊天室 {room_id} 历史 IP={_get_client_ip()}"
            )
        return jsonify(success=False, message="权限不足"), 403

    limit = min(request.args.get('limit', 50, type=int), 100)
    page_param = request.args.get('page')

    def _serialize(msg):
        return {
            'id': msg.id,
            'content': html.unescape(msg.content) if isinstance(msg.content, str) else msg.content,
            'timestamp': to_utc_isoformat(msg.timestamp),
            'user_id': msg.user_id,
            'username': msg.user.username,
            'nickname': msg.user.nickname or msg.user.username,
            'color': msg.user.color,
            'badge': msg.user.badge,
        }

    if page_param is None:
        offset = request.args.get('offset', 0, type=int)
        messages = (
            db_session.query(ChatMessage)
            .filter_by(room_id=room_id)
            .order_by(ChatMessage.timestamp.asc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        return jsonify(messages=[_serialize(m) for m in messages])

    total_count = db_session.query(ChatMessage).filter_by(room_id=room_id).count()
    total_pages = max(1, (total_count + limit - 1) // limit)

    if isinstance(page_param, str) and page_param.lower() == 'last':
        page = max(0, total_pages - 1)
    else:
        try:
            page = int(page_param)
        except Exception:
            page = 0
    page = max(0, min(page, total_pages - 1))
    offset = page * limit

    messages = (
        db_session.query(ChatMessage)
        .filter_by(room_id=room_id)
        .order_by(ChatMessage.timestamp.asc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    has_more = (
        db_session.query(ChatMessage.id)
        .filter_by(room_id=room_id)
        .order_by(ChatMessage.timestamp.asc())
        .limit(1)
        .offset((page + 1) * limit)
        .count()
        > 0
    )
    return jsonify(
        messages=[_serialize(m) for m in messages],
        page=page,
        total_pages=total_pages,
        has_more=has_more,
    )


@bp.route('/api/chat/send', methods=['POST'])
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
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.security.warning(
                f"聊天发送权限拒绝: 用户 {current_user.username}(ID:{current_user.id}) "
                f"尝试在聊天室 {room_id} 发送消息 IP={_get_client_ip()}"
            )
        return jsonify(success=False, message="当前权限无法发送消息"), 403

    # Validate quote references
    quote_ids = [int(i) for i in re.findall(r'@quote\{(\d+)\}', message)]
    if quote_ids:
        valid = {
            m.id
            for m in db_session.query(ChatMessage.id).filter(
                ChatMessage.id.in_(quote_ids), ChatMessage.room_id == room_id
            ).all()
        }
        if any(qid not in valid for qid in quote_ids):
            return jsonify(success=False, message="不能引用不存在的消息"), 400

    message = sanitize_content(message, room_id)

    msg_obj = ChatMessage(content=message, user_id=current_user.id, room_id=room_id)
    try:
        db_session.add(msg_obj)
        db_session.commit()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.chat.info(
                f"用户 {current_user.username}(ID:{current_user.id}) "
                f"在聊天室 {room_id} 发送消息(ID:{msg_obj.id}), 长度={len(message)}"
            )
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.chat.exception('HTTP 保存聊天消息失败')
        return jsonify(success=False, message='服务器保存消息失败'), 500

    try:
        recipients = get_room_notification_recipient_ids(room_id, current_user.id)
        sender_name = current_user.nickname or current_user.username
        preview = safe_utf8_preview(message, NOTIFICATION_PREVIEW_LEN)
        for uid in recipients:
            create_user_notification(
                user_id=uid,
                notification_type='chat_message',
                title=f"{sender_name} 的新消息",
                body=preview,
                payload={'room_id': room_id, 'message_id': msg_obj.id},
            )
        db_session.commit()
    except Exception:
        db_session.rollback()

    return jsonify(success=True)


@bp.route('/api/chat/<int:room_id>/messages/<int:message_id>', methods=['DELETE'])
@login_required
def api_delete_chat_message(room_id, message_id):
    try:
        msg = db_session.query(ChatMessage).filter_by(id=message_id, room_id=room_id).first()
        if not msg:
            return jsonify({'success': False, 'message': '消息未找到'}), 404

        if current_user.is_admin():
            allowed = True
        else:
            perm = get_chat_permission_value(current_user, room_id)
            allowed = perm == 'su' or (perm == '777' and msg.user_id == current_user.id)

        if not allowed:
            mgr = current_app.config.get('_logger_manager')
            if mgr:
                mgr.security.warning(
                    f"聊天删除权限拒绝: 用户 {current_user.username}(ID:{current_user.id}) "
                    f"尝试删除消息(ID:{message_id}) 房间={room_id} IP={_get_client_ip()}"
                )
            return jsonify({'success': False, 'message': '权限不足'}), 403

        db_session.delete(msg)
        db_session.commit()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.chat.info(
                f"用户 {current_user.username}(ID:{current_user.id}) "
                f"删除了聊天室消息(ID:{message_id}) 在房间 {room_id}"
            )
        log_user_action(f"删除聊天消息(ID:{message_id}) 房间={room_id}")

        try:
            socketio.emit('message_deleted', {
                'id': message_id,
                'room_id': room_id,
                'deleted_by': current_user.id,
                'timestamp': utcnow().isoformat() + 'Z',
            })
        except Exception:
            if mgr:
                mgr.chat.exception('广播 message_deleted 失败')

        return jsonify({'success': True, 'message': '消息已删除'})
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.chat.exception('删除聊天室消息时发生错误')
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@bp.route('/api/chat/message/<int:message_id>')
@login_required
def api_get_chat_message(message_id):
    msg = db_session.query(ChatMessage).filter_by(id=message_id).first()
    if not msg:
        return jsonify(success=False, message='消息不存在'), 404
    user = msg.user
    return jsonify(success=True, message={
        'id': msg.id,
        'content': html.unescape(msg.content) if isinstance(msg.content, str) else msg.content,
        'timestamp': to_utc_isoformat(msg.timestamp),
        'user_id': msg.user_id,
        'username': user.username if user else None,
        'nickname': user.nickname if user else None,
        'color': user.color if user else None,
        'badge': user.badge if user else None,
    })


@bp.route('/api/chat/validate_quotes', methods=['POST'])
@login_required
def api_validate_quotes():
    data = request.get_json()
    room_id = data.get('room_id')
    quote_ids = data.get('quote_ids', [])
    if not room_id or not isinstance(quote_ids, list):
        return jsonify(success=False, message='参数错误'), 400

    valid = [
        m.id
        for m in db_session.query(ChatMessage.id).filter(
            ChatMessage.id.in_(quote_ids), ChatMessage.room_id == room_id
        ).all()
    ]
    return jsonify({'success': True, 'valid_quotes': valid})


@bp.route('/api/chat/<int:room_id>/online_count')
@login_required
def get_room_online_count(room_id):
    if not user_can_view_chat(current_user, room_id):
        return jsonify(success=False, message="权限不足"), 403
    from stellarsis.utils import get_room_users_data
    users_data = get_room_users_data(room_id)
    return jsonify({'count': len(users_data), 'users': users_data})
