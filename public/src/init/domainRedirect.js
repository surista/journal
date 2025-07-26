// Domain redirect script - forces www subdomain
// This runs immediately to redirect before any other resources load
if (location.hostname === 'guitar-practice-journal.com') {
    location.replace(
        'https://www.guitar-practice-journal.com' +
            location.pathname +
            location.search +
            location.hash
    );
}
