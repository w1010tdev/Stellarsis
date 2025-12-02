document.addEventListener('DOMContentLoaded', function () {
    // Upload a single file input with preview and send to server
    function setupUpload(inputId, previewContainerId, listContainerId, insertTargetSelector) {
        var input = document.getElementById(inputId);
        var preview = document.getElementById(previewContainerId);
        var list = document.getElementById(listContainerId);
        var insertTarget = insertTargetSelector ? document.querySelector(insertTargetSelector) : null;

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
                    // Add to list
                    if (list) {
                        var container = document.createElement('div');
                        container.className = 'image-upload-item';

                        var thumb = document.createElement('img');
                        thumb.src = data.url;
                        thumb.className = 'image-upload-thumb';
                        container.appendChild(thumb);

                        var text = document.createElement('input');
                        text.type = 'text';
                        text.readOnly = true;
                        text.className = 'image-upload-markdown';
                        text.value = data.markdown || data.url;
                        container.appendChild(text);

                        var copyBtn = document.createElement('button');
                        copyBtn.className = 'btn btn-sm btn-outline image-upload-copy';
                        copyBtn.textContent = '复制 Markdown';
                        copyBtn.addEventListener('click', function () {
                            try { navigator.clipboard.writeText(text.value); showToast('success', '复制成功'); } catch (e) { showToast('warning', '复制失败'); }
                        });
                        container.appendChild(copyBtn);

                        if (insertTarget) {
                            var insertBtn = document.createElement('button');
                            insertBtn.className = 'btn btn-sm btn-primary image-upload-insert';
                            insertBtn.textContent = '插入到编辑器';
                            insertBtn.addEventListener('click', function () {
                                // insert markdown at cursor
                                var el = insertTarget;
                                var val = el.value || '';
                                var start = el.selectionStart || val.length;
                                var before = val.substring(0, start);
                                var after = val.substring(start);
                                el.value = before + '\n' + text.value + '\n' + after;
                                el.dispatchEvent(new Event('input')); // for live preview
                                showToast('success', '已插入到编辑器');
                            });
                            container.appendChild(insertBtn);
                        }

                        list.insertBefore(container, list.firstChild);
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

    // Fetch and render existing images
    function loadExistingImages(listId) {
        var list = document.getElementById(listId);
        if (!list) return;
        fetch('/api/upload/images', {credentials: 'same-origin'})
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
                    var text = document.createElement('input');
                    text.type = 'text'; text.readOnly = true; text.className = 'image-upload-markdown'; text.value = item.markdown;
                    container.appendChild(text);
                    var copyBtn = document.createElement('button'); copyBtn.className = 'btn btn-sm btn-outline image-upload-copy'; copyBtn.textContent='复制 Markdown'; copyBtn.addEventListener('click', function(){ try{ navigator.clipboard.writeText(text.value); showToast('success', '复制成功'); }catch(e){ showToast('warning','复制失败'); }});
                    container.appendChild(copyBtn);
                    list.appendChild(container);
                });
            }).catch(function (e) {console.error('获取已有图片失败', e);});
    }

    // Initialize on known IDs
    setupUpload('profile-image-input', 'profile-image-preview', 'profile-image-list', null);
    setupUpload('post-image-input', 'post-image-preview', 'post-image-list', '#content');
    setupUpload('chat-image-input', 'chat-image-preview', 'chat-image-list', '#message-text');
    // load existing images for profile and for post page
    loadExistingImages('profile-image-list');
    loadExistingImages('post-image-list');

});
