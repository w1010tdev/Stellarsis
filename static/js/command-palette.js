/* Command Palette - desktop quick command overlay
   - Shows when user presses ':' while no input is focused
   - Provides an API: registerCommand(name, desc, handler)
   - Exposes `window.commandPalette.show()` and `window.commandPalette.hide()`
*/
(function () {
    var commands = {};
    function registerCommand(name, desc, handler) {
        commands[name] = { desc: desc || '', handler: handler };
    }

    // default commands
    registerCommand('help', '显示可用命令', function (args) {
        var keys = Object.keys(commands).sort();
        return Promise.resolve({ type: 'help', list: keys.map(k => ({ name: k, desc: commands[k].desc })) });
    });
    registerCommand('theme', '切换主题: theme <name>', function (args) {
        var name = args[0];
        if (!name) return Promise.reject('缺少主题名称');
        if (typeof setTheme === 'function') setTheme(name);
        return Promise.resolve('已切换主题：' + name);
    });
    registerCommand('close', '关闭命令面板', function () { window.commandPalette.hide(); return Promise.resolve('closed'); });
    registerCommand('forumlist', "贴吧分区列表", function () { /*跳转到/forum*/ window.location.replace('/forum'); return Promise.resolve('closed'); });
    registerCommand('chatlist', "贴吧分区列表", function () { /*跳转到/chat*/ window.location.replace('/chat'); return Promise.resolve('closed'); });
    registerCommand('settings','设置',function (){window.location.replace('/settings');return Promise.resolve("closed");});
    registerCommand('admin','管理面板',function (){window.location.replace('/admin');return Promise.resolve("closed");});
    //缩写
    registerCommand('tm', '切换主题: theme <name>', function (args) {
        var name = args[0];
        if (!name) return Promise.reject('缺少主题名称');
        if (typeof setTheme === 'function') setTheme(name);
        return Promise.resolve('已切换主题：' + name);
    });
    registerCommand('ex', "close", function () { window.commandPalette.hide(); return Promise.resolve('closed'); });
    registerCommand('cl', "chatlist", function () { /*跳转到/chat*/ window.location.replace('/chat'); return Promise.resolve('closed'); });
    registerCommand('fl', "forumlist", function () { /*跳转到/forum*/ window.location.replace('/forum'); return Promise.resolve('closed'); });
    registerCommand('st','设置',function (){window.location.replace('/settings');return Promise.resolve("closed");});
    registerCommand('adm','管理面板',function (){window.location.replace('/admin');return Promise.resolve("closed");});
    // Create DOM
    var overlay = document.createElement('div'); overlay.id = 'command-palette-overlay';
    var input = document.createElement('input'); input.className = 'cp-input'; input.placeholder = '输入命令（例如: help）';
    var suggestions = document.createElement('div'); suggestions.className = 'cp-suggestions';
    var help = document.createElement('div'); help.className = 'cp-help'; help.textContent = '按 Enter 执行，Esc 退出';
    overlay.appendChild(input); overlay.appendChild(suggestions); overlay.appendChild(help);
    document.body.appendChild(overlay);

    function show() { overlay.classList.add('show'); overlay.style.display = 'flex'; input.focus(); input.select(); updateSuggestions(); }
    function hide() { overlay.classList.remove('show'); overlay.style.display = 'none'; input.value = ''; suggestions.innerHTML = ''; }

    function updateSuggestions() {
        var v = input.value.trim();
        suggestions.innerHTML = '';
        if (!v) {
            // show commands summary
            Object.keys(commands).sort().forEach(function (k) {
                var el = document.createElement('div'); el.className = 'cp-suggestion'; el.textContent = k + ' — ' + (commands[k].desc || '');
                el.onclick = function () { execute(k); };
                suggestions.appendChild(el);
            });
            return;
        }
        var parts = v.split(/\s+/);
        var cmd = parts[0];
        var args = parts.slice(1);
        Object.keys(commands).sort().filter(function (k) { return k.indexOf(cmd) === 0; }).forEach(function (k) {
            var el = document.createElement('div'); el.className = 'cp-suggestion'; el.textContent = k + ' — ' + (commands[k].desc || '');
            el.onclick = function () { execute(k, args); };
            suggestions.appendChild(el);
        });
    }

    function execute(name, providedArgs) {
        var args = providedArgs || input.value.trim().split(/\s+/).slice(1);
        if (!commands[name]) return;
        try {
            var res = commands[name].handler(args);
            Promise.resolve(res).then(function (r) {
                suggestions.innerHTML = '';
                var out = document.createElement('div'); out.className = 'cp-suggestion'; out.textContent = (typeof r === 'string') ? r : JSON.stringify(r);
                suggestions.appendChild(out);
            }).catch(function (e) {
                suggestions.innerHTML = '';
                var out = document.createElement('div'); out.className = 'cp-suggestion'; out.textContent = '错误: ' + e;
                suggestions.appendChild(out);
            });
        } catch (e) {
            suggestions.innerHTML = '';
            var out = document.createElement('div'); out.className = 'cp-suggestion'; out.textContent = '执行异常: ' + e;
            suggestions.appendChild(out);
        }
    }

    // keyboard handling: show on ':' when no input focused
    document.addEventListener('keydown', function (e) {
        var active = document.activeElement;
        var isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (e.key === ':' && !isInput) {
            e.preventDefault(); show();
        }
        if (e.key === 'Escape') {
            if (overlay.classList.contains('show')) { hide(); }
        }
    });

    // input handling
    input.addEventListener('input', updateSuggestions);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            var v = input.value.trim(); if (!v) return; var parts = v.split(/\s+/); var cmd = parts[0]; execute(cmd);
        } else if (e.key === 'Escape') {
            hide();
        }
    });

    // public API
    window.commandPalette = {
        registerCommand: registerCommand,
        show: show,
        hide: hide,
        listCommands: function () { return Object.keys(commands).sort(); }
    };

})();
