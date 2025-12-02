#!/usr/bin/env python
import sqlite3

# 连接数据库
conn = sqlite3.connect('/workspace/stellarsis.db')
cursor = conn.cursor()

# 查询所有表
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("数据库中的所有表:")
for i, table in enumerate(tables, 1):
    print(f"{i}. {table[0]}")

print(f"\n总共 {len(tables)} 个表")

# 检查每个表的结构
print("\n各表结构:")
for table in tables:
    table_name = table[0]
    print(f"\n表: {table_name}")
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]}) {'PRIMARY KEY' if col[5] else ''}")

conn.close()