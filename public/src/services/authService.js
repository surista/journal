// authService.js - Fixed with proper Firebase integration
import firebaseSyncService from './firebaseSyncService.js';
import rateLimitService from './rateLimitService.js';

export class AuthService {
    constructor() {
        this.cloudStorage = firebaseSyncService;
        this.isCloudEnabled = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // Wait for Firebase to be ready
            await this.cloudStorage.waitForInitialization();
            // Check if Firebase is actually available
            this.isCloudEnabled =
                this.cloudStorage.isInitialized ||
                (typeof firebase !== 'undefined' && firebase.auth);

            if (!this.isCloudEnabled) {
                console.warn('⚠️ AuthService: Cloud sync disabled - Firebase not initialized');
            } else {
                console.log('✅ AuthService: Cloud sync enabled');
            }
        } catch (error) {
            console.error('❌ AuthService: Firebase init failed:', error);
            this.isCloudEnabled = false;
        }
    }

    async ensureInitialized() {
        await this.initPromise;
    }

    async login(email, password) {
        console.log('🔑 AuthService.login called for:', email);

        // Add timeout wrapper
        const loginWithTimeout = async () => {
            await this.ensureInitialized();

            // Check rate limit
            const rateLimit = rateLimitService.checkRateLimit(email, 'login');
            if (!rateLimit.allowed) {
                console.warn('🚫 AuthService: Rate limit exceeded for:', email);
                throw new Error(rateLimit.message);
            }

            // Handle demo login
            if (email === 'demo@example.com' && password === 'demo123') {
                return this.localLogin(email, password);
            }

            // Try cloud authentication only if enabled and not demo
            if (this.isCloudEnabled && email !== 'demo@example.com') {
                console.log('🔑 AuthService: Attempting cloud login');
                const result = await this.cloudStorage.signIn(email, password);
                console.log('🔑 AuthService: Cloud login result:', result);

                if (result.success) {
                    // Get existing user data to preserve isAdmin status
                    const existingUser = this.getCurrentUser();
                    
                    const user = {
                        id: result.user.uid,
                        email: result.user.email,
                        isCloudEnabled: true,
                        lastLogin: new Date().toISOString(),
                        isAdmin: existingUser?.isAdmin || false // Preserve admin status
                    };

                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));

                    // Clear rate limit on successful login
                    rateLimitService.recordAttempt(email, 'login', true);

                    return { success: true, user };
                }

                // Record failed attempt
                rateLimitService.recordAttempt(email, 'login', false);
                return result;
            }

            // If we get here and cloud is not enabled, it means the user doesn't exist in Firebase
            // Only demo accounts can use local login
            if (!this.isCloudEnabled || email === 'demo@example.com') {
                return this.localLogin(email, password);
            }

            // For non-demo accounts when cloud didn't authenticate them
            return {
                success: false,
                error: 'Invalid email or password'
            };
        };

        try {
            // Wrap the login with a timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Login timeout - please try again')), 15000)
            );

            const result = await Promise.race([loginWithTimeout(), timeoutPromise]);

            return result;
        } catch (error) {
            console.error('💥 AuthService: Login error:', error);

            // Record failed attempt unless it's a rate limit error
            if (
                !error.message.includes('Too many attempts') &&
                !error.message.includes('timeout')
            ) {
                rateLimitService.recordAttempt(email, 'login', false);
            }

            return { success: false, error: error.message };
        }
    }

    async signup(email, password) {
        await this.ensureInitialized();

        // Check rate limit
        const rateLimit = rateLimitService.checkRateLimit(email, 'signup');
        if (!rateLimit.allowed) {
            console.warn('🚫 AuthService: Rate limit exceeded for signup:', email);
            throw new Error(rateLimit.message);
        }

        if (!this.isCloudEnabled) {
            return {
                success: false,
                error: 'Cloud sync required for new accounts'
            };
        }

        try {
            const result = await this.cloudStorage.signUp(email, password);

            if (result.success) {
                const user = {
                    id: result.user.uid,
                    email: result.user.email,
                    isCloudEnabled: true,
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem('currentUser', JSON.stringify(user));

                // Clear rate limit on successful signup
                rateLimitService.recordAttempt(email, 'signup', true);

                return { success: true, user };
            }

            // Record failed attempt
            rateLimitService.recordAttempt(email, 'signup', false);
            return result;
        } catch (error) {
            // Record failed attempt unless it's a rate limit error
            if (!error.message.includes('Too many attempts')) {
                rateLimitService.recordAttempt(email, 'signup', false);
            }
            throw error;
        }
    }

    localLogin(email, password) {
        if (email === 'demo@example.com' && password === 'demo123') {
            const user = {
                id: 'demo_user',
                email: email,
                isCloudEnabled: false,
                isDemo: true,
                lastLogin: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('authToken', 'demo_token_' + Date.now());
            return { success: true, user };
        }

        return { success: false, error: 'Invalid credentials. Use demo@example.com / demo123' };
    }

    async logout() {
        try {
            if (this.isCloudEnabled) {
                await this.cloudStorage.signOut();
            }

            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        try {
            const stored = localStorage.getItem('currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            return null;
        }
    }

    async waitForAuthState() {
        await this.ensureInitialized();

        // Wait for Firebase auth state to be determined with timeout
        return new Promise((resolve) => {
            let authStateResolved = false;

            // Set a timeout to prevent indefinite waiting
            const timeout = setTimeout(() => {
                if (!authStateResolved) {
                    authStateResolved = true;
                    console.warn('⚠️ Auth state timeout - using local auth');
                    resolve(this.getCurrentUser());
                }
            }, 5000); // 5 second timeout

            if (typeof firebase !== 'undefined' && firebase.auth) {
                const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                    if (authStateResolved) return; // Already resolved by timeout

                    authStateResolved = true;
                    clearTimeout(timeout);
                    unsubscribe(); // Unsubscribe after first call

                    if (user) {
                        // Get existing user data to preserve isAdmin status
                        const existingUser = this.getCurrentUser();
                        
                        // Update local storage with Firebase user, preserving isAdmin
                        const userData = {
                            id: user.uid,
                            email: user.email,
                            isCloudEnabled: true,
                            lastLogin: new Date().toISOString(),
                            isAdmin: existingUser?.isAdmin || false // Preserve admin status
                        };
                        localStorage.setItem('currentUser', JSON.stringify(userData));
                        resolve(userData);
                    } else {
                        // Check local storage for offline user
                        resolve(this.getCurrentUser());
                    }
                });
            } else {
                // No Firebase, use local auth
                authStateResolved = true;
                clearTimeout(timeout);
                resolve(this.getCurrentUser());
            }
        });
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    async resetPassword(email) {
        await this.ensureInitialized();

        if (!this.isCloudEnabled) {
            return { success: false, error: 'Password reset requires cloud sync' };
        }

        return await this.cloudStorage.resetPassword(email);
    }
}
