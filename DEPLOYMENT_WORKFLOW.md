# 🎸 Guitar Practice Journal - Development Workflow Guide

> Complete guide for developing, testing, and deploying your application

---

## ⚡ Quick Reference

```bash
# Check current environment
firebase use

# Development
npm run switch:dev
npm run emulators:dev   # Local testing
npm run deploy:dev      # Deploy to dev hosting

# Production
npm run switch:prod
npm run deploy:prod     # Deploy to live site
```

---

## 📋 Prerequisites

- [x] Firebase CLI installed
- [x] Java installed (for emulators)
- [x] Access to both Firebase projects
- [x] Working from the `public` directory

---

## 🔄 Complete Development Cycle

### Step 1: Start Development

```bash
cd public
npm run switch:dev
npm run emulators:dev
```

✅ Visit `http://localhost:5000` to see your app  
✅ Look for the **🔧 Development** badge in the upper left

### Step 2: Deploy to Dev Hosting

```bash
npm run deploy:dev
```

✅ Test at: `https://journal-dev-b6257.web.app`  
✅ Share with testers for feedback

### Step 3: Ready for Production

```bash
# Update version
npm run bump-patch  # or bump-minor for features

# Commit changes
git add .
git commit -m "Deploy v10.95 - Add new features"
git push

# Deploy to production
npm run deploy:prod
```

✅ Live at: `https://guitar-practice-journal-9f064.web.app`  
✅ No environment badge should appear

### Step 4: Continue Development

```bash
npm run switch:dev
```

✅ Ready for the next feature!

---

## 🌍 Environment Overview

| Environment | Firebase Project | URL | Badge |
|------------|------------------|-----|-------|
| **Development** | journal-dev-b6257 | https://journal-dev-b6257.web.app | 🔧 Development (Green) |
| **Production** | guitar-practice-journal-9f064 | https://guitar-practice-journal-9f064.web.app | None (hidden) |

---

## 🎯 Key Commands Explained

### Development Commands

**`npm run emulators:dev`** - Starts local Firebase emulators
- Hosting on http://localhost:5000
- Auth emulator on http://localhost:9099
- Firestore emulator on http://localhost:8080
- Emulator UI on http://localhost:4000

**`npm run deploy:dev`** - Deploys to development hosting
- Uses no-cache headers for testing
- Shows environment badge
- Enables debug logging

### Production Commands

**`npm run deploy:prod`** - Deploys to live production site
- Uses 24-hour cache for performance
- No environment badge
- App Check enabled for security

---

## ⚠️ Important Notes

### Data Separation
Development and Production use separate Firebase projects. Data does NOT sync between them:
- Test data stays in dev
- Real user data stays in production

### Always Use NPM Scripts
Don't use `firebase deploy` directly - it might deploy with wrong settings!  
Always use: `npm run deploy:dev` or `npm run deploy:prod`

---

## ✅ Best Practices

1. **Test locally first** with emulators
2. **Deploy to dev hosting** for external testing
3. **Version bump** before production deploys
4. **Git commit** before production deploys
5. **Verify production** after deploying
6. **Switch back to dev** after production deploy

---

## 🚨 Troubleshooting

### Wrong project deployed?
```bash
firebase use  # Check current project
npm run switch:dev  # or switch:prod
```

### Emulators not starting?
```bash
java -version  # Ensure Java is installed
firebase emulators:kill  # Kill stuck emulators
```

### Deploy failed?
```bash
firebase login  # Re-authenticate
firebase projects:list  # Verify access
```

---

## 📝 Version Management

| Command | Version Change | Use Case |
|---------|---------------|----------|
| `npm run bump-patch` | 10.94 → 10.94.1 | Bug fixes |
| `npm run bump-minor` | 10.94 → 10.95 | New features |
| `npm run bump-major` | 10.94 → 11.0 | Breaking changes |

---

## 🎉 You're All Set!

Follow this workflow to safely develop and deploy features. The environment badge will always show you where you are!

### Remember:
- 🟢 **Green badge** = Development
- 🟠 **Amber badge** = Staging (if used)
- ❌ **No badge** = Production

---

*Last updated: July 2024*