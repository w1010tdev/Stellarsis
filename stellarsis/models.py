"""
Database models for Stellarsis.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from flask_login import UserMixin

from stellarsis.extensions import Base


def utcnow():
    """Return the current UTC time as a naive datetime (for SQLAlchemy defaults)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(UserMixin, Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, index=True)
    password_hash = Column(String(128))
    nickname = Column(String(64), default='')
    color = Column(String(7), default='#000000')
    badge = Column(String(32), default='')
    last_seen = Column(DateTime, default=utcnow)
    role = Column(String(20), default='user')
    upload_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    def is_admin(self):
        return self.role == 'admin'

    def set_password(self, password):
        self.password_hash = password

    def check_password(self, password):
        return self.password_hash == password


class ChatRoom(Base):
    __tablename__ = 'chat_rooms'

    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    description = Column(Text)


class ChatMessage(Base):
    __tablename__ = 'chat_messages'

    id = Column(Integer, primary_key=True)
    content = Column(Text)
    timestamp = Column(DateTime, index=True, default=utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    room_id = Column(Integer, ForeignKey('chat_rooms.id'))

    user = relationship('User', backref='chat_messages')
    room = relationship('ChatRoom', backref='messages')


class ForumSection(Base):
    __tablename__ = 'forum_sections'

    id = Column(Integer, primary_key=True)
    name = Column(String(64), unique=True)
    description = Column(Text)


class ForumThread(Base):
    __tablename__ = 'forum_threads'

    id = Column(Integer, primary_key=True)
    title = Column(String(128))
    content = Column(Text)
    timestamp = Column(DateTime, index=True, default=utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    section_id = Column(Integer, ForeignKey('forum_sections.id'))

    user = relationship('User', backref='forum_threads')
    section = relationship('ForumSection', backref='threads')
    replies = relationship('ForumReply', backref='thread', lazy='dynamic')


class ForumReply(Base):
    __tablename__ = 'forum_replies'

    id = Column(Integer, primary_key=True)
    content = Column(Text)
    timestamp = Column(DateTime, index=True, default=utcnow)
    user_id = Column(Integer, ForeignKey('users.id'))
    thread_id = Column(Integer, ForeignKey('forum_threads.id'))

    user = relationship('User', backref='forum_replies')


class ChatPermission(Base):
    __tablename__ = 'chat_permissions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    perm = Column(String(10), default='Null')

    user = relationship('User', backref='chat_permissions')
    room = relationship('ChatRoom')


class ForumPermission(Base):
    __tablename__ = 'forum_permissions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('forum_sections.id'), nullable=False)
    perm = Column(String(10), default='Null')

    user = relationship('User', backref='forum_permissions')
    section = relationship('ForumSection')


class UserFollow(Base):
    __tablename__ = 'user_follows'

    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    followed_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    follower = relationship('User', foreign_keys=[follower_id], backref='following')
    followed = relationship('User', foreign_keys=[followed_id], backref='followers')


class ChatLastView(Base):
    __tablename__ = 'chat_last_views'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('chat_rooms.id'), nullable=False)
    last_view = Column(DateTime, default=utcnow)

    user = relationship('User')
    room = relationship('ChatRoom')


class ForumLastView(Base):
    __tablename__ = 'forum_last_views'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('forum_sections.id'), nullable=False)
    last_view = Column(DateTime, default=utcnow)

    user = relationship('User')
    section = relationship('ForumSection')


class UserImage(Base):
    __tablename__ = 'user_images'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    upload_time = Column(DateTime, default=utcnow)
    file_type = Column(String(50), nullable=False)

    user = relationship('User', backref='images')


class MobilePushToken(Base):
    __tablename__ = 'mobile_push_tokens'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token = Column(String(512), nullable=False, index=True)
    platform = Column(String(32), nullable=False, default='android')
    device_id = Column(String(128), nullable=False, default='')
    enabled = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow)

    user = relationship('User', backref='mobile_push_tokens')


class UserNotification(Base):
    __tablename__ = 'user_notifications'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    type = Column(String(32), nullable=False, default='system')
    title = Column(String(128), nullable=False, default='系统通知')
    body = Column(Text, nullable=False, default='')
    payload_json = Column(Text, nullable=False, default='{}')
    is_read = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=utcnow, index=True)
    read_at = Column(DateTime)

    user = relationship('User', backref='notifications')
