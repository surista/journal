# Deployment Guide - Dev/Prod Environment Setup

## Overview

This guide explains how to set up and deploy the Guitar Practice Journal to different environments (Development, Staging, and Production).

## Prerequisites

1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Access to Firebase Console
3. Node.js and npm installed

## Initial Setup

### 1. Create Firebase Projects

You need to create separate Firebase projects for each environment:

1. **Development Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project named `guitar-practice-journal-dev`
   - Enable Authentication, Firestore, and Hosting

2. **Staging Project** (Optional)
   - Create project named `guitar-practice-journal-staging`
   - Enable same services as development

3. **Production Project**
   - Already exists as `guitar-practice-journal-9f064`

### 2. Configure Firebase Projects

After creating the projects, you need to get the configuration for each:

1. In Firebase Console, go to Project Settings > Your apps
2. Create a web app if not already created
3. Copy the Firebase configuration object
4. Update `public/src/config/environment.js` with your development config:

```javascript
development: {
    firebaseConfig: {
        apiKey: "YOUR_DEV_API_KEY",
        authDomain: "YOUR_DEV_PROJECT.firebaseapp.com",
        projectId: "YOUR_DEV_PROJECT",
        storageBucket: "YOUR_DEV_PROJECT.appspot.com",
        messagingSenderId: "YOUR_DEV_SENDER_ID",
        appId: "YOUR_DEV_APP_ID",
        measurementId: "YOUR_DEV_MEASUREMENT_ID"
    },
    // ... rest of config
}
```

### 3. Initialize Firebase Projects Locally

```bash
# Login to Firebase
firebase login

# Add the projects to your local configuration
firebase use --add

# When prompted, select each project and give it an alias:
# - Select your dev project → alias: development
# - Select your staging project → alias: staging  
# - Select your prod project → alias: production
```

## Environment Configuration

### Environment Detection

The app automatically detects the environment based on the hostname:
- `localhost` or `127.0.0.1` → Development
- URLs containing `staging`, `-dev`, or `test` → Staging
- Everything else → Production

### Environment-Specific Features

| Feature | Development | Staging | Production |
|---------|------------|---------|------------|
| Debug Logging | ✅ Enabled | ❌ Disabled | ❌ Disabled |
| App Check | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| Environment Badge | ✅ Visible (Green) | ✅ Visible (Amber) | ❌ Hidden |
| Cache Strategy | Network First | Cache First (1hr) | Cache First (24hr) |
| Auth Rate Limit | 10 attempts/15min | 5 attempts/15min | 3 attempts/30min |

## Deployment Commands

### Development Environment

```bash
# Switch to development project
npm run switch:dev

# Serve locally with Firebase emulators
npm run emulators:dev

# Deploy to development hosting
npm run deploy:dev
```

### Staging Environment

```bash
# Switch to staging project
npm run switch:staging

# Serve locally
npm run serve:staging

# Deploy to staging hosting
npm run deploy:staging
```

### Production Environment

```bash
# Switch to production project
npm run switch:prod

# Build and deploy to production
npm run deploy:prod
```

## Development Workflow

### 1. Local Development

```bash
# Start local development with emulators
cd public
npm run emulators:dev

# This will start:
# - Hosting emulator on http://localhost:5000
# - Auth emulator on http://localhost:9099
# - Firestore emulator on http://localhost:8080
# - Emulator UI on http://localhost:4000
```

### 2. Testing New Features

1. Develop features locally with emulators
2. Test thoroughly in development environment
3. Deploy to development hosting: `npm run deploy:dev`
4. Test on the live development URL
5. If everything works, deploy to staging for final testing
6. Finally, deploy to production

### 3. Version Management

Before deploying to production:

```bash
# Bump version appropriately
npm run bump-patch  # For bug fixes (1.0.0 → 1.0.1)
npm run bump-minor  # For new features (1.0.0 → 1.1.0)
npm run bump-major  # For breaking changes (1.0.0 → 2.0.0)
```

## Security Considerations

### Firestore Rules

The same Firestore rules (`firestore.rules`) are used across all environments. However, you can create environment-specific rules files if needed:

```bash
# Deploy with specific rules file
firebase deploy --only firestore:rules --config firebase.dev.json
```

### Environment Variables

Never commit sensitive data. Use environment detection to load appropriate configurations:

```javascript
import { currentEnvironment, isDebugEnabled } from './config/environment.js';

if (isDebugEnabled()) {
    console.log('Debug mode enabled');
}
```

## Monitoring and Debugging

### Environment Badge

In development and staging, you'll see an environment badge in the bottom-right corner showing:
- Current environment name
- Environment color (green for dev, amber for staging)
- Click for more details

### Service Worker Caching

Different cache strategies per environment:
- **Development**: No caching, always fetch from network
- **Staging**: 1-hour cache for testing
- **Production**: 24-hour cache for performance

### Debug Logging

Enable detailed logging in development:

```javascript
import { isDebugEnabled } from './config/environment.js';

if (isDebugEnabled()) {
    console.log('Detailed debug info...');
}
```

## Troubleshooting

### Common Issues

1. **Firebase project not found**
   ```bash
   firebase use --add  # Re-add the project
   ```

2. **Permission denied errors**
   - Ensure you're logged in: `firebase login`
   - Check you have access to the project in Firebase Console

3. **Cache issues in development**
   - Clear browser cache and service worker
   - The dev service worker disables caching

4. **Environment badge not showing**
   - Check that you're not in production environment
   - Verify `shouldShowEnvironmentBadge()` returns true

### Rollback Procedure

If something goes wrong in production:

1. Keep track of the last known good version
2. Revert your changes in git
3. Deploy the previous version:
   ```bash
   git checkout <last-good-commit>
   npm run deploy:prod
   ```

## Best Practices

1. **Always test in development first**
2. **Use staging for final testing before production**
3. **Keep development data separate from production**
4. **Monitor the Firebase Console for errors**
5. **Use version control for all deployments**
6. **Document any environment-specific features**

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)