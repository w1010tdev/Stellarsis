"""
日志工具模块 / Logging Utility Module

提供统一的日志接口，支持多种日志类型的分离记录
Provides unified logging interface with support for separated log types
"""

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime
from functools import wraps
import traceback


class LoggerManager:
    """日志管理器 / Logger Manager"""
    
    def __init__(self, app_root_path):
        """
        初始化日志管理器
        Initialize logger manager
        
        Args:
            app_root_path: Flask app 根路径
        """
        self.app_root_path = app_root_path
        self.log_dir = Path(app_root_path) / 'logs'
        self.log_dir.mkdir(exist_ok=True)
        
        # 日志配置 / Log configuration
        self.log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        self.max_bytes = 100 * 1024 * 1024  # 100 MB per file
        self.backup_count = 10
        
        # 初始化各类日志器 / Initialize loggers
        self._loggers = {}
        self._init_loggers()
    
    def _create_logger(self, name, filename, level=logging.INFO):
        """
        创建日志器
        Create a logger
        
        Args:
            name: 日志器名称
            filename: 日志文件名
            level: 日志级别
        
        Returns:
            logging.Logger: 配置好的日志器
        """
        logger = logging.getLogger(name)
        logger.setLevel(level)
        
        # 避免重复添加handler
        if logger.handlers:
            return logger
        
        # 创建文件handler
        log_file = self.log_dir / filename
        handler = RotatingFileHandler(
            log_file,
            maxBytes=self.max_bytes,
            backupCount=self.backup_count,
            encoding='utf-8'
        )
        
        # 设置格式
        formatter = logging.Formatter(self.log_format)
        handler.setFormatter(formatter)
        
        # 添加handler
        logger.addHandler(handler)
        
        return logger
    
    def _init_loggers(self):
        """初始化所有日志器 / Initialize all loggers"""
        # 系统日志 - 记录系统运行状态、数据库操作、错误等
        # System log - records system status, database operations, errors, etc.
        self._loggers['system'] = self._create_logger('stellarsis.system', 'system.log')
        
        # 管理员操作日志 - 记录所有管理员操作，用于审计
        # Admin log - records all admin operations for auditing
        self._loggers['admin'] = self._create_logger('stellarsis.admin', 'admin.log')
        
        # 用户操作日志 - 记录所有用户操作（发帖、上传、关注等）
        # User log - records all user operations (posts, uploads, follows, etc.)
        self._loggers['user'] = self._create_logger('stellarsis.user', 'user.log')
        
        # 认证日志 - 记录用户登录、登出、密码修改等
        # Auth log - records login, logout, password changes, etc.
        self._loggers['auth'] = self._create_logger('stellarsis.auth', 'auth.log')
        
        # 聊天日志 - 记录聊天相关操作（消息发送、删除等）
        # Chat log - records chat operations (send, delete, etc.)
        self._loggers['chat'] = self._create_logger('stellarsis.chat', 'chat.log')
        
        # 论坛日志 - 记录论坛相关操作（发帖、回复、删除等）
        # Forum log - records forum operations (post, reply, delete, etc.)
        self._loggers['forum'] = self._create_logger('stellarsis.forum', 'forum.log')
        
        # 上传日志 - 记录文件上传、删除等操作
        # Upload log - records file upload and delete operations
        self._loggers['upload'] = self._create_logger('stellarsis.upload', 'upload.log')
        
        # 安全日志 - 记录安全相关事件（权限检查失败、可疑操作等）
        # Security log - records security events (permission failures, suspicious operations, etc.)
        self._loggers['security'] = self._create_logger('stellarsis.security', 'security.log')
        
        # 让所有子日志器的消息也写入 system.log（系统总日志）
        # Propagate all sub-loggers to system.log via a shared handler
        system_handler = self._loggers['system'].handlers[0] if self._loggers['system'].handlers else None
        if system_handler:
            for name, lgr in self._loggers.items():
                if name != 'system' and system_handler not in lgr.handlers:
                    lgr.addHandler(system_handler)
    
    def get_logger(self, logger_type='system'):
        """
        获取指定类型的日志器
        Get logger by type
        
        Args:
            logger_type: 日志器类型 (system/admin/auth/chat/forum/upload/security)
        
        Returns:
            logging.Logger: 日志器实例
        """
        return self._loggers.get(logger_type, self._loggers['system'])
    
    @property
    def system(self):
        """系统日志器 / System logger"""
        return self._loggers['system']
    
    @property
    def admin(self):
        """管理员日志器 / Admin logger"""
        return self._loggers['admin']
    
    @property
    def user(self):
        """用户操作日志器 / User operations logger"""
        return self._loggers['user']
    
    @property
    def auth(self):
        """认证日志器 / Auth logger"""
        return self._loggers['auth']
    
    @property
    def chat(self):
        """聊天日志器 / Chat logger"""
        return self._loggers['chat']
    
    @property
    def forum(self):
        """论坛日志器 / Forum logger"""
        return self._loggers['forum']
    
    @property
    def upload(self):
        """上传日志器 / Upload logger"""
        return self._loggers['upload']
    
    @property
    def security(self):
        """安全日志器 / Security logger"""
        return self._loggers['security']


