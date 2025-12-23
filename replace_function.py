#!/usr/bin/env python3
import re

# Read the entire file
with open('/workspace/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new function
new_function = '''def sanitize_content(content):
    """
    完全移除HTML标签，但保留代码块、LaTeX公式等内容
    """
    # 1. 空值/非字符串处理
    if not content:
        return ""
    # 确保输入为字符串类型
    if not isinstance(content, str):
        try:
            content = str(content)
        except Exception:
            return ""

    # 2. 解码HTML实体
    try:
        content = html.unescape(content)
    except Exception:
        pass

    # 3. 临时保护代码块和特殊语法
    temp_placeholders = {}
    
    # 首先保护代码块（包括多行代码块和行内代码）
    # 保护多行代码块：```code```
    code_block_pattern = r'```[\\s\\S]*?```'
    
    def replace_code_block(match):
        key = f"__CODEBLOCK_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(code_block_pattern, replace_code_block, content, flags=re.MULTILINE)
    
    # 保护行内代码：`code`
    inline_code_pattern = r'`[^`]*`'
    
    def replace_inline_code(match):
        key = f"__INLINECODE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(inline_code_pattern, replace_inline_code, content, flags=re.MULTILINE)
    
    # 保存LaTeX表达式：$...$, $$...$$, \\(...\\), \\[...\\]
    latex_pattern = r'\$[^\$]*?\$|\$\$[^\$]*?\$\$|\\\\\(.*?\\\\\)|\\\\\[.*?\\\\\]'
    
    def replace_latex(match):
        key = f"__LATEX_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(latex_pattern, replace_latex, content, flags=re.MULTILINE)

    # 保存@quote引用
    quote_pattern = r'@quote\{\d+\}'
    
    def replace_quote(match):
        key = f"__QUOTE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(quote_pattern, replace_quote, content, flags=re.MULTILINE)

    # 4. 移除所有HTML标签（<tag>或<tag/>或</tag>形式）
    # 这将移除所有类似 <div>, </div>, <p>, <span style="..."> 等标签
    html_tag_pattern = r'</?[^>]+>'
    content = re.sub(html_tag_pattern, '', content)
    
    # 5. 转义其他HTML特殊字符（如 & < > " '）
    content = html.escape(content, quote=True)

    # 6. 恢复之前保存的安全内容
    for key, original in temp_placeholders.items():
        content = content.replace(key, original)

    return content'''

# Find the start of the function
start_pattern = r'def sanitize_content\(content\):'
end_pattern = r'^(\s*return content\s*)$'

# Find the start position
start_match = re.search(start_pattern, content)
if not start_match:
    print("Could not find the start of sanitize_content function")
    exit(1)

start_pos = start_match.start()

# Find the end of the function by looking for the return statement with proper indentation
lines = content.split('\n')
start_line_num = content[:start_pos].count('\n')
current_line = start_line_num

# Look for the return statement that ends the function
end_line_num = -1
indent_level = len(lines[current_line]) - len(lines[current_line].lstrip())
parentheses_count = 0
in_function = True

for i in range(current_line, len(lines)):
    line = lines[i]
    
    # Count parentheses to track function depth
    parentheses_count += line.count('(') - line.count(')')
    
    # Check if we're still in the function by indentation
    if line.strip():
        line_indent = len(line) - len(line.lstrip())
        # If we encounter a line with less indent than the function start and we're not inside parentheses
        if line_indent < indent_level and parentheses_count <= 0 and i > current_line:
            end_line_num = i
            break
    
    # Check for return statement
    stripped = line.strip()
    if stripped.startswith('return ') and stripped.endswith('content'):
        # Check if this is at the expected indentation level
        if line_indent == indent_level:
            # This is likely the end of the function
            end_line_num = i + 1
            break

if end_line_num == -1:
    print("Could not find the end of sanitize_content function")
    # As fallback, look for the next function definition or class
    for i in range(current_line + 1, len(lines)):
        if (lines[i].startswith('def ') or lines[i].startswith('class ')) and lines[i].strip() != 'def replace_code_block(' and lines[i].strip() != 'def replace_inline_code(' and lines[i].strip() != 'def replace_latex(' and lines[i].strip() != 'def replace_quote(':
            end_line_num = i
            break

if end_line_num == -1:
    print("Could not find the end of sanitize_content function even with fallback")
    exit(1)

print(f"Replacing function from line {start_line_num + 1} to {end_line_num}")

# Replace the function
before_func = '\n'.join(lines[:start_line_num])
after_func = '\n'.join(lines[end_line_num:])

new_content = before_func + '\n' + new_function + '\n' + after_func

# Write the modified content back to the file
with open('/workspace/app.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Function successfully replaced!")