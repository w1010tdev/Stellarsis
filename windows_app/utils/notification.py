# -*- coding: utf-8 -*-
"""
Windows 通知工具
"""

import sys
import platform


class NotificationHelper:
    """通知帮助类"""
    
    def __init__(self):
        self.is_windows = platform.system() == "Windows"
        self.toaster = None
        
        if self.is_windows:
            try:
                from win10toast import ToastNotifier
                self.toaster = ToastNotifier()
            except ImportError:
                print("win10toast 未安装，无法发送 Windows 通知")
    
    def show_notification(self, title: str, message: str, duration: int = 5):
        """
        显示系统通知
        
        Args:
            title: 通知标题
            message: 通知内容
            duration: 显示时长（秒）
        """
        if self.is_windows and self.toaster:
            try:
                self.toaster.show_toast(
                    title,
                    message,
                    duration=duration,
                    threaded=True
                )
            except Exception as e:
                print(f"发送通知失败: {e}")
        else:
            # 非 Windows 系统，打印到控制台
            print(f"[通知] {title}: {message}")
    
    def show_unread_notification(self, total_unread: int, chat_count: int, forum_count: int):
        """
        显示未读消息通知
        
        Args:
            total_unread: 未读总数
            chat_count: 聊天未读数
            forum_count: 论坛未读数
        """
        if total_unread <= 0:
            return
        
        parts = []
        if chat_count > 0:
            parts.append(f"{chat_count} 条聊天消息")
        if forum_count > 0:
            parts.append(f"{forum_count} 条论坛更新")
        
        if parts:
            message = "您有 " + "，".join(parts)
        else:
            message = f"您有 {total_unread} 条未读消息"
        
        self.show_notification("Stellarsis - 新消息", message)


# 全局通知帮助类实例
notification_helper = NotificationHelper()
