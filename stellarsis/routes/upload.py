"""
Upload routes for images and files.
"""

import os
import time
import imghdr
import tempfile
import threading
import zipfile
from pathlib import Path
from uuid import uuid4

from flask import Blueprint, request, jsonify, url_for, send_file, current_app
from flask_login import current_user, login_required
from werkzeug.utils import secure_filename

from stellarsis.extensions import db_session
from stellarsis.models import User, UserImage
from stellarsis.decorators import su_required
from stellarsis.utils import (
    to_utc_isoformat, allowed_image_extension, allowed_file_extension,
    is_image_extension, log_admin_action,
)

bp = Blueprint('upload', __name__)


def _save_upload(file, filename, is_image_file, max_size):
    """Shared upload logic for images and files.

    Returns ``(jsonify-response, status_code)`` on error, or
    ``(UserImage instance, None)`` on success.
    """
    base = secure_filename(os.path.splitext(filename)[0]) or ('img' if is_image_file else 'file')
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'png'
    unique_name = f"{base}_{int(time.time())}_{uuid4().hex}.{ext}"

    static_root = Path(current_app.root_path) / 'static'
    upload_folder = (
        Path(current_app.root_path)
        / current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
        / str(current_user.id)
    ).resolve()
    if not str(upload_folder).startswith(str(static_root.resolve())):
        return jsonify(success=False, message='上传目录配置不合法'), 500
    upload_folder.mkdir(parents=True, exist_ok=True)
    filepath = upload_folder / unique_name

    try:
        file.save(str(filepath))

        if is_image_file:
            with open(filepath, 'rb') as fh:
                header = fh.read(2048)
            detected = imghdr.what(None, h=header)
            if not detected:
                filepath.unlink(missing_ok=True)
                return jsonify(success=False, message='无法识别的图片类型'), 400
            normalized = detected.replace('jpeg', 'jpg')
            if normalized not in current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', set()):
                filepath.unlink(missing_ok=True)
                return jsonify(success=False, message=f'不被允许的图片类型: {detected}'), 400
            file_type = normalized
        else:
            file_type = ext

        actual_size = filepath.stat().st_size
        if actual_size > max_size:
            filepath.unlink(missing_ok=True)
            return jsonify(success=False, message='文件过大'), 413

        if not current_user.is_admin():
            quota = current_app.config.get('USER_UPLOAD_QUOTA', 50 * 1024 * 1024)
            if current_user.upload_used + actual_size > quota:
                filepath.unlink(missing_ok=True)
                return jsonify(success=False, message='上传后将超出配额限制'), 400

        ui = UserImage(
            user_id=current_user.id,
            filename=unique_name,
            filepath=str(filepath),
            file_size=actual_size,
            file_type=file_type,
        )
        db_session.add(ui)
        if not current_user.is_admin():
            current_user.upload_used += actual_size
            db_session.add(current_user)
        db_session.commit()

        rel = os.path.relpath(str(filepath), str(Path(current_app.root_path) / 'static'))
        file_url = url_for('static', filename=rel.replace('\\', '/'))
        if is_image_file:
            markdown = f"![{secure_filename(base)}]({file_url})"
        else:
            markdown = f"[{secure_filename(base)}.{ext}]({file_url})"

        return jsonify(
            success=True, url=file_url, markdown=markdown,
            id=ui.id, filename=ui.filename, is_image=is_image_file,
        ), None
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('保存上传文件失败')
        return jsonify(success=False, message='保存文件失败'), 500


@bp.route('/api/upload/image', methods=['POST'])
@login_required
def api_upload_image():
    if 'file' not in request.files:
        return jsonify(success=False, message='未找到文件'), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, message='文件名为空'), 400
    if not allowed_image_extension(file.filename):
        return jsonify(success=False, message='不支持的文件扩展名'), 400

    max_size = current_app.config.get('IMAGE_MAX_SIZE', 5 * 1024 * 1024)
    if request.content_length and request.content_length > max_size:
        return jsonify(success=False, message='文件过大'), 413

    if not current_user.is_admin():
        quota = current_app.config.get('USER_UPLOAD_QUOTA', 50 * 1024 * 1024)
        if current_user.upload_used >= quota:
            return jsonify(success=False, message='上传配额已用完'), 400
        file.seek(0, 2)
        fsize = file.tell()
        file.seek(0)
        if current_user.upload_used + fsize > quota:
            return jsonify(success=False, message='上传后将超出配额限制'), 400

    resp, status = _save_upload(file, file.filename, True, max_size)
    return (resp, status) if status else resp


@bp.route('/api/upload/file', methods=['POST'])
@login_required
def api_upload_file():
    if not current_app.config.get('ENABLE_FILE_UPLOAD', False):
        return jsonify(success=False, message='文件上传功能未启用'), 403
    if 'file' not in request.files:
        return jsonify(success=False, message='未找到文件'), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, message='文件名为空'), 400
    if '.' not in file.filename:
        return jsonify(success=False, message='不支持的文件扩展名'), 400

    is_img = is_image_extension(file.filename)
    if not is_img and not allowed_file_extension(file.filename):
        return jsonify(success=False, message='不支持的文件扩展名'), 400
    if is_img and not allowed_image_extension(file.filename):
        return jsonify(success=False, message='不支持的图片扩展名'), 400

    max_size = (
        current_app.config.get('IMAGE_MAX_SIZE', 5 * 1024 * 1024)
        if is_img else current_app.config.get('FILE_MAX_SIZE', 10 * 1024 * 1024)
    )
    if request.content_length and request.content_length > max_size:
        return jsonify(success=False, message='文件过大'), 413

    if not current_user.is_admin():
        quota = current_app.config.get('USER_UPLOAD_QUOTA', 50 * 1024 * 1024)
        if current_user.upload_used >= quota:
            return jsonify(success=False, message='上传配额已用完'), 400
        file.seek(0, 2)
        fsize = file.tell()
        file.seek(0)
        if current_user.upload_used + fsize > quota:
            return jsonify(success=False, message='上传后将超出配额限制'), 400

    resp, status = _save_upload(file, file.filename, is_img, max_size)
    return (resp, status) if status else resp


