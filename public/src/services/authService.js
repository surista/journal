// authService.js - Updated with Firebase integration
import {cloudStorage} from './firebaseService.js';

export class AuthService {
    constructor() {
        this.cloudStorage = cloudStorage;
        this.isCloudEnabled = true;

        // Check if Firebase is properly configured
        if (!cloudStorage || !cloudStorage.auth) {
            console.warn('⚠️ Firebase not properly initialized. Running in demo mode.');
            this.isCloudEnabled = false;
        }
    }

    async login(email, password) {
        try {
            // Always try cloud authentication first
            if (this.isCloudEnabled) {
                const cloudResult = await this.cloudStorage.signIn(email, password);

                if (cloudResult.success) {
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

                    return {success: true};
                } else {
                    return {success: false, error: cloudResult.error};
                }
            }

            // Fallback to local auth if cloud is disabled
            return this.localLogin(email, password);
        } catch (error) {
            console.error('Login error:', error);
            return {success: false, error: error.message};
        }
    }

    async signup(email, password) {
        if (!this.isCloudEnabled) {
            return {success: false, error: 'Cloud sync must be enabled for new accounts'};
        }

        const cloudResult = await this.cloudStorage.signUp(email, password);

        if (cloudResult.success) {
            // Store user info locally
            const user = {
                id: cloudResult.user.uid,
                email: cloudResult.user.email,
                isCloudEnabled: true,
                createdAt: new Date().toISOString()
            };

            localStorage.setItem('currentUser', JSON.stringify(user));

            return {success: true};
        }

        return cloudResult;
    }

    // Local login fallback (existing functionality)
    localLogin(email, password) {
        // Demo credentials
        if (email === 'demo@example.com' && password === 'demo123') {
            const user = {
                id: 'demo_user',
                email: email,
                isCloudEnabled: false
            };

            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('authToken', 'demo_token_' + Date.now());

            return {success: true};
        }

        return {success: false, error: 'Invalid credentials'};
    }

    async logout() {
        try {
            // Sign out from Firebase
            await this.cloudStorage.signOut();

            // Clear local storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');

            return {success: true};
        } catch (error) {
            console.error('Logout error:', error);
            return {success: false, error: error.message};
        }
    }

    getCurrentUser() {
        try {
            const stored = localStorage.getItem('currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
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