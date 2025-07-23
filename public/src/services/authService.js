// authService.js - Fixed with proper Firebase integration
import firebaseSyncService from './firebaseSyncService.js';
import rateLimitService from './rateLimitService.js';

export class AuthService {
    constructor() {
        console.log('🔧 AuthService: Initializing...');
        this.cloudStorage = firebaseSyncService;
        this.isCloudEnabled = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // Wait for Firebase to be ready
            await this.cloudStorage.waitForInitialization();
            const isReady = !!this.cloudStorage.currentUser || true; // Allow auth attempts
            this.isCloudEnabled = isReady;
            console.log('✅ AuthService: Firebase ready:', isReady);
        } catch (error) {
            console.error('❌ AuthService: Firebase init failed:', error);
            this.isCloudEnabled = false;
        }
    }

    async ensureInitialized() {
        await this.initPromise;
    }

    async login(email, password) {
        console.log('🔐 AuthService: Login attempt for:', email);
        await this.ensureInitialized();

        // Check rate limit
        const rateLimit = rateLimitService.checkRateLimit(email, 'login');
        if (!rateLimit.allowed) {
            console.warn('🚫 AuthService: Rate limit exceeded for:', email);
            throw new Error(rateLimit.message);
        }

        try {
            // Handle demo login
            if (email === 'demo@example.com' && password === 'demo123') {
                console.log('🎭 AuthService: Demo login');
                return this.localLogin(email, password);
            }

            // Try cloud authentication
            if (this.isCloudEnabled) {
                console.log('☁️ AuthService: Cloud login...');
                const result = await this.cloudStorage.signIn(email, password);

                if (result.success) {
                    const user = {
                        id: result.user.uid,
                        email: result.user.email,
                        isCloudEnabled: true,
                        lastLogin: new Date().toISOString()
                    };

                    localStorage.setItem('currentUser', JSON.stringify(user));
                    window.dispatchEvent(new CustomEvent('userLoggedIn', {detail: user}));
                    
                    // Clear rate limit on successful login
                    rateLimitService.recordAttempt(email, 'login', true);
                    
                    return {success: true, user};
                }
                
                // Record failed attempt
                rateLimitService.recordAttempt(email, 'login', false);
                return result;
            }

            // Fallback to local
            return this.localLogin(email, password);
        } catch (error) {
            console.error('💥 AuthService: Login error:', error);
            
            // Record failed attempt unless it's a rate limit error
            if (!error.message.includes('Too many attempts')) {
                rateLimitService.recordAttempt(email, 'login', false);
            }
            
            return {success: false, error: error.message};
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
                
                return {success: true, user};
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
            return {success: true, user};
        }

        return {success: false, error: 'Invalid credentials. Use demo@example.com / demo123'};
    }

    async logout() {
        try {
            if (this.isCloudEnabled) {
                await this.cloudStorage.signOut();
            }

            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            return {success: true};
        } catch (error) {
            return {success: false, error: error.message};
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
        
        // Wait for Firebase auth state to be determined
        return new Promise((resolve) => {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                    unsubscribe(); // Unsubscribe after first call
                    if (user) {
                        // Update local storage with Firebase user
                        const userData = {
                            id: user.uid,
                            email: user.email,
                            isCloudEnabled: true,
                            lastLogin: new Date().toISOString()
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
            return {success: false, error: 'Password reset requires cloud sync'};
        }

        return await this.cloudStorage.resetPassword(email);
    }
}