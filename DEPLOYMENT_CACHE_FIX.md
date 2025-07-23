# Fixing Cache Issues After Deployment

## Problem
The old practice recommendations are still showing after deployment due to aggressive service worker caching.

## Solution Applied
1. **Version bumped to 10.68** - This forces the service worker to update
2. **Added cache-busting query parameter** to the new component import
3. **Added new component to service worker cache list**

## Steps to Clear Cache on Deployed Site

### For End Users:
1. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Site Data**:
   - Open Chrome DevTools (F12)
   - Go to Application tab
   - Under "Storage", click "Clear site data"
   - Refresh the page

### Alternative Method:
1. Open the site
2. Open Chrome DevTools Console (F12)
3. Run this command:
   ```javascript
   await clearCacheAndReload();
   ```

### For Mobile Users:
1. Go to browser settings
2. Clear browsing data for the specific site
3. Or reinstall the PWA

## What Changed:
- **Old**: Multiple practice recommendations displayed
- **New**: Single dismissible daily practice suggestion
- **Feature**: Suggestion dismissed for the day won't reappear until tomorrow

## Service Worker Updates:
The service worker now:
- Uses network-first strategy for JS/CSS files
- Automatically clears old caches on version update
- Forces immediate activation with `skipWaiting()`

## Prevention for Future:
- Always bump version when deploying UI changes
- Consider adding version query parameters to critical imports
- Test with service worker enabled before deployment