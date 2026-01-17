# -*- coding: utf-8 -*-
"""
登录窗口
"""

import tkinter as tk
from tkinter import ttk, messagebox
import platform
import config
from api import api_service
from utils.token_manager import token_manager


class LoginWindow:
    """登录窗口类"""
    
    def __init__(self, on_login_success):
        """
        初始化登录窗口
        
        Args:
            on_login_success: 登录成功回调函数
        """
        self.on_login_success = on_login_success
        
        self.window = tk.Tk()
        self.window.title(f"{config.WINDOW_TITLE} - 登录")
        self.window.geometry(f"350x400")
        self.window.resizable(False, False)
        
        # 居中显示
        self._center_window()
        
        self._create_widgets()
    
    def _center_window(self):
        """将窗口居中显示"""
        self.window.update_idletasks()
        width = 350
        height = 400
        x = (self.window.winfo_screenwidth() // 2) - (width // 2)
        y = (self.window.winfo_screenheight() // 2) - (height // 2)
        self.window.geometry(f"{width}x{height}+{x}+{y}")
    
    def _create_widgets(self):
        """创建界面组件"""
        # 主框架
        main_frame = ttk.Frame(self.window, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 标题
        title_label = ttk.Label(
            main_frame,
            text="Stellarsis",
            font=("Microsoft YaHei", 24, "bold")
        )
        title_label.pack(pady=(20, 5))
        
        subtitle_label = ttk.Label(
            main_frame,
            text="群星议会",
            font=("Microsoft YaHei", 12)
        )
        subtitle_label.pack(pady=(0, 30))
        
        # 用户名
        username_frame = ttk.Frame(main_frame)
        username_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(username_frame, text="用户名:").pack(anchor=tk.W)
        self.username_entry = ttk.Entry(username_frame, width=35)
        self.username_entry.pack(fill=tk.X, pady=2)
        
        # 密码
        password_frame = ttk.Frame(main_frame)
        password_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(password_frame, text="密码:").pack(anchor=tk.W)
        self.password_entry = ttk.Entry(password_frame, width=35, show="*")
        self.password_entry.pack(fill=tk.X, pady=2)
        
        # 登录按钮
        self.login_button = ttk.Button(
            main_frame,
            text="登录",
            command=self._on_login
        )
        self.login_button.pack(pady=30, ipadx=50, ipady=5)
        
        # 状态标签
        self.status_label = ttk.Label(
            main_frame,
            text="",
            foreground="gray"
        )
        self.status_label.pack()
        
        # 绑定回车键
        self.window.bind("<Return>", lambda e: self._on_login())
        
        # 自动聚焦用户名输入框
        self.username_entry.focus()
    
    def _on_login(self):
        """登录按钮点击事件"""
        username = self.username_entry.get().strip()
        password = self.password_entry.get()
        
        if not username:
            messagebox.showwarning("提示", "请输入用户名")
            self.username_entry.focus()
            return
        
        if not password:
            messagebox.showwarning("提示", "请输入密码")
            self.password_entry.focus()
            return
        
        # 禁用按钮
        self.login_button.config(state=tk.DISABLED)
        self.status_label.config(text="登录中...")
        self.window.update()
        
        # 执行登录
        device_name = f"Windows {platform.release()}"
        success, data = api_service.login(username, password, device_name)
        
        if success:
            # 保存 Token
            token = data.get("token")
            user = data.get("user", {})
            token_manager.save_token(token, user)
            
            self.status_label.config(text="登录成功!")
            self.window.after(500, self._login_complete)
        else:
            message = data.get("message", "登录失败")
            messagebox.showerror("登录失败", message)
            self.login_button.config(state=tk.NORMAL)
            self.status_label.config(text="")
    
    def _login_complete(self):
        """登录完成，跳转到主界面"""
        self.window.destroy()
        self.on_login_success()
    
    def run(self):
        """运行窗口"""
        self.window.mainloop()