@bp.route('/api/upload/images')
@login_required
def api_list_user_images():
    try:
        images = (
            db_session.query(UserImage)
            .filter_by(user_id=current_user.id)
            .order_by(UserImage.upload_time.desc())
            .all()
        )
        allowed_exts = current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', set())
        results = []
        for im in images:
            rel = os.path.relpath(str(im.filepath), str(Path(current_app.root_path) / 'static'))
            file_url = url_for('static', filename=rel.replace('\\', '/'))
            ext = im.filename.rsplit('.', 1)[1].lower() if '.' in im.filename else ''
            is_img = ext in allowed_exts or (im.file_type and im.file_type.lower() in allowed_exts)
            markdown = f'![{im.filename}]({file_url})' if is_img else f'[{im.filename}]({file_url})'
            results.append({
                'id': im.id,
                'filename': im.filename,
                'url': file_url,
                'markdown': markdown,
                'uploaded': to_utc_isoformat(im.upload_time),
                'is_image': is_img,
            })
        return jsonify(success=True, images=results)
    except Exception:
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('列出用户文件失败')
        return jsonify(success=False, message='服务器错误'), 500


@bp.route('/api/upload/quota')
@login_required
def api_get_upload_quota():
    try:
        quota = current_app.config.get('USER_UPLOAD_QUOTA', 50 * 1024 * 1024)
        is_admin = current_user.is_admin()
        return jsonify(success=True, quota={
            'used': 0 if is_admin else current_user.upload_used,
            'total': 0 if is_admin else quota,
            'is_admin': is_admin,
            'percent': 0 if is_admin else min(100, (current_user.upload_used / quota) * 100),
        })
    except Exception:
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('获取用户上传配额失败')
        return jsonify(success=False, message='服务器错误'), 500


@bp.route('/api/upload/image/<int:image_id>', methods=['DELETE'])
@login_required
def api_delete_image(image_id):
    try:
        ui = db_session.get(UserImage, image_id)
        if not ui:
            return jsonify(success=False, message='图片不存在'), 404
        if not (current_user.is_admin() or ui.user_id == current_user.id):
            return jsonify(success=False, message='权限不足'), 403

        try:
            p = Path(ui.filepath)
            if p.exists():
                p.unlink()
        except Exception:
            pass

        owner = db_session.get(User, ui.user_id)
        if owner and not owner.is_admin():
            owner.upload_used = max(0, owner.upload_used - ui.file_size)
            db_session.add(owner)

        db_session.delete(ui)
        db_session.commit()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.info(
                f"用户 {current_user.username} 删除上传图片 {ui.filename} (ID:{ui.id})"
            )
        return jsonify(success=True, message='图片已删除')
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('删除上传图片失败')
        return jsonify(success=False, message='服务器错误'), 500


@bp.route('/api/admin/recalculate-upload-sizes', methods=['POST'])
@login_required
@su_required
def api_admin_recalculate_upload_sizes():
    if not current_user.is_admin():
        return jsonify(success=False, message='权限不足'), 403
    try:
        rows = db_session.query(UserImage.user_id, UserImage.file_size).all()
        totals: dict[int, int] = {}
        for uid, size in rows:
            totals[uid] = totals.get(uid, 0) + (size or 0)

        for user in db_session.query(User).all():
            user.upload_used = 0 if user.is_admin() else totals.get(user.id, 0)
            db_session.add(user)
        db_session.commit()

        log_admin_action(
            f"管理员 {current_user.username} 重新统计了所有用户上传图片大小，共 {len(totals)} 个用户"
        )
        return jsonify(success=True, totals=totals)
    except Exception:
        db_session.rollback()
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('重新统计上传大小失败')
        return jsonify(success=False, message='服务器错误'), 500


@bp.route('/admin/download-images-zip')
@login_required
@su_required
def admin_download_images_zip():
    try:
        uploads_dir = Path(current_app.root_path) / current_app.config.get('UPLOAD_FOLDER', 'static/uploads')
        if not uploads_dir.exists():
            return jsonify(success=False, message='上传目录不存在'), 404

        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        tmp.close()
        try:
            with zipfile.ZipFile(tmp.name, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, _dirs, files in os.walk(uploads_dir):
                    for fname in files:
                        full = os.path.join(root, fname)
                        zf.write(full, os.path.relpath(full, uploads_dir))
            resp = send_file(tmp.name, as_attachment=True, download_name='uploads.zip')

            def _cleanup(p=tmp.name):
                time.sleep(10)
                try:
                    os.remove(p)
                except Exception:
                    pass

            threading.Thread(target=_cleanup, daemon=True).start()
            return resp
        except Exception:
            try:
                os.remove(tmp.name)
            except Exception:
                pass
            raise
    except Exception as e:
        mgr = current_app.config.get('_logger_manager')
        if mgr:
            mgr.upload.exception('创建静态图片压缩包失败')
        return jsonify(success=False, message=str(e)), 500
