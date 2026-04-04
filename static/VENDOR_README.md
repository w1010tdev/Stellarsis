# Frontend Vendor Libraries / 前端依赖库

本目录存放前端本地 vendor 资源，用于在网络不稳定或 CDN 不可用时回退加载。

## 当前使用到的库 / Libraries in use

### JavaScript

- Vue 3
- Element Plus
- Element Plus Icons
- Socket.IO Client
- Marked.js
- KaTeX
- Highlight.js

### CSS

- Element Plus
- Element Plus Dark Variables
- KaTeX
- Highlight.js (Light/Dark)

## 加载策略 / Loading strategy

- 页面优先尝试本地 `static/**/vendor` 资源。
- 本地资源缺失时，模板会自动回退到 CDN。

## 说明 / Notes

- 当前错误页中的 Font Awesome 图标使用 CDN，不使用本地 vendor Font Awesome 文件。
