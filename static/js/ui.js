(function () {
    // 简单的 Toast 提示系统
    function ensureContainer() {
        var container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function createToast(type, message, timeout) {
        var container = ensureContainer();
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + (type || 'info');
        // 使用textContent以避免注入
        toast.textContent = message || '';

        // 可添加关闭按钮
        var closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', function () {
            hideToast(toast);
        });
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        // 强制重绘以触发动画
        window.getComputedStyle(toast).opacity;
        toast.classList.add('show');

        var t = typeof timeout === 'number' ? timeout : 4000;
        if (t > 0) {
            setTimeout(function () {
                hideToast(toast);
            }, t);
        }
    }

    function hideToast(toast) {
        if (!toast) return;
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', function () {
            if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
        });
    }

    // 全局暴露
    window.showToast = function (typeOrMessage, maybeMessage, maybeTimeout) {
        // 支持两种调用方式：showToast(message) 或 showToast(type, message, timeout)
        if (maybeMessage === undefined) {
            createToast('info', String(typeOrMessage), maybeTimeout);
        } else {
            createToast(String(typeOrMessage), String(maybeMessage), maybeTimeout);
        }
    };

    // 可复用的确认/输入模态
    // 用法1: showConfirm(message, options) -> Promise<boolean>
    // 用法2: showConfirm(message, {input:true, ...}) -> Promise<string|false> (输入字符串或 false 表示取消)
    window.showConfirm = function (message, options) {
        options = options || {};
        var title = options.title || '';
        var danger = !!options.danger;
        var confirmText = options.confirmText || '确定';
        var cancelText = options.cancelText || '取消';
        var withInput = !!options.input;

        return new Promise(function (resolve) {
            // 创建遮罩（带基础样式）
            var backdrop = document.createElement('div');
            backdrop.className = 'confirm-backdrop';
            backdrop.style.position = 'fixed';
            backdrop.style.left = '0';
            backdrop.style.top = '0';
            backdrop.style.right = '0';
            backdrop.style.bottom = '0';
            backdrop.style.background = 'rgba(0,0,0,0.4)';
            backdrop.style.display = 'flex';
            backdrop.style.alignItems = 'center';
            backdrop.style.justifyContent = 'center';
            backdrop.style.zIndex = 9999;
            backdrop.style.opacity = '0';
            backdrop.style.transition = 'opacity 220ms ease';

            var modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.style.minWidth = '280px';
            modal.style.maxWidth = '90%';
            modal.style.background = '#fff';
            modal.style.borderRadius = '8px';
            modal.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            modal.style.padding = '18px';
            modal.style.transform = 'translateY(8px) scale(0.98)';
            modal.style.opacity = '0';
            modal.style.transition = 'transform 220ms cubic-bezier(.2,.8,.2,1), opacity 180ms ease';

            if (title) {
                var h = document.createElement('h3');
                h.className = 'confirm-title';
                h.textContent = title;
                h.style.margin = '0 0 8px 0';
                h.style.fontSize = '1.05rem';
                modal.appendChild(h);
            }

            var p = document.createElement('div');
            p.className = 'confirm-message';
            p.textContent = message || '';
            p.style.marginBottom = '12px';
            modal.appendChild(p);

            var inputEl = null;
            if (withInput) {
                inputEl = document.createElement('input');
                inputEl.type = 'text';
                inputEl.className = 'confirm-input';
                inputEl.style.width = '100%';
                inputEl.style.marginBottom = '12px';
                inputEl.style.padding = '8px 10px';
                inputEl.style.border = '1px solid #ddd';
                inputEl.style.borderRadius = '4px';
                modal.appendChild(inputEl);
            }

            var btnRow = document.createElement('div');
            btnRow.className = 'confirm-actions';
            btnRow.style.display = 'flex';
            btnRow.style.gap = '8px';
            btnRow.style.justifyContent = 'flex-end';

            var cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary confirm-cancel';
            cancelBtn.textContent = cancelText;
            cancelBtn.style.padding = '8px 12px';
            btnRow.appendChild(cancelBtn);

            var okBtn = document.createElement('button');
            okBtn.className = 'btn btn-primary confirm-ok';
            okBtn.textContent = confirmText;
            if (danger) {
                okBtn.classList.add('btn-danger');
                okBtn.classList.remove('btn-primary');
            }
            okBtn.style.padding = '8px 12px';
            btnRow.appendChild(okBtn);

            modal.appendChild(btnRow);
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);

            // 触发进入动画
            requestAnimationFrame(function () {
                backdrop.style.opacity = '1';
                modal.style.transform = 'translateY(0) scale(1)';
                modal.style.opacity = '1';
            });

            // 聚焦：如果有输入则聚焦输入，否则聚焦确定按钮
            setTimeout(function () {
                if (inputEl) inputEl.focus(); else okBtn.focus();
            }, 150);

            var removed = false;
            function removeElements() {
                if (removed) return;
                removed = true;
                if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
            }

            function cleanup(result) {
                // 触发退出动画
                backdrop.style.opacity = '0';
                modal.style.transform = 'translateY(8px) scale(0.98)';
                modal.style.opacity = '0';
                // 等待動畫结束再移除
                var t = Math.max(220, 200);
                setTimeout(function () {
                    removeElements();
                    // 如果是带输入模式，返回输入字符串或 false
                    if (withInput) {
                        if (result) {
                            resolve(inputEl ? inputEl.value : '');
                        } else {
                            resolve(false);
                        }
                    } else {
                        resolve(!!result);
                    }
                }, t);
            }

            cancelBtn.addEventListener('click', function () { cleanup(false); });
            okBtn.addEventListener('click', function () { cleanup(true); });

            backdrop.addEventListener('click', function (e) {
                if (e.target === backdrop) {
                    cleanup(false);
                }
            });

            function onKey(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', onKey);
                    cleanup(false);
                }
                if (e.key === 'Enter') {
                    // 如果光标在输入框内按 Enter，确认
                    document.removeEventListener('keydown', onKey);
                    cleanup(true);
                }
            }

            document.addEventListener('keydown', onKey);
        });
    };

})();
