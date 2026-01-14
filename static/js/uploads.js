document.addEventListener('DOMContentLoaded', function () {
    
    // Check if file upload is enabled (set from server-side template)
    var FILE_UPLOAD_ENABLED = window.ENABLE_FILE_UPLOAD || false;
    
    // 使用 clipboard-polyfill 库（如果存在），否则使用现代 Clipboard API，最后回退到传统方法
    function copyToClipboard(text) {
        // 如果 clipboardPolyfill 存在，优先使用它
        if (typeof clipboardPolyfill !== 'undefined' && clipboardPolyfill.writeText) {
            clipboardPolyfill.writeText(text).then(function() {
                showToast('success', '复制成功');
            }).catch(function(err) {
                console.error('无法复制到剪贴板:', err);
                showToast('warning', '复制失败');
                
                // 如果 polyfill 失败，回退到现代 API 或传统方法
                fallbackCopyToClipboardSafe(text);
            });
        } else {
            // 否则使用现代 API 或传统方法
            fallbackCopyToClipboardSafe(text);
        }
    }
    
    // 增强版的回退方法，先尝试现代 API，再使用传统方法
    function fallbackCopyToClipboardSafe(text) {
        // 尝试现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function() {
                showToast('success', '复制成功');
            }).catch(function(err) {
                console.error('现代剪贴板 API 失败:', err);
                showToast('warning', '复制失败');
                
                // 最终回退到传统方法
                fallbackCopyTextToClipboard(text);
            });
        } else {
            // 直接使用传统方法
            fallbackCopyTextToClipboard(text);
        }
    }

    // 截断文件名，超出 maxLen 用 ... 代替
    function truncateFilename(str, maxLen) {
        if (!str) return '';
        maxLen = maxLen || 30;
        if (str.length <= maxLen) return str;
        return str.slice(0, maxLen - 3) + '...';
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
    
    // 检查文件扩展名是否为图片类型
    function isImageFile(filename) {
        if (!filename) return false;
        var imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        var ext = filename.split('.').pop().toLowerCase();
        return imageExtensions.indexOf(ext) !== -1;
    }
    
    // 获取文件图标（用于非图片文件）
    function getFileIcon(filename) {
        var ext = filename ? filename.split('.').pop().toLowerCase() : '';
        var iconMap = {
            'pdf': '📄',
            'doc': '📝',
            'docx': '📝',
            'xls': '📊',
            'xlsx': '📊',
            'ppt': '📽️',
            'pptx': '📽️',
            'txt': '📄',
            'md': '📝',
            'zip': '📦',
            'rar': '📦',
            '7z': '📦'
        };
        return iconMap[ext] || '📁';
    }
    
    // Upload a single file input with preview and send to server
    function setupUpload(inputId, previewContainerId, listContainerId, insertTargetSelector, displayList, autoSend) {
        // displayList: whether to show/manage the file list UI
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
            
            // 判断是否为图片文件
            var isImage = isImageFile(file.name);

            // preview (only for images)
            if (preview && isImage) {
                preview.innerHTML = '';
                var img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'image-upload-preview';
                img.onload = function () { URL.revokeObjectURL(this.src); };
                preview.appendChild(img);
            } else if (preview) {
                preview.innerHTML = '';
            }

            // upload - 根据是否启用文件上传选择不同的API
            var fd = new FormData();
            fd.append('file', file);
            
            var uploadUrl = FILE_UPLOAD_ENABLED ? '/api/upload/file' : '/api/upload/image';

            fetch(uploadUrl, {
                method: 'POST',
                body: fd,
                credentials: 'same-origin'
            }).then(function (resp) {
                return resp.json();
            }).then(function (data) {
                if (data && data.success) {
                    // 从服务器响应获取是否为图片
                    var fileIsImage = data.is_image !== undefined ? data.is_image : isImage;
                    var itemType = fileIsImage ? '图片' : '文件';
                    
                    // If displayList is enabled, add an entry; otherwise directly insert into editor
                    if (displayList && list) {
                        var container = document.createElement('div');
                        container.className = 'image-upload-item' + (fileIsImage ? '' : ' file-upload-item');

                        if (fileIsImage) {
                            var thumb = document.createElement('img');
                            thumb.src = data.url;
                            thumb.className = 'image-upload-thumb';
                            container.appendChild(thumb);
                        } else {
                            // 非图片文件显示图标
                            var iconDiv = document.createElement('div');
                            iconDiv.className = 'file-icon';
                            iconDiv.textContent = getFileIcon(data.filename);
                            container.appendChild(iconDiv);
                        }

                        // store markdown in data attribute, but do not display long raw markdown
                        container.dataset.markdown = data.markdown || data.url;
                        container.dataset.isImage = fileIsImage ? 'true' : 'false';

                        var fname = document.createElement('div');
                        fname.className = 'image-upload-filename';
                        var fullName = data.filename || (data.url || '').split('/').pop() || '';
                        fname.textContent = truncateFilename(fullName, 30);
                        fname.title = fullName;
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

                        // add delete button (only visible for user's own files)
                        var delBtn = document.createElement('button');
                        delBtn.className = 'btn btn-sm btn-danger image-upload-delete';
                        delBtn.textContent = '删除';
                        delBtn.addEventListener('click', function () {
                            var confirmMsg = fileIsImage ? '确认删除图片？此操作不可恢复。' : '确认删除文件？此操作不可恢复。';
                            var confirmTitle = fileIsImage ? '删除图片' : '删除文件';
                            showConfirm(confirmMsg, { title: confirmTitle, danger: true }).then(function (ok) {
                                if (!ok) return;
                                fetch('/api/upload/image/' + (data.id || data.image_id || 0), { method: 'DELETE', credentials: 'same-origin' })
                                    .then(function (r) { return r.json(); })
                                    .then(function (res) {
                                        if (res && res.success) {
                                            container.parentNode && container.parentNode.removeChild(container);
                                            showToast('success', itemType + '已删除');
                                            
                                            // 触发上传完成事件以更新配额信息
                                            document.dispatchEvent(new CustomEvent('uploadComplete', { detail: data }));
                                        } else {
                                            showToast('danger', res && res.message ? res.message : '删除失败');
                                        }
                                    }).catch(function (e) { console.error('删除失败', e); showToast('danger', '删除失败'); });
                            });
                        });
                        container.appendChild(delBtn);
                        list.insertBefore(container, list.firstChild);
                        
                        // 触发上传完成事件以更新配额信息
                        document.dispatchEvent(new CustomEvent('uploadComplete', { detail: data }));
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
                        showToast('success', itemType + '已插入到编辑器');
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
                        
                        // 触发上传完成事件以更新配额信息
                        document.dispatchEvent(new CustomEvent('uploadComplete', { detail: data }));
                    }
                    showToast('success', itemType + '上传成功');
                } else {
                    showToast('danger', data && data.message ? data.message : '上传失败');
                }
            }).catch(function (e) {
                console.error('上传错误', e);
                showToast('danger', '上传错误');
            });
        });
    }

    // Fetch and render existing files (only for pages that show a list)
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
                    // 判断是否为图片
                    var fileIsImage = item.is_image !== undefined ? item.is_image : isImageFile(item.filename);
                    container.className = 'image-upload-item' + (fileIsImage ? '' : ' file-upload-item');
                    
                    if (fileIsImage) {
                        var thumb = document.createElement('img');
                        thumb.src = item.url;
                        thumb.className = 'image-upload-thumb';
                        container.appendChild(thumb);
                    } else {
                        // 非图片文件显示图标
                        var iconDiv = document.createElement('div');
                        iconDiv.className = 'file-icon';
                        iconDiv.textContent = getFileIcon(item.filename);
                        container.appendChild(iconDiv);
                    }
                    
                    container.dataset.markdown = item.markdown;
                    container.dataset.isImage = fileIsImage ? 'true' : 'false';
                    var fname = document.createElement('div');
                    fname.className = 'image-upload-filename';
                    var fullName = item.filename || '';
                    fname.textContent = truncateFilename(fullName, 30);
                    fname.title = fullName;
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
                    // delete for user's files
                    var delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-sm btn-danger image-upload-delete';
                    delBtn.textContent = '删除';
                    delBtn.addEventListener('click', function () {
                        var confirmMsg = fileIsImage ? '确认删除图片？此操作不可恢复。' : '确认删除文件？此操作不可恢复。';
                        var confirmTitle = fileIsImage ? '删除图片' : '删除文件';
                        showConfirm(confirmMsg, { title: confirmTitle, danger: true }).then(function (ok) {
                            if (!ok) return;
                            fetch('/api/upload/image/' + item.id, { method: 'DELETE', credentials: 'same-origin' })
                                .then(function (r) { return r.json(); })
                                .then(function (res) {
                                    if (res && res.success) {
                                        container.parentNode && container.parentNode.removeChild(container);
                                        showToast('success', (fileIsImage ? '图片' : '文件') + '已删除');
                                        
                                        // 触发上传完成事件以更新配额信息
                                        document.dispatchEvent(new CustomEvent('uploadComplete', { detail: item }));
                                    } else {
                                        showToast('danger', res && res.message ? res.message : '删除失败');
                                    }
                                }).catch(function (e) { console.error('删除失败', e); showToast('danger', '删除失败'); });
                        });
                    });
                    container.appendChild(delBtn);
                    list.appendChild(container);
                });
            }).catch(function (e) { console.error('获取已有文件失败', e); });
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
    // load existing files only for settings page
    loadExistingImages('settings-images-list', null);

});
