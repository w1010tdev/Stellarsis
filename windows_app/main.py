#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stellarsis Windows App
群星议会 Windows 客户端

功能:
- 用户登录/登出
- 获取未读消息通知
- Windows 系统通知
"""

import sys
import os

# 确保当前目录在 Python 路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import api_service
from utils.token_manager import token_manager
from ui.login_window import LoginWindow
from ui.main_window import MainWindow


class App:
    """应用程序主类"""
    
    def __init__(self):
        self.running = True
    
    def run(self):
        """运行应用程序"""
        while self.running:
            # 检查是否已登录
            if token_manager.is_logged_in():
                token = token_manager.get_token()
                api_service.set_token(token)
                
                # 验证 Token
                success, _ = api_service.validate_token()
                if success:
                    self._show_main_window()
                else:
                    # Token 无效，清除并显示登录窗口
                    token_manager.clear_token()
                    self._show_login_window()
            else:
                self._show_login_window()
    
    def _show_login_window(self):
        """显示登录窗口"""
        login_window = LoginWindow(on_login_success=self._on_login_success)
        login_window.run()
    
    def _show_main_window(self):
        """显示主窗口"""
        main_window = MainWindow(on_logout=self._on_logout)
        main_window.run()
    
    def _on_login_success(self):
        """登录成功回调"""
        # LoginWindow 会自行销毁，这里什么都不用做
        # 下一次循环会检测到已登录状态并显示主窗口
        pass
    
    def _on_logout(self):
        """登出回调"""
        # MainWindow 会自行销毁，这里什么都不用做
        # 下一次循环会检测到未登录状态并显示登录窗口
        pass


def main():
    """主函数"""
    print("=" * 40)
    print("Stellarsis Windows App")
    print("群星议会 Windows 客户端")
    print("=" * 40)
    
    try:
        app = App()
        app.run()
    except KeyboardInterrupt:
        print("\n程序已退出")
    except Exception as e:
        print(f"程序出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
