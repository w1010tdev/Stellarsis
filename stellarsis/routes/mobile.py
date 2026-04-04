"""
Mobile-specific APIs (push token + notification center).
"""

import json

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from stellarsis.extensions import db_session
from stellarsis.models import MobilePushToken, UserNotification
from stellarsis.utils import utcnow, to_utc_isoformat, log_user_action

bp = Blueprint('mobile', __name__)


@bp.route('/api/mobile/push/token', methods=['POST'])
@login_required
def register_push_token():
    data = request.get_json(silent=True) or {}
    token = (data.get('token') or '').strip()
    if not token:
        return jsonify(success=False, message='token 不能为空'), 400

    platform = (data.get('platform') or 'android').strip().lower()[:32]
    device_id = (data.get('device_id') or '').strip()[:128]

    try:
        entry = db_session.query(MobilePushToken).filter_by(
            user_id=current_user.id,
            token=token,
        ).first()
        if entry:
            entry.platform = platform
            entry.device_id = device_id
            entry.enabled = 1
            entry.updated_at = utcnow()
        else:
            db_session.add(MobilePushToken(
                user_id=current_user.id,
                token=token,
                platform=platform,
                device_id=device_id,
                enabled=1,
                created_at=utcnow(),
                updated_at=utcnow(),
            ))
        db_session.commit()
        log_user_action("注册移动端推送 token")
        return jsonify(success=True)
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/mobile/push/token', methods=['DELETE'])
@login_required
def unregister_push_token():
    data = request.get_json(silent=True) or {}
    token = (data.get('token') or '').strip()
    if not token:
        return jsonify(success=False, message='token 不能为空'), 400
    try:
        entry = db_session.query(MobilePushToken).filter_by(
            user_id=current_user.id,
            token=token,
        ).first()
        if not entry:
            return jsonify(success=True, message='token 不存在')
        db_session.delete(entry)
        db_session.commit()
        log_user_action("注销移动端推送 token")
        return jsonify(success=True)
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/mobile/notifications')
@login_required
def list_notifications():
    limit = min(request.args.get('limit', 50, type=int), 100)
    offset = max(request.args.get('offset', 0, type=int), 0)
    read_filter = request.args.get('is_read')

    query = db_session.query(UserNotification).filter_by(user_id=current_user.id)
    if read_filter in ('0', '1'):
        query = query.filter_by(is_read=int(read_filter))
    rows = query.order_by(UserNotification.created_at.desc()).limit(limit).offset(offset).all()

    return jsonify(success=True, notifications=[
        {
            'id': n.id,
            'type': n.type,
            'title': n.title,
            'body': n.body,
            'payload': json.loads(n.payload_json or '{}'),
            'is_read': bool(n.is_read),
            'created_at': to_utc_isoformat(n.created_at),
            'read_at': to_utc_isoformat(n.read_at),
        }
        for n in rows
    ])


@bp.route('/api/mobile/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    row = db_session.query(UserNotification).filter_by(
        id=notification_id,
        user_id=current_user.id,
    ).first()
    if not row:
        return jsonify(success=False, message='通知不存在'), 404
    try:
        row.is_read = 1
        row.read_at = utcnow()
        db_session.commit()
        return jsonify(success=True)
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/mobile/notifications/read_all', methods=['POST'])
@login_required
def mark_notifications_read_all():
    try:
        rows = db_session.query(UserNotification).filter_by(
            user_id=current_user.id,
            is_read=0,
        ).all()
        now = utcnow()
        for row in rows:
            row.is_read = 1
            row.read_at = now
        db_session.commit()
        return jsonify(success=True, updated=len(rows))
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500
