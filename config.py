import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///stellarsis.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True  # 用于热重载
    SOCKETIO_ASYNC_MODE = 'eventlet'
    ONLINE_TIMEOUT = 30  # 30秒无活动视为离线
    # 图片上传相关配置
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join('static', 'uploads')
    ALLOWED_IMAGE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'webp'])
    IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 单张图片最大 5MB
    USER_UPLOAD_QUOTA = 50 * 1024 * 1024  # 每个用户默认上传配额 50MB
    # 是否允许上传任意文件（开启后：上传图片/图片管理 将变为 上传文件/文件管理）
    ENABLE_FILE_UPLOADS = os.environ.get('ENABLE_FILE_UPLOADS', 'False').lower() in ('1', 'true', 'yes')
    # 如果启用文件上传，请在这里配置允许的扩展名（小写，不带点）
    ALLOWED_FILE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'txt', 'zip', 'rar', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp3', 'mp4'])
