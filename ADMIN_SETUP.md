# Admin Setup Guide

## Overview
The admin dashboard requires proper Firestore security rules to be deployed to allow admin users to read user data.

## Current Issue
The admin dashboard shows "No users found" because the default Firestore security rules only allow users to read their own data. Admin users need special permissions to query all users.

## Solution

### 1. Deploy Updated Firestore Rules
The `firestore.rules` file has been updated to include admin access. Deploy these rules to your Firebase project:

```bash
# Make sure you're in the project root directory
firebase deploy --only firestore:rules
```

### 2. Admin User Setup
Admin users are identified in one of three ways:
1. Email is `admin@example.com`
2. User has a custom claim `admin: true`
3. User document has `isAdmin: true` field

### 3. Setting Up Admin Users

#### Option A: Using Firebase Console (Easiest)
1. Go to Firebase Console > Firestore Database
2. Navigate to `users` collection
3. Find your admin user document
4. Add field: `isAdmin` = `true` (boolean)

#### Option B: Using Custom Claims (Most Secure)
```javascript
// Run this in a secure server environment or Firebase Cloud Function
const admin = require('firebase-admin');
admin.initializeApp();

async function setAdminClaim(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
}

// Call with your admin user's UID
setAdminClaim('YOUR_ADMIN_USER_UID');
```

#### Option C: Using Firebase Admin SDK
```javascript
// Add this to a secure backend script
const admin = require('firebase-admin');
const db = admin.firestore();

async function makeUserAdmin(email) {
  const userRecord = await admin.auth().getUserByEmail(email);
  await db.collection('users').doc(userRecord.uid).update({
    isAdmin: true
  });
}

// Make a user admin
makeUserAdmin('your-admin@example.com');
```

## Testing Admin Access

1. Deploy the updated rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Log in as your admin user

3. Navigate to the Admin tab

4. Click "Refresh Users" to load the user list

## Security Considerations

- The `isAdmin` field in Firestore is easier to set up but less secure than custom claims
- Custom claims require server-side code but are more secure
- Always use HTTPS in production
- Regularly audit admin access
- Consider implementing admin action logging

## Troubleshooting

If you still see "No users found":

1. **Check Firebase Authentication**
   - Ensure you're logged in
   - Verify your user has admin privileges

2. **Check Firestore Rules Deployment**
   - Run `firebase deploy --only firestore:rules`
   - Check deployment succeeded in Firebase Console

3. **Check Browser Console**
   - Look for permission-denied errors
   - These indicate rules haven't been deployed or user isn't admin

4. **Verify Admin Status**
   - Check your user document in Firestore has `isAdmin: true`
   - Or verify custom claims are set correctly

5. **Check Environment**
   - Ensure you're connected to the correct Firebase project
   - Development environment uses different project than production