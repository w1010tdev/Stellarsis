// Theme switcher: expose setTheme(theme) and getCurrentTheme()
(function () {
    // Detect base path for theme files; fallback to static path
    var themeBase = window.themeBasePath || (function () {
        var links = document.querySelectorAll('link[href*="/css/themes/"]');
        if (links.length) return links[0].href.replace(/[^/]+$/, '');
        return '/static/css/themes/';
    })();

    // Curated minimal critical variables for allowed themes
    var critical = {
        light: {
            '--surface-color': '#ffffff',
            '--text-color': '#0f172a',
            '--background-image': 'linear-gradient(135deg,#f0f4ff 0%,#e6e9ff 100%)'
        },
        mint: {
            '--surface-color': '#f0fff6',
            '--text-color': '#093120',
            '--background-image': 'linear-gradient(135deg,#f0fff6 0%,#e6fff0 100%)'
        },
        ocean: {
            '--surface-color': '#e9f6ff',
            '--text-color': '#022c43',
            '--background-image': 'linear-gradient(135deg,#e9f6ff 0%,#d0eefc 100%)'
        },
        purple: {
            '--surface-color': '#1a0f3a',
            '--text-color': '#efe6ff',
            '--background-image': 'linear-gradient(135deg,#120427 0%,#2b0f4a 100%)'
        },
        solarized: {
            '--surface-color': '#fdf6e3',
            '--text-color': '#073642',
            '--background-image': 'linear-gradient(135deg,#fff8e6 0%,#f6ecd0 100%)'
        },
        sunset: {
            '--surface-color': '#fff5f0',
            '--text-color': '#402218',
            '--background-image': 'linear-gradient(135deg,#fff5f0 0%,#ffe8d5 100%)'
        }
    };

    // expose the curated theme list
    try { window.availableThemes = ['light','mint','ocean','purple','solarized','sunset']; } catch (e) { }

    function setCookie(name, value, days) {
        try {
            var expires = '';
            if (days) {
                var d = new Date();
                d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + d.toUTCString();
            }
            document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
        } catch (e) { }
    }

    function applyCritical(theme) {
        if (!theme || !critical[theme]) return;
        var vars = critical[theme];
        Object.keys(vars).forEach(function (k) {
            document.documentElement.style.setProperty(k, vars[k]);
        });
    }

    function ensureFullLink(theme) {
        if (!theme) return;
        var id = 'theme-full-css';
        var link = document.getElementById(id);
        var href = themeBase + theme + '.css';
        if (link) {
            if (link.href.indexOf(theme + '.css') === -1) link.href = href;
            return link;
        }
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.id = id;
        link.href = href;
        // avoid blocking load and tolerate 404s; browsers will ignore missing CSS
        document.head.appendChild(link);
        return link;
    }

    window.setTheme = function (theme) {
        try { localStorage.setItem('theme', theme); } catch (e) { }
        setCookie('theme', theme, 365);
        applyCritical(theme);
        ensureFullLink(theme);
        // Fire a theme change event so other UI code can react
        try {
            var ev = new CustomEvent('themeChanged', { detail: { theme: theme } });
            window.dispatchEvent(ev);
        } catch (e) { }
        // Per user request: refresh the page to ensure full-theme assets and CSS variables apply
        try {
            setTimeout(function () { window.location.reload(); }, 120);
        } catch (e) { }
    };

    window.getCurrentTheme = function () {
        try { var t = localStorage.getItem('theme'); if (t) return t; } catch (e) { }
        var m = document.cookie.match(new RegExp('(^| )theme=([^;]+)'));
        if (m) return decodeURIComponent(m[2]);
        return null;
    };

    // On load, if there's a stored theme ensure full CSS is present
    document.addEventListener('DOMContentLoaded', function () {
        var t = window.getCurrentTheme && window.getCurrentTheme();
        if (t) {
            applyCritical(t);
            ensureFullLink(t);
        }
    });
})();
