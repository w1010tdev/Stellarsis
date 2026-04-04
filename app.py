"""
Stellarsis – entry point.

Usage:
    python app.py
"""

import os

from flask_cors import CORS

from stellarsis import create_app
from stellarsis.extensions import socketio

app = create_app()

if __name__ == '__main__':
    CORS(app, resources={r"/socket.io/*": {"origins": "*"}})
    port = int(os.environ.get('PORT', 80))
    socketio.run(app, host='0.0.0.0', port=port, debug=app.config['DEBUG'])
