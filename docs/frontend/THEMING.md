# Theme System / 主题系统

> **English** | [中文](#中文文档)

## English Documentation

### Overview

Stellarsis features a sophisticated theming system with **6 curated themes**, critical CSS optimization to prevent FOUC (Flash of Unstyled Content), and a design token system with 90+ CSS custom properties. The theme switcher works seamlessly in both traditional MPA and modern SPA modes.

---

### Available Themes

| Theme | Type | Color Palette | Best For |
|-------|------|---------------|----------|
| **Light** | Light | Blue-purple gradient | Default, professional use |
| **Mint** | Light | Fresh mint green | Nature lovers, soft aesthetic |
| **Ocean** | Light | Calm ocean blue | Focus, calm environments |
| **Purple** | Dark | Deep purple nocturne | Night mode, eye comfort |
| **Solarized** | Light | Warm beige tones | Solarized fans, classic look |
| **Sunset** | Warm | Orange-peach gradient | Warm, inviting atmosphere |

---

### Theme Structure

Each theme is defined in `static/css/themes/{theme}.css` and consists of:

1. **CSS Custom Properties (Design Tokens)**
2. **Semantic Color Variables**
3. **Component-Specific Overrides**

#### Example: Light Theme (`light.css`)

```css
:root {
  /* Surface and text */
  --surface-color: #ffffff;
  --text-color: #0f172a;
  
  /* Neutral scale (grays) */
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;
  
  /* Primary color scale (purple) */
  --primary-50: #f5f3ff;
  --primary-100: #ede9fe;
  --primary-200: #ddd6fe;
  --primary-300: #c4b5fd;
  --primary-400: #a78bfa;
  --primary-500: #8b5cf6;
  --primary-600: #7c3aed;
  --primary-700: #6d28d9;
  --primary-800: #5b21b6;
  --primary-900: #4c1d95;
  
  /* Background gradient */
  --background-image: linear-gradient(135deg, #f0f4ff 0%, #e6e9ff 100%);
  
  /* Semantic tokens */
  --primary-color: var(--primary-600);
  --muted-text-color: var(--neutral-600);
  
  /* Component-specific */
  --header-bg: linear-gradient(135deg, var(--overlay-strong), var(--overlay-almost));
  --chat-username-bg: var(--primary-100);
  --profile-title-color: var(--primary-700);
}

body {
  background-image: var(--background-image) !important;
  background-color: var(--neutral-50) !important;
  color: var(--text-color) !important;
}
```

---

### Design Token System

#### Color Scales

**Neutral Scale (Grays)**
- `--neutral-50` to `--neutral-900`
- Lightest (50) to darkest (900)
- Used for text, borders, backgrounds

**Primary Scale**
- `--primary-50` to `--primary-900`
- Brand color scale
- Used for buttons, links, highlights

**Accent Teal Scale**
- `--accent-teal-50` to `--accent-teal-900`
- Secondary color for accents
- Used for success states, highlights

**Status Colors**
- `--success-500`: Green (#10b981)
- `--warning-500`: Orange (#f59e0b)
- `--danger-500`: Red (#ef4444)
- `--info-500`: Blue (#3b82f6)

#### Semantic Tokens

These tokens map to color scales and provide semantic meaning:

```css
/* Surface and foreground */
--surface-color: #ffffff;         /* Card/panel background */
--text-color: #0f172a;            /* Body text */
--muted-text-color: #475569;      /* Secondary text */
--border-color: #e2e8f0;          /* Default borders */

/* On-colors (text on colored backgrounds) */
--on-surface: var(--text-color);  /* Text on surface */
--on-primary: #ffffff;            /* Text on primary color */
--on-danger: #ffffff;             /* Text on danger color */
--on-success: #ffffff;            /* Text on success color */
--on-warning: #0f172a;            /* Text on warning color */

/* Component tokens */
--primary-color: var(--primary-600);
--primary-dark: var(--primary-700);
--btn-primary: var(--primary-600);
--btn-danger: var(--danger-500);

/* Gradients */
--background-image: linear-gradient(...);
--header-bg: linear-gradient(...);
--site-logo-text-gradient: linear-gradient(...);
--settings-accent-gradient: linear-gradient(...);
```

#### Spacing

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 2.5rem;   /* 40px */
--spacing-3xl: 3rem;     /* 48px */
```

#### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;
```

#### Typography

```css
/* Font families */
--font-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...;
--font-mono: 'SFMono-Regular', Menlo, Monaco, Consolas, ...;

/* Font sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Transitions

```css
--transition-fast: 0.15s;
--transition-base: 0.25s;
--transition-slow: 0.35s;
```

---

### Theme Switcher Implementation

#### Critical CSS Optimization

To prevent FOUC (Flash of Unstyled Content), critical CSS is inlined in the `<head>` before HTML renders:

**In theme-switcher.js:**

```javascript
var critical = {
    light: {
        '--surface-color': '#ffffff',
        '--text-color': '#0f172a',
        '--background-image': 'linear-gradient(135deg,#f0f4ff 0%,#e6e9ff 100%)'
    },
    purple: {
        '--surface-color': '#1a0f3a',
        '--text-color': '#efe6ff',
        '--background-image': 'linear-gradient(135deg,#120427 0%,#2b0f4a 100%)'
    },
    // ... other themes
};
```

**Critical CSS is applied immediately:**

```javascript
function applyCritical(theme) {
    if (!theme || !critical[theme]) return;
    var vars = critical[theme];
    Object.keys(vars).forEach(function (k) {
        document.documentElement.style.setProperty(k, vars[k]);
    });
}
```

**Full theme CSS is lazy-loaded:**

```javascript
function ensureFullLink(theme) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'theme-full-css';
    link.href = '/static/css/themes/' + theme + '.css';
    document.head.appendChild(link);
}
```

#### Loading Sequence

```
1. Page load starts
2. Critical CSS applies inline (from localStorage/cookie)
   → Prevents white flash
3. HTML renders with correct colors
4. Full theme CSS loads asynchronously
5. All theme variables available
```

#### Theme Persistence

Themes are stored in **two places** for reliability:

1. **localStorage** (primary):
   ```javascript
   localStorage.setItem('theme', 'ocean');
   ```

2. **Cookie** (fallback for environments where localStorage is unavailable):
   ```javascript
   document.cookie = 'theme=ocean; expires=...; path=/';
   ```

**Retrieval order:**
1. Try localStorage
2. Fall back to cookie
3. Default to 'light'

---

### Using Themes

#### Switch Theme Programmatically

```javascript
// Set theme
window.setTheme('ocean');

// Get current theme
const currentTheme = window.getCurrentTheme();

// Available themes
const themes = window.availableThemes;
// ['light', 'mint', 'ocean', 'purple', 'solarized', 'sunset']
```

#### Listen to Theme Changes

```javascript
window.addEventListener('themeChanged', (event) => {
    console.log('Theme changed to:', event.detail.theme);
    
    // Update UI accordingly
    updateThemeIndicator(event.detail.theme);
});
```

#### Theme Selector UI

**HTML:**
```html
<select id="theme-selector">
    <option value="light">Light</option>
    <option value="mint">Mint</option>
    <option value="ocean">Ocean</option>
    <option value="purple">Purple (Dark)</option>
    <option value="solarized">Solarized</option>
    <option value="sunset">Sunset</option>
</select>
```

**JavaScript:**
```javascript
const selector = document.getElementById('theme-selector');

// Set initial value
selector.value = window.getCurrentTheme();

// Handle changes
selector.addEventListener('change', (e) => {
    window.setTheme(e.target.value);
});
```

---

### Creating Custom Themes

#### Step 1: Create Theme CSS File

Create `static/css/themes/mytheme.css`:

```css
/* My Custom Theme */
:root {
  /* Core colors */
  --surface-color: #f5f5f5;
  --text-color: #1a1a1a;
  
  /* Neutral scale */
  --neutral-50: #fafafa;
  --neutral-100: #f5f5f5;
  --neutral-200: #e5e5e5;
  --neutral-300: #d4d4d4;
  --neutral-400: #a3a3a3;
  --neutral-500: #737373;
  --neutral-600: #525252;
  --neutral-700: #404040;
  --neutral-800: #262626;
  --neutral-900: #171717;
  
  /* Primary scale (your brand color) */
  --primary-50: #fef2f2;
  --primary-100: #fee2e2;
  --primary-200: #fecaca;
  --primary-300: #fca5a5;
  --primary-400: #f87171;
  --primary-500: #ef4444;  /* Main brand color */
  --primary-600: #dc2626;
  --primary-700: #b91c1c;
  --primary-800: #991b1b;
  --primary-900: #7f1d1d;
  
  /* Background gradient */
  --background-image: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  
  /* Semantic tokens */
  --primary-color: var(--primary-600);
  --muted-text-color: var(--neutral-600);
  --border-color: var(--neutral-200);
  
  /* Component-specific tokens */
  --header-bg: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95));
  --header-border-color: rgba(220,38,38,0.1);
  --chat-username-bg: var(--primary-100);
  --profile-title-color: var(--primary-700);
}

body {
  background-image: var(--background-image) !important;
  background-color: var(--neutral-50) !important;
  color: var(--text-color) !important;
}
```

#### Step 2: Add Critical CSS Variables

In `static/js/theme-switcher.js`, add critical variables:

```javascript
var critical = {
    // ... existing themes
    mytheme: {
        '--surface-color': '#f5f5f5',
        '--text-color': '#1a1a1a',
        '--background-image': 'linear-gradient(135deg,#fff5f5 0%,#ffe5e5 100%)'
    }
};
```

#### Step 3: Register Theme

Add to available themes list:

```javascript
window.availableThemes = [
    'light',
    'mint',
    'ocean',
    'purple',
    'solarized',
    'sunset',
    'mytheme'  // Add your theme
];
```

#### Step 4: Update UI

Add theme option to selectors:

```html
<option value="mytheme">My Theme</option>
```

#### Step 5: Test

```javascript
window.setTheme('mytheme');
```

---

### Theme Guidelines

#### Color Contrast

Ensure sufficient contrast for accessibility:
- **Normal text**: 4.5:1 minimum
- **Large text (18px+)**: 3:1 minimum
- **UI components**: 3:1 minimum

Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### Dark Theme Considerations

For dark themes (like Purple):

1. **Reduce pure white**: Use soft whites (`#efe6ff` instead of `#ffffff`)
2. **Lower brightness**: Avoid harsh contrasts
3. **Adjust overlay opacity**: Dark themes need different overlay values
4. **Invert shadows**: Use lighter shadows for elevation
5. **Test in low light**: Ensure comfortable viewing

**Example dark theme adjustments:**

```css
/* Dark theme specific */
:root {
  /* Soft white instead of pure white */
  --text-color: #efe6ff;
  
  /* Dark overlays */
  --overlay-strong: rgba(0,0,0,0.6);
  --overlay-medium: rgba(0,0,0,0.28);
  
  /* Light borders */
  --card-border-color: rgba(255,255,255,0.05);
  
  /* Light shadows */
  --card-shadow: 0 6px 18px rgba(0,0,0,0.5);
}
```

#### Semantic Color Usage

Follow these conventions:

- **Primary**: Brand actions (buttons, links, highlights)
- **Success**: Positive actions (save, confirm, success messages)
- **Warning**: Caution states (warnings, alerts requiring attention)
- **Danger**: Destructive actions (delete, errors)
- **Info**: Informational messages (tips, neutral alerts)

#### Gradient Usage

Gradients should be subtle for backgrounds, bold for accents:

```css
/* Subtle background gradient */
--background-image: linear-gradient(135deg, #f0f4ff 0%, #e6e9ff 100%);

/* Bold accent gradient */
--site-logo-text-gradient: linear-gradient(135deg, #7c3aed, #a78bfa);
```

---

### Theme-Aware Components

Components should use semantic tokens instead of hard-coded colors:

**❌ Bad (hard-coded colors):**
```css
.button {
    background: #7c3aed;
    color: #ffffff;
}
```

**✅ Good (semantic tokens):**
```css
.button {
    background: var(--primary-color);
    color: var(--on-primary);
}
```

**✅ Better (scale-based for hover states):**
```css
.button {
    background: var(--primary-600);
    color: var(--on-primary);
}

.button:hover {
    background: var(--primary-700);
}

.button:active {
    background: var(--primary-800);
}
```

---

### Theme File Organization

```
static/css/
├── main.css              # Base styles + default design tokens
├── themes/               # Theme-specific overrides
│   ├── light.css        # Light theme
│   ├── mint.css         # Mint theme
│   ├── ocean.css        # Ocean theme
│   ├── purple.css       # Purple dark theme
│   ├── solarized.css    # Solarized theme
│   └── sunset.css       # Sunset theme
└── *.css                # Component styles (use tokens)
```

**Loading order:**
1. `main.css` (base tokens + styles)
2. Selected theme CSS (overrides tokens)
3. Component CSS (uses tokens)

---

### Performance Considerations

#### Critical CSS Benefits

- **No FOUC**: Page renders with correct colors immediately
- **Faster perceived load**: User sees styled content sooner
- **No blocking**: Full CSS loads asynchronously

#### Optimization Tips

1. **Keep critical CSS minimal**: Only essential variables (3-5 per theme)
2. **Use CSS custom properties**: Single source of truth
3. **Lazy load full theme**: Don't block rendering
4. **Cache themes**: Browser caches theme CSS files

#### Metrics

- **Critical CSS size**: ~500 bytes per theme (inline)
- **Full theme CSS size**: ~3-6 KB per theme (cached)
- **Theme switch time**: ~120ms (reload delay)

---

## 中文文档

### 概览

Stellarsis 拥有精心设计的主题系统，包含 **6 个精选主题**、关键 CSS 优化以防止 FOUC（无样式内容闪烁），以及包含 90 多个 CSS 自定义属性的设计令牌系统。主题切换器在传统 MPA 和现代 SPA 模式下都能无缝工作。

---

### 可用主题

| 主题 | 类型 | 配色 | 适用场景 |
|------|------|------|----------|
| **Light** | 浅色 | 蓝紫色渐变 | 默认，专业使用 |
| **Mint** | 浅色 | 清新薄荷绿 | 自然爱好者，柔和美学 |
| **Ocean** | 浅色 | 平静海洋蓝 | 专注，平静环境 |
| **Purple** | 深色 | 深紫色夜曲 | 夜间模式，护眼 |
| **Solarized** | 浅色 | 温暖米色调 | Solarized 粉丝，经典外观 |
| **Sunset** | 暖色 | 橙桃色渐变 | 温暖，友好氛围 |

---

### 主题结构

每个主题都在 `static/css/themes/{theme}.css` 中定义，包含：

1. **CSS 自定义属性（设计令牌）**
2. **语义色彩变量**
3. **组件特定覆盖**

---

### 设计令牌系统

#### 颜色比例

**中性比例（灰色）**
- `--neutral-50` 到 `--neutral-900`
- 最浅（50）到最深（900）
- 用于文本、边框、背景

**主色比例**
- `--primary-50` 到 `--primary-900`
- 品牌色比例
- 用于按钮、链接、高亮

**青绿色强调比例**
- `--accent-teal-50` 到 `--accent-teal-900`
- 辅助色用于强调
- 用于成功状态、高亮

**状态颜色**
- `--success-500`: 绿色 (#10b981)
- `--warning-500`: 橙色 (#f59e0b)
- `--danger-500`: 红色 (#ef4444)
- `--info-500`: 蓝色 (#3b82f6)

---

### 使用主题

#### 编程方式切换主题

```javascript
// 设置主题
window.setTheme('ocean');

// 获取当前主题
const currentTheme = window.getCurrentTheme();

// 可用主题
const themes = window.availableThemes;
// ['light', 'mint', 'ocean', 'purple', 'solarized', 'sunset']
```

#### 监听主题更改

```javascript
window.addEventListener('themeChanged', (event) => {
    console.log('主题已更改为:', event.detail.theme);
    
    // 相应地更新 UI
    updateThemeIndicator(event.detail.theme);
});
```

---

### 创建自定义主题

#### 步骤 1：创建主题 CSS 文件

创建 `static/css/themes/mytheme.css`：

```css
/* 我的自定义主题 */
:root {
  /* 核心颜色 */
  --surface-color: #f5f5f5;
  --text-color: #1a1a1a;
  
  /* 中性比例 */
  --neutral-50: #fafafa;
  /* ... */
  
  /* 主色比例（你的品牌色） */
  --primary-500: #ef4444;  /* 主品牌色 */
  /* ... */
  
  /* 背景渐变 */
  --background-image: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
}
```

#### 步骤 2：添加关键 CSS 变量

在 `static/js/theme-switcher.js` 中添加关键变量：

```javascript
var critical = {
    // ... 现有主题
    mytheme: {
        '--surface-color': '#f5f5f5',
        '--text-color': '#1a1a1a',
        '--background-image': 'linear-gradient(135deg,#fff5f5 0%,#ffe5e5 100%)'
    }
};
```

#### 步骤 3：注册主题

添加到可用主题列表：

```javascript
window.availableThemes = [
    'light', 'mint', 'ocean', 'purple', 'solarized', 'sunset',
    'mytheme'  // 添加你的主题
];
```

---

### 主题指南

#### 颜色对比度

确保足够的对比度以实现无障碍访问：
- **普通文本**：最小 4.5:1
- **大文本（18px+）**：最小 3:1
- **UI 组件**：最小 3:1

#### 深色主题注意事项

对于深色主题（如 Purple）：

1. **减少纯白色**：使用柔和的白色（`#efe6ff` 而不是 `#ffffff`）
2. **降低亮度**：避免刺眼的对比
3. **调整叠加层不透明度**：深色主题需要不同的叠加值
4. **反转阴影**：使用较浅的阴影以提升层次
5. **在低光下测试**：确保舒适的观看体验

---

### 主题感知组件

组件应使用语义令牌而不是硬编码颜色：

**❌ 不好（硬编码颜色）：**
```css
.button {
    background: #7c3aed;
    color: #ffffff;
}
```

**✅ 好（语义令牌）：**
```css
.button {
    background: var(--primary-color);
    color: var(--on-primary);
}
```

---

### 性能考虑

#### 关键 CSS 的好处

- **无 FOUC**：页面立即以正确的颜色渲染
- **更快的感知加载**：用户更快看到样式化的内容
- **无阻塞**：完整的 CSS 异步加载

---

## Related Documentation / 相关文档

- [Architecture Overview / 架构概览](./ARCHITECTURE.md)
- [Components Guide / 组件指南](./COMPONENTS.md)
- [Command Palette / 命令面板](./COMMAND_PALETTE.md)
