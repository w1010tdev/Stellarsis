#!/bin/bash
# Script to download frontend library dependencies to local static/vendor directories
# Run this script to cache CDN resources locally for better performance and offline support

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📦 Downloading frontend libraries..."
echo ""

# Create vendor directories
mkdir -p static/js/vendor
mkdir -p static/css/vendor
mkdir -p static/css/vendor/webfonts

# Function to download with progress
download_file() {
    local url="$1"
    local output="$2"
    local name="$3"
    
    echo "  Downloading $name..."
    if command -v curl &> /dev/null; then
        curl -sL "$url" -o "$output"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$output"
    else
        echo "  ✗ Error: Neither curl nor wget is available"
        return 1
    fi
    
    if [ -f "$output" ]; then
        local size=$(du -h "$output" | cut -f1)
        echo "    ✓ Downloaded ($size)"
    else
        echo "    ✗ Failed to download"
        return 1
    fi
}

# Download JavaScript libraries
echo "📜 JavaScript Libraries:"
download_file "https://unpkg.com/vue@3.4.38/dist/vue.global.prod.js" \
    "static/js/vendor/vue.global.prod.js" "Vue 3.4.38"
    
download_file "https://unpkg.com/element-plus@2.9.1/dist/index.full.min.js" \
    "static/js/vendor/element-plus.min.js" "Element Plus 2.9.1"
    
download_file "https://unpkg.com/@element-plus/icons-vue@2.3.1/dist/index.iife.min.js" \
    "static/js/vendor/element-plus-icons.min.js" "Element Plus Icons 2.3.1"
    
download_file "https://cdn.jsdelivr.net/npm/marked@4.0.0/marked.min.js" \
    "static/js/vendor/marked.min.js" "Marked.js 4.0.0"
    
download_file "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js" \
    "static/js/vendor/katex.min.js" "KaTeX 0.16.4"
    
download_file "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" \
    "static/js/vendor/highlight.min.js" "Highlight.js 11.9.0"

echo ""
echo "🎨 CSS Libraries:"
download_file "https://unpkg.com/element-plus@2.9.1/dist/index.css" \
    "static/css/vendor/element-plus.css" "Element Plus CSS"
    
download_file "https://unpkg.com/element-plus@2.9.1/theme-chalk/dark/css-vars.css" \
    "static/css/vendor/element-plus-dark.css" "Element Plus Dark Mode"
    
download_file "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" \
    "static/css/vendor/font-awesome.min.css" "Font Awesome 6.5.1"
    
download_file "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css" \
    "static/css/vendor/katex.min.css" "KaTeX CSS"
    
download_file "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" \
    "static/css/vendor/highlight-github.min.css" "Highlight.js Light Theme"
    
download_file "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" \
    "static/css/vendor/highlight-github-dark.min.css" "Highlight.js Dark Theme"

echo ""
echo "🔤 Web Fonts:"
download_file "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2" \
    "static/css/vendor/webfonts/fa-solid-900.woff2" "Font Awesome Solid"
    
download_file "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.woff2" \
    "static/css/vendor/webfonts/fa-regular-400.woff2" "Font Awesome Regular"
    
download_file "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.woff2" \
    "static/css/vendor/webfonts/fa-brands-400.woff2" "Font Awesome Brands"

echo ""
echo "✅ All frontend libraries downloaded successfully!"
echo ""
echo "📊 Total size:"
du -sh static/js/vendor static/css/vendor
echo ""
echo "💡 Note: These files are cached locally. The application will use them"
echo "   instead of loading from CDN, improving performance and enabling offline use."
