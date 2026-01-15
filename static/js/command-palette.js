/* Command Palette - desktop quick command overlay (Bash-style)
   - Shows when user presses ':' while no input is focused
   - Provides an API: registerCommand(name, desc, handler)
   - Exposes `window.commandPalette.show()` and `window.commandPalette.hide()`
   - Bash-style features: command history (↑/↓), tab completion, aliases
*/
(function () {
    var commands = {};
    var aliases = {}; // alias -> command
    var commandHistory = []; // command history for ↑/↓ navigation
    var historyIndex = -1; // current position in history

    function registerCommand(name, desc, handler, opts) {
        commands[name] = { desc: desc || '', handler: handler };
        if (opts && Array.isArray(opts.aliases)) {
            opts.aliases.forEach(function (a) { aliases[a] = name; });
        }
    }

    function resolveCommand(nameOrAlias) {
        if (!nameOrAlias) return null;
        if (commands[nameOrAlias]) return nameOrAlias;
        if (aliases[nameOrAlias]) return aliases[nameOrAlias];
        return null;
    }

    // helper to get available themes from theme-switcher
    function getAvailableThemes() {
        if (window && Array.isArray(window.availableThemes)) return window.availableThemes.slice();
        return ['light', 'mint', 'ocean', 'purple', 'solarized', 'sunset'];
    }

    // helper to save command to history
    function saveToHistory(cmd) {
        if (!cmd || cmd.trim() === '') return;
        // avoid duplicates
        if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== cmd) {
            commandHistory.push(cmd);
            // keep only last 50 commands
            if (commandHistory.length > 50) {
                commandHistory.shift();
            }
        }
        historyIndex = -1; // reset history navigation
    }

    // helper to navigate history
    function navigateHistory(direction) {
        if (commandHistory.length === 0) return null;
        
        if (direction === 'up') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
            }
        } else if (direction === 'down') {
            if (historyIndex > 0) {
                historyIndex--;
            } else {
                historyIndex = -1;
                return '';
            }
        }
        
        return historyIndex >= 0 ? commandHistory[commandHistory.length - 1 - historyIndex] : '';
    }

    // fuzzy match helper for better autocomplete
    function fuzzyMatch(pattern, text) {
        pattern = pattern.toLowerCase();
        text = text.toLowerCase();
        var patternIdx = 0;
        var textIdx = 0;
        
        while (patternIdx < pattern.length && textIdx < text.length) {
            if (pattern[patternIdx] === text[textIdx]) {
                patternIdx++;
            }
            textIdx++;
        }
        
        return patternIdx === pattern.length;
    }

    // default commands
    registerCommand('help', '显示可用命令', function (args) {
        var keys = Object.keys(commands).sort();
        return Promise.resolve({ type: 'help', list: keys.map(k => ({ name: k, desc: commands[k].desc })) });
    });

    registerCommand('history', '显示命令历史', function (args) {
        if (commandHistory.length === 0) {
            return Promise.resolve('命令历史为空');
        }
        var recent = commandHistory.slice(-10).reverse(); // show last 10 commands
        return Promise.resolve({ 
            type: 'help', 
            list: recent.map((cmd, idx) => ({ 
                name: (commandHistory.length - idx) + ': ' + cmd, 
                desc: '' 
            })) 
        });
    }, { aliases: ['hist'] });

    registerCommand('theme', '切换主题: theme <name>', function (args) {
        var name = args[0];
        if (!name) return Promise.reject('缺少主题名称');
        if (typeof setTheme === 'function') setTheme(name);
        return Promise.resolve('已切换主题：' + name);
    });

    registerCommand('close', '关闭命令面板', function () { window.commandPalette.hide(); return Promise.resolve('closed'); }, { aliases: ['ex', 'quit'] });
    registerCommand('exit', '关闭命令面板', function () { window.commandPalette.hide(); return Promise.resolve('closed'); }, { aliases: ['q'] });

    registerCommand('forumlist', "贴吧分区列表", function () { window.location.replace('/forum'); return Promise.resolve('closed'); }, { aliases: ['fl'] });
    registerCommand('chatlist', "聊天室列表", function () { window.location.replace('/chat'); return Promise.resolve('closed'); }, { aliases: ['cl'] });
    registerCommand('settings', '设置', function () { window.location.replace('/settings'); return Promise.resolve('closed'); }, { aliases: ['st'] });
    registerCommand('admin', '管理面板', function () { window.location.replace('/admin/index'); return Promise.resolve('closed'); }, { aliases: ['adm'] });
    registerCommand('home', '首页', function () { window.location.replace('/'); return Promise.resolve('closed'); }, { aliases: ['h'] });
    registerCommand('tm', '切换主题: theme <name>', function (args) { var name = args[0]; if (!name) return Promise.reject('缺少主题名称'); if (typeof setTheme === 'function') setTheme(name); return Promise.resolve('已切换主题：' + name); });

    // focus command - focuses common inputs across site
    var focusTargets = {
        message: '#message-text',
        chat: '#message-text',
        search: '#searchInput',
        'admin-search': '#searchInput'
    };
    registerCommand('focus', '聚焦元素: focus <target>，可用: ' + Object.keys(focusTargets).join(', '), function (args) {
        var t = args[0];
        if (!t) return Promise.resolve({ type: 'targets', list: Object.keys(focusTargets) });
        var sel = focusTargets[t];
        if (!sel) return Promise.reject('未知目标: ' + t);
        var el = document.querySelector(sel);
        if (!el) return Promise.reject('目标元素不存在: ' + sel);
        el.focus();
        // if it's a textarea, move cursor to end
        try { if (el.setSelectionRange) { var len = el.value ? el.value.length : 0; el.setSelectionRange(len, len); } } catch (e) { }
        return Promise.resolve('已聚焦: ' + t);
    });

    // Create DOM
    var overlay = document.createElement('div'); overlay.id = 'command-palette-overlay';
    var input = document.createElement('input'); input.className = 'cp-input'; input.placeholder = '输入命令（例如: help）';
    var suggestions = document.createElement('div'); suggestions.className = 'cp-suggestions';
    var help = document.createElement('div'); help.className = 'cp-help'; help.textContent = '按 Enter 执行，Tab 补全，↑↓ 历史记录，Esc 退出';
    overlay.appendChild(input); overlay.appendChild(suggestions); overlay.appendChild(help);
    document.body.appendChild(overlay);

    var selectedSuggestion = -1;

    function show() { 
        overlay.classList.add('show'); 
        overlay.style.display = 'flex'; 
        input.focus(); 
        input.select(); 
        updateSuggestions(); 
        historyIndex = -1; // reset history navigation when showing
    }
    function hide() { 
        overlay.classList.remove('show'); 
        overlay.style.display = 'none'; 
        input.value = ''; 
        suggestions.innerHTML = ''; 
        selectedSuggestion = -1; 
        historyIndex = -1;
    }

    function clearSuggestions() { suggestions.innerHTML = ''; selectedSuggestion = -1; }

    function renderSuggestionItem(text, meta, clickHandler) {
        var el = document.createElement('div'); el.className = 'cp-suggestion';
        el.textContent = text + (meta ? ' — ' + meta : '');
        el.onclick = function () { if (clickHandler) clickHandler(); };
        return el;
    }

    function updateSuggestions() {
        var v = input.value.trim();
        suggestions.innerHTML = '';
        if (!v) {
            // show commands summary
            Object.keys(commands).sort().forEach(function (k) {
                suggestions.appendChild(renderSuggestionItem(k, commands[k].desc, function () { execute(k); }));
            });
            return;
        }
        var parts = v.split(/\s+/);
        var cmdToken = parts[0];
        var args = parts.slice(1);

        // exact alias resolution
        var resolved = resolveCommand(cmdToken);
        if (resolved && args.length === 0 && (resolved === 'theme' || resolved === 'tm')) {
            // if theme command and no args, show theme list
            getAvailableThemes().forEach(function (t) {
                suggestions.appendChild(renderSuggestionItem(t, '主题', function () { input.value = resolved + ' ' + t; execute(resolved, [t]); }));
            });
            return;
        }

        // command name suggestions (prefix match + fuzzy match)
        var exactMatches = Object.keys(commands).sort().filter(function (k) { 
            return k.indexOf(cmdToken) === 0; 
        });
        var fuzzyMatches = Object.keys(commands).sort().filter(function (k) {
            return k.indexOf(cmdToken) !== 0 && fuzzyMatch(cmdToken, k);
        });
        var keys = exactMatches.concat(fuzzyMatches);
        
        // include alias matches
        Object.keys(aliases).forEach(function (a) {
            if (a.indexOf(cmdToken) === 0 || fuzzyMatch(cmdToken, a)) {
                var r = aliases[a]; 
                if (keys.indexOf(r) === -1) keys.push(r);
            }
        });

        keys.forEach(function (k) {
            suggestions.appendChild(renderSuggestionItem(k, commands[k].desc, function () { input.value = k + ' '; input.focus(); updateSuggestions(); }));
        });
    }

    function execute(name, providedArgs) {
        var parts = input.value.trim().split(/\s+/);
        var raw = parts[0];
        var cmdName = resolveCommand(name || raw) || raw;
        var args = providedArgs || parts.slice(1);
        
        // save to history before executing
        saveToHistory(input.value.trim());
        
        if (!commands[cmdName]) {
            clearSuggestions();
            suggestions.appendChild(renderSuggestionItem('未知命令: ' + raw, '', function () { }));
            return;
        }
        try {
            var res = commands[cmdName].handler(args);
            Promise.resolve(res).then(function (r) {
                clearSuggestions();
                if (r && r.type === 'targets' && Array.isArray(r.list)) {
                    r.list.forEach(function (t) { suggestions.appendChild(renderSuggestionItem(t, 'target', function () { input.value = cmdName + ' ' + t; execute(cmdName, [t]); })); });
                    return;
                }
                if (r && r.type === 'help' && Array.isArray(r.list)) {
                    r.list.forEach(function (it) { suggestions.appendChild(renderSuggestionItem(it.name, it.desc)); });
                    return;
                }
                var out = document.createElement('div'); out.className = 'cp-suggestion'; out.textContent = (typeof r === 'string') ? r : JSON.stringify(r);
                suggestions.appendChild(out);
            }).catch(function (e) {
                clearSuggestions();
                var out = document.createElement('div'); out.className = 'cp-suggestion'; out.textContent = '错误: ' + e;
                suggestions.appendChild(out);
            });
        } catch (e) {
            clearSuggestions();
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
        } else if (e.key === 'ArrowUp') {
            // Navigate command history backwards (older commands)
            e.preventDefault();
            var historyCmd = navigateHistory('up');
            if (historyCmd !== null) {
                input.value = historyCmd;
                // move cursor to end
                setTimeout(function() {
                    input.setSelectionRange(input.value.length, input.value.length);
                }, 0);
            }
        } else if (e.key === 'ArrowDown') {
            // Navigate command history forwards (newer commands)
            e.preventDefault();
            var historyCmd = navigateHistory('down');
            if (historyCmd !== null) {
                input.value = historyCmd;
                // move cursor to end
                setTimeout(function() {
                    input.setSelectionRange(input.value.length, input.value.length);
                }, 0);
            }
        } else if (e.key === 'Tab') {
            // Tab autocomplete
            e.preventDefault();
            var val = input.value;
            var before = val.slice(0, input.selectionStart);
            var parts = before.trim().split(/\s+/);
            var prefix = parts[0] || '';
            
            // exact matches first, then fuzzy matches
            var exactMatches = Object.keys(commands).filter(function (k) { return k.indexOf(prefix) === 0; });
            var fuzzyMatches = Object.keys(commands).filter(function (k) { return k.indexOf(prefix) !== 0 && fuzzyMatch(prefix, k); });
            var matches = exactMatches.concat(fuzzyMatches);
            
            // include aliases
            Object.keys(aliases).forEach(function (a) { 
                if ((a.indexOf(prefix) === 0 || fuzzyMatch(prefix, a)) && matches.indexOf(aliases[a]) === -1) {
                    matches.push(aliases[a]); 
                }
            });
            
            if (matches.length === 1) {
                input.value = matches[0] + (val.length > before.length ? val.slice(before.length) : ' ');
                updateSuggestions();
            } else if (matches.length > 1) {
                // show possible completions
                suggestions.innerHTML = '';
                matches.forEach(function (m) { suggestions.appendChild(renderSuggestionItem(m, commands[m].desc, function () { input.value = m + ' '; updateSuggestions(); input.focus(); })); });
            }
        }
    });

    // public API
    window.commandPalette = {
        registerCommand: registerCommand,
        show: show,
        hide: hide,
        listCommands: function () { return Object.keys(commands).sort(); },
        resolveCommand: resolveCommand,
        getHistory: function () { return commandHistory.slice(); }, // get command history
        clearHistory: function () { commandHistory = []; historyIndex = -1; } // clear history
    };

})();
