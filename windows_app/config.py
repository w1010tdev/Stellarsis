# -*- coding: utf-8 -*-
"""
Stellarsis Windows App 配置文件
"""

# 服务器地址 - 请修改为你的服务器地址
SERVER_URL = "http://localhost:5000"

# API 端点
API_LOGIN = "/api/auth/login"
API_LOGOUT = "/api/auth/logout"
API_VALIDATE = "/api/auth/validate"
API_UNREAD = "/api/notifications/unread"

# 通知检查间隔（秒）
CHECK_INTERVAL = 60

# 窗口设置
WINDOW_WIDTH = 400
WINDOW_HEIGHT = 500
WINDOW_TITLE = "Stellarsis"

# Token 存储文件名
TOKEN_FILE = ".stellarsis_token"
