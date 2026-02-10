"""
Follow / unfollow routes.
"""

from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required

from stellarsis.extensions import db_session
from stellarsis.models import User, UserFollow
from stellarsis.utils import to_utc_isoformat, log_admin_action

bp = Blueprint('follow', __name__)


@bp.route('/api/follows', methods=['GET', 'POST'])
@login_required
def api_follows():
    if request.method == 'GET':
        follows = db_session.query(UserFollow).filter_by(follower_id=current_user.id).all()
        return jsonify(success=True, follows=[
            {
                'id': f.followed.id,
                'username': f.followed.username,
                'nickname': f.followed.nickname,
                'followed_at': to_utc_isoformat(f.created_at),
            }
            for f in follows
        ])

    data = request.get_json() or {}
    username = data.get('username')
    user_id = data.get('user_id')
    if not username and not user_id:
        return jsonify(success=False, message='需要指定 username 或 user_id'), 400

    try:
        target = (
            db_session.get(User, int(user_id)) if user_id
            else db_session.query(User).filter_by(username=username).first()
        )
        if not target:
            return jsonify(success=False, message='目标用户不存在'), 404
        if target.id == current_user.id:
            return jsonify(success=False, message='不能关注自己'), 400
        if db_session.query(UserFollow).filter_by(
            follower_id=current_user.id, followed_id=target.id
        ).first():
            return jsonify(success=False, message='已关注'), 400

        db_session.add(UserFollow(follower_id=current_user.id, followed_id=target.id))
        db_session.commit()
        return jsonify(success=True, message='关注成功', user={
            'id': target.id, 'username': target.username, 'nickname': target.nickname,
        })
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/follows/<int:followed_id>', methods=['DELETE'])
@login_required
def api_unfollow(followed_id):
    try:
        rel = db_session.query(UserFollow).filter_by(
            follower_id=current_user.id, followed_id=followed_id,
        ).first()
        if not rel:
            return jsonify(success=False, message='未找到关注关系'), 404
        db_session.delete(rel)
        db_session.commit()
        return jsonify(success=True, message='已取消关注')
    except Exception as e:
        db_session.rollback()
        return jsonify(success=False, message=str(e)), 500


@bp.route('/api/follow/following')
@login_required
def get_following():
    ids = [r[0] for r in db_session.query(UserFollow.followed_id).filter_by(follower_id=current_user.id).all()]
    users = db_session.query(User).filter(User.id.in_(ids)).all() if ids else []
    return jsonify(success=True, following=[
        {
            'id': u.id,
            'username': u.username,
            'nickname': u.nickname or u.username,
            'color': u.color,
            'badge': u.badge,
        }
        for u in users
    ])


@bp.route('/api/follow/toggle', methods=['POST'])
@login_required
def toggle_follow():
    data = request.get_json()
    target_id = data.get('user_id')
    if not target_id or target_id == current_user.id:
        return jsonify(success=False, message="无效用户"), 400
    target = db_session.get(User, target_id)
    if not target:
        return jsonify(success=False, message="用户不存在"), 404

    existing = db_session.query(UserFollow).filter_by(
        follower_id=current_user.id, followed_id=target_id,
    ).first()
    if existing:
        db_session.delete(existing)
        action = "unfollow"
    else:
        db_session.add(UserFollow(follower_id=current_user.id, followed_id=target_id))
        action = "follow"

    db_session.commit()
    log_admin_action(
        f"{current_user.username} {'关注' if action == 'follow' else '取消关注'} 用户 {target.username}"
    )
    return jsonify(success=True, action=action)
