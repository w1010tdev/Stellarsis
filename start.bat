@echo off
:: 切换到UTF-8，解决中文显示乱码
chcp 65001
setlocal enabledelayedexpansion

:: 配置Python版本及安装相关参数
set PYTHON_VERSION=3.10.11
set PYTHON_INSTALLER=python-%PYTHON_VERSION%-amd64.exe
set PYTHON_DOWNLOAD_URL=https://mirrors.tuna.tsinghua.edu.cn/python/%PYTHON_VERSION%/%PYTHON_INSTALLER%
set REQUIREMENTS_FILE=requirements.txt
set APP_FILE=app.py
set SSLKEYLOGFILE=

:: 第一步：检查Python是否已安装
echo ========================
echo 检查Python是否已安装...
echo ========================

if exist "%ProgramFiles%\Python310\python.exe" (
    echo √ Python 已安装
    goto install_deps
)
:: 其次检查用户级安装路径（LocalAppData）
if exist "%LocalAppData%\Programs\Python\Python310\python.exe" (
    echo √ Python 已安装
    goto install_deps
)

:: 第二步：下载并安装Python
echo ========================
echo 开始安装Python...
echo ========================

:: 使用bitsadmin下载安装包（Windows内置工具，无需curl）
echo 正在下载Python安装包：%PYTHON_DOWNLOAD_URL%
bitsadmin /transfer PythonInstaller /download /priority normal ^
    %PYTHON_DOWNLOAD_URL% ^
    %cd%\%PYTHON_INSTALLER%

:: 检查下载是否成功
if not exist %PYTHON_INSTALLER% (
    echo × Python安装包下载失败！下载地址：%PYTHON_DOWNLOAD_URL%
    pause
    exit /b 1
)

echo 正在安装Python，请稍候...
:: 静默安装参数说明：
:: InstallAllUsers=1：全局安装（所有用户）
:: PrependPath=1：尝试添加到系统PATH（但当前进程不生效）
:: Include_test=0：不安装测试组件
:: QuietInstall=1：静默安装
%PYTHON_INSTALLER% /quiet InstallAllUsers=1 PrependPath=1 Include_test=0 QuietInstall=1

:: 安装完成后，自动检测Python安装路径（适配系统/用户级安装）
set "PYTHON_EXE="
:: 优先检查系统级安装路径（Program Files）
if exist "%ProgramFiles%\Python310\python.exe" (
    set "PYTHON_EXE=%ProgramFiles%\Python310\python.exe"
)
:: 其次检查用户级安装路径（LocalAppData）
if not defined PYTHON_EXE if exist "%LocalAppData%\Programs\Python\Python310\python.exe" (
    set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python310\python.exe"
)

:: 检查是否找到Python可执行文件
if not defined PYTHON_EXE (
    echo × Python安装失败，未找到安装路径！
    pause
    exit /b 1
)

echo √ Python安装成功
echo √ Python路径：%PYTHON_EXE%
"%PYTHON_EXE%" --version

:: 第三步：安装依赖包
:install_deps
echo ========================
echo 开始安装项目依赖...
echo ========================

:: 检查requirements.txt是否存在
if not exist %REQUIREMENTS_FILE% (
    echo × 未找到requirements.txt文件！
    pause
    exit /b 1
)

:: 升级pip（使用绝对路径调用Python，避免PATH问题）
echo 正在升级pip...
"%PYTHON_EXE%" -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple

:: 安装依赖包（使用清华源加速）
echo 正在安装项目依赖包...
"%PYTHON_EXE%" -m pip install -r %REQUIREMENTS_FILE% -i https://pypi.tuna.tsinghua.edu.cn/simple

if %errorlevel% equ 0 (
    echo √ 依赖包安装成功
) else (
    echo × 依赖包安装失败！请检查requirements.txt文件内容
    pause
    exit /b 1
)

:: 第四步：运行应用程序
echo ========================
echo 正在启动应用程序 %APP_FILE%...
echo ========================
"%PYTHON_EXE%" %APP_FILE%

:: 防止窗口自动关闭
pause
endlocal
