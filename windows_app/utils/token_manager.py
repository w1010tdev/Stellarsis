# -*- coding: utf-8 -*-
"""
Token 管理器
安全存储和管理用户 Token
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict, Any
import config


class TokenManager:
    """Token 管理类"""
    
    def __init__(self):
        # 获取用户目录
        self.token_file = Path.home() / config.TOKEN_FILE
    
    def save_token(self, token: str, user_info: Dict[str, Any]) -> bool:
        """
        保存 Token 和用户信息
        
        Args:
            token: API Token
            user_info: 用户信息字典
        
        Returns:
            是否保存成功
        """
        try:
            data = {
                "token": token,
                "user": user_info
            }
            with open(self.token_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"保存 Token 失败: {e}")
            return False
    
    def load_token(self) -> Optional[Dict[str, Any]]:
        """
        加载 Token 和用户信息
        
        Returns:
            包含 token 和 user 的字典，如果不存在则返回 None
        """
        try:
            if not self.token_file.exists():
                return None
            
            with open(self.token_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            if "token" in data and "user" in data:
                return data
            return None
        except Exception as e:
            print(f"加载 Token 失败: {e}")
            return None
    
    def get_token(self) -> Optional[str]:
        """
        获取 Token
        
        Returns:
            Token 字符串，如果不存在则返回 None
        """
        data = self.load_token()
        if data:
            return data.get("token")
        return None
    
    def get_user_info(self) -> Optional[Dict[str, Any]]:
        """
        获取用户信息
        
        Returns:
            用户信息字典，如果不存在则返回 None
        """
        data = self.load_token()
        if data:
            return data.get("user")
        return None
    
    def clear_token(self) -> bool:
        """
        清除 Token
        
        Returns:
            是否清除成功
        """
        try:
            if self.token_file.exists():
                os.remove(self.token_file)
            return True
        except Exception as e:
            print(f"清除 Token 失败: {e}")
            return False
    
    def is_logged_in(self) -> bool:
        """
        检查是否已登录
        
        Returns:
            是否已登录
        """
        return self.get_token() is not None


# 全局 Token 管理器实例
token_manager = TokenManager()
