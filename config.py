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
    ONLINE_TIMEOUT = 300  # 5分钟无活动视为离线
    # 图片上传相关配置
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB 上传限制
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join('static', 'uploads')
    ALLOWED_IMAGE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'webp'])
    IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 单张图片最大 5MB