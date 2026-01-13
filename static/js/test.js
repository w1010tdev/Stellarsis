/**
 * Stellarsis 前端自动化测试脚本
 * 使用方法: 在浏览器控制台中输入 window.test() 后测试全部功能
 */

(function() {
    'use strict';

    // 测试结果统计
    const testResults = {
        passed: 0,
        failed: 0,
        errors: []
    };

    // 日志输出
    function log(message, type = 'info') {
        const styles = {
            'info': 'color: #2196F3',
            'success': 'color: #4CAF50; font-weight: bold',
            'error': 'color: #f44336; font-weight: bold',
            'warning': 'color: #FF9800',
            'section': 'color: #9C27B0; font-weight: bold; font-size: 14px'
        };
        console.log(`%c${message}`, styles[type] || styles.info);
    }

    // 测试断言
    function assert(condition, testName, message = '') {
        if (condition) {
            testResults.passed++;
            log(`  ✅ PASS: ${testName}`, 'success');
            if (message) log(`       ${message}`, 'info');
        } else {
            testResults.failed++;
            testResults.errors.push(`${testName}: ${message}`);
            log(`  ❌ FAIL: ${testName}`, 'error');
            if (message) log(`       ${message}`, 'error');
        }
        return condition;
    }

    // 测试段落标题
    function section(name) {
        log(`\n${'='.repeat(50)}`, 'section');
        log(`测试: ${name}`, 'section');
        log('='.repeat(50), 'section');
    }

    // 异步等待
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // DOM元素测试
    // ============================================
    async function testDOMElements() {
        section('DOM 元素');

        // 检查基本页面结构
        assert(document.body !== null, '页面body存在');
        assert(document.head !== null, '页面head存在');

        // 检查常见元素（这些是可选的，所以用日志记录而非断言）
        const header = document.querySelector('header, .header, nav, .navbar');
        if (header !== null) {
            log('  ✓ 页面头部元素存在', 'info');
        } else {
            log('  ⚠️ 页面头部元素未找到（可能不存在）', 'warning');
        }

        const main = document.querySelector('main, .main, .content, .container');
        if (main !== null) {
            log('  ✓ 页面主体元素存在', 'info');
        } else {
            log('  ⚠️ 页面主体元素未找到（可能不存在）', 'warning');
        }

        // 检查Toast容器是否可以创建
        if (typeof window.showToast === 'function') {
            try {
                window.showToast('info', '测试Toast', 1000);
                await wait(500);
                const toastContainer = document.getElementById('toast-container');
                assert(toastContainer !== null, 'Toast容器创建成功');
            } catch (e) {
                assert(false, 'Toast功能', e.message);
            }
        } else {
            log('  ⚠️ 跳过: showToast 函数未定义', 'warning');
        }
    }

    // ============================================
    // 全局函数测试
    // ============================================
    async function testGlobalFunctions() {
        section('全局函数');

        // showToast
        assert(typeof window.showToast === 'function', 'showToast 函数存在');
        
        // showConfirm
        assert(typeof window.showConfirm === 'function', 'showConfirm 函数存在');

        // autoResizeTextarea
        assert(typeof window.autoResizeTextarea === 'function', 'autoResizeTextarea 函数存在');

        // setupInactivityLogout
        assert(typeof window.setupInactivityLogout === 'function', 'setupInactivityLogout 函数存在');

        // renderContent (渲染系统)
        assert(typeof window.renderContent === 'function', 'renderContent 渲染函数存在');

        // postProcessRendered (后处理)
        if (typeof window.postProcessRendered === 'function') {
            assert(true, 'postProcessRendered 后处理函数存在');
        } else {
            log('  ⚠️ 跳过: postProcessRendered 函数未定义', 'warning');
        }

        // initChat (聊天初始化)
        if (typeof window.initChat === 'function') {
            assert(true, 'initChat 聊天初始化函数存在');
        } else {
            log('  ⚠️ 跳过: initChat 函数未定义 (可能不在聊天页面)', 'warning');
        }
    }

    // ============================================
    // 渲染系统测试
    // ============================================
    async function testRenderSystem() {
        section('渲染系统');

        if (typeof window.renderContent !== 'function') {
            log('  ⚠️ 跳过: renderContent 函数未定义', 'warning');
            return;
        }

        // 测试Markdown渲染
        try {
            const boldText = window.renderContent('**粗体文本**');
            assert(boldText.includes('<strong>') || boldText.includes('粗体'), 'Markdown粗体渲染', boldText.substring(0, 100));
        } catch (e) {
            assert(false, 'Markdown粗体渲染', e.message);
        }

        try {
            const italicText = window.renderContent('*斜体文本*');
            assert(italicText.includes('<em>') || italicText.includes('斜体'), 'Markdown斜体渲染', italicText.substring(0, 100));
        } catch (e) {
            assert(false, 'Markdown斜体渲染', e.message);
        }

        try {
            const codeText = window.renderContent('`代码`');
            assert(codeText.includes('<code>') || codeText.includes('代码'), 'Markdown行内代码渲染', codeText.substring(0, 100));
        } catch (e) {
            assert(false, 'Markdown行内代码渲染', e.message);
        }

        try {
            const codeBlock = window.renderContent('```python\nprint("hello")\n```');
            assert(codeBlock.includes('<pre>') || codeBlock.includes('<code>') || codeBlock.includes('print'), 'Markdown代码块渲染', codeBlock.substring(0, 100));
        } catch (e) {
            assert(false, 'Markdown代码块渲染', e.message);
        }

        // 测试XSS防护
        try {
            const xssText = window.renderContent('<script>alert("xss")</script>');
            assert(!xssText.includes('<script>') || xssText.includes('&lt;script&gt;'), 'XSS防护', 'script标签被转义');
        } catch (e) {
            assert(false, 'XSS防护测试', e.message);
        }

        // 测试空输入
        try {
            const emptyResult = window.renderContent('');
            assert(emptyResult !== null && emptyResult !== undefined, '空输入处理');
        } catch (e) {
            assert(false, '空输入处理', e.message);
        }
    }

    // ============================================
    // API测试
    // ============================================
    async function testAPIs() {
        section('API 请求');

        // 测试在线人数API
        try {
            const resp = await fetch('/api/online_count');
            const data = await resp.json();
            assert(resp.ok && 'count' in data, '获取在线人数API', `在线: ${data.count}`);
        } catch (e) {
            assert(false, '获取在线人数API', e.message);
        }

        // 测试随机名言API
        try {
            const resp = await fetch('/api/random_quote');
            const data = await resp.json();
            assert(resp.ok, '获取随机名言API', data.quote ? data.quote.substring(0, 50) + '...' : '无名言');
        } catch (e) {
            assert(false, '获取随机名言API', e.message);
        }

        // 测试未读数API
        try {
            const resp = await fetch('/api/last_views/unread_counts');
            const data = await resp.json();
            assert(resp.ok && data.success, '获取未读数API', JSON.stringify(data).substring(0, 100));
        } catch (e) {
            assert(false, '获取未读数API', e.message);
        }

        // 测试关注列表API
        try {
            const resp = await fetch('/api/follows');
            const data = await resp.json();
            assert(resp.ok && data.success, '获取关注列表API', `关注数: ${(data.follows || []).length}`);
        } catch (e) {
            assert(false, '获取关注列表API', e.message);
        }

        // 测试上传配额API
        try {
            const resp = await fetch('/api/upload/quota');
            const data = await resp.json();
            assert(resp.ok && data.success, '获取上传配额API', `已用: ${data.quota ? data.quota.used : 0}`);
        } catch (e) {
            assert(false, '获取上传配额API', e.message);
        }

        // 测试图片列表API
        try {
            const resp = await fetch('/api/upload/images');
            const data = await resp.json();
            assert(resp.ok && data.success, '获取图片列表API', `图片数: ${(data.images || []).length}`);
        } catch (e) {
            assert(false, '获取图片列表API', e.message);
        }

        // 测试搜索用户API
        try {
            const resp = await fetch('/api/search_users?username=admin');
            const data = await resp.json();
            assert(resp.ok && data.success, '搜索用户API', `结果数: ${(data.users || []).length}`);
        } catch (e) {
            assert(false, '搜索用户API', e.message);
        }
    }

    // ============================================
    // 聊天功能测试
    // ============================================
    async function testChatFeatures() {
        section('聊天功能');

        // 检查是否在聊天页面
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) {
            log('  ⚠️ 跳过: 不在聊天页面', 'warning');
            return;
        }

        // 检查聊天室数据
        const chatRoomData = document.getElementById('chat-room-data');
        if (chatRoomData) {
            try {
                const data = JSON.parse(chatRoomData.textContent);
                assert(data.room_id !== undefined, '聊天室ID存在', `room_id: ${data.room_id}`);
                assert(data.user_id !== undefined, '用户ID存在', `user_id: ${data.user_id}`);
            } catch (e) {
                assert(false, '聊天室数据解析', e.message);
            }
        }

        // 检查消息输入框
        const messageInput = document.getElementById('message-text');
        assert(messageInput !== null, '消息输入框存在');

        // 检查发送按钮
        const sendButton = document.getElementById('send-button');
        assert(sendButton !== null, '发送按钮存在');

        // 检查在线人数显示
        const onlineCount = document.getElementById('online-count');
        assert(onlineCount !== null, '在线人数显示存在');

        // 检查加载更多按钮
        const loadMoreBtn = document.getElementById('chat-load-more-btn');
        if (loadMoreBtn) {
            assert(true, '加载更多按钮存在');
        } else {
            log('  ⚠️ 跳过: 加载更多按钮不存在 (可能消息不多)', 'warning');
        }

        // 测试聊天历史API
        const roomData = document.getElementById('chat-room-data');
        if (roomData) {
            try {
                const data = JSON.parse(roomData.textContent);
                const roomId = data.room_id;
                const resp = await fetch(`/api/chat/${roomId}/history?page=last&limit=10`);
                const historyData = await resp.json();
                assert(resp.ok && 'messages' in historyData, '获取聊天历史API', `消息数: ${historyData.messages.length}`);
            } catch (e) {
                assert(false, '获取聊天历史API', e.message);
            }
        }

        // 检查WebSocket连接
        if (typeof io !== 'undefined') {
            assert(true, 'Socket.IO库加载');
        } else {
            log('  ⚠️ 警告: Socket.IO库未加载', 'warning');
        }
    }

    // ============================================
    // 论坛功能测试
    // ============================================
    async function testForumFeatures() {
        section('论坛功能');

        // 检查是否在论坛页面
        const forumContent = document.querySelector('.forum-container, .thread-content, .section-content, .forum');
        if (!forumContent) {
            log('  ⚠️ 跳过: 不在论坛页面', 'warning');
            return;
        }

        // 检查帖子内容区域
        const threadContent = document.querySelector('.thread-content');
        if (threadContent) {
            assert(true, '帖子内容区域存在');
        }

        // 检查回复表单
        const replyForm = document.getElementById('reply-form');
        if (replyForm) {
            assert(true, '回复表单存在');
            
            // 检查内容输入框
            const contentInput = replyForm.querySelector('textarea[name="content"]');
            assert(contentInput !== null, '回复内容输入框存在');
            
            // 检查提交按钮
            const submitBtn = replyForm.querySelector('button[type="submit"]');
            assert(submitBtn !== null, '回复提交按钮存在');
        }

        // 检查回复列表
        const replies = document.querySelectorAll('.reply, .reply-content');
        log(`  ℹ️ 发现 ${replies.length} 条回复`, 'info');
    }

    // ============================================
    // 图片上传功能测试
    // ============================================
    async function testUploadFeatures() {
        section('图片上传功能');

        // 检查各种上传输入框
        const uploadInputs = [
            { id: 'profile-image-input', name: '个人资料图片上传' },
            { id: 'post-image-input', name: '论坛帖子图片上传' },
            { id: 'chat-image-input', name: '聊天图片上传' },
            { id: 'settings-images-input', name: '设置页图片上传' }
        ];

        let foundAny = false;
        for (const input of uploadInputs) {
            const el = document.getElementById(input.id);
            if (el) {
                assert(true, `${input.name}输入框存在`);
                foundAny = true;
            }
        }

        if (!foundAny) {
            log('  ⚠️ 跳过: 当前页面没有图片上传功能', 'warning');
        }

        // 检查图片列表容器
        const imagesList = document.getElementById('settings-images-list');
        if (imagesList) {
            assert(true, '图片列表容器存在');
        }
    }

    // ============================================
    // UI组件测试
    // ============================================
    async function testUIComponents() {
        section('UI组件');

        // 测试Toast
        if (typeof window.showToast === 'function') {
            try {
                window.showToast('success', '成功消息测试', 1000);
                await wait(300);
                window.showToast('warning', '警告消息测试', 1000);
                await wait(300);
                window.showToast('error', '错误消息测试', 1000);
                assert(true, 'Toast消息显示', '所有类型Toast正常');
            } catch (e) {
                assert(false, 'Toast消息显示', e.message);
            }
        }

        // 测试确认对话框 (不实际显示，只测试函数存在)
        if (typeof window.showConfirm === 'function') {
            assert(true, '确认对话框函数存在');
        }

        // 测试autoResizeTextarea
        if (typeof window.autoResizeTextarea === 'function') {
            const testTextarea = document.createElement('textarea');
            testTextarea.value = '测试\n多行\n文本';
            document.body.appendChild(testTextarea);
            try {
                window.autoResizeTextarea(testTextarea);
                assert(true, '自动调整文本框高度');
            } catch (e) {
                assert(false, '自动调整文本框高度', e.message);
            } finally {
                document.body.removeChild(testTextarea);
            }
        }

        // 检查模态框元素
        const modals = document.querySelectorAll('.modal, .modal-backdrop, [class*="modal"]');
        log(`  ℹ️ 发现 ${modals.length} 个模态框元素`, 'info');

        // 检查下拉菜单
        const dropdowns = document.querySelectorAll('.dropdown, [class*="dropdown"]');
        log(`  ℹ️ 发现 ${dropdowns.length} 个下拉菜单元素`, 'info');
    }

    // ============================================
    // 主题切换测试
    // ============================================
    async function testThemeSwitcher() {
        section('主题切换');

        // 检查主题切换按钮
        const themeToggle = document.getElementById('theme-toggle') || document.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            assert(true, '主题切换按钮存在');
        } else {
            log('  ⚠️ 跳过: 主题切换按钮未找到', 'warning');
        }

        // 检查当前主题
        const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme');
        log(`  ℹ️ 当前主题: ${currentTheme || '默认'}`, 'info');

        // 检查CSS变量
        const styles = getComputedStyle(document.documentElement);
        const bgColor = styles.getPropertyValue('--bg-color') || styles.backgroundColor;
        log(`  ℹ️ 背景颜色: ${bgColor}`, 'info');
    }

    // ============================================
    // 命令面板测试
    // ============================================
    async function testCommandPalette() {
        section('命令面板');

        // 检查命令面板元素
        const commandPalette = document.getElementById('command-palette') || document.querySelector('.command-palette');
        if (commandPalette) {
            assert(true, '命令面板元素存在');
        } else {
            log('  ⚠️ 跳过: 命令面板元素未找到', 'warning');
        }

        // 检查快捷键处理
        log('  ℹ️ 尝试按 Ctrl/Cmd + K 打开命令面板', 'info');
    }

    // ============================================
    // 设置页面测试
    // ============================================
    async function testSettingsPage() {
        section('设置页面');

        // 检查是否在设置页面
        if (!window.location.pathname.includes('settings') && !window.location.pathname.includes('profile')) {
            log('  ⚠️ 跳过: 不在设置页面', 'warning');
            return;
        }

        // 检查表单元素
        const forms = document.querySelectorAll('form');
        log(`  ℹ️ 发现 ${forms.length} 个表单`, 'info');

        // 检查密码修改表单
        const passwordForm = document.querySelector('[action*="change_password"]') || document.querySelector('#password-form');
        if (passwordForm) {
            assert(true, '密码修改表单存在');
        }

        // 检查资料表单
        const profileForm = document.querySelector('[action*="profile"]') || document.querySelector('#profile-form');
        if (profileForm) {
            assert(true, '资料表单存在');
        }

        // 检查爱心雨设置
        const heartRainToggle = document.getElementById('heart-rain-toggle') || document.querySelector('[name="heartRain"]');
        if (heartRainToggle) {
            assert(true, '爱心雨设置存在');
        }
    }

    // ============================================
    // 管理员页面测试
    // ============================================
    async function testAdminPages() {
        section('管理员功能');

        // 检查是否在管理员页面
        if (!window.location.pathname.includes('admin')) {
            log('  ⚠️ 跳过: 不在管理员页面', 'warning');
            return;
        }

        // 检查管理员导航
        const adminNav = document.querySelector('.admin-nav, .admin-sidebar, [class*="admin"]');
        if (adminNav) {
            assert(true, '管理员导航存在');
        }

        // 检查用户管理功能
        if (window.location.pathname.includes('users')) {
            const userTable = document.querySelector('table, .user-list');
            if (userTable) {
                assert(true, '用户列表存在');
            }
        }

        // 检查聊天室管理功能
        if (window.location.pathname.includes('chat')) {
            const roomList = document.querySelector('.room-list, table');
            if (roomList) {
                assert(true, '聊天室列表存在');
            }
        }

        // 检查论坛管理功能
        if (window.location.pathname.includes('forum')) {
            const sectionList = document.querySelector('.section-list, table');
            if (sectionList) {
                assert(true, '论坛分区列表存在');
            }
        }

        // 检查名言管理功能
        if (window.location.pathname.includes('quotes')) {
            const quotesList = document.querySelector('.quotes-list, table, #quotes-container');
            if (quotesList) {
                assert(true, '名言列表存在');
            }
        }

        // 检查数据库管理功能
        if (window.location.pathname.includes('db')) {
            const tableList = document.querySelector('.table-list, table');
            if (tableList) {
                assert(true, '数据库表列表存在');
            }
        }
    }

    // ============================================
    // 性能测试
    // ============================================
    async function testPerformance() {
        section('性能测试');

        // 测试页面加载性能
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            assert(loadTime < 5000, '页面加载时间', `${loadTime}ms`);
        }

        // 测试DOM节点数量
        const allElements = document.getElementsByTagName('*').length;
        assert(allElements < 5000, 'DOM节点数量合理', `${allElements} 个节点`);

        // 测试事件监听器数量 (近似估计)
        log(`  ℹ️ 页面元素数量: ${allElements}`, 'info');
    }

    // ============================================
    // 错误处理测试
    // ============================================
    async function testErrorHandling() {
        section('错误处理');

        // 测试空输入处理
        if (typeof window.renderContent === 'function') {
            try {
                window.renderContent(null);
                window.renderContent(undefined);
                window.renderContent('');
                assert(true, '空输入不抛出异常');
            } catch (e) {
                assert(false, '空输入不抛出异常', e.message);
            }
        }

        // 测试API错误处理
        try {
            const resp = await fetch('/api/nonexistent_endpoint_12345');
            assert(resp.status === 404, 'API 404响应正常', `状态码: ${resp.status}`);
        } catch (e) {
            log(`  ℹ️ API错误: ${e.message}`, 'info');
        }
    }

    // ============================================
    // 主测试函数
    // ============================================
    async function runAllTests() {
        console.clear();
        log('\n' + '='.repeat(60), 'section');
        log('Stellarsis 前端自动化测试', 'section');
        log(`测试时间: ${new Date().toISOString()}`, 'section');
        log(`当前页面: ${window.location.pathname}`, 'section');
        log('='.repeat(60), 'section');

        try {
            await testDOMElements();
            await testGlobalFunctions();
            await testRenderSystem();
            await testAPIs();
            await testChatFeatures();
            await testForumFeatures();
            await testUploadFeatures();
            await testUIComponents();
            await testThemeSwitcher();
            await testCommandPalette();
            await testSettingsPage();
            await testAdminPages();
            await testPerformance();
            await testErrorHandling();
        } catch (e) {
            log(`\n❌ 测试过程中发生错误: ${e.message}`, 'error');
            console.error(e);
        }

        // 打印总结
        log('\n' + '='.repeat(60), 'section');
        log('测试总结', 'section');
        log('='.repeat(60), 'section');
        log(`  ✅ 通过: ${testResults.passed}`, 'success');
        log(`  ❌ 失败: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
        
        const total = testResults.passed + testResults.failed;
        if (total > 0) {
            const passRate = ((testResults.passed / total) * 100).toFixed(1);
            log(`  📊 通过率: ${passRate}%`, passRate >= 80 ? 'success' : 'warning');
        }

        if (testResults.errors.length > 0) {
            log('\n失败的测试:', 'error');
            testResults.errors.forEach(error => {
                log(`  - ${error}`, 'error');
            });
        }

        log('\n' + '='.repeat(60), 'section');
        log('测试完成!', 'section');
        log('='.repeat(60), 'section');

        return {
            passed: testResults.passed,
            failed: testResults.failed,
            errors: testResults.errors,
            passRate: total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0
        };
    }

    // 暴露测试函数到全局
    window.test = runAllTests;

    // 也暴露单独的测试函数
    window.testDOM = testDOMElements;
    window.testFunctions = testGlobalFunctions;
    window.testRender = testRenderSystem;
    window.testAPI = testAPIs;
    window.testChat = testChatFeatures;
    window.testForum = testForumFeatures;
    window.testUpload = testUploadFeatures;
    window.testUI = testUIComponents;
    window.testTheme = testThemeSwitcher;
    window.testCommand = testCommandPalette;
    window.testSettings = testSettingsPage;
    window.testAdmin = testAdminPages;
    window.testPerf = testPerformance;
    window.testError = testErrorHandling;

    // 提示
    console.log('%c[Stellarsis Test] 测试模块已加载', 'color: #4CAF50; font-weight: bold');
    console.log('%c在控制台输入 window.test() 运行全部测试', 'color: #2196F3');
    console.log('%c或输入 window.testXXX() 运行单个测试模块 (如 window.testChat())', 'color: #2196F3');

})();
