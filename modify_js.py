#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 读取文件
with open('/workspace/templates/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换代码，添加变量声明
old_part = '''                    const date = new Date(commit.commit.author.date).toLocaleDateString('zh-CN');
                    html += `'''
                    
new_part = '''                    const date = new Date(commit.commit.author.date).toLocaleDateString('zh-CN');
                    // 获取提交信息的第一行
                    let message = commit.commit.message.split('\\n')[0];
                    // 如果超过20个字符则截断
                    if (message.length > 20) {
                        message = message.substring(0, 20) + '...';
                    }
                    html += `'''
                    
content = content.replace(old_part, new_part)

# 替换引用原始提交信息的部分
content = content.replace(
    '                                <strong>${commit.commit.message.split(\'\\\\n\')[0]}</strong>',
    '                                <strong>${message}</strong>'
)

# 写回文件
with open('/workspace/templates/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("JavaScript code modified successfully!")