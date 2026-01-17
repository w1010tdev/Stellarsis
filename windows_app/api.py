# -*- coding: utf-8 -*-
"""
Stellarsis API 服务
"""

import requests
from typing import Optional, Dict, Any, Tuple
import config


class ApiService:
    """API 服务类"""
    
    def __init__(self):
        self.base_url = config.SERVER_URL
        self.session = requests.Session()
        self.token: Optional[str] = None
    
    def set_token(self, token: str):
        """设置认证 Token"""
        self.token = token
    
    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        headers = {
            "Content-Type": "application/json"
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def login(self, username: str, password: str, device_name: str = "Windows App") -> Tuple[bool, Dict[str, Any]]:
        """
        用户登录
        
        Args:
            username: 用户名
            password: 密码
            device_name: 设备名称
        
        Returns:
            (success, data) - 成功标志和响应数据
        """
        try:
            url = f"{self.base_url}{config.API_LOGIN}"
            data = {
                "username": username,
                "password": password,
                "device_name": device_name
            }
            response = self.session.post(url, json=data, timeout=30)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                self.token = result.get("token")
                return True, result
            else:
                return False, result
        except requests.exceptions.RequestException as e:
            return False, {"message": f"网络错误: {str(e)}"}
        except Exception as e:
            return False, {"message": f"错误: {str(e)}"}
    
    def logout(self) -> Tuple[bool, Dict[str, Any]]:
        """
        用户登出
        
        Returns:
            (success, data) - 成功标志和响应数据
        """
        try:
            url = f"{self.base_url}{config.API_LOGOUT}"
            response = self.session.post(url, headers=self._get_headers(), timeout=30)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                self.token = None
                return True, result
            else:
                return False, result
        except requests.exceptions.RequestException as e:
            return False, {"message": f"网络错误: {str(e)}"}
        except Exception as e:
            return False, {"message": f"错误: {str(e)}"}
    
    def validate_token(self) -> Tuple[bool, Dict[str, Any]]:
        """
        验证 Token 是否有效
        
        Returns:
            (success, data) - 成功标志和响应数据
        """
        if not self.token:
            return False, {"message": "未登录"}
        
        try:
            url = f"{self.base_url}{config.API_VALIDATE}"
            response = self.session.get(url, headers=self._get_headers(), timeout=30)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                return True, result
            else:
                return False, result
        except requests.exceptions.RequestException as e:
            return False, {"message": f"网络错误: {str(e)}"}
        except Exception as e:
            return False, {"message": f"错误: {str(e)}"}
    
    def get_unread_notifications(self) -> Tuple[bool, Dict[str, Any]]:
        """
        获取未读消息数
        
        Returns:
            (success, data) - 成功标志和响应数据
        """
        if not self.token:
            return False, {"message": "未登录"}
        
        try:
            url = f"{self.base_url}{config.API_UNREAD}"
            response = self.session.get(url, headers=self._get_headers(), timeout=30)
            result = response.json()
            
            if response.status_code == 200 and result.get("success"):
                return True, result
            elif response.status_code == 401:
                return False, {"message": "登录已过期", "expired": True}
            else:
                return False, result
        except requests.exceptions.RequestException as e:
            return False, {"message": f"网络错误: {str(e)}"}
        except Exception as e:
            return False, {"message": f"错误: {str(e)}"}


# 全局 API 服务实例
api_service = ApiService()
