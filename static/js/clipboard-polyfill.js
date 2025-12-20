// clipboard-polyfill implementation
// Simplified version focusing on writeText functionality

var clipboardPolyfill = (function () {
    "use strict";

    function supportsModernClipboardAPI() {
        return (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function" &&
            window.isSecureContext
        );
    }

    function writeText(text) {
        if (supportsModernClipboardAPI()) {
            return navigator.clipboard.writeText(text);
        } else {
            return legacyCopyText(text);
        }
    }

    function legacyCopyText(text) {
        // Create a temporary textarea element
        var textArea = document.createElement("textarea");
        textArea.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 1px;
            height: 1px;
            padding: 0;
            border: none;
            outline: none;
            boxShadow: none;
            background: transparent;
        `;
        textArea.value = text;

        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            var successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                return Promise.resolve();
            } else {
                return Promise.reject(new Error("Unable to copy text to clipboard"));
            }
        } catch (err) {
            document.body.removeChild(textArea);
            return Promise.reject(new Error("Unable to copy text to clipboard"));
        }
    }

    return {
        writeText: writeText,
        // Additional methods could be added here if needed
    };
})();