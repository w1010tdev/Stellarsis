@echo off
:: 优先检查系统级安装路径（Program Files）
if exist "%ProgramFiles%\Python310\python.exe" (
    set "PYTHON_EXE=%ProgramFiles%\Python310\python.exe"
)
:: 其次检查用户级安装路径（LocalAppData）
if not defined PYTHON_EXE if exist "%LocalAppData%\Programs\Python\Python310\python.exe" (
    set "PYTHON_EXE=%LocalAppData%\Programs\Python\Python310\python.exe"
)
set APP_FILE=app.py
"%PYTHON_EXE%" -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
"%PYTHON_EXE%" %APP_FILE%
