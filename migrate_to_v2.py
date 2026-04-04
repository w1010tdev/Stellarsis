#!/usr/bin/env python3
"""
Stellarsis v2 migration script.

This script migrates an existing Stellarsis database to be compatible with
the modularized v2 codebase.  The database *schema* has not changed – this
script only ensures that:

  1. All required columns exist (created_at, role, upload_used on users).
  2. All required tables exist (chat_permissions, forum_permissions).
  3. Admin users have ``su`` permissions on every room / section.

Run this once before starting the refactored app if you are upgrading from
the original monolithic ``app.py``.

Usage:
    python migrate_to_v2.py [path-to-stellarsis.db]

If no path is given, the default ``stellarsis.db`` in the project root is used.
"""

import os
import sqlite3
import sys


def migrate(db_path: str):
    if not os.path.exists(db_path):
        print(f"[SKIP] Database file not found: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # 1. Ensure users columns exist
    cur.execute("PRAGMA table_info(users);")
    cols = {c[1] for c in cur.fetchall()}

    if 'role' not in cols:
        print("[MIGRATE] Adding 'role' column to users …")
        cur.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';")
        conn.commit()

    if 'upload_used' not in cols:
        print("[MIGRATE] Adding 'upload_used' column to users …")
        cur.execute("ALTER TABLE users ADD COLUMN upload_used INTEGER DEFAULT 0;")
        conn.commit()

    if 'created_at' not in cols:
        print("[MIGRATE] Adding 'created_at' column to users …")
        cur.execute("ALTER TABLE users ADD COLUMN created_at DATETIME;")
        cur.execute("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;")
        conn.commit()

    # 2. Ensure permission tables exist
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_permissions';")
    if not cur.fetchone():
        print("[MIGRATE] Creating chat_permissions table …")
        cur.execute("""
            CREATE TABLE chat_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                room_id INTEGER NOT NULL,
                perm VARCHAR(10) DEFAULT 'Null'
            );
        """)
        conn.commit()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='forum_permissions';")
    if not cur.fetchone():
        print("[MIGRATE] Creating forum_permissions table …")
        cur.execute("""
            CREATE TABLE forum_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                section_id INTEGER NOT NULL,
                perm VARCHAR(10) DEFAULT 'Null'
            );
        """)
        conn.commit()

    # 3. Grant su permissions to all admins
    cur.execute("SELECT id FROM users WHERE role = 'admin';")
    admin_ids = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT id FROM chat_rooms;")
    room_ids = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT id FROM forum_sections;")
    section_ids = [r[0] for r in cur.fetchall()]

    for aid in admin_ids:
        for rid in room_ids:
            cur.execute(
                "SELECT id FROM chat_permissions WHERE user_id = ? AND room_id = ?",
                (aid, rid),
            )
            if cur.fetchone():
                cur.execute(
                    "UPDATE chat_permissions SET perm = 'su' WHERE user_id = ? AND room_id = ?",
                    (aid, rid),
                )
            else:
                cur.execute(
                    "INSERT INTO chat_permissions (user_id, room_id, perm) VALUES (?, ?, 'su')",
                    (aid, rid),
                )
        for sid in section_ids:
            cur.execute(
                "SELECT id FROM forum_permissions WHERE user_id = ? AND section_id = ?",
                (aid, sid),
            )
            if cur.fetchone():
                cur.execute(
                    "UPDATE forum_permissions SET perm = 'su' WHERE user_id = ? AND section_id = ?",
                    (aid, sid),
                )
            else:
                cur.execute(
                    "INSERT INTO forum_permissions (user_id, section_id, perm) VALUES (?, ?, 'su')",
                    (aid, sid),
                )
    conn.commit()
    conn.close()
    print("[OK] Migration complete.")


if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else 'stellarsis.db'
    migrate(path)
