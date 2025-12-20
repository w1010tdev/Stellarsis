// 确保代码在DOM加载后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在帖子页面
    const threadContent = document.querySelector('.thread-content');
    const replyForm = document.getElementById('reply-form');
    
    // 如果是帖子详情页，处理内容渲染
    if (threadContent) {
        const rawContent = threadContent.getAttribute('data-content');
        if (rawContent) {
            renderAndSetContent(threadContent, rawContent);
        }
    }
    
    // 如果是回复表单，设置提交处理
    if (replyForm) {
        setupReplyForm();
    }
    
    // 处理所有回复内容
    document.querySelectorAll('.reply-content').forEach(function(element) {
        const rawContent = element.getAttribute('data-content');
        if (rawContent) {
            renderAndSetContent(element, rawContent);
        }
    });
    
    // 渲染并设置内容
    function renderAndSetContent(element, content) {
        // 等待渲染系统就绪
        waitForRenderReady(function() {
            try {
                    element.innerHTML = window.renderContent(content);
                    if (typeof window.postProcessRendered === 'function') window.postProcessRendered(element);
                } catch (e) {
                    console.error('内容渲染失败:', e);
                    element.innerHTML = '<div class="render-error">' + escapeHtml(content) + '</div>';
                }
        });
    }
    
    // 设置回复表单
    function setupReplyForm() {
        const submitButton = replyForm.querySelector('button[type="submit"]');
        const contentInput = replyForm.querySelector('textarea[name="content"]');
        
        if (!submitButton || !contentInput) return;
        
        // 初始化时调整高度
        if (typeof window.autoResizeTextarea === 'function') {
            window.autoResizeTextarea(contentInput);
        }
        
        // 监听输入事件以调整高度
        contentInput.addEventListener('input', function() {
            if (typeof window.autoResizeTextarea === 'function') {
                window.autoResizeTextarea(this);
            }
        });
        
        submitButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const content = contentInput.value.trim();
            if (!content) {
                showToast('warning', '回复内容不能为空');
                return;
            }
            
            // 禁用按钮，防止重复提交
            submitButton.disabled = true;
            submitButton.textContent = '提交中...';
            
            // 发送请求
            const formData = new FormData();
            formData.append('thread_id', replyForm.getAttribute('data-thread-id'));
            formData.append('content', content);
            
            fetch('/api/forum/reply', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不正常');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // 创建新的回复元素
                    const repliesContainer = document.querySelector('.replies');
                    if (repliesContainer) {
                        const newReply = createReplyElement(data);
                        repliesContainer.appendChild(newReply);
                        
                        // 滚动到新回复
                        newReply.scrollIntoView({behavior: 'smooth'});
                    }
                    
                    // 重置表单
                    contentInput.value = '';
                    if (typeof window.autoResizeTextarea === 'function') {
                        window.autoResizeTextarea(contentInput); // 重置高度
                    }
                    submitButton.disabled = false;
                    submitButton.textContent = '回复';
                } else {
                    throw new Error(data.message || '提交失败');
                }
            })
            .catch(error => {
                console.error('提交回复失败:', error);
                showToast('error', '提交失败: ' + error.message);
                submitButton.disabled = false;
                submitButton.textContent = '回复';
            });
        });
    }
    
    // 创建回复元素
    function createReplyElement(replyData) {
        const replyElement = document.createElement('div');
        replyElement.className = 'reply';
        
        // 用户信息
        const userElement = document.createElement('div');
        userElement.className = 'reply-user';
        
        if (replyData.badge) {
            const badgeElement = document.createElement('span');
            badgeElement.className = 'user-badge';
            badgeElement.style.backgroundColor = replyData.color;
            badgeElement.textContent = replyData.badge;
            userElement.appendChild(badgeElement);
        }
        
        const nameElement = document.createElement('span');
        nameElement.className = 'user-name';
        nameElement.style.color = replyData.color;
        nameElement.textContent = replyData.nickname || replyData.username;
        userElement.appendChild(nameElement);
        
        const timeElement = document.createElement('span');
        timeElement.className = 'reply-time';
        const date = new Date(replyData.timestamp);
        timeElement.textContent = date.toLocaleString();
        userElement.appendChild(timeElement);
        
        // 回复内容
        const contentElement = document.createElement('div');
        contentElement.className = 'reply-content';
        
        // 等待渲染系统就绪
        waitForRenderReady(function() {
            try {
                contentElement.innerHTML = window.renderContent(replyData.content);
                if (typeof window.postProcessRendered === 'function') window.postProcessRendered(contentElement);
            } catch (e) {
                console.error('回复渲染失败:', e);
                contentElement.innerHTML = '<div class="render-error">' + escapeHtml(replyData.content) + '</div>';
            }
        });
        
        // 组装
        replyElement.appendChild(userElement);
        replyElement.appendChild(contentElement);
        
        return replyElement;
    }
    
    // 等待渲染系统就绪
    function waitForRenderReady(callback) {
        if (typeof window.renderContent === 'function') {
            callback();
            return;
        }
        
        let retryCount = 0;
        const maxRetries = 3;
        
        const checkReady = function() {
            if (typeof window.renderContent === 'function') {
                callback();
                return;
            }
            
            if (retryCount >= maxRetries) {
                console.error('渲染系统初始化失败');
                // 定义安全的降级渲染函数
                window.renderContent = function(content) {
                    return '<pre class="plaintext-render">' + escapeHtml(content) + '</pre>';
                };
                callback();
                return;
            }
            
            retryCount++;
            setTimeout(checkReady, 1000);
        };
        
        checkReady();
    }
    
    // HTML转义
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.message, 'at', e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
    e.preventDefault();
});