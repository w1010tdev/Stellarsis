"""
Shared Flask extensions and database session.

All extensions are initialized here and bound to the app in create_app().
``db_session`` is a :class:`~werkzeug.local.LocalProxy` so that modules
can safely import it at the top level; the real scoped session is wired up
later by :func:`init_db`.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from werkzeug.local import LocalProxy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# SQLAlchemy
Base = declarative_base()
engine = None
_db_session = None


def _get_db_session():
    if _db_session is None:
        raise RuntimeError("Database not initialized – call init_db() first.")
    return _db_session


db_session: scoped_session = LocalProxy(_get_db_session)  # type: ignore[assignment]

# Flask-Login
login_manager = LoginManager()
login_manager.login_view = 'auth.login'

# Flask-SocketIO
socketio = SocketIO()

# Flask-Limiter
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")


def init_db(app):
    """Initialize the database engine and scoped session."""
    global engine, _db_session
    engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'])
    _db_session = scoped_session(
        sessionmaker(autocommit=False, autoflush=False, bind=engine)
    )
    app.teardown_appcontext(lambda exc: _db_session.remove())
    Base.metadata.create_all(bind=engine)
