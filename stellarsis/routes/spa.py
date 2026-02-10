"""
SPA routes and supporting API endpoints.
"""

import html
import json
import random

from flask import Blueprint, request, redirect, render_template, jsonify, url_for, current_app
from flask_login import current_user, login_required

from stellarsis.extensions import db_session
from stellarsis.models import (
    User, ChatRoom, ChatMessage, ChatLastView,
    ForumSection, ForumThread, ForumReply, ForumLastView, UserFollow,
)
from stellarsis.permissions import (
    get_chat_permission_value, get_forum_permission_value,
    FORUM_POST_PERMISSIONS,
)
from stellarsis.utils import utcnow, to_utc_isoformat, get_global_online_count

bp = Blueprint('spa', __name__)


@bp.route('/')
def index():
    if current_user.is_authenticated:
        return redirect('/spa')
    return redirect(url_for('auth.login'))


@bp.route('/spa')
def spa_index():
    """Serve the SPA interface with all data pre-loaded."""
    if not current_user.is_authenticated:
        return render_template('spa.html', spa_data={
            'rooms': [], 'chatPermissions': {},
            'sections': [], 'forumPermissions': {},
            'unreadCounts': {'chat': {}, 'forum': {}},
            'following': [], 'randomQuote': '',
        })

    # Rooms
    rooms = db_session.query(ChatRoom).all()
    visible_rooms = []
    chat_perms = {}
    for r in rooms:
        perm = get_chat_permission_value(current_user, r.id)
        if perm != 'Null':
            visible_rooms.append({'id': r.id, 'name': r.name, 'description': r.description or ''})
            chat_perms[r.id] = perm

    # Forum sections
    sections = db_session.query(ForumSection).all()
    visible_sections = []
    forum_perms = {}
    for s in sections:
        perm = get_forum_permission_value(current_user, s.id)
        if perm != 'Null':
            visible_sections.append({'id': s.id, 'name': s.name, 'description': s.description or ''})
            forum_perms[s.id] = perm

    # Unread counts
    chat_unread = {}
    forum_unread = {}
    for r in rooms:
        if get_chat_permission_value(current_user, r.id) == 'Null':
            continue
        last = db_session.query(ChatLastView).filter_by(user_id=current_user.id, room_id=r.id).first()
        if last:
            chat_unread[r.id] = db_session.query(ChatMessage).filter(
                ChatMessage.room_id == r.id, ChatMessage.timestamp > last.last_view
            ).count()
        else:
            chat_unread[r.id] = db_session.query(ChatMessage).filter_by(room_id=r.id).count()
    for s in sections:
        if get_forum_permission_value(current_user, s.id) == 'Null':
            continue
        last = db_session.query(ForumLastView).filter_by(user_id=current_user.id, section_id=s.id).first()
        if last:
            cnt_t = db_session.query(ForumThread).filter(
                ForumThread.section_id == s.id, ForumThread.timestamp > last.last_view
            ).count()
            cnt_r = db_session.query(ForumReply).join(ForumThread).filter(
                ForumThread.section_id == s.id, ForumReply.timestamp > last.last_view
            ).count()
        else:
            cnt_t = db_session.query(ForumThread).filter_by(section_id=s.id).count()
            cnt_r = db_session.query(ForumReply).join(ForumThread).filter(
                ForumThread.section_id == s.id
            ).count()
        forum_unread[s.id] = cnt_t + cnt_r

    # Following
    ids = [r[0] for r in db_session.query(UserFollow.followed_id).filter_by(follower_id=current_user.id).all()]
    following = db_session.query(User).filter(User.id.in_(ids)).all() if ids else []
    following_list = [
        {'id': u.id, 'username': u.username, 'nickname': u.nickname or u.username,
         'color': u.color or '', 'badge': u.badge or ''}
        for u in following
    ]

    # Random quote
    random_quote = ''
    try:
        with open('quotes.json', 'r', encoding='utf-8') as f:
            qs = json.load(f).get('quotes', [])
            formatted = [f"{q['text']} - {q['author']}" for q in qs if 'text' in q and 'author' in q]
            if formatted:
                random_quote = random.choice(formatted)
    except Exception:
        pass

    return render_template('spa.html', spa_data={
        'rooms': visible_rooms, 'chatPermissions': chat_perms,
        'sections': visible_sections, 'forumPermissions': forum_perms,
        'unreadCounts': {'chat': chat_unread, 'forum': forum_unread},
        'following': following_list, 'randomQuote': random_quote,
    })


