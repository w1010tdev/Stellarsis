document.addEventListener('DOMContentLoaded', function () {
    
    // 使用 Cloudflare clipboard-polyfill 库的复制到剪贴板函数
    function copyToClipboard(text) {
        // 使用 clipboard-polyfill 提供的兼容性方案
        clipboardPolyfill.writeText(text).then(function() {
            showToast('success', '复制成功');
        }).catch(function(err) {
            console.error('无法复制到剪贴板:', err);
            showToast('warning', '复制失败');
            
            // 如果 polyfill 也失败，回退到传统方法
            fallbackCopyTextToClipboard(text);
        });
    }

    // 传统的复制文本方法（通过创建临时 textarea）作为最后的备选方案
    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        
        // 避免滚动到底部
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            if (successful) {
                showToast('success', '复制成功');
            } else {
                showToast('warning', '复制失败');
            }
        } catch (err) {
            console.error('fallback 复制失败:', err);
            showToast('warning', '复制失败');
        }

        document.body.removeChild(textArea);
    }
    // Upload a single file input with preview and send to server
    function setupUpload(inputId, previewContainerId, listContainerId, insertTargetSelector, displayList, autoSend) {
        // displayList: whether to show/manage the image list UI
        // autoSend: whether to auto-submit after inserting (forum/chat)
        var input = document.getElementById(inputId);
        var preview = previewContainerId ? document.getElementById(previewContainerId) : null;
        var list = listContainerId ? document.getElementById(listContainerId) : null;
        var insertTarget = insertTargetSelector ? document.querySelector(insertTargetSelector) : null;
        displayList = !!displayList;
        autoSend = !!autoSend;

        if (!input) return;

        input.addEventListener('change', function (e) {
            var file = input.files[0];
            if (!file) return;

            // preview
            if (preview) {
                preview.innerHTML = '';
                var img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'image-upload-preview';
                img.onload = function () { URL.revokeObjectURL(this.src); };
                preview.appendChild(img);
            }

            // upload
            var fd = new FormData();
            fd.append('file', file);

            fetch('/api/upload/image', {
                method: 'POST',
                body: fd,
                credentials: 'same-origin'
            }).then(function (resp) {
                return resp.json();
            }).then(function (data) {
                if (data && data.success) {
                    // If displayList is enabled, add an entry; otherwise directly insert into editor
                    if (displayList && list) {
                        var container = document.createElement('div');
                        container.className = 'image-upload-item';

                        var thumb = document.createElement('img');
                        thumb.src = data.url;
                        thumb.className = 'image-upload-thumb';
                        container.appendChild(thumb);

                        // store markdown in data attribute, but do not display long raw markdown
                        container.dataset.markdown = data.markdown || data.url;

                        var fname = document.createElement('div');
                        fname.className = 'image-upload-filename';
                        fname.textContent = data.filename || (data.url || '').split('/').pop();
                        container.appendChild(fname);

                        var copyBtn = document.createElement('button');
                        copyBtn.className = 'btn btn-sm btn-outline image-upload-copy';
                        copyBtn.textContent = '复制 Markdown';
                        copyBtn.addEventListener('click', function () {
                            copyToClipboard(container.dataset.markdown);
                        });
                        container.appendChild(copyBtn);

                        if (insertTarget) {
                            var insertBtn = document.createElement('button');
                            insertBtn.className = 'btn btn-sm btn-primary image-upload-insert';
                            insertBtn.textContent = '插入到编辑器';
                            insertBtn.addEventListener('click', function () {
                                var el = insertTarget;
                                var val = el.value || '';
                                var start = el.selectionStart || val.length;
                                var before = val.substring(0, start);
                                var after = val.substring(start);
                                el.value = before + '\n' + container.dataset.markdown + '\n' + after;
                                el.dispatchEvent(new Event('input'));
                                showToast('success', '已插入到编辑器');
                            });
                            container.appendChild(insertBtn);
                        }

                        // add delete button (only visible for user's own images)
                        var delBtn = document.createElement('button');
                        delBtn.className = 'btn btn-sm btn-danger image-upload-delete';
                        delBtn.textContent = '删除';
                        delBtn.addEventListener('click', function () {
                            showConfirm('确认删除图片？此操作不可恢复。', { title: '删除图片', danger: true }).then(function (ok) {
                                if (!ok) return;
                                fetch('/api/upload/image/' + (data.id || data.image_id || 0), { method: 'DELETE', credentials: 'same-origin' })
                                    .then(function (r) { return r.json(); })
                                    .then(function (res) {
                                        if (res && res.success) {
                                            container.parentNode && container.parentNode.removeChild(container);
                                            showToast('success', '图片已删除');
                                        } else {
                                            showToast('danger', res && res.message ? res.message : '删除失败');
                                        }
                                    }).catch(function (e) { console.error('删除失败', e); showToast('danger', '删除失败'); });
                            });
                        });
                        container.appendChild(delBtn);
                        list.insertBefore(container, list.firstChild);
                    } else if (insertTarget) {
                        // directly insert markdown into editor and optionally auto-send
                        var el = insertTarget;
                        var val = el.value || '';
                        var start = el.selectionStart || val.length;
                        var before = val.substring(0, start);
                        var after = val.substring(start);
                        var md = data.markdown || data.url;
                        el.value = before + '\n' + md + '\n' + after;
                        el.dispatchEvent(new Event('input'));
                        showToast('success', '图片已插入到编辑器');
                        if (autoSend) {
                            // If it is a forum form, submit it; otherwise try to click send button
                            var form = el.closest('form');
                            if (form) {
                                var submitBtn = form.querySelector('button[type=submit]');
                                if (submitBtn) submitBtn.click(); else form.submit();
                            } else {
                                var sendBtn = document.getElementById('send-button');
                                if (sendBtn) sendBtn.click();
                            }
                        }
                    }
                    showToast('success', '图片上传成功');
                } else {
                    showToast('danger', data && data.message ? data.message : '上传失败');
                }
            }).catch(function (e) {
                console.error('上传错误', e);
                showToast('danger', '上传错误');
            });
        });
    }

    // Fetch and render existing images (only for pages that show a list)
    function loadExistingImages(listId, insertTargetSelector) {
        var list = document.getElementById(listId);
        if (!list) return;
        fetch('/api/upload/images', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (!d || !d.success) return;
                list.innerHTML = '';
                d.images.forEach(function (item) {
                    var container = document.createElement('div');
                    container.className = 'image-upload-item';
                    var thumb = document.createElement('img');
                    thumb.src = item.url;
                    thumb.className = 'image-upload-thumb';
                    container.appendChild(thumb);
                    container.dataset.markdown = item.markdown;
                    var fname = document.createElement('div');
                    fname.className = 'image-upload-filename';
                    fname.textContent = item.filename;
                    container.appendChild(fname);
                    var copyBtn = document.createElement('button');
                    copyBtn.className = 'btn btn-sm btn-outline image-upload-copy';
                    copyBtn.textContent = '复制 Markdown';
                    copyBtn.addEventListener('click', function () {
                        copyToClipboard(container.dataset.markdown);
                    });
                    container.appendChild(copyBtn);
                    // insert button
                    if (insertTargetSelector) {
                        var insertBtn = document.createElement('button');
                        insertBtn.className = 'btn btn-sm btn-primary image-upload-insert';
                        insertBtn.textContent = '插入到编辑器';
                        insertBtn.addEventListener('click', function () {
                            var el = document.querySelector(insertTargetSelector);
                            if (!el) return;
                            var val = el.value || '';
                            var start = el.selectionStart || val.length;
                            var before = val.substring(0, start);
                            var after = val.substring(start);
                            el.value = before + '\n' + container.dataset.markdown + '\n' + after;
                            el.dispatchEvent(new Event('input'));
                            showToast('success', '已插入到编辑器');
                        });
                        container.appendChild(insertBtn);
                    }
                    // delete for user's images
                    var delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-sm btn-danger image-upload-delete';
                    delBtn.textContent = '删除';
                    delBtn.addEventListener('click', function () {
                        showConfirm('确认删除图片？此操作不可恢复。', { title: '删除图片', danger: true }).then(function (ok) {
                            if (!ok) return;
                            fetch('/api/upload/image/' + item.id, { method: 'DELETE', credentials: 'same-origin' })
                                .then(function (r) { return r.json(); })
                                .then(function (res) {
                                    if (res && res.success) {
                                        container.parentNode && container.parentNode.removeChild(container);
                                        showToast('success', '图片已删除');
                                    } else {
                                        showToast('danger', res && res.message ? res.message : '删除失败');
                                    }
                                }).catch(function (e) { console.error('删除失败', e); showToast('danger', '删除失败'); });
                        });
                    });
                    container.appendChild(delBtn);
                    list.appendChild(container);
                });
            }).catch(function (e) { console.error('获取已有图片失败', e); });
    }

    // Initialize on known IDs
    // Profile: upload only, no list
    setupUpload('profile-image-input', 'profile-image-preview', null, null, false, false);
    // Forum new post: auto-insert after upload, do NOT auto-send
    setupUpload('post-image-input', 'post-image-preview', null, '#content', false, false);
    // Chat composer: auto-insert into message input, do NOT auto-send
    setupUpload('chat-image-input', 'chat-image-preview', null, '#message-text', false, false);
    // Settings page: show list and allow copy/delete
    setupUpload('settings-images-input', null, 'settings-images-list', null, true, false);
    // load existing images only for settings page
    loadExistingImages('settings-images-list', null);

});
//为管理员面板新增：一个button用于从/down下载根目录压缩包，一个button用于从/downdb下载db（API路径可能不对，我忘了），一个button用于从static下载图片压缩包（自行实现后端）。上传的图片可能有5G之多，但是我的服务器只有2G的内存，你需要思考如何优化。
//解决问题：1. 插入图片自动发送（贴吧中），2. 上传多个图片后大量积压输入空间（你只应当上传后自动插入，而非显示所有图片的预览。3. “我的图片”菜单没有在所有的settings文件夹下的网页显示 4. 删除markdown链接的直接显示，复制markdown链接这个按钮的文字颜色不对（与背景颜色冲突）（浅色模式）5. 个人资料这里应当删除图片列表