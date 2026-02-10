"""
Utility functions for Stellarsis.
"""

import html
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import current_app

from stellarsis.extensions import db_session


def utcnow():
    """Return the current UTC time as a naive datetime."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_utc_isoformat(dt):
    """Convert a naive-UTC datetime to an ISO 8601 string with Z suffix.

    The database stores naive datetimes that are implicitly UTC.
    This function makes the timezone explicit by appending ``Z``.
    """
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat() + 'Z'


# ------------------------------------------------------------------
# Content sanitization
# ------------------------------------------------------------------

def sanitize_content(content, room_id=None):
    """Strip HTML tags while preserving code blocks, LaTeX and @quote references.

    Args:
        content: Raw user-submitted content.
        room_id: If provided, validate that ``@quote{id}`` references exist
            within this chat room.
    """
    from stellarsis.models import ChatMessage

    if not content:
        return ""
    if not isinstance(content, str):
        try:
            content = str(content)
        except Exception:
            return ""
    try:
        content = html.unescape(content)
    except Exception:
        pass

    placeholders: dict[str, str] = {}

    # Protect code blocks (``` ... ``` and ` ... `)
    def _protect_code_blocks(text):
        result = []
        i = 0
        n = len(text)
        while i < n:
            if text[i:i + 3] == '```':
                end = text.find('```', i + 3)
                if end == -1:
                    result.append(text[i:])
                    break
                key = f"__CODEBLOCK_{len(placeholders)}__"
                placeholders[key] = text[i:end + 3]
                result.append(key)
                i = end + 3
            elif text[i] == '`':
                j = i + 1
                while j < n and text[j] != '`':
                    j += 1
                if j < n:
                    key = f"__INLINECODE_{len(placeholders)}__"
                    placeholders[key] = text[i:j + 1]
                    result.append(key)
                    i = j + 1
                else:
                    result.append(text[i:])
                    break
            else:
                result.append(text[i])
                i += 1
        return ''.join(result)

    content = _protect_code_blocks(content)

    # Protect LaTeX expressions
    latex_pattern = r'\$[^\$]*?\$|\$\$[^\$]*?\$\$|\\\(.*?\\\)|\\\[.*?\\\]'

    def _replace_latex(match):
        key = f"__LATEX_{len(placeholders)}__"
        placeholders[key] = match.group(0)
        return key

    content = re.sub(latex_pattern, _replace_latex, content, flags=re.MULTILINE)

    # Protect / validate @quote references
    quote_pattern = r'@quote\{(\d+)\}'

    def _replace_quote(match):
        quote_id = int(match.group(1))
        if room_id is not None:
            quoted = db_session.query(ChatMessage).filter_by(id=quote_id, room_id=room_id).first()
            if not quoted:
                return ''
        key = f"__QUOTE_{len(placeholders)}__"
        placeholders[key] = match.group(0)
        return key

    content = re.sub(quote_pattern, _replace_quote, content, flags=re.MULTILINE)

    # Escape remaining HTML
    content = html.escape(content, quote=True)

    # Restore protected sections
    for key, original in placeholders.items():
        content = content.replace(key, original)

    return content


# ------------------------------------------------------------------
# Online / real-time helpers
# ------------------------------------------------------------------

def get_room_users_data(room_id):
    """Return a list of user-info dicts for users currently online in *room_id*."""
    from stellarsis.models import ChatLastView, User

    cutoff = utcnow() - timedelta(seconds=current_app.config.get('ONLINE_TIMEOUT', 30))
    views = db_session.query(ChatLastView).filter(
        ChatLastView.room_id == room_id,
        ChatLastView.last_view >= cutoff,
    ).all()
    user_ids = [v.user_id for v in views]
    if not user_ids:
        return []
    users = db_session.query(User).filter(User.id.in_(user_ids)).all()
    return [
        {
            'id': u.id,
            'username': u.username,
            'nickname': u.nickname or u.username,
            'color': u.color,
            'badge': u.badge,
        }
        for u in users
    ]


def get_online_users(room_id):
    """Alias for :func:`get_room_users_data`."""
    return get_room_users_data(room_id)


def get_global_online_count():
    """Return the number of users active within the heartbeat window."""
    from stellarsis.models import User

    cutoff = utcnow() - timedelta(seconds=current_app.config.get('ONLINE_TIMEOUT', 300))
    return db_session.query(User).filter(User.last_seen >= cutoff).count()


def broadcast_global_online_count():
    """Emit the global online count to all connected clients."""
    from stellarsis.extensions import socketio

    socketio.emit('global_online_count', {'count': get_global_online_count()})


def update_room_online_count(room_id):
    """Emit the current online-user list for *room_id*."""
    from stellarsis.extensions import socketio

    socketio.emit(
        'online_users',
        {'users': get_room_users_data(room_id)},
        room=f"room_{room_id}",
    )


def notify_followers_user_online(user):
    """Notify all followers that *user* has come online."""
    from stellarsis.extensions import socketio
    from stellarsis.models import UserFollow

    followers = db_session.query(UserFollow).filter_by(followed_id=user.id).all()
    for follow in followers:
        socketio.emit(
            'followed_user_online',
            {
                'user_id': user.id,
                'username': user.username,
                'nickname': user.nickname or user.username,
                'color': user.color,
                'badge': user.badge,
            },
            room=f"user_{follow.follower_id}",
        )


# ------------------------------------------------------------------
# File helpers
# ------------------------------------------------------------------

def allowed_image_extension(filename):
    """Check whether *filename* has an allowed image extension."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', set())


def allowed_file_extension(filename):
    """Check whether *filename* has an allowed file extension.

    When ``ALLOWED_FILE_EXTENSIONS`` is empty, uploading is denied unless
    ``ALLOW_ALL_FILE_EXTENSIONS`` is explicitly ``True``.
    """
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    allowed = current_app.config.get('ALLOWED_FILE_EXTENSIONS')
    if not allowed:
        return bool(current_app.config.get('ALLOW_ALL_FILE_EXTENSIONS', False))
    return ext in allowed


def is_image_extension(filename):
    """Return ``True`` if *filename* has an image extension."""
    return allowed_image_extension(filename)


def get_image_type(stream):
    """Detect the image type from file header bytes."""
    try:
        import imghdr
        stream.seek(0)
        header = stream.read(2048)
        stream.seek(0)
        t = imghdr.what(None, h=header)
        if t:
            return t
    except Exception:
        pass
    try:
        from PIL import Image
        stream.seek(0)
        img = Image.open(stream)
        fmt = img.format.lower() if img.format else None
        stream.seek(0)
        return fmt
    except Exception:
        pass
    return None


# ------------------------------------------------------------------
# Admin / logging helpers
# ------------------------------------------------------------------

def log_admin_action(action):
    """Record an admin action via the logging subsystem."""
    from flask_login import current_user

    mgr = current_app.config.get('_logger_manager')
    admin_lgr = current_app.config.get('_admin_logger')
    if admin_lgr:
        admin_lgr.log(action, user=current_user)
    elif mgr:
        mgr.system.info(f"管理员操作: {action}")
    else:
        current_app.logger.info(f"管理员操作: {action}")


def get_recent_logs(limit=10):
    """Return recent system log entries."""
    from logger_utils import get_recent_system_logs

    log_dir = Path(current_app.root_path) / 'logs'
    entries = get_recent_system_logs(log_dir, limit=limit)
    return [
        type('Log', (), {'timestamp': e.get('timestamp'), 'message': e.get('message')})()
        for e in entries
    ]
