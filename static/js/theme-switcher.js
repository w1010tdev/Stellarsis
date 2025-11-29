// Theme switcher: expose setTheme(theme) and getCurrentTheme()
(function () {
    var themeBase = window.themeBasePath || (function () {
        // try to detect base path from any existing theme link
        var links = document.querySelectorAll('link[href*="/css/themes/"]');
        if (links.length) return links[0].href.replace(/[^/]+$/, '');
        // default fallback
        return '/static/css/themes/';
    })();

    var critical = {
        light: {
            '--surface-color': '#ffffff',
            '--text-color': '#0f172a',
            '--neutral-50': '#f8fafc',
            '--background-image': 'linear-gradient(135deg,#f0f4ff 0%,#e6e9ff 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(250,252,255,0.98))',
            '--header-border-color': 'rgba(224,231,255,0.4)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,255,0.82))',
            '--settings-sidebar-border': 'rgba(99,102,241,0.06)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(139,92,246,0.08)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(139,92,246,0.08), rgba(37,99,235,0.03))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(99,102,241,0.12)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(241,245,249,0.9))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.08)'
        },
        dark: {
            '--surface-color': '#0b1220',
            '--text-color': '#e6eef8',
            '--neutral-50': '#071029',
            '--background-image': 'linear-gradient(135deg,#071029 0%,#0b1220 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(7,16,41,0.92), rgba(11,18,32,0.96))',
            '--header-border-color': 'rgba(10,18,30,0.5)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(8,10,20,0.85), rgba(10,14,22,0.9))',
            '--settings-sidebar-border': 'rgba(30,36,55,0.12)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(0,0,0,0.28)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(139,92,246,0.04), rgba(37,99,235,0.02))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(0,0,0,0.32)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(7,16,41,0.95), rgba(11,18,32,0.95))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.5)'
        },
        solarized: {
            '--surface-color': '#fdf6e3',
            '--text-color': '#073642',
            '--neutral-50': '#fdf6e3',
            '--background-image': 'linear-gradient(135deg,#fff8e6 0%,#f6ecd0 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(255,248,230,0.95), rgba(246,236,208,0.98))',
            '--header-border-color': 'rgba(230,220,200,0.4)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(255,248,230,0.95), rgba(250,244,230,0.9))',
            '--settings-sidebar-border': 'rgba(200,180,150,0.06)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(150,120,60,0.06)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(200,150,60,0.06), rgba(220,180,80,0.03))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(200,160,60,0.12)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(255,248,230,0.95), rgba(250,244,230,0.9))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.06)'
        },
        purple: {
            '--surface-color': '#0f0826',
            '--text-color': '#efe6ff',
            '--neutral-50': '#0b0716',
            '--background-image': 'linear-gradient(135deg,#120427 0%,#2b0f4a 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(18,4,39,0.92), rgba(43,15,74,0.96))',
            '--header-border-color': 'rgba(40,20,60,0.5)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(12,6,30,0.88), rgba(30,12,50,0.9))',
            '--settings-sidebar-border': 'rgba(60,40,100,0.08)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(80,40,160,0.08)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(139,92,246,0.04), rgba(37,99,235,0.02))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(40,20,80,0.2)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(18,4,39,0.95), rgba(43,15,74,0.95))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.5)'
        },
        ocean: {
            '--surface-color': '#e9f6ff',
            '--text-color': '#022c43',
            '--neutral-50': '#e9f6ff',
            '--background-image': 'linear-gradient(135deg,#e9f6ff 0%,#d0eefc 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(233,246,255,0.95), rgba(208,238,252,0.98))',
            '--header-border-color': 'rgba(200,230,245,0.4)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(233,246,255,0.95), rgba(220,242,252,0.9))',
            '--settings-sidebar-border': 'rgba(160,200,220,0.06)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(20,120,160,0.06)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(14,165,233,0.06), rgba(6,120,180,0.03))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(6,120,180,0.12)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(233,246,255,0.95), rgba(208,238,252,0.9))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.06)'
        },
        mint: {
            '--surface-color': '#f0fff6',
            '--text-color': '#093120',
            '--neutral-50': '#f0fff6',
            '--background-image': 'linear-gradient(135deg,#f0fff6 0%,#e6fff0 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(240,255,246,0.95), rgba(230,255,240,0.98))',
            '--header-border-color': 'rgba(210,245,230,0.4)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(240,255,246,0.95), rgba(230,255,240,0.9))',
            '--settings-sidebar-border': 'rgba(160,220,200,0.06)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(20,80,60,0.06)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(52,211,153,0.06), rgba(16,185,129,0.03))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(20,120,80,0.12)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(240,255,246,0.95), rgba(230,255,240,0.9))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.06)'
        },
        sunset: {
            '--surface-color': '#fff5f0',
            '--text-color': '#402218',
            '--neutral-50': '#fff5f0',
            '--background-image': 'linear-gradient(135deg,#fff5f0 0%,#ffe8d5 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(255,245,240,0.95), rgba(255,232,213,0.98))',
            '--header-border-color': 'rgba(255,220,200,0.4)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(255,245,240,0.95), rgba(255,240,230,0.9))',
            '--settings-sidebar-border': 'rgba(220,180,150,0.06)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(240,120,120,0.06)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(251,113,133,0.06), rgba(251,90,88,0.03))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(240,160,120,0.12)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(255,245,240,0.95), rgba(255,232,213,0.9))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.06)'
        },
        slate: {
            '--surface-color': '#f6f8fa',
            '--text-color': '#0b1220',
            '--neutral-50': '#f6f8fa',
            '--background-image': 'linear-gradient(135deg,#f6f8fa 0%,#eef2f6 100%)',
            '--header-bg': 'linear-gradient(135deg, rgba(246,248,250,0.95), rgba(238,242,246,0.98))',
            '--header-border-color': 'rgba(230,235,240,0.4)',
            '--site-logo-text-gradient': 'linear-gradient(135deg, var(--primary-color), var(--accent-start))',
            '--site-logo-icon-bg': 'linear-gradient(135deg, var(--primary-color), var(--accent-end))',
            '--avatar-bg': 'linear-gradient(135deg, var(--primary-500), var(--primary-400))',
            '--nav-underline-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-sidebar-bg': 'linear-gradient(180deg, rgba(246,248,250,0.95), rgba(238,242,246,0.9))',
            '--settings-sidebar-border': 'rgba(200,210,220,0.06)',
            '--settings-accent-gradient': 'linear-gradient(180deg, var(--primary-400), var(--primary-700))',
            '--settings-accent-shadow': 'rgba(100,110,120,0.06)',
            '--settings-hover-gradient': 'linear-gradient(90deg, rgba(100,110,120,0.06), rgba(140,150,160,0.03))',
            '--settings-active-gradient': 'linear-gradient(90deg, var(--primary-color), var(--accent-start))',
            '--settings-active-shadow': 'rgba(120,130,140,0.12)',
            '--mobile-nav-bg': 'linear-gradient(135deg, rgba(246,248,250,0.95), rgba(238,242,246,0.9))',
            '--mobile-nav-shadow': 'rgba(0,0,0,0.06)'
        }
    };

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
        document.head.appendChild(link);
        return link;
    }

    window.setTheme = function (theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) { }
        setCookie('theme', theme, 365);
        applyCritical(theme);
        ensureFullLink(theme);
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
