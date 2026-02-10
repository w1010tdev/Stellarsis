"""
Blueprint registration.
"""

from stellarsis.routes import auth, chat, forum, admin, upload, follow, spa


def register_blueprints(app):
    app.register_blueprint(spa.bp)       # root routes (/, /spa, /settings, /api/*)
    app.register_blueprint(auth.bp)      # /login, /logout, /api/auth/*, /change_password, /profile
    app.register_blueprint(chat.bp)      # /chat/*, /api/chat/*
    app.register_blueprint(forum.bp)     # /forum/*, /api/forum/*
    app.register_blueprint(admin.bp)     # /admin/*, /api/admin/*, /down, /downdb, /api/search_users
    app.register_blueprint(upload.bp)    # /api/upload/*
    app.register_blueprint(follow.bp)    # /api/follows/*, /api/follow/*
