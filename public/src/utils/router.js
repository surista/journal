// Simple Router for Single Page Application - Updated with Config Support
import appConfig from '../config.js';

export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.config = appConfig;

        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', () => this.resolve());
    }

    on(path, handler) {
        this.routes.set(path, handler);
        return this;
    }

    navigate(path) {
        // Ensure path includes base path if it doesn't already
        const fullPath = path.startsWith(this.config.basePath)
            ? path
            : this.config.basePath + path.replace(/^\//, '');

        // Update browser history
        window.history.pushState({}, '', fullPath);

        // Resolve the route
        this.resolve();
    }

    navigateToRoute(routeName, params = {}) {
        // Navigate using route name from config
        const routePath = this.config.getRouteUrl(routeName);

        // Add parameters if any
        const queryString = Object.keys(params).length > 0
            ? '?' + new URLSearchParams(params).toString()
            : '';

        this.navigate(routePath + queryString);
    }

    resolve() {
        const path = window.location.pathname;
        const relativePath = this.getRelativePath(path);

        // Find matching route
        let handler = this.routes.get(path);

        // If no exact match, try relative path
        if (!handler && relativePath !== path) {
            handler = this.routes.get(this.config.basePath + relativePath);
        }

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
            handler = this.routes.get('*') || this.routes.get(this.config.basePath);
        }

        if (handler) {
            this.currentRoute = path;
            const params = this.extractParams(path);
            const query = this.extractQuery();

            handler({
                params,
                query,
                path: relativePath,
                fullPath: path
            });
        } else {
            console.warn(`No route handler found for: ${path}`);
        }
    }

    getRelativePath(fullPath) {
        // Remove base path to get relative path
        if (fullPath.startsWith(this.config.basePath)) {
            return fullPath.slice(this.config.basePath.length);
        }
        return fullPath;
    }

    matchRoute(routePath, actualPath) {
        // Convert paths to relative for comparison
        const relativeRoutePath = this.getRelativePath(routePath);
        const relativeActualPath = this.getRelativePath(actualPath);

        // Simple pattern matching for routes like /user/:id
        const routeParts = relativeRoutePath.split('/').filter(p => p);
        const actualParts = relativeActualPath.split('/').filter(p => p);

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

        const routeParts = this.getRelativePath(routePath).split('/').filter(p => p);
        const actualParts = this.getRelativePath(path).split('/').filter(p => p);

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].substring(1);
                params[paramName] = actualParts[i];
            }
        }

        return params;
    }

    extractQuery() {
        const query = {};
        const queryString = window.location.search;

        if (queryString) {
            const urlParams = new URLSearchParams(queryString);
            for (const [key, value] of urlParams) {
                query[key] = value;
            }
        }

        return query;
    }

    getCurrentRoute() {
        return {
            path: this.currentRoute,
            relativePath: this.getRelativePath(this.currentRoute),
            params: this.extractParams(this.currentRoute),
            query: this.extractQuery()
        };
    }

    // Helper method to generate URL with base path
    generateUrl(path, params = {}) {
        const fullPath = path.startsWith(this.config.basePath)
            ? path
            : this.config.basePath + path.replace(/^\//, '');

        const queryString = Object.keys(params).length > 0
            ? '?' + new URLSearchParams(params).toString()
            : '';

        return fullPath + queryString;
    }

    // Check if current route matches
    isCurrentRoute(routeName) {
        const routePath = this.config.getRouteUrl(routeName);
        return this.currentRoute === routePath;
    }
}