# ------------------------------------------------------------------
# SPA dynamic API endpoints
# ------------------------------------------------------------------

@bp.route('/api/spa/forum/section/<int:section_id>')
@login_required
def api_spa_forum_section(section_id):
    section = db_session.get(ForumSection, section_id)
    if section is None:
        return jsonify(success=False, message='Section not found'), 404
    perm = get_forum_permission_value(current_user, section_id)
    if perm == 'Null':
        return jsonify(success=False, message='Permission denied'), 403

    try:
        last = db_session.query(ForumLastView).filter_by(user_id=current_user.id, section_id=section_id).first()
        now = utcnow()
        if last:
            last.last_view = now
        else:
            db_session.add(ForumLastView(user_id=current_user.id, section_id=section_id, last_view=now))
        db_session.commit()
    except Exception:
        db_session.rollback()

    threads = db_session.query(ForumThread).filter_by(section_id=section_id)\
        .order_by(ForumThread.timestamp.desc()).all()
    return jsonify(success=True, section={
        'id': section.id, 'name': section.name, 'description': section.description or '',
    }, permission=perm, threads=[
        {
            'id': t.id, 'title': t.title,
            'content': html.unescape(t.content) if t.content else '',
            'timestamp': to_utc_isoformat(t.timestamp),
            'reply_count': db_session.query(ForumReply).filter_by(thread_id=t.id).count(),
            'user': {
                'id': t.user.id, 'username': t.user.username,
                'nickname': t.user.nickname, 'color': t.user.color, 'badge': t.user.badge,
            } if t.user else None,
        }
        for t in threads
    ])


@bp.route('/api/spa/forum/thread/<int:thread_id>')
@login_required
def api_spa_forum_thread(thread_id):
    thread = db_session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify(success=False, message='Thread not found'), 404
    perm = get_forum_permission_value(current_user, thread.section_id)
    if perm == 'Null':
        return jsonify(success=False, message='Permission denied'), 403

    replies = db_session.query(ForumReply).filter_by(thread_id=thread_id)\
        .order_by(ForumReply.timestamp.asc()).all()
    return jsonify(success=True, thread={
        'id': thread.id, 'title': thread.title,
        'content': html.unescape(thread.content) if thread.content else '',
        'section_id': thread.section_id,
        'timestamp': to_utc_isoformat(thread.timestamp),
        'user': {
            'id': thread.user.id, 'username': thread.user.username,
            'nickname': thread.user.nickname, 'color': thread.user.color, 'badge': thread.user.badge,
        } if thread.user else None,
    }, permission=perm, replies=[
        {
            'id': r.id,
            'content': html.unescape(r.content) if r.content else '',
            'timestamp': to_utc_isoformat(r.timestamp),
            'user': {
                'id': r.user.id, 'username': r.user.username,
                'nickname': r.user.nickname, 'color': r.user.color, 'badge': r.user.badge,
            } if r.user else None,
        }
        for r in replies
    ])


