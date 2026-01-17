// 初始化 Material Design 组件
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化文本框
    document.querySelectorAll('.mdc-text-field').forEach(el => {
        mdc.textField.MDCTextField.attachTo(el);
    });

    // 初始化按钮涟漪效果
    document.querySelectorAll('.mdc-button').forEach(el => {
        mdc.ripple.MDCRipple.attachTo(el);
    });

    // 加载配置
    const config = await window.electronAPI.getConfig();
    document.getElementById('serverUrl').value = config.serverUrl;

    // 处理表单提交
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const serverUrl = document.getElementById('serverUrl').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnLabel = document.getElementById('loginBtnLabel');
    const statusMessage = document.getElementById('statusMessage');

    if (!username || !password) {
        showStatus('请输入用户名和密码', 'error');
        return;
    }

    // 禁用按钮
    loginBtn.disabled = true;
    loginBtnLabel.textContent = '登录中...';
    statusMessage.textContent = '';

    try {
        const response = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                device_name: 'Stellarsis Desktop (Electron)'
            })
        });

        const data = await response.json();

        if (data.success) {
            // 保存 Token
            await window.electronAPI.saveToken({
                token: data.token,
                user: data.user,
                serverUrl: serverUrl
            });

            showStatus('登录成功!', 'success');

            // 跳转到主界面
            setTimeout(() => {
                window.electronAPI.navigateTo('main');
            }, 500);
        } else {
            showStatus(data.message || '登录失败', 'error');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showStatus('网络错误: ' + error.message, 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtnLabel.textContent = '登录';
    }
}

function showStatus(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = 'status-message ' + type;
}
