"""
Custom decorators.
"""

import time
from functools import wraps

from flask import request, redirect, url_for, jsonify, session, abort
from flask_login import current_user


def su_required(f):
    """Require the current user to be an admin with a valid SU session."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin():
            abort(403)

        if request.endpoint == 'admin.admin_su':
            return f(*args, **kwargs)

        su_expires = session.get('su_expires')
        if su_expires is None or time.time() > su_expires:
            if request.is_json or request.path.startswith('/api/'):
                return jsonify(success=False, message="需要 SU 验证", require_su=True), 401
            return redirect(url_for('admin.admin_su', next=request.url))

        return f(*args, **kwargs)
    return decorated
