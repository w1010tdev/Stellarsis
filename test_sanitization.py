#!/usr/bin/env python3
"""
测试sanitization功能
"""
import html
import re

def test_sanitize_content(content):
    """
    测试用的增强XSS防护函数 - 过滤掉真正的HTML标签，但保留代码中的尖括号
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
    code_block_pattern = r'```[\s\S]*?```'
    
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
    
    # 保存LaTeX表达式：$...$, $$...$$, \(...\), \[...\]
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

    # 4. 处理HTML标签内的危险CSS样式属性
    # 首先移除危险的CSS属性
    dangerous_css_patterns = [
        r'(style\s*=\s*["\'][^"\']*(?:padding|margin|width|height|position|top|left|right|bottom|z-index|transform|animation|transition)[^"\']*["\'])',
        r'(style\s*=\s*["\'][^"\']*[-+]?\d+(?:\.\d+)?(?:px|em|rem|vw|vh|cm|mm|in|pt|pc|ex|%)[^"\']*["\'])',
        r'(style\s*=\s*["\'][^"\']*[-+]?\d{4,}[^"\']*["\'])',  # 特别大的数值
    ]
    
    for css_pattern in dangerous_css_patterns:
        content = re.sub(css_pattern, '', content, flags=re.IGNORECASE | re.MULTILINE)
    
    # 4. 只移除真正的HTML标签，但不移除类似<something>的内容
    # 我们只移除已知的HTML标签
    html_tags = [
        # 基本HTML标签
        r'<script[^>]*>[\s\S]*?</script>',
        r'<style[^>]*>[\s\S]*?</style>',
        r'<iframe[^>]*>[\s\S]*?</iframe>',
        r'<embed[^>]*>[\s\S]*?</embed>',
        r'<object[^>]*>[\s\S]*?</object>',
        r'<applet[^>]*>[\s\S]*?</applet>',
        
        # 可能危险的标签
        r'<link[^>]*>',
        r'<meta[^>]*>',
        r'<base[^>]*>',
        
        # 其他常见HTML标签（可以适当放宽）
        r'<form[^>]*>[\s\S]*?</form>',
        r'<input[^>]*>',
        r'<textarea[^>]*>[\s\S]*?</textarea>',
        r'<select[^>]*>[\s\S]*?</select>',
        r'<button[^>]*>[\s\S]*?</button>',
        
        # 事件处理属性（移除on事件）
        r'\bon\w+=\s*"[^"]*"',
        r"\bon\w+=\s*'[^']*'",
        r'\bon\w+=\s*[^\s>]+',
        
        # 移除style属性
        r'\s*style\s*=\s*["\'][^"\']*["\']',
    ]
    
    for pattern in html_tags:
        content = re.sub(pattern, '', content, flags=re.IGNORECASE)

    # 5. 移除其他潜在的XSS向量
    # 移除javascript:等协议
    script_protocols = [
        r'javascript:', r'jscript:', r'vbscript:', r'vbs:',
        r'data:', r'blob:', r'file:', r'about:', r'chrome:',
        r'ms-script:', r'ms-javascript:'
    ]
    for protocol in script_protocols:
        content = re.sub(
            re.escape(protocol),
            '',
            content,
            flags=re.IGNORECASE
        )

    # 移除危险脚本关键词
    dangerous_keywords = [
        r'eval\(', r'expression\(', r'setTimeout\(', r'setInterval\(',
        r'Function\(', r'alert\(', r'prompt\(', r'confirm\('
    ]
    for keyword in dangerous_keywords:
        content = re.sub(
            keyword,
            '',
            content,
            flags=re.IGNORECASE
        )

    # 6. 恢复之前保存的安全内容
    for key, original in temp_placeholders.items():
        content = content.replace(key, original)

    # 7. 转义其他HTML特殊字符
    content = html.escape(content, quote=True)

    return content

# 测试用例
test_cases = [
    '<h1 style="padding: 114cm 114cm">sdfds</h1>',
    '<div style="font-size:817px;padding: 10000cm 0;">LL</div>',
    '<p onclick="alert(1)">Safe content</p>',
    'Normal text without HTML',
    '`code block with <tag>`',
    '```js\nconsole.log("<script>alert(1)</script>");\n```',
    '$latex equation$',
    '@quote{123}',
]

print("Testing sanitization:")
for i, case in enumerate(test_cases):
    sanitized = test_sanitize_content(case)
    print(f"Test {i+1}:")
    print(f"  Input:    {case}")
    print(f"  Output:   {sanitized}")
    print()