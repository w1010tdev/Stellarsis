@echo off
setlocal enabledelayedexpansion

:: 配置参数（可根据需求修改）
set PYTHON_VERSION=3.10.11
set PYTHON_INSTALLER=python-%PYTHON_VERSION%-amd64.exe
set PYTHON_DOWNLOAD_URL=https://www.python.org/ftp/python/%PYTHON_VERSION%/%PYTHON_INSTALLER%
set REQUIREMENTS_FILE=requirements.txt
set APP_FILE=app.py
set SSLKEYLOGFILE=
:: 第一步：检查 Python 是否已安装
echo ========================
echo 检查 Python 安装状态...
echo ========================
python --version > nul 2>&1
if %errorlevel% equ 0 (
    echo ? Python 已安装：
    python --version
    goto install_deps
)

:: 第二步：下载并安装 Python
echo ? 未检测到 Python，开始下载安装包...
:: 优先使用 bitsadmin（Windows 内置）下载，避免 curl 缺失
bitsadmin /transfer PythonInstaller /download /priority normal ^
    %PYTHON_DOWNLOAD_URL% ^
    %cd%\%PYTHON_INSTALLER%

if not exist %PYTHON_INSTALLER% (
    echo ? 下载失败，请检查网络或手动下载 Python：%PYTHON_DOWNLOAD_URL%
    pause
    exit /b 1
)

echo ? 开始静默安装 Python（请等待）...
:: 静默安装参数：InstallAllUsers=1（全局安装）、PrependPath=1（添加到系统PATH）
%PYTHON_INSTALLER% /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

:: 验证安装结果
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ? Python 安装失败，请手动安装后重试
    pause
    exit /b 1
)
echo ? Python 安装完成：
python --version

:: 第三步：安装依赖包
:install_deps
echo ========================
echo 安装项目依赖...
echo ========================
if not exist %REQUIREMENTS_FILE% (
    echo ? 未找到 %REQUIREMENTS_FILE% 文件，请检查路径
    pause
    exit /b 1
)
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
:: 升级 pip 并安装依赖
python -m pip install --upgrade pip
pip install -r %REQUIREMENTS_FILE%
if %errorlevel% equ 0 (
    echo ? 依赖安装完成
) else (
    echo ? 依赖安装失败，请检查 requirements.txt 内容
    pause
    exit /b 1
)

:: 第四步：启动应用
echo ========================
echo 启动应用 %APP_FILE%...
echo ========================
python %APP_FILE%

:: 防止窗口关闭（可选）
pause
endlocal