class AdminActionLogger:
    """
    管理员操作日志器
    Admin action logger with enhanced formatting
    """
    
    def __init__(self, logger_manager):
        """
        初始化管理员操作日志器
        
        Args:
            logger_manager: LoggerManager 实例
        """
        self.logger = logger_manager.admin
        self.log_dir = logger_manager.log_dir
    
    def log(self, action, user=None, details=None, level='INFO'):
        """
        记录管理员操作
        Log admin action
        
        Args:
            action: 操作描述
            user: 操作用户（User对象或username字符串）
            details: 操作详情（可选）
            level: 日志级别 (INFO/WARNING/ERROR)
        """
        try:
            # 获取用户名
            if user is None:
                username = 'system'
            elif hasattr(user, 'username'):
                username = user.username
            elif hasattr(user, 'is_authenticated') and user.is_authenticated:
                username = user.username
            else:
                username = str(user) if user else 'unknown'
            
            # 构建日志消息
            message = f"[管理员: {username}] {action}"
            if details:
                message += f" | 详情: {details}"
            
            # 写入日志
            if level.upper() == 'ERROR':
                self.logger.error(message)
            elif level.upper() == 'WARNING':
                self.logger.warning(message)
            else:
                self.logger.info(message)
                
        except Exception as e:
            # 避免日志记录失败导致程序崩溃
            try:
                self.logger.error(f"记录管理员操作失败: {str(e)}")
            except:
                print(f"记录管理员操作失败(二次错误): {str(e)}")
    
    def get_recent_logs(self, limit=50):
        """
        获取最近的管理员日志
        Get recent admin logs
        
        Args:
            limit: 返回日志条数
        
        Returns:
            list: 日志条目列表，每个条目包含 timestamp 和 message
        """
        logs = []
        log_file = self.log_dir / 'admin.log'
        
        if log_file.exists():
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()[-limit:]
                    for line in lines:
                        try:
                            # 解析日志行
                            parts = line.split(' - ', 3)
                            if len(parts) >= 4:
                                timestamp_str = parts[0].strip()
                                message = parts[3].strip()
                                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
                                logs.append({
                                    'timestamp': timestamp,
                                    'message': message
                                })
                        except Exception:
                            continue
            except Exception:
                pass
        
        return logs


def log_function_call(logger_type='system'):
    """
    函数调用日志装饰器
    Function call logging decorator
    
    Args:
        logger_type: 日志类型 (system/admin/auth/chat/forum/upload/security)
    
    Usage:
        @log_function_call('admin')
        def some_admin_function():
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            logger = logging.getLogger(f'stellarsis.{logger_type}')
            logger.info(f"调用函数: {func.__name__}")
            try:
                result = func(*args, **kwargs)
                logger.info(f"函数 {func.__name__} 执行成功")
                return result
            except Exception as e:
                logger.error(f"函数 {func.__name__} 执行失败: {str(e)}")
                logger.debug(f"错误堆栈:\n{traceback.format_exc()}")
                raise
        return wrapper
    return decorator


def get_recent_system_logs(log_dir, limit=50):
    """
    获取最近的系统日志
    Get recent system logs
    
    Args:
        log_dir: 日志目录路径
        limit: 返回日志条数
    
    Returns:
        list: 日志条目列表
    """
    logs = []
    log_file = Path(log_dir) / 'system.log'
    
    if log_file.exists():
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()[-limit:]
                for line in lines:
                    try:
                        # 解析日志行: 2024-01-01 12:00:00,000 - name - LEVEL - message
                        parts = line.split(' - ', 3)
                        if len(parts) >= 4:
                            timestamp_str = parts[0].strip()
                            level = parts[2].strip()
                            message = parts[3].strip()
                            
                            try:
                                timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S,%f')
                            except ValueError:
                                # 如果解析失败，使用当前时间
                                timestamp = datetime.now()
                            
                            logs.append({
                                'timestamp': timestamp,
                                'level': level,
                                'message': message
                            })
                    except Exception:
                        continue
        except Exception:
            pass
    
    # 如果没有日志，返回模拟数据
    if not logs:
        logs.append({
            'timestamp': datetime.now(),
            'level': 'INFO',
            'message': '系统启动正常 - 暂无日志记录'
        })
    
    return logs


# 单例日志管理器
# Singleton logger manager
_logger_manager = None


def init_logger_manager(app_root_path):
    """
    初始化全局日志管理器
    Initialize global logger manager
    
    Args:
        app_root_path: Flask app 根路径
    
    Returns:
        LoggerManager: 日志管理器实例
    """
    global _logger_manager
    if _logger_manager is None:
        _logger_manager = LoggerManager(app_root_path)
    return _logger_manager


def get_logger_manager():
    """
    获取全局日志管理器
    Get global logger manager
    
    Returns:
        LoggerManager: 日志管理器实例
    """
    if _logger_manager is None:
        raise RuntimeError("LoggerManager 未初始化，请先调用 init_logger_manager()")
    return _logger_manager
