// Simple Router for Single Page Application
export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;

        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', () => this.resolve());
    }

    on(path, handler) {
        this.routes.set(path, handler);
        return this;
    }

    navigate(path) {
        // Update browser history
        window.history.pushState({}, '', path);

        // Resolve the route
        this.resolve();
    }

    resolve() {
        const path = window.location.pathname;

        // Find matching route
        let handler = this.routes.get(path);

        // If no exact match, try to find a wildcard route
        if (!handler) {
            for (const [routePath, routeHandler] of this.routes) {
                if (this.matchRoute(routePath, path)) {
                    handler = routeHandler;
                    break;
                }
            }
        }

        // If still no match, try default route
        if (!handler) {
            handler = this.routes.get('*') || this.routes.get('/');
        }

        if (handler) {
            this.currentRoute = path;
            handler(this.extractParams(path));
        }
    }

    matchRoute(routePath, actualPath) {
        // Simple pattern matching for routes like /user/:id
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');

        if (routeParts.length !== actualParts.length) {
            return false;
        }

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                // This is a parameter, so any value matches
                continue;
            }

            if (routeParts[i] !== actualParts[i]) {
                return false;
            }
        }
           return true;
    }

    extractParams(path) {
        const params = {};
        const routePath = this.currentRoute;

        if (!routePath) return params;

        const routeParts = routePath.split('/');
        const actualParts = path.split('/');

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = actualParts[i];
            }
        }

        return params;
    }
}