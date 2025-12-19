#!/usr/bin/env python3
"""Fix the sanitizer function in app.py"""

import re

def fix_sanitizer():
    # Read the file
    with open('/workspace/app.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # The exact problematic section
    old_code = """    # 3. 临时替换安全的标签（Markdown、LaTeX、自定义标签）
    # 存储临时替换的标记
    temp_placeholders = {}

    # 保存LaTeX表达式：$...$, 37...37, \\\\(...\\), \\\\[...\\]
    latex_pattern = r'($[^$]*$|[$]{2}[^......[\\s\\S]*?[^|@quote\\{\\d+\\})'
    def replace_code(match):
        key = f"__CODE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    content = re.sub(code_pattern, replace_code, content, flags=re.MULTILINE)"""

    # The corrected code
    new_code = """    # 3. 临时替换安全的标签（Markdown、LaTeX、自定义标签）
    # 存储临时替换的标记
    temp_placeholders = {}

    # 保存LaTeX表达式：$...$, $$...$$, \\(...\\), \\[...\\]
    latex_pattern = r'(\$[^\$]*\$|\${2}[\s\S]*?\${2}|\\\([^)]*\\\)|\\\[[^\]]*\\\])'
    
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
    
    content = re.sub(quote_pattern, replace_quote, content, flags=re.MULTILINE)"""

    # Replace the old code with new code
    if old_code in content:
        updated_content = content.replace(old_code, new_code)
        
        # Write the updated content back to the file
        with open('/workspace/app.py', 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print("Successfully fixed the sanitizer function!")
    else:
        print("Old code not found in the file")

if __name__ == "__main__":
    fix_sanitizer()