@bp.route('/api/spa/forum/thread', methods=['POST'])
@login_required
def api_spa_forum_thread_create():
    section_id = request.form.get('section_id', type=int)
    title = request.form.get('title', '').strip()
    content = request.form.get('content', '').strip()
    if not section_id or not title or not content:
        return jsonify(success=False, message='请填写所有必填项'), 400
    section = db_session.get(ForumSection, section_id)
    if section is None:
        return jsonify(success=False, message='Section not found'), 404
    perm = get_forum_permission_value(current_user, section_id)
    if perm not in FORUM_POST_PERMISSIONS:
        return jsonify(success=False, message='Permission denied'), 403
    try:
        thread = ForumThread(
            title=title, content=content,
            user_id=current_user.id, section_id=section_id, timestamp=utcnow(),
        )
        db_session.add(thread)
        db_session.commit()
        return jsonify(success=True, message='发表成功', thread_id=thread.id)
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/spa/chat/<int:room_id>/mark_read', methods=['POST'])
@login_required
def api_spa_chat_mark_read(room_id):
    room = db_session.get(ChatRoom, room_id)
    if room is None:
        return jsonify(success=False, message='Room not found'), 404
    if get_chat_permission_value(current_user, room_id) == 'Null':
        return jsonify(success=False, message='Permission denied'), 403
    try:
        last = db_session.query(ChatLastView).filter_by(user_id=current_user.id, room_id=room_id).first()
        now = utcnow()
        if last:
            last.last_view = now
        else:
            db_session.add(ChatLastView(user_id=current_user.id, room_id=room_id, last_view=now))
        db_session.commit()
        return jsonify(success=True)
    except Exception:
        db_session.rollback()
        return jsonify(success=False, message='Database error'), 500


# ------------------------------------------------------------------
# Misc API (online count, random quote, unread counts, redirects)
# ------------------------------------------------------------------

@bp.route('/api/online_count')
@login_required
def api_online_count():
    return jsonify(count=get_global_online_count())


@bp.route('/api/random_quote')
@login_required
def api_random_quote():
    try:
        with open('quotes.json', 'r', encoding='utf-8') as f:
            qs = json.load(f).get('quotes', [])
            formatted = [f"{q['text']} - {q['author']}" for q in qs if 'text' in q and 'author' in q]
            if formatted:
                return jsonify(success=True, quote=random.choice(formatted))
        return jsonify(success=False, message="没有找到名言")
    except FileNotFoundError:
        return jsonify(success=False, message="quotes.json文件不存在")
    except json.JSONDecodeError:
        return jsonify(success=False, message="quotes.json文件格式错误")


@bp.route('/api/last_views/unread_counts')
@login_required
def api_unread_counts():
    try:
        chat_counts = {}
        forum_counts = {}
        for r in db_session.query(ChatRoom).all():
            if get_chat_permission_value(current_user, r.id) == 'Null':
                continue
            last = db_session.query(ChatLastView).filter_by(user_id=current_user.id, room_id=r.id).first()
            if last:
                chat_counts[r.id] = db_session.query(ChatMessage).filter(
                    ChatMessage.room_id == r.id, ChatMessage.timestamp > last.last_view
                ).count()
            else:
                chat_counts[r.id] = db_session.query(ChatMessage).filter_by(room_id=r.id).count()

        for s in db_session.query(ForumSection).all():
            if get_forum_permission_value(current_user, s.id) == 'Null':
                continue
            last = db_session.query(ForumLastView).filter_by(user_id=current_user.id, section_id=s.id).first()
            if last:
                ct = db_session.query(ForumThread).filter(
                    ForumThread.section_id == s.id, ForumThread.timestamp > last.last_view
                ).count()
                cr = db_session.query(ForumReply).join(ForumThread).filter(
                    ForumThread.section_id == s.id, ForumReply.timestamp > last.last_view
                ).count()
            else:
                ct = db_session.query(ForumThread).filter_by(section_id=s.id).count()
                cr = db_session.query(ForumReply).join(ForumThread).filter(
                    ForumThread.section_id == s.id
                ).count()
            forum_counts[s.id] = ct + cr
        return jsonify(success=True, chat=chat_counts, forum=forum_counts)
    except Exception as e:
        current_app.logger.exception('计算未读数时发生错误')
        return jsonify(success=False, message=str(e)), 500


# Redirect stubs for old routes
@bp.route('/settings')
@login_required
def settings_index():
    return redirect('/spa#/settings')

@bp.route('/settings/follows')
@login_required
def settings_follows():
    return redirect('/spa#/settings?tab=follows')

@bp.route('/settings/images')
@login_required
def settings_images():
    return redirect('/spa#/settings?tab=uploads')
