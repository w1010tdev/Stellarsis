"""
Permission constants and helper functions.
"""

import logging

from stellarsis.extensions import db_session
from stellarsis.models import (
    User, ChatRoom, ChatPermission, ForumSection, ForumPermission,
)

PERMISSION_VALUES = {'su', '777', '444', 'Null'}
CHAT_SEND_PERMISSIONS = {'su', '777'}
CHAT_VIEW_PERMISSIONS = {'su', '777', '444'}
FORUM_POST_PERMISSIONS = {'su', '777'}
FORUM_VIEW_PERMISSIONS = {'su', '777', '444'}


def normalize_permission_value(value):
    """Normalize a permission string to one of ``su``, ``777``, ``444``, or ``Null``."""
    if value is None:
        return 'Null'
    v = str(value).strip()
    low = v.lower()
    if low == 'su':
        return 'su'
    if v in ('777', '444'):
        return v
    if low == 'null':
        return 'Null'
    return None


def get_chat_permission_value(user, room_id):
    """Return the effective chat permission for *user* in *room_id*."""
    if not user or room_id is None:
        return 'Null'
    if user.is_admin():
        return 'su'
    perm = db_session.query(ChatPermission).filter_by(user_id=user.id, room_id=room_id).first()
    return normalize_permission_value(perm.perm) if perm else 'Null'


def get_forum_permission_value(user, section_id):
    """Return the effective forum permission for *user* in *section_id*."""
    if not user or section_id is None:
        return 'Null'
    if user.is_admin():
        return 'su'
    perm = db_session.query(ForumPermission).filter_by(user_id=user.id, section_id=section_id).first()
    return normalize_permission_value(perm.perm) if perm else 'Null'


def user_can_view_chat(user, room_id):
    return get_chat_permission_value(user, room_id) in CHAT_VIEW_PERMISSIONS


def user_can_send_chat(user, room_id):
    return get_chat_permission_value(user, room_id) in CHAT_SEND_PERMISSIONS


def user_can_view_forum(user, section_id):
    return get_forum_permission_value(user, section_id) in FORUM_VIEW_PERMISSIONS


def user_can_post_forum(user, section_id):
    return get_forum_permission_value(user, section_id) in FORUM_POST_PERMISSIONS


def grant_su_to_admins():
    """Assign ``su`` permission for all admins across all rooms and sections."""
    logger = logging.getLogger('stellarsis.system')
    try:
        admins = db_session.query(User).filter_by(role='admin').all()
        rooms = db_session.query(ChatRoom).all()
        sections = db_session.query(ForumSection).all()
        for admin in admins:
            for room in rooms:
                existing = db_session.query(ChatPermission).filter_by(user_id=admin.id, room_id=room.id).first()
                if not existing:
                    db_session.add(ChatPermission(user_id=admin.id, room_id=room.id, perm='su'))
                else:
                    existing.perm = 'su'
            for sec in sections:
                existing = db_session.query(ForumPermission).filter_by(user_id=admin.id, section_id=sec.id).first()
                if not existing:
                    db_session.add(ForumPermission(user_id=admin.id, section_id=sec.id, perm='su'))
                else:
                    existing.perm = 'su'
        db_session.commit()
    except Exception as e:
        logger.error(f"为管理员分配权限失败: {e}")
