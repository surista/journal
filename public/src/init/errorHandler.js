// Global error handler - catches unhandled promise rejections
// Must be loaded early to catch all errors

// Catch all promise rejections as early as possible
window.addEventListener('unhandledrejection', function (event) {
    // Always prevent the default error handling for null rejections
    if (event.reason === null || event.reason === undefined || event.reason === 'null') {
        console.warn('⚠️ Unhandled promise rejection: null (suppressed)');
        event.preventDefault();
        return;
    }

    // Log other unhandled rejections without preventing default
    console.warn('⚠️ Unhandled promise rejection:', event.reason);
});
