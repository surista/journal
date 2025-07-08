// authService.js - Updated with Firebase integration and debug logging
import {cloudStorage} from './firebaseService.js';

export class AuthService {
    constructor() {
        console.log('🔧 AuthService: Initializing...');
        this.cloudStorage = cloudStorage;
        this.isCloudEnabled = true;

        // Check if Firebase is properly configured
        if (!cloudStorage || !cloudStorage.auth) {
            console.warn('⚠️ Firebase not properly initialized. Running in demo mode.');
            this.isCloudEnabled = false;
        } else {
            console.log('✅ AuthService: Firebase available');
        }
    }

    async login(email, password) {
        console.log('🔐 AuthService: Login attempt for:', email);

        try {
            // Handle demo login FIRST before trying Firebase
            if (email === 'demo@example.com' && password === 'demo123') {
                console.log('🎭 AuthService: Demo login detected');
                return this.localLogin(email, password);
            }

            // Only try cloud authentication for non-demo accounts
            if (this.isCloudEnabled) {
                console.log('☁️ AuthService: Attempting cloud login...');
                const cloudResult = await this.cloudStorage.signIn(email, password);

                if (cloudResult.success) {
                    console.log('✅ AuthService: Cloud login successful');
                    // Store user info locally
                    const user = {
                        id: cloudResult.user.uid,
                        email: cloudResult.user.email,
                        isCloudEnabled: true,
                        lastLogin: new Date().toISOString()
                    };

                    localStorage.setItem('currentUser', JSON.stringify(user));

                    // Trigger data sync
                    window.dispatchEvent(new CustomEvent('userLoggedIn', {detail: user}));

                    return {success: true, user: user};
                } else {
                    console.error('❌ AuthService: Cloud login failed:', cloudResult.error);
                    return {success: false, error: cloudResult.error};
                }
            }

            // Fallback to local auth if cloud is disabled
            console.log('💻 AuthService: Using local auth fallback');
            return this.localLogin(email, password);
        } catch (error) {
            console.error('💥 AuthService: Login error:', error);
            return {success: false, error: error.message};
        }
    }

    async signup(email, password) {
        console.log('📝 AuthService: Signup attempt for:', email);

        if (!this.isCloudEnabled) {
            return {success: false, error: 'Cloud sync must be enabled for new accounts'};
        }

        const cloudResult = await this.cloudStorage.signUp(email, password);

        if (cloudResult.success) {
            console.log('✅ AuthService: Signup successful');
            // Store user info locally
            const user = {
                id: cloudResult.user.uid,
                email: cloudResult.user.email,
                isCloudEnabled: true,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(user));

            return {success: true, user: user};
        }

        console.error('❌ AuthService: Signup failed:', cloudResult.error);
        return cloudResult;
    }

    // Local login fallback (existing functionality)
    localLogin(email, password) {
        console.log('💻 AuthService: Local login for:', email);

        // Demo credentials
        if (email === 'demo@example.com' && password === 'demo123') {
            console.log('✅ AuthService: Demo login successful');

            const user = {
                id: 'demo_user',
                email: email,
                isCloudEnabled: false,
                isDemo: true,
                lastLogin: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('authToken', 'demo_token_' + Date.now());

            return {success: true, user: user};
        }

        console.error('❌ AuthService: Invalid credentials');
        return {success: false, error: 'Invalid credentials. Use demo@example.com / demo123 for demo mode.'};
    }

    async logout() {
        console.log('🚪 AuthService: Logout');

        try {
            // Sign out from Firebase if available
            if (this.isCloudEnabled) {
                await this.cloudStorage.signOut();
            }

            // Clear local storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');

            console.log('✅ AuthService: Logout successful');
            return {success: true};
        } catch (error) {
            console.error('❌ AuthService: Logout error:', error);
            return {success: false, error: error.message};
        }
    }

    getCurrentUser() {
        try {
            const stored = localStorage.getItem('currentUser');
            const user = stored ? JSON.parse(stored) : null;
            console.log('👤 AuthService: Current user:', user ? user.email : 'None');
            return user;
        } catch (error) {
            console.error('❌ AuthService: Error getting current user:', error);
            return null;
        }
    }

    isLoggedIn() {
        const user = this.getCurrentUser();
        const loggedIn = user !== null;
        console.log('🔍 AuthService: Is logged in:', loggedIn);
        return loggedIn;
    }

    async resetPassword(email) {
        if (!this.isCloudEnabled) {
            return {success: false, error: 'Password reset requires cloud sync'};
        }

        return await this.cloudStorage.resetPassword(email);
    }

    async changePassword(currentPassword, newPassword) {
        if (!this.isCloudEnabled) {
            return {success: false, error: 'Password change requires cloud sync'};
        }

        return await this.cloudStorage.changePassword(currentPassword, newPassword);
    }
}