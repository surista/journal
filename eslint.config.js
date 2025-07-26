export default [
  {
    files: ["public/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        location: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly",
        FileReader: "readonly",
        CustomEvent: "readonly",
        Event: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        
        // Web APIs
        IntersectionObserver: "readonly",
        ResizeObserver: "readonly",
        MutationObserver: "readonly",
        PerformanceObserver: "readonly",
        performance: "readonly",
        caches: "readonly",
        Image: "readonly",
        Audio: "readonly",
        Notification: "readonly",
        Worker: "readonly",
        ServiceWorker: "readonly",
        Node: "readonly",
        Element: "readonly",
        HTMLElement: "readonly",
        
        // Libraries
        firebase: "readonly",
        YT: "readonly",
        Toastify: "readonly",
        Chart: "readonly",
        Tone: "readonly",
        
        // Custom globals
        clearCacheAndReload: "readonly",
        
        // Service Worker
        self: "readonly",
        clients: "readonly",
        skipWaiting: "readonly"
      }
    },
    rules: {
      // Error prevention
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off", // Allow console for now
      
      // Code quality
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["warn", "smart"],
      
      // ES6+ features
      "arrow-spacing": "warn",
      "no-duplicate-imports": "error",
      
      // Formatting (Prettier will handle most)
      "semi": ["error", "always"],
      "quotes": ["warn", "single", { "allowTemplateLiterals": true }],
      
      // Async best practices
      "no-async-promise-executor": "error",
      "prefer-promise-reject-errors": "warn"
    }
  },
  {
    ignores: [
      "**/node_modules/**",
      "public/build-info.json",
      "public/styles/bundled.css",
      "**/service-worker.js",
      "**/*.min.js"
    ]
  }
];