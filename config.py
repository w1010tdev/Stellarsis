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
    # 文件上传相关配置
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join('static', 'uploads')
    ALLOW_FILE_UPLOAD = os.environ.get('ALLOW_FILE_UPLOAD', 'True').lower() in ('1','true','yes')
    ALLOWED_IMAGE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'webp'])
    ALLOWED_FILE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'zip', 'rar', '7z', 'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp3', 'wav', 'mp4', 'mov'])
    IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 单张图片最大 5MB
    FILE_MAX_SIZE = 20 * 1024 * 1024  # 单个文件最大 20MB
    USER_UPLOAD_QUOTA = 50 * 1024 * 1024  # 每个用户默认上传配额 50MB

    # 管理面板开关：用于在生产环境中禁用高风险功能
    ENABLE_FILE_MANAGER = os.environ.get('ENABLE_FILE_MANAGER', 'False').lower() in ('1','true','yes')
    ENABLE_SERVER_CONTROL = os.environ.get('ENABLE_SERVER_CONTROL', 'False').lower() in ('1','true','yes')
