"""
Forum routes.
"""

import html

from flask import Blueprint, request, redirect, url_for, jsonify, abort, current_app
from flask_login import current_user, login_required

from stellarsis.extensions import db_session
from stellarsis.models import ForumSection, ForumThread, ForumReply
from stellarsis.permissions import (
    get_forum_permission_value, user_can_post_forum,
    FORUM_POST_PERMISSIONS,
)
from stellarsis.utils import to_utc_isoformat, sanitize_content, log_admin_action

bp = Blueprint('forum', __name__)


@bp.route('/forum')
@login_required
def forum_index():
    return redirect('/spa#/forum')


@bp.route('/forum/section/<int:section_id>')
@login_required
def forum_section(section_id):
    section = db_session.get(ForumSection, section_id)
    if section is None:
        abort(404)
    if get_forum_permission_value(current_user, section_id) == 'Null':
        abort(403)
    return redirect(f'/spa#/forum/{section_id}')


@bp.route('/forum/thread/<int:thread_id>')
@login_required
def forum_thread(thread_id):
    thread = db_session.get(ForumThread, thread_id)
    if thread is None:
        abort(404)
    if get_forum_permission_value(current_user, thread.section_id) == 'Null':
        abort(403)
    return redirect(f'/spa#/forum/thread/{thread_id}')


@bp.route('/forum/new/<int:section_id>', methods=['GET', 'POST'])
@login_required
def new_post(section_id):
    section = db_session.get(ForumSection, section_id)
    if section is None:
        abort(404)
    permission = get_forum_permission_value(current_user, section_id)
    if permission == 'Null':
        abort(403)

    if request.method == 'GET':
        return redirect(f'/spa#/forum/{section_id}')

    if permission not in FORUM_POST_PERMISSIONS:
        return jsonify(success=False, message="当前权限无法发帖"), 403

    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()

    if not title or len(title) > 128:
        return jsonify(success=False, message="标题不能为空且不超过128字符"), 400
    if not content or len(content) > 100000:
        return jsonify(success=False, message="内容不能为空且不超过100000字符"), 400

    content = sanitize_content(content)
    thread = ForumThread(
        title=title, content=content,
        user_id=current_user.id, section_id=section_id,
    )
    db_session.add(thread)
    db_session.commit()
    log_admin_action(f"用户创建新帖: {current_user.username} - {title}")
    return redirect(url_for('forum.forum_thread', thread_id=thread.id))


@bp.route('/api/forum/reply', methods=['POST'])
@login_required
def reply_post():
    thread_id = request.form.get('thread_id', type=int)
    content = request.form.get('content', '').strip()

    if not thread_id:
        return jsonify(success=False, message="参数错误"), 400
    if not content or len(content) > 5000:
        return jsonify(success=False, message="内容不能为空且不超过5000字符"), 400

    content = sanitize_content(content)
    thread = db_session.get(ForumThread, thread_id)
    if not thread:
        return jsonify(success=False, message="帖子不存在"), 404
    if not user_can_post_forum(current_user, thread.section_id):
        return jsonify(success=False, message="当前权限无法回复"), 403

    reply = ForumReply(content=content, user_id=current_user.id, thread_id=thread_id)
    db_session.add(reply)
    db_session.commit()
    log_admin_action(f"用户回复帖子: {current_user.username} - 帖子ID: {thread_id}")

    return jsonify(
        success=True,
        reply_id=reply.id,
        user_id=current_user.id,
        username=current_user.username,
        nickname=current_user.nickname or current_user.username,
        color=current_user.color,
        badge=current_user.badge,
        timestamp=to_utc_isoformat(reply.timestamp),
        content=html.unescape(reply.content) if isinstance(reply.content, str) else reply.content,
    )


@bp.route('/api/forum/reply/<int:reply_id>', methods=['DELETE'])
@login_required
def api_delete_forum_reply(reply_id):
    try:
        reply = db_session.query(ForumReply).filter_by(id=reply_id).first()
        if not reply:
            return jsonify({'success': False, 'message': '回复未找到'}), 404

        thread = reply.thread or db_session.query(ForumThread).filter_by(id=reply.thread_id).first()
        if not thread:
            return jsonify({'success': False, 'message': '关联主题不存在'}), 400

        if current_user.is_admin():
            allowed = True
        else:
            perm = get_forum_permission_value(current_user, thread.section_id)
            allowed = perm == 'su' or (perm == '777' and reply.user_id == current_user.id)

        if not allowed:
            return jsonify({'success': False, 'message': '权限不足'}), 403

        db_session.delete(reply)
        db_session.commit()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.forum.info(f"用户 {current_user.id} 删除了回复 {reply_id}")
        return jsonify({'success': True, 'message': '回复已删除'})
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.forum.exception('删除回复时发生错误')
        return jsonify({'success': False, 'message': '服务器错误'}), 500


@bp.route('/api/forum/thread/<int:thread_id>', methods=['DELETE'])
@login_required
def api_delete_thread(thread_id):
    try:
        thread = db_session.get(ForumThread, thread_id)
        if not thread:
            return jsonify(success=False, message='帖子不存在'), 404

        perm = get_forum_permission_value(current_user, thread.section_id)
        if current_user.is_admin() or perm == 'su' or (perm == '777' and thread.user_id == current_user.id):
            db_session.query(ForumReply).filter_by(thread_id=thread.id).delete()
            db_session.delete(thread)
            db_session.commit()
            log_admin_action(f"删除了主题帖: {thread.title} (ID:{thread.id})")
            mgr = current_app.config.get('_logger_manager')
            if mgr:
                mgr.forum.info(f"用户 {current_user.id} 删除了主题帖 {thread.id}")
            return jsonify(success=True, message='删除成功',
                           redirect=url_for('forum.forum_section', section_id=thread.section_id))
        return jsonify(success=False, message='权限不足'), 403
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.forum.exception('删除主题帖时发生错误')
        return jsonify(success=False, message='服务器错误'), 500


@bp.route('/api/forum/thread/<int:thread_id>/replies')
@login_required
def api_get_thread_replies(thread_id):
    thread = db_session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify(success=False, message='主题不存在'), 404

    replies = thread.replies.order_by(ForumReply.timestamp.asc()).all()
    result = [
        {
            'id': r.id,
            'thread_id': r.thread_id,
            'user_id': r.user_id,
            'username': r.user.username if r.user else None,
            'nickname': r.user.nickname if r.user else None,
            'color': r.user.color if r.user else None,
            'content': r.content,
            'timestamp': to_utc_isoformat(r.timestamp),
        }
        for r in replies
    ]
    return jsonify(success=True, replies=result, page=0, total_pages=1)
