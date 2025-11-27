document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('follow-search');
    const resultEl = document.getElementById('search-result');
    const followListEl = document.getElementById('follow-list');

    function renderFollowList(items) {
        if (!followListEl) return;
        followListEl.innerHTML = '';
        if (!items || items.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty-state';
            li.textContent = '暂无关注';
            followListEl.appendChild(li);
            return;
        }
        items.forEach(f => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.justifyContent = 'space-between';
            li.style.padding = '8px';
            li.style.borderBottom = '1px solid #eee';
            li.innerHTML = `
                <div>
                    <strong>${escapeHtml(f.nickname || f.username)}</strong>
                    <div style="font-size:0.9rem;color:#666">@${escapeHtml(f.username)}</div>
                </div>
                <div>
                    <button class="btn btn-secondary" data-unfollow-id="${f.id}">取消关注</button>
                </div>
            `;
            followListEl.appendChild(li);
        });
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function refreshFollowList() {
        fetch('/api/follows')
            .then(r => r.json())
            .then(data => {
                if (data && data.success) {
                    renderFollowList(data.follows);
                }
            }).catch(e => console.error('刷新关注列表失败', e));
    }

    // 初始化已有关注列表行为（也可以直接刷新）
    refreshFollowList();

    // 搜索交互
    if (searchInput) {
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const q = searchInput.value.trim();
                if (!q) return;
                resultEl.innerHTML = '搜索中...';
                fetch('/api/search_users?username=' + encodeURIComponent(q))
                    .then(r => r.json())
                    .then(data => {
                        if (!data || !data.success) {
                            resultEl.innerHTML = '<div class="error">搜索失败</div>';
                            return;
                        }
                        const users = data.users || [];
                        if (users.length === 0) {
                            resultEl.innerHTML = '<div class="help-text">未找到用户</div>';
                            return;
                        }
                        const list = document.createElement('ul');
                        list.style.listStyle = 'none';
                        list.style.padding = '0';
                        users.forEach(u => {
                            const li = document.createElement('li');
                            li.style.display = 'flex';
                            li.style.justifyContent = 'space-between';
                            li.style.padding = '8px 0';
                            li.style.borderBottom = '1px solid #f0f0f0';
                            li.innerHTML = `
                                <div>
                                    <strong>${escapeHtml(u.nickname || u.username)}</strong>
                                    <div style="font-size:0.9rem;color:#666">@${escapeHtml(u.username)}</div>
                                </div>
                                <div>
                                    <button class="btn" data-follow-id="${u.id}">关注</button>
                                </div>
                            `;
                            list.appendChild(li);
                        });
                        resultEl.innerHTML = '';
                        resultEl.appendChild(list);
                    }).catch(e => {
                        console.error('搜索用户失败', e);
                        resultEl.innerHTML = '<div class="error">搜索出错</div>';
                    });
            }
        });
    }

    // 事件委托：处理关注按钮
    document.addEventListener('click', function (e) {
        const followBtn = e.target.closest('[data-follow-id]');
        if (followBtn) {
            const id = followBtn.getAttribute('data-follow-id');
            followBtn.disabled = true;
            fetch('/api/follows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: id })
            }).then(r => r.json()).then(data => {
                followBtn.disabled = false;
                if (data && data.success) {
                    refreshFollowList();
                    resultEl.innerHTML = '<div class="alert alert-success">已关注</div>';
                } else {
                    resultEl.innerHTML = '<div class="alert alert-danger">' + (data.message || '关注失败') + '</div>';
                }
            }).catch(e => {
                followBtn.disabled = false;
                console.error('关注失败', e);
            });
            return;
        }

        const unfollowBtn = e.target.closest('[data-unfollow-id]');
        if (unfollowBtn) {
            const id = unfollowBtn.getAttribute('data-unfollow-id');
            if (!confirm('确定要取消关注该用户吗？')) return;
            unfollowBtn.disabled = true;
            fetch('/api/follows/' + encodeURIComponent(id), { method: 'DELETE' })
                .then(r => r.json())
                .then(data => {
                    unfollowBtn.disabled = false;
                    if (data && data.success) {
                        refreshFollowList();
                    } else {
                        alert(data.message || '取消关注失败');
                    }
                }).catch(e => {
                    unfollowBtn.disabled = false;
                    console.error('取消关注失败', e);
                });
            return;
        }
    });
});
