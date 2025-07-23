# Firebase Configuration

## Security Notes

The Firebase configuration in `firebaseConfig.js` contains client-side API keys that are designed to be public. However, security is enforced through:

1. **Firebase Security Rules** - Configured in `/firestore.rules` and `/storage.rules`
2. **Authorized Domains** - Set in Firebase Console under Authentication > Settings
3. **App Check** (recommended) - Additional layer of security for production

## Environment Configuration

For enhanced security in production:

1. **Option 1: Environment Variables (Recommended for server deployments)**
   - Create a `.env` file (never commit this)
   - Use a build process to inject values

2. **Option 2: Firebase Hosting Environment Configuration**
   ```bash
   firebase functions:config:set app.api_key="your-api-key"
   ```

3. **Option 3: Runtime Configuration**
   - Inject configuration at build time
   - Use CI/CD environment variables

## Important Security Measures

1. **Always configure Firebase Security Rules** to protect your data
2. **Enable App Check** in production for additional security
3. **Restrict API key usage** in Google Cloud Console
4. **Monitor usage** in Firebase Console for unusual activity

## Demo Credentials

The app includes demo credentials for testing purposes. In production:
- Consider removing demo access entirely
- Or implement rate limiting for demo accounts
- Monitor demo account usage