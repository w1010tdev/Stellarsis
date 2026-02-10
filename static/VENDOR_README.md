# Frontend Vendor Libraries / 前端依赖库

This directory contains cached versions of frontend libraries that are loaded from CDN by default.

本目录包含前端库的缓存版本，默认从 CDN 加载。

## Quick Setup / 快速设置

Run the download script from the project root:

从项目根目录运行下载脚本：

```bash
./download_vendor_libs.sh
```

## Benefits / 优势

- **Faster loading** / 更快的加载速度: Libraries load from local server instead of CDN
- **Offline support** / 离线支持: Application works without internet connection  
- **Better privacy** / 更好的隐私: No third-party CDN requests
- **Reliability** / 可靠性: No dependency on external CDN availability

## Libraries Included / 包含的库

### JavaScript

- **Vue 3.4.38** - Progressive JavaScript framework
- **Element Plus 2.9.1** - Vue 3 UI library
- **Element Plus Icons 2.3.1** - Icon components
- **Marked.js 4.0.0** - Markdown parser
- **KaTeX 0.16.4** - Math typesetting
- **Highlight.js 11.9.0** - Syntax highlighting
- **Socket.IO** (already included) - Real-time communication

### CSS

- **Element Plus** - Main stylesheet
- **Element Plus Dark** - Dark mode variables
- **Font Awesome 6.5.1** - Icon fonts
- **KaTeX** - Math rendering styles
- **Highlight.js** - Code syntax themes (light & dark)

## Fallback Behavior / 回退行为

If vendor files are not present, the application automatically falls back to loading from CDN.

如果本地文件不存在，应用会自动回退到从 CDN 加载。

## File Structure / 文件结构

```
static/
├── css/vendor/
│   ├── element-plus.css
│   ├── element-plus-dark.css
│   ├── font-awesome.min.css
│   ├── katex.min.css
│   ├── highlight-github.min.css
│   ├── highlight-github-dark.min.css
│   └── webfonts/
│       ├── fa-solid-900.woff2
│       ├── fa-regular-400.woff2
│       └── fa-brands-400.woff2
└── js/vendor/
    ├── vue.global.prod.js
    ├── element-plus.min.js
    ├── element-plus-icons.min.js
    ├── marked.min.js
    ├── katex.min.js
    ├── highlight.min.js
    └── socket.io.min.js (already included)
```

## Updates / 更新

To update libraries to newer versions:

更新库到新版本：

1. Edit `download_vendor_libs.sh` with new version numbers
2. Run the script again
3. Test the application

## Total Size / 总大小

Approximately ~5-10 MB total when all libraries are downloaded.

下载所有库后总计约 5-10 MB。
