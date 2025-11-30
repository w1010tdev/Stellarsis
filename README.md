# Stellarsis

Stellarsis (The same as the game of paradox) is a feature-rich online community platform that integrates chat, forum, user management, and more. The system provides users with a secure, efficient, and scalable communication environment, supporting multi-room chat, partitioned forums, user following, and other features.

## Documentation

- [English Documentation](README.md)
- [中文文档](README_zh.md)

## Features Overview

For detailed feature documentation, please see our [Wiki](wiki.md) (English) or [Wiki](wiki_zh.md) (中文).

## Technical Architecture

- **Backend**: Python Flask framework
- **Database**: SQLite
- **Real-time Communication**: Flask-SocketIO
- **Frontend**: HTML/CSS/JavaScript
- **Template Engine**: Jinja2

## Installation & Deployment

1. Clone project to local machine
2. Install dependencies: `pip install -r requirements.txt`
3. Run application: `python app.py`
4. Access `http://localhost:5000`

## API Documentation

For API documentation, please refer to:
- [English API Documentation](API_DOCUMENTATION.md)
- [中文API文档](API_DOCUMENTATION_ZH.md)

## Default Account

- **Username**: admin
- **Password**: admin123 (automatically created on first run)

## Development & Maintenance

System has good extensibility, supporting:

- Addition of new feature modules
- Extension of permission system
- Customization of frontend interface
- Database structure upgrades
