// authService.js - Fixed with proper Firebase integration
import {cloudStorage} from './firebaseService.js';

export class AuthService {
    constructor() {
        console.log('🔧 AuthService: Initializing...');
        this.cloudStorage = cloudStorage;
        this.isCloudEnabled = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // Wait for Firebase to be ready
            await this.cloudStorage.ensureInitialized();
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
                    return {success: true, user};
                }
                return result;
            }

            // Fallback to local
            return this.localLogin(email, password);
        } catch (error) {
            console.error('💥 AuthService: Login error:', error);
            return {success: false, error: error.message};
        }
    }

    async signup(email, password) {
        await this.ensureInitialized();

        if (!this.isCloudEnabled) {
            return {
                success: false,
                error: 'Cloud sync required for new accounts'
            };
        }

        const result = await this.cloudStorage.signUp(email, password);

        if (result.success) {
            const user = {
                id: result.user.uid,
                email: result.user.email,
                isCloudEnabled: true,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            return {success: true, user};
        }

        return result;
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