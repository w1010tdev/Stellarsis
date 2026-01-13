document.addEventListener('DOMContentLoaded', function () {
    
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
    
    // 增强版的回退方法，先尝试 modern API，再使用传统方法
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

    // 检查是否为图片扩展名
    function isImageExtension(filename) {
        var ext = filename.split('.').pop().toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) !== -1;
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

            // preview
            if (preview) {
                preview.innerHTML = '';
                if (isImageExtension(file.name)) {
                    var img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.className = 'image-upload-preview';
                    img.onload = function () { URL.revokeObjectURL(this.src); };
                    preview.appendChild(img);
                } else {
                    var icon = document.createElement('div');
                    icon.className = 'image-upload-preview';
                    icon.innerHTML = '<i class="fas fa-file"></i>';
                    preview.appendChild(icon);
                }
            }

            // upload
            var fd = new FormData();
            fd.append('file', file);

            fetch('/api/upload/file', {
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

                        if (isImageExtension(data.filename)) {
                            var thumb = document.createElement('img');
                            thumb.src = data.url;
                            thumb.className = 'image-upload-thumb';
                            container.appendChild(thumb);
                        } else {
                            var thumbIcon = document.createElement('div');
                            thumbIcon.className = 'image-upload-thumb file-icon';
                            thumbIcon.innerHTML = '<i class="fas fa-file"></i>';
                            container.appendChild(thumbIcon);
                        }

                        // store markdown in data attribute, but do not display long raw markdown
                        container.dataset.markdown = data.markdown || data.url;

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
                            showConfirm('确认删除文件？此操作不可恢复。', { title: '删除文件', danger: true }).then(function (ok) {
                                if (!ok) return;
                                fetch('/api/upload/file/' + (data.id || 0), { method: 'DELETE', credentials: 'same-origin' })
                                    .then(function (r) { return r.json(); })
                                    .then(function (res) {
                                        if (res && res.success) {
                                            container.parentNode && container.parentNode.removeChild(container);
                                            showToast('success', '文件已删除');
                                            
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
                        showToast('success', '文件已插入到编辑器');
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
                    showToast('success', '文件上传成功');
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
    function loadExistingFiles(listId, insertTargetSelector) {
        var list = document.getElementById(listId);
        if (!list) return;
        fetch('/api/upload/files', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (d) {
                if (!d || !d.success) return;
                list.innerHTML = '';
                d.files.forEach(function (item) {
                    var container = document.createElement('div');
                    container.className = 'image-upload-item';
                    
                    if (item.is_image) {
                        var thumb = document.createElement('img');
                        thumb.src = item.url;
                        thumb.className = 'image-upload-thumb';
                        container.appendChild(thumb);
                    } else {
                        var thumbIcon = document.createElement('div');
                        thumbIcon.className = 'image-upload-thumb file-icon';
                        thumbIcon.innerHTML = '<i class="fas fa-file"></i>';
                        container.appendChild(thumbIcon);
                    }
                    
                    container.dataset.markdown = item.markdown;
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

                    var delBtn = document.createElement('button');
                    delBtn.className = 'btn btn-sm btn-danger image-upload-delete';
                    delBtn.textContent = '删除';
                    delBtn.addEventListener('click', function () {
                        showConfirm('确认删除文件？此操作不可恢复。', { title: '删除文件', danger: true }).then(function (ok) {
                            if (!ok) return;
                            fetch('/api/upload/file/' + item.id, { method: 'DELETE', credentials: 'same-origin' })
                                .then(function (r) { return r.json(); })
                                .then(function (res) {
                                    if (res && res.success) {
                                        container.parentNode && container.parentNode.removeChild(container);
                                        showToast('success', '文件已删除');
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
            }).catch(function (e) { console.error('加载文件列表失败', e); });
    }

    // Export functions to window
    window.setupUpload = setupUpload;
    window.loadExistingFiles = loadExistingFiles;
    // Keep loadExistingImages for compatibility if needed, but it calls loadExistingFiles
    window.loadExistingImages = loadExistingFiles;

});
