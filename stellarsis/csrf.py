"""
Lightweight CSRF protection.

The SPA authenticates with a session cookie and talks to the backend through
``fetch()`` calls.  A per-session token is rendered into the page and compared
for every state-changing request.  Socket.IO polling POSTs are exempt because
they are protected by the Socket.IO handshake instead.
"""

import hmac
import secrets

from flask import jsonify, request, session

CSRF_SESSION_KEY = '_csrf_token'
CSRF_HEADER = 'X-CSRF-Token'
CSRF_FORM_FIELD = 'csrf_token'
SAFE_METHODS = frozenset({'GET', 'HEAD', 'OPTIONS', 'TRACE'})
EXEMPT_PATHS = ('/socket.io/',)


def get_csrf_token():
    """Return the CSRF token for the current session, creating it if needed."""
    token = session.get(CSRF_SESSION_KEY)
    if not token:
        token = secrets.token_urlsafe(32)
        session[CSRF_SESSION_KEY] = token
    return token


def _provided_token():
    token = request.headers.get(CSRF_HEADER)
    if not token:
        token = request.form.get(CSRF_FORM_FIELD, '')
    return token or ''


def _wants_json():
    if request.path.startswith('/api/'):
        return True
    if request.is_json:
        return True
    return request.accept_mimetypes.best == 'application/json'


def init_csrf(app):
    """Register the token helper and the request guard on *app*."""
    app.jinja_env.globals['csrf_token'] = get_csrf_token

    @app.before_request
    def _csrf_protect():
        if request.method in SAFE_METHODS:
            return None
        if any(request.path.startswith(prefix) for prefix in EXEMPT_PATHS):
            return None

        expected = session.get(CSRF_SESSION_KEY)
        provided = _provided_token()
        if expected and provided and hmac.compare_digest(str(expected), str(provided)):
            return None

        if _wants_json():
            return jsonify(success=False, message='CSRF 校验失败，请刷新页面后重试'), 403
        return 'CSRF 校验失败，请刷新页面后重试', 403
