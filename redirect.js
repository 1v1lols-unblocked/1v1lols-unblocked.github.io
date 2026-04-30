(function() {
    var path = window.location.pathname;
    // Normalize: remove multiple slashes and trailing slashes
    var cleanPath = path.replace(/\/+/g, '/').replace(/\/+$/, '');
    
    // Ensure root is handled correctly
    if (cleanPath === '') cleanPath = '/';
    
    // Remove .html extension for canonical URLs
    if (cleanPath.endsWith('.html')) {
        cleanPath = cleanPath.substring(0, cleanPath.length - 5);
    }
    
    // Handle index specifically to redirect to root
    if (cleanPath === '/index') {
        cleanPath = '/';
    }

    // If the current path is not the clean version, redirect
    // (Ignoring trailing slash check for root itself)
    if (path !== cleanPath && (path !== '/' || cleanPath !== '/')) {
        window.location.replace(window.location.origin + cleanPath + window.location.search);
    }
})();
