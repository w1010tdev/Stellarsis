/**
 * Stellarsis SPA Router
 * A simple hash-based router for SPA navigation
 */

const StellarisRouter = {
    routes: {},
    currentRoute: null,
    beforeEach: null,
    afterEach: null,
    
    // Register a route
    register(path, component) {
        this.routes[path] = component;
        return this;
    },
    
    // Get current path from hash
    getCurrentPath() {
        const hash = window.location.hash.slice(1) || '/';
        return hash.split('?')[0];
    },
    
    // Get query parameters from hash
    getQueryParams() {
        const hash = window.location.hash.slice(1) || '/';
        const queryString = hash.split('?')[1] || '';
        const params = {};
        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            });
        }
        return params;
    },
    
    // Navigate to a route
    navigate(path, params = {}) {
        let fullPath = path;
        if (Object.keys(params).length > 0) {
            const queryString = Object.entries(params)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            fullPath = `${path}?${queryString}`;
        }
        window.location.hash = fullPath;
    },
    
    // Replace current route without adding to history
    replace(path, params = {}) {
        let fullPath = path;
        if (Object.keys(params).length > 0) {
            const queryString = Object.entries(params)
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            fullPath = `${path}?${queryString}`;
        }
        window.location.replace(`#${fullPath}`);
    },
    
    // Match route with dynamic parameters
    matchRoute(path) {
        // First try exact match
        if (this.routes[path]) {
            return { component: this.routes[path], params: {} };
        }
        
        // Try dynamic routes
        for (const routePath in this.routes) {
            const routeParts = routePath.split('/');
            const pathParts = path.split('/');
            
            if (routeParts.length !== pathParts.length) continue;
            
            const params = {};
            let match = true;
            
            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    // Dynamic parameter
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                return { component: this.routes[routePath], params };
            }
        }
        
        return null;
    },
    
    // Get current route info
    getRoute() {
        const path = this.getCurrentPath();
        const matched = this.matchRoute(path);
        const query = this.getQueryParams();
        
        return {
            path,
            query,
            params: matched ? matched.params : {},
            component: matched ? matched.component : null
        };
    },
    
    // Initialize router
    init() {
        // Handle hash change
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
        
        // Handle initial route
        if (!window.location.hash) {
            window.location.hash = '/';
        }
        
        this.handleRouteChange();
    },
    
    // Handle route change
    handleRouteChange() {
        const route = this.getRoute();
        
        // Before each hook
        if (this.beforeEach) {
            const result = this.beforeEach(route, this.currentRoute);
            if (result === false) {
                // Navigation cancelled
                return;
            }
            if (typeof result === 'string') {
                // Redirect
                this.navigate(result);
                return;
            }
        }
        
        this.currentRoute = route;
        
        // Emit route change event
        window.dispatchEvent(new CustomEvent('route-changed', { detail: route }));
        
        // After each hook
        if (this.afterEach) {
            this.afterEach(route);
        }
    }
};

// Navigation function for global use
window.navigateTo = function(path, params) {
    StellarisRouter.navigate(path, params);
};

// Export for use in Vue
window.StellarisRouter = StellarisRouter;
