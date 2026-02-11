/**
 * Stellarsis SPA Utilities
 * Helper functions for the SPA
 */

const StellarisUtils = {
    // HTML escape
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    // Decode HTML entities
    decodeHtmlEntities(str) {
        if (!str) return '';
        const txt = document.createElement('textarea');
        let prev = null;
        let current = str;
        let iterations = 0;
        const MAX_ITER = 5;
        while (current !== prev && iterations < MAX_ITER) {
            txt.innerHTML = current;
            prev = current;
            current = txt.value;
            iterations++;
        }
        return current;
    },
    
    // Render markdown with LaTeX and code highlighting
    renderContent(content) {
        if (!content) return '';
        
        try {
            // Decode HTML entities first
            const decoded = this.decodeHtmlEntities(content);
            
            // Protect fenced code blocks
            const codeBlocks = [];
            const fencedRe = /```(\w+)?\n([\s\S]*?)```/g;
            const placeholderPrefix = '@@CODEBLOCK_';
            let temp = decoded.replace(fencedRe, (m, lang, code) => {
                const idx = codeBlocks.length;
                codeBlocks.push({ lang: lang || '', code: code });
                return placeholderPrefix + idx + '@@';
            });
            
            // Escape remaining content
            const safe = this.escapeHtml(temp);
            
            // Render markdown
            let html = '';
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                html = marked.parse(safe);
            } else {
                html = safe.replace(/\n/g, '<br>');
            }
            
            // Restore code blocks
            html = html.replace(new RegExp(placeholderPrefix + '(\\d+)@@', 'g'), (m, idx) => {
                const cb = codeBlocks[Number(idx)];
                if (!cb) return '';
                const langClass = cb.lang ? ` class="language-${this.escapeHtml(cb.lang)}"` : '';
                let highlightedCode = this.escapeHtml(cb.code);
                
                // Apply syntax highlighting
                if (typeof hljs !== 'undefined') {
                    try {
                        if (cb.lang && hljs.getLanguage(cb.lang)) {
                            highlightedCode = hljs.highlight(cb.code, { language: cb.lang }).value;
                        } else {
                            highlightedCode = hljs.highlightAuto(cb.code).value;
                        }
                    } catch (e) {
                        // Use escaped code on error
                    }
                }
                
                return `<pre><code${langClass}>${highlightedCode}</code></pre>`;
            });
            
            // Handle quote placeholders
            html = html.replace(/@quote\{(\d+)\}/g, (m, id) => {
                return `<div class="quote-block" data-quote-id="${id}">
                    <div class="quote-header">引用消息 #${id}</div>
                    <div class="quote-content">加载中...</div>
                </div>`;
            });
            
            // Render inline LaTeX: $...$
            html = html.replace(/\$([^\$]+)\$/g, (match, p1) => {
                try {
                    if (typeof katex !== 'undefined') {
                        return katex.renderToString(p1, {
                            throwOnError: false,
                            displayMode: false
                        });
                    }
                } catch (e) {
                    console.warn('KaTeX inline error:', e);
                }
                return `<span class="katex-error">$${this.escapeHtml(p1)}$</span>`;
            });
            
            // Render block LaTeX: $$...$$
            html = html.replace(/\$\$([^\$]+)\$\$/g, (match, p1) => {
                try {
                    if (typeof katex !== 'undefined') {
                        return `<div class="katex-block">${katex.renderToString(p1, {
                            throwOnError: false,
                            displayMode: true
                        })}</div>`;
                    }
                } catch (e) {
                    console.warn('KaTeX block error:', e);
                }
                return `<div class="katex-block katex-error">$$${this.escapeHtml(p1)}$$</div>`;
            });
            
            // Render \(...\) inline LaTeX
            html = html.replace(/\\\((.*?)\\\)/g, (match, p1) => {
                try {
                    if (typeof katex !== 'undefined') {
                        return katex.renderToString(p1, {
                            throwOnError: false,
                            displayMode: false
                        });
                    }
                } catch (e) {}
                return `<span class="katex-error">\\(${this.escapeHtml(p1)}\\)</span>`;
            });
            
            // Render \[...\] block LaTeX
            html = html.replace(/\\\[(.*?)\\\]/g, (match, p1) => {
                try {
                    if (typeof katex !== 'undefined') {
                        return `<div class="katex-block">${katex.renderToString(p1, {
                            throwOnError: false,
                            displayMode: true
                        })}</div>`;
                    }
                } catch (e) {}
                return `<div class="katex-block katex-error">\\[${this.escapeHtml(p1)}\\]</div>`;
            });
            
            return html;
        } catch (e) {
            console.error('Content render error:', e);
            return `<div class="render-error">${this.escapeHtml(content)}</div>`;
        }
    },
    
    // Load quote content
    async loadQuote(quoteId) {
        try {
            const response = await fetch(`/api/chat/message/${quoteId}`);
            const data = await response.json();
            if (data.success && data.message) {
                return data.message;
            }
        } catch (e) {
            console.error('Failed to load quote:', e);
        }
        return null;
    },
    
    // Load quotes in an element and replace the placeholders
    async loadQuotesInElement(element) {
        if (!element) return;
        
        const quoteBlocks = element.querySelectorAll('.quote-block[data-quote-id]');
        for (const block of quoteBlocks) {
            const quoteId = block.getAttribute('data-quote-id');
            if (!quoteId || block.dataset.loaded === 'true') continue;
            
            block.dataset.loaded = 'true';
            const contentEl = block.querySelector('.quote-content');
            
            try {
                const msg = await this.loadQuote(quoteId);
                if (msg && contentEl) {
                    const nickname = msg.nickname || msg.username || '匿名';
                    const preview = (msg.content || '').substring(0, 100);
                    contentEl.innerHTML = `<strong style="color: ${msg.color || 'inherit'}">${this.escapeHtml(nickname)}</strong>: ${this.escapeHtml(preview)}${msg.content && msg.content.length > 100 ? '...' : ''}`;
                } else if (contentEl) {
                    contentEl.textContent = '消息不存在或已删除';
                }
            } catch (e) {
                if (contentEl) {
                    contentEl.textContent = '加载失败';
                }
            }
        }
    },
    
    // Format time for messages
    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    },
    
    // Format date for separators
    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        }
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    },
    
    // Format relative time
    formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        
        return date.toLocaleDateString('zh-CN');
    },
    
    // Get user color with fallback
    getUserColor(color) {
        return color || '#409eff';
    },
    
    // Get user initial for avatar
    getUserInitial(name) {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    },
    
    // Trigger heart rain effect
    triggerHeartRain() {
        if (!StellarisStore.isHeartRainEnabled()) return;
        
        let container = document.querySelector('.heart-rain-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'heart-rain-container';
            document.body.appendChild(container);
        }
        
        const colors = ['#ff6b6b', '#ff8e8e', '#ff5252', '#ff1744', '#f50057'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'heart-rain';
                heart.innerHTML = '<i class="fas fa-heart"></i>';
                
                const startPos = Math.random() * window.innerWidth;
                heart.style.left = startPos + 'px';
                
                const size = 16 + Math.random() * 20;
                heart.style.fontSize = size + 'px';
                
                heart.style.color = colors[Math.floor(Math.random() * colors.length)];
                
                const duration = 2 + Math.random() * 3;
                heart.style.animationDuration = duration + 's';
                
                container.appendChild(heart);
                
                setTimeout(() => {
                    if (heart.parentNode) {
                        heart.parentNode.removeChild(heart);
                    }
                }, duration * 1000);
            }, i * 100);
        }
        
        setTimeout(() => {
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 5000);
    },
    
    // Trigger cake rain effect (birthday)
    triggerCakeRain() {
        if (!StellarisStore.isCakeRainEnabled()) return;
        
        let container = document.querySelector('.cake-rain-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'cake-rain-container';
            document.body.appendChild(container);
        }
        
        const cakes = ['🎂', '🍰', '🎉', '🎊', '🎁'];
        
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const cake = document.createElement('div');
                cake.className = 'cake-rain';
                cake.textContent = cakes[Math.floor(Math.random() * cakes.length)];
                
                const startPos = Math.random() * window.innerWidth;
                cake.style.left = startPos + 'px';
                
                const size = 20 + Math.random() * 24;
                cake.style.fontSize = size + 'px';
                
                const duration = 2 + Math.random() * 3;
                cake.style.animationDuration = duration + 's';
                
                container.appendChild(cake);
                
                setTimeout(() => {
                    if (cake.parentNode) {
                        cake.parentNode.removeChild(cake);
                    }
                }, duration * 1000);
            }, i * 100);
        }
        
        setTimeout(() => {
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 5000);
    },
    
    // Check if message should trigger heart effect
    // Matches specific pattern to avoid false positives
    hasHeartEffect(content) {
        if (!content) return false;
        // Match "2026" as a standalone pattern (not part of dates like 2026-01-01)
        return /(?<!\d)2026(?!\d)/.test(content);
    },
    
    // Check if message should trigger birthday cake effect
    hasBirthdayEffect(content) {
        if (!content) return false;
        return /生日快乐/.test(content);
    },
    
    // Debounce function
    debounce(fn, delay) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    
    // Throttle function
    throttle(fn, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Auto-resize textarea
    autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    },
    
    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    },
    
    // Generate client ID for messages
    generateClientId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    },
    
    // Fetch wrapper that handles SU verification requirement
    async fetchWithSUCheck(url, options = {}) {
        try {
            const response = await fetch(url, options);
            
            // Check for SU verification requirement
            if (response.status === 401) {
                try {
                    const data = await response.json();
                    if (data.require_su) {
                        // Redirect to SU verification page with return URL
                        const currentPath = StellarisRouter.getCurrentPath();
                        StellarisRouter.navigate('/admin/su', { next: currentPath });
                        return null;
                    }
                } catch (e) {
                    // If not JSON or parsing failed, just return the response
                }
            }
            
            return response;
        } catch (error) {
            throw error;
        }
    }
};

// Export for global use
window.StellarisUtils = StellarisUtils;
