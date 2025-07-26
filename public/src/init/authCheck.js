// Auth check script - redirects to login if not authenticated
// This runs immediately to prevent unauthorized access

(function () {
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath === '/' || currentPath === '/index.html';
    const hasUser = localStorage.getItem('currentUser');

    if (isIndexPage && !hasUser) {
        // console.log('No user found, redirecting to login page');
        window.location.replace('./login.html');
    }
})();
