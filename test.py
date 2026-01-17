#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stellarsis 后端自动化测试脚本

运行方式:
  方式1（自动模式）: python test.py
    - 测试脚本会自动启动服务器，运行测试，然后停止服务器
    - 测试完成后会自动恢复数据库到测试前状态
    
  方式2（手动模式）: TEST_MANUAL_SERVER=true python test.py
    - 需要先手动启动服务器 (python app.py)
    - 测试完成后需要停止服务器才能恢复数据库

特性:
- 测试前自动备份数据库
- 测试后自动恢复数据库（可选）
- 全面测试管理员功能
- 测试用户创建、消息发送、帖子发布后的删除
"""

import requests
import json
import time
import os
import sys
import sqlite3
import shutil
import io
import subprocess
import signal
import atexit
from datetime import datetime

# 配置
BASE_URL = os.environ.get('TEST_BASE_URL', 'http://localhost:80')
ADMIN_USERNAME = 'admin'
DB_PATH = os.environ.get('DATABASE_PATH', 'stellarsis.db')
BACKUP_PATH = DB_PATH + '.test_backup'
UPLOADS_DIR = 'uploads'
UPLOADS_BACKUP_DIR = 'uploads.test_backup'

# 是否在测试后恢复数据库（默认为True）
RESTORE_DB_AFTER_TEST = os.environ.get('RESTORE_DB_AFTER_TEST', 'true').lower() == 'true'

# 是否使用手动服务器模式（默认为False，自动启动/停止服务器）
MANUAL_SERVER_MODE = os.environ.get('TEST_MANUAL_SERVER', 'false').lower() == 'true'

# 服务器进程（用于自动模式）
_server_process = None
_atexit_registered = False

def start_server():
    """启动Flask服务器进程"""
    global _server_process, _atexit_registered
    if MANUAL_SERVER_MODE:
        print("ℹ️ 手动服务器模式：跳过服务器启动")
        return True
    
    try:
        print("🚀 正在启动服务器...")
        # 使用subprocess启动app.py
        _server_process = subprocess.Popen(
            [sys.executable, 'app.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=os.path.dirname(os.path.abspath(__file__)) or '.'
        )
        
        # 注册退出时清理函数（只注册一次）
        if not _atexit_registered:
            atexit.register(stop_server)
            _atexit_registered = True
        
        # 等待服务器启动（最多30秒）
        max_wait = 30
        for i in range(max_wait):
            try:
                resp = requests.get(f"{BASE_URL}/", timeout=1)
                if resp.status_code in [200, 302, 303]:
                    print(f"✅ 服务器已启动 (等待了 {i+1} 秒)")
                    return True
            except requests.exceptions.RequestException:
                # 服务器可能尚未启动或端口未开放，忽略异常并重试直到超时
                pass
            time.sleep(1)
        
        print("❌ 服务器启动超时")
        stop_server()
        return False
    except Exception as e:
        print(f"❌ 启动服务器失败: {e}")
        return False

def stop_server():
    """停止Flask服务器进程"""
    global _server_process
    if MANUAL_SERVER_MODE:
        print("ℹ️ 手动服务器模式：跳过服务器停止")
        return True
    
    if _server_process is None:
        return True
    
    try:
        print("🛑 正在停止服务器...")
        # 发送终止信号
        if sys.platform == 'win32':
            _server_process.terminate()
        else:
            _server_process.send_signal(signal.SIGTERM)
        
        # 等待进程结束（最多5秒）
        try:
            _server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            # 强制终止
            _server_process.kill()
            _server_process.wait()
        
        print("✅ 服务器已停止")
        _server_process = None
        
        # 等待一小段时间确保文件锁释放
        time.sleep(1)
        return True
    except Exception as e:
        print(f"❌ 停止服务器失败: {e}")
        return False

def backup_database():
    """备份数据库和上传目录"""
    try:
        if os.path.exists(DB_PATH):
            shutil.copy2(DB_PATH, BACKUP_PATH)
            print(f"✅ 已备份数据库: {DB_PATH} -> {BACKUP_PATH}")
        if os.path.exists(UPLOADS_DIR):
            if os.path.exists(UPLOADS_BACKUP_DIR):
                shutil.rmtree(UPLOADS_BACKUP_DIR)
            shutil.copytree(UPLOADS_DIR, UPLOADS_BACKUP_DIR)
            print(f"✅ 已备份上传目录: {UPLOADS_DIR} -> {UPLOADS_BACKUP_DIR}")
        return True
    except Exception as e:
        print(f"❌ 备份失败: {e}")
        return False

def restore_database():
    """恢复数据库和上传目录
    
    在自动模式下，服务器会先停止再恢复数据库，因此不会有文件锁问题。
    在手动模式下，需要确保服务器已停止才能成功恢复。
    """
    try:
        if os.path.exists(BACKUP_PATH):
            shutil.copy2(BACKUP_PATH, DB_PATH)
            os.remove(BACKUP_PATH)
            print(f"✅ 已恢复数据库: {BACKUP_PATH} -> {DB_PATH}")
        if os.path.exists(UPLOADS_BACKUP_DIR):
            if os.path.exists(UPLOADS_DIR):
                shutil.rmtree(UPLOADS_DIR)
            shutil.copytree(UPLOADS_BACKUP_DIR, UPLOADS_DIR)
            shutil.rmtree(UPLOADS_BACKUP_DIR)
            print(f"✅ 已恢复上传目录: {UPLOADS_BACKUP_DIR} -> {UPLOADS_DIR}")
        return True
    except Exception as e:
        print(f"❌ 恢复失败: {e}")
        if MANUAL_SERVER_MODE:
            print("提示: 手动模式下，请确保服务器已停止后重试。")
        return False

# 从数据库读取admin密码
def get_admin_password():
    """
    从数据库读取admin用户的密码
    注意: 虽然列名为password_hash，但当前实现存储的是明文密码
    """
    try:
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT password_hash FROM users WHERE username=?", (ADMIN_USERNAME,))
            result = cursor.fetchone()
            if result:
                return result[0]
    except Exception as e:
        print(f"警告: 无法从数据库读取密码: {e}")
    # 如果无法从数据库读取，使用环境变量或默认值
    return os.environ.get('ADMIN_PASSWORD', 'admin123')

ADMIN_PASSWORD = get_admin_password()

# 测试结果统计
test_results = {
    'passed': 0,
    'failed': 0,
    'errors': []
}


class TestSession:
    """管理测试会话"""
    def __init__(self):
        self.session = requests.Session()
        self.csrf_token = None
        self.su_verified = False
        
    def get_csrf_token(self, html_content):
        """从HTML中提取CSRF token"""
        import re
        match = re.search(r'name="csrf_token"[^>]*value="([^"]*)"', html_content)
        if match:
            return match.group(1)
        # 也尝试其他格式
        match = re.search(r'value="([^"]*)"[^>]*name="csrf_token"', html_content)
        if match:
            return match.group(1)
        return None


def log_test(test_name, passed, message=''):
    """记录测试结果"""
    status = '✅ PASS' if passed else '❌ FAIL'
    print(f"  {status}: {test_name}")
    if message:
        print(f"       {message}")
    if passed:
        test_results['passed'] += 1
    else:
        test_results['failed'] += 1
        test_results['errors'].append(f"{test_name}: {message}")


def test_section(name):
    """打印测试部分标题"""
    print(f"\n{'='*60}")
    print(f"测试: {name}")
    print('='*60)


# ============================================
# 登录/登出测试
# ============================================
def test_login(ts):
    """测试登录功能"""
    test_section("登录/登出")
    
    # 获取登录页面
    try:
        resp = ts.session.get(f"{BASE_URL}/login")
        log_test("获取登录页面", resp.status_code == 200, f"状态码: {resp.status_code}")
        ts.csrf_token = ts.get_csrf_token(resp.text)
    except Exception as e:
        log_test("获取登录页面", False, str(e))
        return False
    
    # 执行登录
    try:
        login_data = {
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD,
        }
        if ts.csrf_token:
            login_data['csrf_token'] = ts.csrf_token
            
        resp = ts.session.post(f"{BASE_URL}/login", data=login_data, allow_redirects=False)
        # 登录成功应该重定向
        success = resp.status_code in [302, 303, 200]
        log_test("管理员登录", success, f"状态码: {resp.status_code}")
        
        if resp.status_code in [302, 303]:
            # 跟随重定向
            ts.session.get(f"{BASE_URL}/")
            
        return success
    except Exception as e:
        log_test("管理员登录", False, str(e))
        return False


def test_su_verification(ts):
    """测试SU验证"""
    try:
        # 获取SU验证页面
        resp = ts.session.get(f"{BASE_URL}/admin/su")
        ts.csrf_token = ts.get_csrf_token(resp.text)
        
        # 执行SU验证
        su_data = {
            'password': ADMIN_PASSWORD,
        }
        if ts.csrf_token:
            su_data['csrf_token'] = ts.csrf_token
            
        resp = ts.session.post(f"{BASE_URL}/admin/su", data=su_data, allow_redirects=True)
        # Check if SU verification succeeded: either redirect or success message in response
        success = (resp.status_code == 200 and 'success' in resp.text.lower()) or resp.status_code in [302, 303]
        log_test("SU验证", success, f"状态码: {resp.status_code}")
        if success:
            ts.su_verified = True
        return success
    except Exception as e:
        log_test("SU验证", False, str(e))
        return False


def test_logout(ts):
    """测试登出功能"""
    try:
        resp = ts.session.get(f"{BASE_URL}/logout", allow_redirects=False)
        success = resp.status_code in [302, 303]
        log_test("登出", success, f"状态码: {resp.status_code}")
        return success
    except Exception as e:
        log_test("登出", False, str(e))
        return False


# ============================================
# 用户资料测试
# ============================================
def test_profile(ts):
    """测试用户资料功能"""
    test_section("用户资料")
    
    # 获取资料页面
    try:
        resp = ts.session.get(f"{BASE_URL}/profile")
        log_test("获取资料页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取资料页面", False, str(e))


def test_settings(ts):
    """测试设置页面"""
    try:
        resp = ts.session.get(f"{BASE_URL}/settings")
        log_test("获取设置页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取设置页面", False, str(e))
        
    try:
        resp = ts.session.get(f"{BASE_URL}/settings/follows")
        log_test("获取关注设置页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取关注设置页面", False, str(e))
        
    try:
        resp = ts.session.get(f"{BASE_URL}/settings/images")
        log_test("获取图片设置页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取图片设置页面", False, str(e))


# ============================================
# 聊天室测试
# ============================================
def test_chat(ts):
    """测试聊天功能"""
    test_section("聊天室")
    
    # 获取聊天室列表
    try:
        resp = ts.session.get(f"{BASE_URL}/chat")
        log_test("获取聊天室列表页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取聊天室列表页面", False, str(e))
    
    # 获取聊天室1
    try:
        resp = ts.session.get(f"{BASE_URL}/chat/1")
        log_test("获取聊天室详情", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取聊天室详情", False, str(e))
    
    # 获取聊天历史
    try:
        resp = ts.session.get(f"{BASE_URL}/api/chat/1/history")
        data = resp.json()
        success = resp.status_code == 200 and 'messages' in data
        log_test("获取聊天历史API", success, f"消息数: {len(data.get('messages', []))}")
    except Exception as e:
        log_test("获取聊天历史API", False, str(e))
    
    # 发送聊天消息
    message_id = None
    try:
        resp = ts.session.post(f"{BASE_URL}/api/chat/send", json={
            'room_id': 1,
            'message': f'测试消息 - {datetime.now().isoformat()}'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("发送聊天消息API", success, f"响应: {data}")
    except Exception as e:
        log_test("发送聊天消息API", False, str(e))
    
    # 获取在线人数
    try:
        resp = ts.session.get(f"{BASE_URL}/api/chat/1/online_count")
        data = resp.json()
        success = resp.status_code == 200 and 'count' in data
        log_test("获取聊天室在线人数", success, f"在线: {data.get('count')}")
    except Exception as e:
        log_test("获取聊天室在线人数", False, str(e))
    
    # 验证引用
    try:
        resp = ts.session.post(f"{BASE_URL}/api/chat/validate_quotes", json={
            'room_id': 1,
            'quote_ids': [1]
        })
        data = resp.json()
        success = resp.status_code == 200
        log_test("验证引用API", success, f"响应: {data}")
    except Exception as e:
        log_test("验证引用API", False, str(e))


# ============================================
# 论坛测试
# ============================================
def test_forum(ts):
    """测试论坛功能"""
    test_section("论坛")
    
    # 获取论坛首页
    try:
        resp = ts.session.get(f"{BASE_URL}/forum")
        log_test("获取论坛首页", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取论坛首页", False, str(e))
    
    # 获取分区
    try:
        resp = ts.session.get(f"{BASE_URL}/forum/section/1")
        log_test("获取论坛分区", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("获取论坛分区", False, str(e))
    
    # 获取新帖页面
    try:
        resp = ts.session.get(f"{BASE_URL}/forum/new/1")
        log_test("获取发帖页面", resp.status_code == 200, f"状态码: {resp.status_code}")
        ts.csrf_token = ts.get_csrf_token(resp.text)
    except Exception as e:
        log_test("获取发帖页面", False, str(e))
    
    # 发帖
    thread_id = None
    try:
        post_data = {
            'title': f'测试帖子 - {datetime.now().isoformat()}',
            'content': '这是测试帖子内容',
        }
        if ts.csrf_token:
            post_data['csrf_token'] = ts.csrf_token
            
        resp = ts.session.post(f"{BASE_URL}/forum/new/1", data=post_data, allow_redirects=True)
        success = resp.status_code == 200
        log_test("发帖", success, f"状态码: {resp.status_code}")
        
        # 尝试从URL获取帖子ID
        if '/forum/thread/' in resp.url:
            thread_id = int(resp.url.split('/forum/thread/')[-1].split('?')[0])
    except Exception as e:
        log_test("发帖", False, str(e))
    
    # 如果有帖子，测试回复
    if thread_id:
        try:
            resp = ts.session.post(f"{BASE_URL}/api/forum/reply", data={
                'thread_id': thread_id,
                'content': f'测试回复 - {datetime.now().isoformat()}'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("发回复API", success, f"响应: {data}")
        except Exception as e:
            log_test("发回复API", False, str(e))
        
        # 获取回复列表
        try:
            resp = ts.session.get(f"{BASE_URL}/api/forum/thread/{thread_id}/replies")
            data = resp.json()
            success = resp.status_code == 200 and 'replies' in data
            log_test("获取回复列表API", success, f"回复数: {len(data.get('replies', []))}")
        except Exception as e:
            log_test("获取回复列表API", False, str(e))


# ============================================
# 图片上传测试
# ============================================
def test_upload(ts):
    """测试图片上传功能"""
    test_section("图片上传")
    
    # 获取配额
    try:
        resp = ts.session.get(f"{BASE_URL}/api/upload/quota")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取上传配额API", success, f"配额信息: {data.get('quota')}")
    except Exception as e:
        log_test("获取上传配额API", False, str(e))
    
    # 获取图片列表
    try:
        resp = ts.session.get(f"{BASE_URL}/api/upload/images")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取图片列表API", success, f"图片数: {len(data.get('images', []))}")
    except Exception as e:
        log_test("获取图片列表API", False, str(e))
    
    # 创建测试图片并上传
    try:
        # 创建一个小的测试PNG图片（简单的1x1红色PNG）
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        resp = ts.session.post(f"{BASE_URL}/api/upload/image", files=files)
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("上传图片API", success, f"响应: {data}")
        
        # 如果上传成功，测试删除
        if success and data.get('id'):
            try:
                resp = ts.session.delete(f"{BASE_URL}/api/upload/image/{data['id']}")
                del_data = resp.json()
                success = resp.status_code == 200 and del_data.get('success')
                log_test("删除图片API", success, f"响应: {del_data}")
            except Exception as e:
                log_test("删除图片API", False, str(e))
    except Exception as e:
        log_test("上传图片API", False, str(e))


# ============================================
# 关注功能测试
# ============================================
def test_follows(ts):
    """测试关注功能"""
    test_section("关注功能")
    
    # 获取关注列表
    try:
        resp = ts.session.get(f"{BASE_URL}/api/follows")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取关注列表API", success, f"关注数: {len(data.get('follows', []))}")
    except Exception as e:
        log_test("获取关注列表API", False, str(e))
    
    try:
        resp = ts.session.get(f"{BASE_URL}/api/follow/following")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取正在关注列表API", success, f"关注数: {len(data.get('following', []))}")
    except Exception as e:
        log_test("获取正在关注列表API", False, str(e))


# ============================================
# 其他API测试
# ============================================
def test_misc_api(ts):
    """测试其他API"""
    test_section("其他API")
    
    # 获取在线人数
    try:
        resp = ts.session.get(f"{BASE_URL}/api/online_count")
        data = resp.json()
        success = resp.status_code == 200 and 'count' in data
        log_test("获取全局在线人数", success, f"在线: {data.get('count')}")
    except Exception as e:
        log_test("获取全局在线人数", False, str(e))
    
    # 获取随机名言
    try:
        resp = ts.session.get(f"{BASE_URL}/api/random_quote")
        data = resp.json()
        success = resp.status_code == 200
        log_test("获取随机名言", success, f"名言: {data.get('quote', '')[:50]}...")
    except Exception as e:
        log_test("获取随机名言", False, str(e))
    
    # 获取未读数
    try:
        resp = ts.session.get(f"{BASE_URL}/api/last_views/unread_counts")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取未读数API", success, f"响应: {data}")
    except Exception as e:
        log_test("获取未读数API", False, str(e))
    
    # 搜索用户
    try:
        resp = ts.session.get(f"{BASE_URL}/api/search_users?username=admin")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("搜索用户API", success, f"结果数: {len(data.get('users', []))}")
    except Exception as e:
        log_test("搜索用户API", False, str(e))


# ============================================
# 管理员功能测试
# ============================================
def test_admin(ts):
    """测试管理员功能"""
    test_section("管理员功能")
    
    # 确保SU验证
    if not ts.su_verified:
        test_su_verification(ts)
    
    # 管理员首页
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/index")
        log_test("管理员首页", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("管理员首页", False, str(e))
    
    # 用户管理页面
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/users")
        log_test("用户管理页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("用户管理页面", False, str(e))
    
    # 聊天室管理页面
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/chat")
        log_test("聊天室管理页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("聊天室管理页面", False, str(e))
    
    # 论坛管理页面
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/forum")
        log_test("论坛管理页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("论坛管理页面", False, str(e))
    
    # 名言管理页面
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/quotes")
        log_test("名言管理页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("名言管理页面", False, str(e))
    
    # 数据库管理页面
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/db/")
        log_test("数据库管理页面", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("数据库管理页面", False, str(e))


def test_admin_api(ts):
    """测试管理员API"""
    test_section("管理员API")
    
    # 确保SU验证
    if not ts.su_verified:
        test_su_verification(ts)
    
    # 获取聊天室列表
    try:
        resp = ts.session.get(f"{BASE_URL}/api/admin/chat/rooms")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取聊天室列表API", success, f"聊天室数: {len(data.get('rooms', []))}")
    except Exception as e:
        log_test("获取聊天室列表API", False, str(e))
    
    # 获取论坛分区列表
    try:
        resp = ts.session.get(f"{BASE_URL}/api/admin/forum/sections")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取论坛分区列表API", success, f"分区数: {len(data.get('sections', []))}")
    except Exception as e:
        log_test("获取论坛分区列表API", False, str(e))
    
    # 获取系统信息
    try:
        resp = ts.session.get(f"{BASE_URL}/api/admin/system-info")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取系统信息API", success, f"响应: 成功")
    except Exception as e:
        log_test("获取系统信息API", False, str(e))
    
    # 获取系统日志
    try:
        resp = ts.session.get(f"{BASE_URL}/api/admin/system-log")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取系统日志API", success, f"日志数: {len(data.get('logs', []))}")
    except Exception as e:
        log_test("获取系统日志API", False, str(e))
    
    # 获取名言列表
    try:
        resp = ts.session.get(f"{BASE_URL}/api/admin/quotes")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取名言列表API", success, f"名言数: {len(data.get('quotes', []))}")
    except Exception as e:
        log_test("获取名言列表API", False, str(e))
    
    # 创建测试用户
    test_user_id = None
    try:
        resp = ts.session.post(f"{BASE_URL}/api/admin/users", json={
            'username': f'testuser_{int(time.time())}',
            'password': 'testpassword123',
            'nickname': '测试用户',
            'role': 'user'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        test_user_id = data.get('user_id')
        log_test("创建用户API", success, f"用户ID: {test_user_id}")
    except Exception as e:
        log_test("创建用户API", False, str(e))
    
    # 如果创建成功，测试更多API
    if test_user_id:
        # 获取用户权限
        try:
            resp = ts.session.get(f"{BASE_URL}/api/admin/users/{test_user_id}/permissions")
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("获取用户权限API", success, f"响应: 成功")
        except Exception as e:
            log_test("获取用户权限API", False, str(e))
        
        # 更新用户权限
        try:
            resp = ts.session.put(f"{BASE_URL}/api/admin/users/{test_user_id}/permissions", json={
                'scope': 'chat',
                'target_id': 1,
                'perm': '777'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("更新用户权限API", success, f"响应: {data}")
        except Exception as e:
            log_test("更新用户权限API", False, str(e))
        
        # 删除测试用户
        try:
            resp = ts.session.delete(f"{BASE_URL}/api/admin/users/{test_user_id}")
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("删除用户API", success, f"响应: {data}")
        except Exception as e:
            log_test("删除用户API", False, str(e))
    
    # 创建测试聊天室
    test_room_id = None
    try:
        resp = ts.session.post(f"{BASE_URL}/api/admin/chat/rooms", json={
            'name': f'测试聊天室_{int(time.time())}',
            'description': '测试用聊天室'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        test_room_id = data.get('room', {}).get('id')
        log_test("创建聊天室API", success, f"聊天室ID: {test_room_id}")
    except Exception as e:
        log_test("创建聊天室API", False, str(e))
    
    if test_room_id:
        # 更新聊天室
        try:
            resp = ts.session.put(f"{BASE_URL}/api/admin/chat/rooms/{test_room_id}", json={
                'name': f'更新后的聊天室_{int(time.time())}',
                'description': '更新后的描述'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("更新聊天室API", success, f"响应: {data}")
        except Exception as e:
            log_test("更新聊天室API", False, str(e))
        
        # 删除聊天室
        try:
            resp = ts.session.delete(f"{BASE_URL}/api/admin/chat/rooms/{test_room_id}")
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("删除聊天室API", success, f"响应: {data}")
        except Exception as e:
            log_test("删除聊天室API", False, str(e))
    
    # 创建测试论坛分区
    test_section_id = None
    try:
        resp = ts.session.post(f"{BASE_URL}/api/admin/forum/sections", json={
            'name': f'测试分区_{int(time.time())}',
            'description': '测试用分区'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        test_section_id = data.get('section', {}).get('id')
        log_test("创建论坛分区API", success, f"分区ID: {test_section_id}")
    except Exception as e:
        log_test("创建论坛分区API", False, str(e))
    
    if test_section_id:
        # 更新分区
        try:
            resp = ts.session.put(f"{BASE_URL}/api/admin/forum/sections/{test_section_id}", json={
                'name': f'更新后的分区_{int(time.time())}',
                'description': '更新后的描述'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("更新论坛分区API", success, f"响应: {data}")
        except Exception as e:
            log_test("更新论坛分区API", False, str(e))
        
        # 删除分区
        try:
            resp = ts.session.delete(f"{BASE_URL}/api/admin/forum/sections/{test_section_id}")
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("删除论坛分区API", success, f"响应: {data}")
        except Exception as e:
            log_test("删除论坛分区API", False, str(e))
    
    # 测试名言API
    quote_index = None
    try:
        resp = ts.session.post(f"{BASE_URL}/api/admin/quotes", json={
            'text': f'测试名言_{int(time.time())}',
            'author': '测试作者'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("添加名言API", success, f"响应: {data}")
        
        # 获取名言列表以找到新添加的索引
        if success:
            resp = ts.session.get(f"{BASE_URL}/api/admin/quotes")
            quotes_data = resp.json()
            if quotes_data.get('success'):
                quote_index = len(quotes_data.get('quotes', [])) - 1
    except Exception as e:
        log_test("添加名言API", False, str(e))
    
    if quote_index is not None and quote_index >= 0:
        # 更新名言
        try:
            resp = ts.session.put(f"{BASE_URL}/api/admin/quotes/{quote_index}", json={
                'text': f'更新后的名言_{int(time.time())}',
                'author': '更新后的作者'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("更新名言API", success, f"响应: {data}")
        except Exception as e:
            log_test("更新名言API", False, str(e))
        
        # 删除名言
        try:
            resp = ts.session.delete(f"{BASE_URL}/api/admin/quotes/{quote_index}")
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("删除名言API", success, f"响应: {data}")
        except Exception as e:
            log_test("删除名言API", False, str(e))


def test_user_deletion_with_activity(ts):
    """测试删除有活动记录的用户（消息、帖子、图片等）"""
    test_section("用户删除（有活动记录）")
    
    # 确保SU验证
    if not ts.su_verified:
        test_su_verification(ts)
    
    test_username = f'test_active_user_{int(time.time())}'
    test_password = 'testpassword123'
    test_user_id = None
    
    # 1. 创建测试用户
    try:
        resp = ts.session.post(f"{BASE_URL}/api/admin/users", json={
            'username': test_username,
            'password': test_password,
            'nickname': '测试活跃用户',
            'role': 'user'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        test_user_id = data.get('user_id')
        log_test("创建测试用户", success, f"用户ID: {test_user_id}")
    except Exception as e:
        log_test("创建测试用户", False, str(e))
        return
    
    if not test_user_id:
        log_test("用户删除测试跳过", False, "无法创建测试用户")
        return
    
    # 2. 以测试用户身份登录
    test_session = TestSession()
    try:
        resp = test_session.session.get(f"{BASE_URL}/login")
        test_session.csrf_token = test_session.get_csrf_token(resp.text)
        
        login_data = {
            'username': test_username,
            'password': test_password,
        }
        if test_session.csrf_token:
            login_data['csrf_token'] = test_session.csrf_token
            
        resp = test_session.session.post(f"{BASE_URL}/login", data=login_data, allow_redirects=True)
        success = resp.status_code in [302, 303, 200]
        log_test("测试用户登录", success, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("测试用户登录", False, str(e))
        # 清理：尝试删除用户
        ts.session.delete(f"{BASE_URL}/api/admin/users/{test_user_id}")
        return
    
    # 3. 发送聊天消息
    try:
        resp = test_session.session.post(f"{BASE_URL}/api/chat/send", json={
            'room_id': 1,
            'message': f'测试消息 by {test_username} - {datetime.now().isoformat()}'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("测试用户发送聊天消息", success, f"响应: {data}")
    except Exception as e:
        log_test("测试用户发送聊天消息", False, str(e))
    
    # 4. 发帖（获取CSRF token后发帖）
    thread_id = None
    try:
        resp = test_session.session.get(f"{BASE_URL}/forum/new/1")
        test_session.csrf_token = test_session.get_csrf_token(resp.text)
        
        post_data = {
            'title': f'测试帖子 by {test_username}',
            'content': '这是测试帖子内容',
        }
        if test_session.csrf_token:
            post_data['csrf_token'] = test_session.csrf_token
            
        resp = test_session.session.post(f"{BASE_URL}/forum/new/1", data=post_data, allow_redirects=True)
        success = resp.status_code == 200
        log_test("测试用户发帖", success, f"状态码: {resp.status_code}")
        
        if '/forum/thread/' in resp.url:
            thread_id = int(resp.url.split('/forum/thread/')[-1].split('?')[0])
    except Exception as e:
        log_test("测试用户发帖", False, str(e))
    
    # 5. 回复帖子
    if thread_id:
        try:
            resp = test_session.session.post(f"{BASE_URL}/api/forum/reply", data={
                'thread_id': thread_id,
                'content': f'测试回复 by {test_username}'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("测试用户回复帖子", success, f"响应: {data}")
        except Exception as e:
            log_test("测试用户回复帖子", False, str(e))
    
    # 6. 上传图片
    image_id = None
    try:
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        resp = test_session.session.post(f"{BASE_URL}/api/upload/image", files=files)
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        image_id = data.get('id')
        log_test("测试用户上传图片", success, f"图片ID: {image_id}")
    except Exception as e:
        log_test("测试用户上传图片", False, str(e))
    
    # 7. 修改用户设置
    try:
        resp = test_session.session.post(f"{BASE_URL}/api/settings/profile", json={
            'nickname': '修改后的昵称',
            'color': '#ff5733'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("测试用户修改设置", success, f"响应: {data}")
    except Exception as e:
        log_test("测试用户修改设置", False, str(e))
    
    # 8. 登出测试用户
    try:
        test_session.session.get(f"{BASE_URL}/logout", allow_redirects=False)
    except Exception:
        # 忽略登出错误：即使登出失败也不影响后续管理员删除用户的核心测试
        pass
    
    # 9. 使用管理员删除用户（这是核心测试）
    try:
        resp = ts.session.delete(f"{BASE_URL}/api/admin/users/{test_user_id}")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("删除有活动记录的用户", success, f"响应: {data}")
    except Exception as e:
        log_test("删除有活动记录的用户", False, str(e))
    
    # 10. 验证用户已被删除
    try:
        resp = ts.session.get(f"{BASE_URL}/api/admin/users/{test_user_id}/permissions")
        # 用户不存在应该返回404或相应错误
        success = resp.status_code == 404 or (resp.status_code == 200 and not resp.json().get('success'))
        log_test("验证用户已删除", success, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("验证用户已删除", False, str(e))


def test_admin_user_role(ts):
    """测试用户角色更新API"""
    test_section("用户角色管理")
    
    # 确保SU验证
    if not ts.su_verified:
        test_su_verification(ts)
    
    # 创建测试用户
    test_user_id = None
    try:
        resp = ts.session.post(f"{BASE_URL}/api/admin/users", json={
            'username': f'test_role_user_{int(time.time())}',
            'password': 'testpassword123',
            'nickname': '角色测试用户',
            'role': 'user'
        })
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        test_user_id = data.get('user_id')
        log_test("创建角色测试用户", success, f"用户ID: {test_user_id}")
    except Exception as e:
        log_test("创建角色测试用户", False, str(e))
        return
    
    if test_user_id:
        # 更新用户角色
        try:
            resp = ts.session.put(f"{BASE_URL}/api/admin/users/{test_user_id}/role", json={
                'role': 'admin'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("更新用户角色API", success, f"响应: {data}")
        except Exception as e:
            log_test("更新用户角色API", False, str(e))
        
        # 更新用户信息
        try:
            resp = ts.session.put(f"{BASE_URL}/api/admin/users/{test_user_id}", json={
                'nickname': '更新后的昵称',
                'color': '#3399ff',
                'badge': 'VIP'
            })
            data = resp.json()
            success = resp.status_code == 200 and data.get('success')
            log_test("更新用户信息API", success, f"响应: {data}")
        except Exception as e:
            log_test("更新用户信息API", False, str(e))
        
        # 清理：删除测试用户
        try:
            ts.session.delete(f"{BASE_URL}/api/admin/users/{test_user_id}")
        except Exception:
            # 清理失败不影响主测试结果，安全忽略
            pass


def test_db_admin(ts):
    """测试数据库管理功能"""
    test_section("数据库管理")
    
    # 确保SU验证
    if not ts.su_verified:
        test_su_verification(ts)
    
    # 获取表列表
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/db/")
        log_test("数据库管理首页", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("数据库管理首页", False, str(e))
    
    # 获取users表
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/db/table/users")
        log_test("查看users表", resp.status_code == 200, f"状态码: {resp.status_code}")
    except Exception as e:
        log_test("查看users表", False, str(e))
    
    # 获取表数据API
    try:
        resp = ts.session.get(f"{BASE_URL}/admin/db/table/users/data")
        data = resp.json()
        success = resp.status_code == 200 and data.get('success')
        log_test("获取表数据API", success, f"数据行数: {len(data.get('data', []))}")
    except Exception as e:
        log_test("获取表数据API", False, str(e))


# ============================================
# 主函数
# ============================================
def main():
    """运行所有测试"""
    print("\n" + "="*60)
    print("Stellarsis 后端自动化测试")
    print(f"目标服务器: {BASE_URL}")
    print(f"测试时间: {datetime.now().isoformat()}")
    print(f"数据库路径: {DB_PATH}")
    print(f"测试后恢复数据库: {'是' if RESTORE_DB_AFTER_TEST else '否'}")
    print(f"服务器模式: {'手动' if MANUAL_SERVER_MODE else '自动'}")
    print("="*60)
    
    # 备份数据库
    print("\n" + "-"*40)
    print("备份数据库...")
    print("-"*40)
    backup_success = backup_database()
    if not backup_success:
        print("⚠️ 警告: 数据库备份失败，测试将继续但无法恢复")
    
    # 启动服务器（自动模式）
    if not MANUAL_SERVER_MODE:
        print("\n" + "-"*40)
        print("启动服务器...")
        print("-"*40)
        if not start_server():
            print("❌ 无法启动服务器，测试中止")
            return 1
    
    # 创建测试会话
    ts = TestSession()
    
    try:
        # 登录测试
        if not test_login(ts):
            print("\n❌ 登录失败，无法继续测试")
            if MANUAL_SERVER_MODE:
                print("请确保:")
                print("  1. 服务器已启动 (python app.py)")
                print("  2. 管理员密码正确 (默认: admin)")
            return 1
        
        # SU验证
        test_su_verification(ts)
        
        # 运行各项测试
        test_profile(ts)
        test_settings(ts)
        test_chat(ts)
        test_forum(ts)
        test_upload(ts)
        test_follows(ts)
        test_misc_api(ts)
        test_admin(ts)
        test_admin_api(ts)
        test_admin_user_role(ts)
        test_user_deletion_with_activity(ts)
        test_db_admin(ts)
        
        # 登出测试
        test_logout(ts)
    
    finally:
        # 停止服务器（自动模式下，必须在恢复数据库之前停止）
        if not MANUAL_SERVER_MODE:
            print("\n" + "-"*40)
            print("停止服务器...")
            print("-"*40)
            stop_server()
        
        # 恢复数据库
        if RESTORE_DB_AFTER_TEST and backup_success:
            print("\n" + "-"*40)
            print("恢复数据库...")
            print("-"*40)
            restore_database()
    
    # 打印总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    print(f"  ✅ 通过: {test_results['passed']}")
    print(f"  ❌ 失败: {test_results['failed']}")
    total = test_results['passed'] + test_results['failed']
    if total > 0:
        pass_rate = (test_results['passed'] / total) * 100
        print(f"  📊 通过率: {pass_rate:.1f}%")
    
    if test_results['errors']:
        print("\n失败的测试:")
        for error in test_results['errors']:
            print(f"  - {error}")
    
    print("\n" + "="*60)
    
    return 0 if test_results['failed'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
