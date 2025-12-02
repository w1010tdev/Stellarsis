#!/usr/bin/env python
# 初始化数据库脚本

import os
import sys
from datetime import datetime
sys.path.append('/workspace')

from app import app, db_session, Base, engine
from app import User, ChatRoom, ForumSection, ChatMessage, ForumThread, ForumReply, ChatPermission, ForumPermission, UserFollow, ChatLastView, ForumLastView

def init_database():
    """初始化数据库并创建所有表"""
    print("正在初始化数据库...")
    
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    print("数据库表创建完成")
    
    # 检查并创建默认数据
    # 检查是否存在用户
    if db_session.query(User).count() == 0:
        print("创建默认用户...")
        admin_user = User(
            id=1,
            username='admin',
            nickname='WTX',
            color='#ff0000',
            badge='ADMIN',
            role='admin'
        )
        admin_user.set_password('admin')
        db_session.add(admin_user)
        db_session.commit()
        print("默认管理员用户已创建")
    else:
        print("用户表中已有数据，跳过默认用户创建")
    
    # 检查聊天室
    if db_session.query(ChatRoom).count() == 0:
        print("创建默认聊天室...")
        default_room = ChatRoom(
            name='公共聊天室',
            description='欢迎来到公共聊天室'
        )
        db_session.add(default_room)
        db_session.commit()
        print("默认聊天室已创建")
    else:
        print("聊天室表中已有数据，跳过默认聊天室创建")
    
    # 检查贴吧分区
    if db_session.query(ForumSection).count() == 0:
        print("创建默认贴吧分区...")
        default_section = ForumSection(
            name='公告区',
            description='系统公告和重要通知'
        )
        db_session.add(default_section)
        db_session.commit()
        print("默认贴吧分区已创建")
    else:
        print("贴吧分区表中已有数据，跳过默认分区创建")
    
    print("数据库初始化完成！")

if __name__ == '__main__':
    init_database()