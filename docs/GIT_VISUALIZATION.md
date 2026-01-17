# Git Commit Visualization Setup

## Overview
The git commit visualization on the homepage uses [@gitgraph/js](https://gitgraphjs.com/) to render a VSCode-style commit history tree.

## Setup Instructions

### Option 1: Using CDN (Default)
The current implementation uses a CDN link:
```html
<script src="https://cdn.jsdelivr.net/npm/@gitgraph/js@1.8.0/lib/gitgraph.umd.js"></script>
```

This will work automatically if your deployment environment has internet access.

### Option 2: Local Installation (Recommended for Production)
For production environments or when CDN access is restricted:

1. Download the library:
   ```bash
   curl -o static/js/vendor/gitgraph.umd.js https://cdn.jsdelivr.net/npm/@gitgraph/js@1.8.0/lib/gitgraph.umd.js
   ```

2. Update the script tag in `templates/index.html`:
   ```html
   <script src="{{ url_for('static', filename='js/vendor/gitgraph.umd.js') }}"></script>
   ```

### Fallback Behavior
If the @gitgraph/js library fails to load, the application automatically falls back to a simplified commit list view with:
- Vertical timeline with dots
- Commit hash, message, author, and date
- VSCode-inspired styling

## Features
- **VSCode-style visualization**: Similar to VS Code's git graph extension
- **Dark mode support**: Automatically adjusts colors based on theme
- **Responsive design**: Adapts to container size
- **Error handling**: Graceful fallback if library fails to load
- **GitHub API integration**: Fetches real commit data from the repository

## Configuration
The git graph can be customized in `templates/index.html`:

- **Colors**: Modify the `colors` array in the template configuration
- **Commit spacing**: Adjust `spacing` property in commit configuration
- **Orientation**: Change `orientation` to 'horizontal' or 'vertical'
- **Number of commits**: Change `slice(0, 10)` to show more/fewer commits

## Testing
To test the visualization locally:
1. Start the Flask application: `python3 app.py`
2. Navigate to the homepage
3. Check browser console for any loading errors
4. The git graph should appear in the "Change Log" section
