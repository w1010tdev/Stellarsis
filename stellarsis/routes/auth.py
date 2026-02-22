"""
Authentication routes.
"""

import re

from flask import Blueprint, request, redirect, url_for, flash, jsonify, current_app
from flask_login import current_user, login_user, logout_user, login_required

from stellarsis.extensions import db_session, limiter
from stellarsis.models import User
from stellarsis.forms import LoginForm
from stellarsis.utils import utcnow, log_admin_action, log_user_action, _get_client_ip

bp = Blueprint('auth', __name__)


@bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute", methods=["POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('spa.spa_index'))

    if request.method == 'GET':
        return redirect('/spa#/login')

    form = LoginForm()
    if form.validate_on_submit():
        user = db_session.query(User).filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('无效的用户名或密码', 'danger')
            mgr = current_app.config.get('_logger_manager')
            ip = _get_client_ip()
            if mgr:
                mgr.auth.warning(f"登录失败: 用户名={form.username.data} IP={ip}")
                mgr.security.warning(f"登录失败: 用户名={form.username.data} IP={ip}")
            return redirect(url_for('auth.login'))
        login_user(user)
        user.last_seen = utcnow()
        db_session.commit()
        mgr = current_app.config.get('_logger_manager')
        ip = _get_client_ip()
        if mgr:
            mgr.auth.info(f"用户登录成功: {user.username} IP={ip}")
        log_user_action(f"表单登录成功")
        return redirect(url_for('spa.spa_index'))

    return redirect('/spa#/login')


@bp.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def api_login():
    if current_user.is_authenticated:
        return jsonify({'success': True, 'message': '已经登录'}), 200

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': '无效的请求数据'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'error': '用户名和密码不能为空'}), 400

    user = db_session.query(User).filter_by(username=username).first()
    if user is None or not user.check_password(password):
        mgr = current_app.config.get('_logger_manager')
        ip = _get_client_ip()
        if mgr:
            mgr.auth.warning(f"API登录失败: 用户名={username} IP={ip}")
            mgr.security.warning(f"API登录失败: 用户名={username} IP={ip}")
        return jsonify({'success': False, 'error': '无效的用户名或密码'}), 401

    login_user(user)
    user.last_seen = utcnow()
    db_session.commit()
    mgr = current_app.config.get('_logger_manager')
    ip = _get_client_ip()
    if mgr:
        mgr.auth.info(f"用户API登录成功: {user.username} IP={ip}")
    log_user_action(f"API登录成功")

    return jsonify({
        'success': True,
        'message': '登录成功',
        'user': {
            'id': user.id,
            'username': user.username,
            'is_admin': user.is_admin(),
        },
    }), 200


@bp.route('/logout')
def logout():
    username = current_user.username if current_user.is_authenticated else '未知用户'
    log_user_action(f"用户登出")
    mgr = current_app.config.get('_logger_manager')
    if mgr:
        mgr.auth.info(f"用户登出: {username} IP={_get_client_ip()}")
    logout_user()
    flash('您已成功登出', 'success')
    return redirect(url_for('auth.login'))


@bp.route('/change_password', methods=['GET', 'POST'])
@login_required
@limiter.limit("3 per minute", methods=["POST"])
def change_password():
    if request.is_json:
        try:
            data = request.get_json()
            old_password = data.get('old_password', '')
            new_password = data.get('new_password', '')
            confirm_password = data.get('confirm_password', '')

            if not old_password or not new_password or not confirm_password:
                return jsonify({'success': False, 'message': '请填写所有字段'}), 400

            min_len = current_app.config.get('MIN_PASSWORD_LENGTH', 6)
            if len(new_password) < min_len:
                return jsonify({'success': False, 'message': f'新密码至少需要{min_len}个字符'}), 400
            if new_password != confirm_password:
                return jsonify({'success': False, 'message': '新密码和确认密码不一致'}), 400
            if not current_user.check_password(old_password):
                return jsonify({'success': False, 'message': '当前密码错误'}), 400

            current_user.set_password(new_password)
            db_session.commit()
            mgr = current_app.config.get('_logger_manager')
            if mgr:
                mgr.auth.info(f"用户修改密码: {current_user.username} IP={_get_client_ip()}")
            log_user_action(f"修改密码成功")
            return jsonify({'success': True, 'message': '密码已成功修改'})
        except Exception as e:
            db_session.rollback()
            return jsonify({'success': False, 'message': str(e)}), 500

    return redirect('/spa#/settings?tab=password')


@bp.route('/profile', methods=['GET', 'POST'])
@login_required
@limiter.limit("10 per minute", methods=["POST"])
def profile():
    if request.is_json:
        try:
            data = request.get_json()
            if 'color' in data and data['color']:
                if not re.match(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', data['color']):
                    return jsonify({'success': False, 'message': '颜色格式必须是#RGB或#RRGGBB'}), 400

            if 'nickname' in data:
                current_user.nickname = data['nickname'][:64] if data['nickname'] else None
            if 'color' in data:
                current_user.color = data['color'] or '#000000'
            if 'badge' in data:
                current_user.badge = data['badge'][:32] if data['badge'] else None

            db_session.commit()
            log_user_action(
                f"更新个人资料: nickname={current_user.nickname}, color={current_user.color}, badge={current_user.badge}"
            )

            return jsonify({
                'success': True,
                'message': '个人资料已更新',
                'user': {
                    'nickname': current_user.nickname,
                    'color': current_user.color,
                    'badge': current_user.badge,
                },
            })
        except Exception as e:
            db_session.rollback()
            return jsonify({'success': False, 'message': str(e)}), 500

    return redirect('/spa#/settings?tab=profile')
