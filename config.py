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

    # 文件上传扩展配置
    # ENABLE_FILE_UPLOAD: 开启后允许上传任意文件或特定后缀文件
    ENABLE_FILE_UPLOAD = os.environ.get('ENABLE_FILE_UPLOAD', 'False').lower() in ('1', 'true', 'yes')
    # ALLOWED_FILE_EXTENSIONS: 允许上传的文件扩展名，设为空集合则允许所有类型
    # 如果设置为 set() 或 None，则允许上传任意类型文件
    # 如果设置为具体扩展名集合，则只允许这些类型
    _DEFAULT_FILE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', '7z', 'md']
    _env_file_ext = os.environ.get('ALLOWED_FILE_EXTENSIONS')
    ALLOWED_FILE_EXTENSIONS = set(_env_file_ext.split(',')) if _env_file_ext else set(_DEFAULT_FILE_EXTENSIONS)
    _DEFAULT_FILE_MAX_SIZE = 10 * 1024 * 1024  # 单个文件最大 10MB
    _env_file_max_size = os.environ.get('FILE_MAX_SIZE')
    try:
        FILE_MAX_SIZE = int(_env_file_max_size) if _env_file_max_size is not None else _DEFAULT_FILE_MAX_SIZE
    except ValueError:
        FILE_MAX_SIZE = _DEFAULT_FILE_MAX_SIZE

    # 管理面板开关：用于在生产环境中禁用高风险功能
    ENABLE_FILE_MANAGER = os.environ.get('ENABLE_FILE_MANAGER', 'False').lower() in ('1','true','yes')
    ENABLE_SERVER_CONTROL = os.environ.get('ENABLE_SERVER_CONTROL', 'False').lower() in ('1','true','yes')
