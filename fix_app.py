#!/usr/bin/env python3
"""Script to fix the issues in app.py"""

def fix_app():
    with open('/workspace/app.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix Flask version import (already done earlier, but let's make sure)
    if "from flask import __version__ as flask_version" in content:
        content = content.replace(
            "from flask import __version__ as flask_version",
            "import importlib.metadata\ntry:\n    flask_version = importlib.metadata.version(\"flask\")\nexcept importlib.metadata.PackageNotFoundError:\n    flask_version = \"unknown\""
        )
        print("Fixed Flask version import")

    # 2. Add timezone to datetime import if not already there
    if "from datetime import datetime, timedelta, timezone" not in content:
        content = content.replace(
            "from datetime import datetime, timedelta",
            "from datetime import datetime, timedelta, timezone"
        )
        print("Added timezone import")

    # 3. Replace all datetime.utcnow() calls with datetime.now(timezone.utc)
    import re
    content = re.sub(r'datetime\.utcnow\(\)', 'datetime.now(timezone.utc)', content)
    print("Replaced datetime.utcnow() with datetime.now(timezone.utc)")

    # 4. Fix the problematic section in sanitize_content function
    # First, let's look for the problematic code
    old_section = """    # 保存LaTeX表达式：$...$, 37...37, \\\\(...\\\\), \\\\\\[...\\\\]
    latex_pattern = r'($[^$]*$|[$]{2}[^......[\\s\\S]*?[^|@quote\\{\\d+\\})'
    def replace_code(match):
        key = f"__CODE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    content = re.sub(code_pattern, replace_code, content, flags=re.MULTILINE)"""

    new_section = """    # 保存LaTeX表达式：$...$, $$...$$, \\(...\\), \\[...\\]
    latex_pattern = r'(\\$[^\\$]*\\$|\\${2}[\\s\\S]*?\\${2}|\\\\\\([^)]*\\\\\\)|\\\\\\[[^\\]]*\\\\\\])'
    
    def replace_latex(match):
        key = f"__LATEX_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(latex_pattern, replace_latex, content, flags=re.MULTILINE)

    # 保存@quote引用
    quote_pattern = r'@quote\\{\\d+\\}'
    
    def replace_quote(match):
        key = f"__QUOTE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(quote_pattern, replace_quote, content, flags=re.MULTILINE)"""

    if old_section in content:
        content = content.replace(old_section, new_section)
        print("Fixed problematic section in sanitize_content function")
    else:
        # If the exact section isn't found, try to fix it differently
        # Look for the specific problematic line and surrounding context
        if "content = re.sub(code_pattern, replace_code, content, flags=re.MULTILINE)" in content:
            # Find and replace the whole problematic block
            import re
            
            # Pattern to match the problematic block
            pattern = r'(\s*# 保存LaTeX表达式: \$\.\.\.\$, 37\.\.\.37, \\\\(\\.\\.\\.\), \\\\[\\.\\.\\.\]\n\s*latex_pattern = r\'\([^)]*\)\'\n\s*def replace_code\(match\):\n\s*key = f"[^"]*"\n\s*temp_placeholders\[key\] = match\.group\(0\)\n\s*return key\n\s*content = re\.sub\(code_pattern, replace_code, content, flags=re\.MULTILINE\))'
            
            # This is a simpler approach - replace just the problematic line and surrounding parts
            content = content.replace(
                "    def replace_code(match):\n        key = f\"__CODE_{len(temp_placeholders)}__\"\n        temp_placeholders[key] = match.group(0)\n        return key\n    content = re.sub(code_pattern, replace_code, content, flags=re.MULTILINE)",
                """    def replace_latex(match):
        key = f"__LATEX_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(latex_pattern, replace_latex, content, flags=re.MULTILINE)

    # 保存@quote引用
    quote_pattern = r'@quote\\{\\d+\\}'
    
    def replace_quote(match):
        key = f"__QUOTE_{len(temp_placeholders)}__"
        temp_placeholders[key] = match.group(0)
        return key
    
    content = re.sub(quote_pattern, replace_quote, content, flags=re.MULTILINE)"""
            )
            
            # Fix the latex_pattern as well
            content = content.replace(
                "# 保存LaTeX表达式：$...$, 37...37, \\\\(...\\\\), \\\\\\[...\\\\]\n    latex_pattern = r'($[^$]*$|[$]{2}[^......[\\s\\S]*?[^|@quote\\{\\d+\\})'",
                "# 保存LaTeX表达式：$...$, $$...$$, \\(...\\), \\[...\\]\n    latex_pattern = r'(\\$[^\\$]*\\$|\\${2}[\\s\\S]*?\\${2}|\\\\\\([^)]*\\\\\\)|\\\\\\[[^\\]]*\\\\\\])'"
            )
            
            print("Partially fixed problematic section in sanitize_content function")

    # Write the fixed content back
    with open('/workspace/app.py', 'w', encoding='utf-8') as f:
        f.write(content)

    print("All fixes applied!")

if __name__ == "__main__":
    fix_app()