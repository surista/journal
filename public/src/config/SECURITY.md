# Security Configuration Guide

## Firebase Security

### API Key Security
While Firebase API keys are visible in client-side code, they are secured through:

1. **Firebase Security Rules** - Database access is restricted by user authentication
2. **Authorized Domains** - Only whitelisted domains can use the API key
3. **App Check** - Additional layer of security for production environments
4. **Rate Limiting** - Custom implementation to prevent abuse

### Environment-Based Security

The application uses different security settings per environment:

- **Development**: Relaxed settings for easier testing
  - App Check disabled
  - Higher rate limits (10 attempts)
  - Debug logging enabled

- **Production**: Strict security settings
  - App Check enabled
  - Lower rate limits (3 attempts)
  - Debug logging disabled

### Security Best Practices Implemented

1. **Input Validation** (`/utils/validation.js`)
   - All user inputs are validated before storage
   - Prevents SQL injection and data corruption
   - Enforces data type and size limits

2. **XSS Prevention** (`/utils/sanitizer.js`)
   - HTML escaping for all user-generated content
   - URL sanitization for external links
   - Safe DOM manipulation methods

3. **CSP Headers** (in index.html)
   - Restricts script sources to trusted domains
   - Prevents inline script execution (with nonce support)
   - Blocks unsafe eval operations

4. **Authentication Security**
   - Firebase Authentication for user management
   - Rate limiting on login attempts
   - Secure session management
   - Demo account isolated from cloud features

### Firestore Security Rules

Ensure your Firestore rules enforce:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Validate data structure for practice sessions
    match /users/{userId}/practice_sessions/{sessionId} {
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.keys().hasAll(['date', 'duration']) &&
        request.resource.data.duration is number &&
        request.resource.data.duration >= 0;
    }
  }
}
```

### App Check Configuration

In Firebase Console:
1. Enable App Check for your project
2. Register your app with reCAPTCHA v3
3. Enforce App Check for Firestore and Auth

### Additional Recommendations

1. **Enable Firebase Security Monitoring**
   - Monitor for unusual activity
   - Set up alerts for security events

2. **Regular Security Audits**
   - Review npm dependencies for vulnerabilities
   - Update Firebase SDK versions
   - Test security rules regularly

3. **Data Encryption**
   - Enable Firestore encryption at rest
   - Use HTTPS for all communications
   - Consider field-level encryption for sensitive data

4. **Backup Strategy**
   - Enable automatic Firestore backups
   - Test restore procedures
   - Maintain data retention policies