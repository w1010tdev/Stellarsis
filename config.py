import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///social_platform.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = True  # 用于热重载
    SOCKETIO_ASYNC_MODE = 'eventlet'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB 上传限制
    ONLINE_TIMEOUT = 300  # 5分钟无活动视为离线