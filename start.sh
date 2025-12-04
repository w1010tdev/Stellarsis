#!/bin/bash
set -e  # 遇到错误立即退出

# 配置参数（可根据需求修改）
PYTHON_VERSION=3.10
REQUIREMENTS_FILE=requirements.txt
APP_FILE=app.py

# 颜色输出函数
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }

# 第一步：检查 Python 是否已安装
echo "========================"
echo "检查 Python 安装状态..."
echo "========================"
if command -v python3 &>/dev/null; then
    green "✅ Python 已安装："
    python3 --version
else
    yellow "❌ 未检测到 Python3，开始安装..."
    
    # 检测系统发行版
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu 系列
        sudo apt update -y
        sudo apt install -y python3 python3-pip python3-venv
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL 系列
        sudo dnf install -y python3 python3-pip || sudo yum install -y python3 python3-pip
    else
        red "❌ 不支持的 Linux 发行版，请手动安装 Python3"
        exit 1
    fi

    # 验证安装
    if ! command -v python3 &>/dev/null; then
        red "❌ Python3 安装失败，请手动安装后重试"
        exit 1
    fi
    green "✅ Python 安装完成："
    python3 --version
fi

# 第二步：安装依赖包
echo "========================"
echo "安装项目依赖..."
echo "========================"
if [ ! -f "$REQUIREMENTS_FILE" ]; then
    red "❌ 未找到 $REQUIREMENTS_FILE 文件，请检查路径"
    exit 1
fi
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
# 升级 pip 并安装依赖
python3 -m pip install --upgrade pip --quiet
pip3 install -r "$REQUIREMENTS_FILE"
green "✅ 依赖安装完成"

# 第三步：启动应用
echo "========================"
echo "启动应用 $APP_FILE..."
echo "========================"
python3 "$APP_FILE"