# -*- coding: utf-8 -*-
"""
主窗口
"""

import tkinter as tk
from tkinter import ttk, messagebox
import threading
import time
from datetime import datetime
import config
from api import api_service
from utils.token_manager import token_manager
from utils.notification import notification_helper


class MainWindow:
    """主窗口类"""
    
    def __init__(self, on_logout):
        """
        初始化主窗口
        
        Args:
            on_logout: 登出回调函数
        """
        self.on_logout = on_logout
        self.running = True
        self.check_thread = None
        self.last_unread_count = 0
        
        self.window = tk.Tk()
        self.window.title(config.WINDOW_TITLE)
        self.window.geometry(f"{config.WINDOW_WIDTH}x{config.WINDOW_HEIGHT}")
        self.window.resizable(False, False)
        
        # 居中显示
        self._center_window()
        
        # 设置 API Token
        token = token_manager.get_token()
        if token:
            api_service.set_token(token)
        
        self._create_widgets()
        self._start_check_thread()
        
        # 窗口关闭事件
        self.window.protocol("WM_DELETE_WINDOW", self._on_close)
    
    def _center_window(self):
        """将窗口居中显示"""
        self.window.update_idletasks()
        x = (self.window.winfo_screenwidth() // 2) - (config.WINDOW_WIDTH // 2)
        y = (self.window.winfo_screenheight() // 2) - (config.WINDOW_HEIGHT // 2)
        self.window.geometry(f"{config.WINDOW_WIDTH}x{config.WINDOW_HEIGHT}+{x}+{y}")
    
    def _create_widgets(self):
        """创建界面组件"""
        # 主框架
        main_frame = ttk.Frame(self.window, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 用户信息卡片
        user_frame = ttk.LabelFrame(main_frame, text="用户信息", padding="10")
        user_frame.pack(fill=tk.X, pady=(0, 10))
        
        user_info = token_manager.get_user_info()
        username = user_info.get("nickname") or user_info.get("username", "用户") if user_info else "用户"
        
        ttk.Label(user_frame, text="欢迎回来", font=("Microsoft YaHei", 10)).pack(anchor=tk.W)
        ttk.Label(
            user_frame,
            text=username,
            font=("Microsoft YaHei", 16, "bold"),
            foreground="#1976D2"
        ).pack(anchor=tk.W, pady=(5, 0))
        
        # 消息中心卡片
        msg_frame = ttk.LabelFrame(main_frame, text="消息中心", padding="10")
        msg_frame.pack(fill=tk.X, pady=10)
        
        # 未读总数
        self.total_label = ttk.Label(
            msg_frame,
            text="未读消息总数: 0",
            font=("Microsoft YaHei", 14, "bold"),
            foreground="#FF5722"
        )
        self.total_label.pack(anchor=tk.W, pady=(0, 10))
        
        # 分隔线
        ttk.Separator(msg_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)
        
        # 聊天未读
        self.chat_label = ttk.Label(
            msg_frame,
            text="💬 聊天消息: 0 条未读",
            font=("Microsoft YaHei", 11)
        )
        self.chat_label.pack(anchor=tk.W, pady=3)
        
        # 论坛未读
        self.forum_label = ttk.Label(
            msg_frame,
            text="📋 论坛更新: 0 条未读",
            font=("Microsoft YaHei", 11)
        )
        self.forum_label.pack(anchor=tk.W, pady=3)
        
        # 状态栏
        self.status_label = ttk.Label(
            main_frame,
            text="点击刷新获取最新消息",
            foreground="gray"
        )
        self.status_label.pack(pady=10)
        
        # 按钮区域
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(20, 0), side=tk.BOTTOM)
        
        # 刷新按钮
        self.refresh_button = ttk.Button(
            button_frame,
            text="刷 新",
            command=self._on_refresh
        )
        self.refresh_button.pack(fill=tk.X, pady=5, ipady=10)
        
        # 登出按钮
        self.logout_button = ttk.Button(
            button_frame,
            text="登 出",
            command=self._on_logout
        )
        self.logout_button.pack(fill=tk.X, pady=5, ipady=5)
    
    def _update_ui(self, total_unread: int, chat_count: int, forum_count: int):
        """更新界面显示"""
        self.total_label.config(text=f"未读消息总数: {total_unread}")
        self.chat_label.config(text=f"💬 聊天消息: {chat_count} 条未读")
        self.forum_label.config(text=f"📋 论坛更新: {forum_count} 条未读")
        
        now = datetime.now().strftime("%H:%M:%S")
        self.status_label.config(text=f"上次刷新: {now}")
    
    def _on_refresh(self):
        """刷新按钮点击事件"""
        self.refresh_button.config(state=tk.DISABLED)
        self.status_label.config(text="正在刷新...")
        self.window.update()
        
        # 在新线程中刷新
        def refresh():
            success, data = api_service.get_unread_notifications()
            self.window.after(0, lambda: self._handle_refresh_result(success, data))
        
        threading.Thread(target=refresh, daemon=True).start()
    
    def _handle_refresh_result(self, success: bool, data: dict):
        """处理刷新结果"""
        self.refresh_button.config(state=tk.NORMAL)
        
        if success:
            total_unread = data.get("total_unread", 0)
            chat_counts = data.get("chat", {})
            forum_counts = data.get("forum", {})
            
            chat_count = sum(item.get("count", 0) for item in chat_counts.values()) if chat_counts else 0
            forum_count = sum(item.get("count", 0) for item in forum_counts.values()) if forum_counts else 0
            
            self._update_ui(total_unread, chat_count, forum_count)
        elif data.get("expired"):
            messagebox.showwarning("提示", "登录已过期，请重新登录")
            self._perform_logout()
        else:
            message = data.get("message", "刷新失败")
            self.status_label.config(text=f"错误: {message}")
    
    def _start_check_thread(self):
        """启动后台检查线程"""
        def check_loop():
            while self.running:
                # 首次延迟5秒后开始检查
                time.sleep(5)
                
                while self.running:
                    try:
                        success, data = api_service.get_unread_notifications()
                        
                        if success:
                            total_unread = data.get("total_unread", 0)
                            chat_counts = data.get("chat", {})
                            forum_counts = data.get("forum", {})
                            
                            chat_count = sum(item.get("count", 0) for item in chat_counts.values()) if chat_counts else 0
                            forum_count = sum(item.get("count", 0) for item in forum_counts.values()) if forum_counts else 0
                            
                            # 更新 UI
                            if self.window.winfo_exists():
                                self.window.after(0, lambda t=total_unread, c=chat_count, f=forum_count: self._update_ui(t, c, f))
                            
                            # 如果未读数增加，发送通知
                            if total_unread > self.last_unread_count and total_unread > 0:
                                notification_helper.show_unread_notification(
                                    total_unread, chat_count, forum_count
                                )
                            
                            self.last_unread_count = total_unread
                        elif data.get("expired"):
                            # Token 过期
                            if self.window.winfo_exists():
                                self.window.after(0, lambda: self._handle_token_expired())
                            break
                    except Exception as e:
                        print(f"检查未读消息时出错: {e}")
                    
                    # 等待下次检查
                    for _ in range(config.CHECK_INTERVAL):
                        if not self.running:
                            break
                        time.sleep(1)
        
        self.check_thread = threading.Thread(target=check_loop, daemon=True)
        self.check_thread.start()
    
    def _handle_token_expired(self):
        """处理 Token 过期"""
        messagebox.showwarning("提示", "登录已过期，请重新登录")
        self._perform_logout()
    
    def _on_logout(self):
        """登出按钮点击事件"""
        if messagebox.askyesno("确认", "确定要退出登录吗？"):
            self._perform_logout()
    
    def _perform_logout(self):
        """执行登出"""
        self.running = False
        
        # 通知服务器登出
        api_service.logout()
        
        # 清除本地 Token
        token_manager.clear_token()
        
        self.window.destroy()
        self.on_logout()
    
    def _on_close(self):
        """窗口关闭事件"""
        self.running = False
        self.window.destroy()
    
    def run(self):
        """运行窗口"""
        # 初始刷新
        self._on_refresh()
        self.window.mainloop()
