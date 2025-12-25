#!/usr/bin/env python3
"""
测试quotes管理功能
"""
import json

def test_quotes_file():
    """测试quotes.json文件结构和内容"""
    try:
        with open('quotes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("✓ quotes.json文件格式正确")
        
        if 'quotes' in data:
            print(f"✓ 找到quotes字段，包含{len(data['quotes'])}条名言")
            
            # 检查前几条名言的结构
            for i, quote in enumerate(data['quotes'][:3]):  # 只检查前3条
                if 'text' in quote and 'author' in quote:
                    print(f"  - 名言 {i+1}: {quote['text'][:30]}... - {quote['author']}")
                else:
                    print(f"  - 错误：名言 {i+1} 缺少text或author字段")
        else:
            print("✗ quotes.json中没有quotes字段")
            
    except FileNotFoundError:
        print("✗ quotes.json文件不存在")
    except json.JSONDecodeError:
        print("✗ quotes.json文件格式错误")

def test_add_quote():
    """测试添加名言功能"""
    try:
        # 读取现有数据
        with open('quotes.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 添加一条测试名言
        test_quote = {
            'text': '测试名言内容',
            'author': '测试作者'
        }
        data['quotes'].append(test_quote)
        
        # 写回文件
        with open('quotes.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print("✓ 成功添加测试名言")
        
        # 验证添加结果
        with open('quotes.json', 'r', encoding='utf-8') as f:
            verify_data = json.load(f)
        
        if verify_data['quotes'][-1] == test_quote:
            print("✓ 添加的名言验证成功")
        else:
            print("✗ 添加的名言验证失败")
            
        # 恢复原文件（删除测试名言）
        verify_data['quotes'].pop()  # 删除最后一条
        with open('quotes.json', 'w', encoding='utf-8') as f:
            json.dump(verify_data, f, ensure_ascii=False, indent=2)
        print("✓ 测试名言已清理")
        
    except Exception as e:
        print(f"✗ 测试添加名言失败: {e}")

if __name__ == "__main__":
    print("开始测试quotes功能...")
    test_quotes_file()
    print()
    test_add_quote()
    print()
    print("测试完成！")