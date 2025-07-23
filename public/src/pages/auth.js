// Enhanced auth page with Firebase and debug logging
import {AuthService} from '../services/authService.js';
import firebaseSyncService from '../services/firebaseSyncService.js';
import rateLimitService from '../services/rateLimitService.js';

class AuthPage {
    constructor() {
        this.authService = new AuthService();
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.attachEventListeners();

        // Check if already logged in
        if (this.authService.isLoggedIn()) {
            this.redirectToDashboard();
        }
    }

    attachEventListeners() {
        // Tab switching
        document.getElementById('loginTab')?.addEventListener('click', () => {
            this.switchToLogin();
        });

        document.getElementById('signupTab')?.addEventListener('click', () => {
            this.switchToSignup();
        });

        // Form submissions
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Demo mode
        document.getElementById('demoBtn')?.addEventListener('click', () => {
            this.handleDemoLogin();
        });

        // Forgot password
        document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });
    }

    switchToLogin() {
        this.isLoginMode = true;
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        this.clearStatus();
    }

    switchToSignup() {
        this.isLoginMode = false;
        document.getElementById('signupTab').classList.add('active');
        document.getElementById('loginTab').classList.remove('active');
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
        this.clearStatus();
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;


        if (!email || !password) {
            this.showStatus('Please enter both email and password', 'error');
            return;
        }

        // Check rate limit before attempting login
        const rateLimit = rateLimitService.checkRateLimit(email, 'login');
        if (!rateLimit.allowed) {
            this.showStatus(rateLimit.message, 'error');
            this.showRateLimitInfo(rateLimit);
            return;
        }

        this.showStatus('Signing in...', 'info');

        try {
            const result = await this.authService.login(email, password);

            if (result.success) {
                this.showStatus('Success! Redirecting...', 'success');
                // Small delay to show success message
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 500);
            } else {
                console.error('❌ AuthPage: Login failed:', result.error);
                this.showStatus(result.error || 'Login failed', 'error');
                
                // Show remaining attempts if rate limit is close
                const updatedLimit = rateLimitService.checkRateLimit(email, 'login');
                if (updatedLimit.remainingAttempts <= 2) {
                    this.showRateLimitInfo(updatedLimit);
                }
            }
        } catch (error) {
            console.error('💥 AuthPage: Login error:', error);
            this.showStatus(error.message || 'Login failed - please try again', 'error');
        }
    }

    async handleSignup() {
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupPasswordConfirm').value;


        if (password !== confirmPassword) {
            this.showStatus('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showStatus('Password must be at least 6 characters', 'error');
            return;
        }

        // Check rate limit before attempting signup
        const rateLimit = rateLimitService.checkRateLimit(email, 'signup');
        if (!rateLimit.allowed) {
            this.showStatus(rateLimit.message, 'error');
            this.showRateLimitInfo(rateLimit);
            return;
        }

        this.showStatus('Creating account...', 'info');

        try {
            const result = await this.authService.signup(email, password);

            if (result.success) {
                this.showStatus('Account created! Redirecting...', 'success');
                setTimeout(() => this.redirectToDashboard(), 1000);
            } else {
                this.showStatus(result.error || 'Signup failed', 'error');
                
                // Show remaining attempts if rate limit is close
                const updatedLimit = rateLimitService.checkRateLimit(email, 'signup');
                if (updatedLimit.remainingAttempts <= 2) {
                    this.showRateLimitInfo(updatedLimit);
                }
            }
        } catch (error) {
            console.error('💥 AuthPage: Signup error:', error);
            this.showStatus(error.message || 'Signup failed', 'error');
        }
    }

    async handleDemoLogin() {

        this.showStatus('Loading demo mode...', 'info');

        try {
            const result = await this.authService.login('demo@example.com', 'demo123');

            if (result.success) {
                this.showStatus('Demo mode activated!', 'success');
                setTimeout(() => this.redirectToDashboard(), 1000);
            } else {
                console.error('❌ AuthPage: Demo login failed:', result.error);
                this.showStatus('Demo mode failed: ' + (result.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('💥 AuthPage: Demo login error:', error);
            this.showStatus('Demo mode failed: ' + error.message, 'error');
        }
    }

    async handleForgotPassword() {
        const email = prompt('Enter your email address:');
        if (!email) return;

        this.showStatus('Sending reset email...', 'info');

        const result = await this.authService.resetPassword(email);

        if (result.success) {
            this.showStatus('Password reset email sent! Check your inbox.', 'success');
        } else {
            this.showStatus(result.error || 'Failed to send reset email', 'error');
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('authStatus');
        if (!statusEl) return;

        statusEl.className = `auth-status ${type}`;
        statusEl.textContent = message;
        statusEl.style.display = 'block';
    }

    clearStatus() {
        const statusEl = document.getElementById('authStatus');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }

    showRateLimitInfo(rateLimit) {
        const statusEl = document.getElementById('authStatus');
        if (!statusEl) return;

        // Create or update rate limit info
        let rateLimitEl = document.getElementById('rateLimitInfo');
        if (!rateLimitEl) {
            rateLimitEl = document.createElement('div');
            rateLimitEl.id = 'rateLimitInfo';
            rateLimitEl.style.cssText = 'margin-top: 10px; font-size: 0.9em; color: #fbbf24;';
            statusEl.parentNode.insertBefore(rateLimitEl, statusEl.nextSibling);
        }

        if (rateLimit.remainingAttempts > 0) {
            rateLimitEl.textContent = `⚠️ ${rateLimit.remainingAttempts} attempt${rateLimit.remainingAttempts > 1 ? 's' : ''} remaining`;
        } else {
            const timeUntilReset = rateLimitService.getTimeUntilReset(rateLimit.resetTime);
            rateLimitEl.textContent = `🔒 Account locked. Try again in ${timeUntilReset}`;
        }
        
        rateLimitEl.style.display = 'block';
        
        // Auto-hide after reset time
        if (rateLimit.resetTime) {
            const hideTimeout = rateLimit.resetTime - new Date();
            if (hideTimeout > 0) {
                setTimeout(() => {
                    if (rateLimitEl) {
                        rateLimitEl.style.display = 'none';
                    }
                }, hideTimeout);
            }
        }
    }

    redirectToDashboard() {
        window.location.href = './index.html';
    }
}

// Initialize auth page
document.addEventListener('DOMContentLoaded', () => {
    new AuthPage();
});