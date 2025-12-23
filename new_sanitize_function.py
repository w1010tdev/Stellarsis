def sanitize_content(content):
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

    return content