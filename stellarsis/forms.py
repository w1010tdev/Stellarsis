"""
WTForms form definitions.
"""

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Length, EqualTo, Regexp


class LoginForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(message="用户名不能为空"),
        Length(min=3, max=64, message="用户名长度需在3-64字符之间"),
    ])
    password = PasswordField('密码', validators=[
        DataRequired(message="密码不能为空"),
    ])
    submit = SubmitField('登录')


class ChangePasswordForm(FlaskForm):
    old_password = PasswordField('当前密码', validators=[
        DataRequired(message="请输入当前密码"),
    ])
    new_password = PasswordField('新密码', validators=[
        DataRequired(message="新密码不能为空"),
        Length(min=6, message="密码至少6个字符"),
        EqualTo('confirm_password', message='两次输入的密码必须一致'),
    ])
    confirm_password = PasswordField('确认新密码', validators=[
        DataRequired(message="请确认新密码"),
    ])
    submit = SubmitField('修改密码')


class ProfileForm(FlaskForm):
    nickname = StringField('昵称', validators=[
        Length(max=64, message="昵称不能超过64个字符"),
    ])
    color = StringField('名字颜色', validators=[
        Regexp(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', message="颜色格式必须是#RGB或#RRGGBB"),
    ])
    badge = StringField('徽章', validators=[
        Length(max=32, message="徽章不能超过32个字符"),
    ])
    submit = SubmitField('保存设置')
