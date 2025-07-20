// Enhanced auth page with Firebase and debug logging
import {AuthService} from '../services/authService.js';
import {cloudStorage} from '../services/firebaseService.js';

class AuthPage {
    constructor() {
        console.log('🔧 AuthPage: Initializing...');
        this.authService = new AuthService();
        this.isLoginMode = true;
        this.init();
    }

    init() {
        console.log('🔧 AuthPage: Setting up event listeners...');
        this.attachEventListeners();

        // Check if already logged in
        if (this.authService.isLoggedIn()) {
            console.log('✅ AuthPage: User already logged in, redirecting...');
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
        console.log('🔄 AuthPage: Switching to login mode');
        this.isLoginMode = true;
        document.getElementById('loginTab').classList.add('active');
        document.getElementById('signupTab').classList.remove('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        this.clearStatus();
    }

    switchToSignup() {
        console.log('🔄 AuthPage: Switching to signup mode');
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

        console.log('🔐 AuthPage: Handling login for:', email);

        if (!email || !password) {
            this.showStatus('Please enter both email and password', 'error');
            return;
        }

        this.showStatus('Signing in...', 'info');

        try {
            console.log('📞 AuthPage: Calling authService.login...');
            const result = await this.authService.login(email, password);
            console.log('📥 AuthPage: Login result:', result);

            if (result.success) {
                this.showStatus('Success! Redirecting...', 'success');
                console.log('✅ AuthPage: Login successful, redirecting...');
                // Small delay to show success message
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 500);
            } else {
                console.error('❌ AuthPage: Login failed:', result.error);
                this.showStatus(result.error || 'Login failed', 'error');
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

        console.log('📝 AuthPage: Handling signup for:', email);

        if (password !== confirmPassword) {
            this.showStatus('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showStatus('Password must be at least 6 characters', 'error');
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
            }
        } catch (error) {
            console.error('💥 AuthPage: Signup error:', error);
            this.showStatus(error.message || 'Signup failed', 'error');
        }
    }

    async handleDemoLogin() {
        console.log('🎭 AuthPage: Handling demo login');

        this.showStatus('Loading demo mode...', 'info');

        try {
            console.log('📞 AuthPage: Calling demo login...');
            const result = await this.authService.login('demo@example.com', 'demo123');
            console.log('📥 AuthPage: Demo login result:', result);

            if (result.success) {
                this.showStatus('Demo mode activated!', 'success');
                console.log('✅ AuthPage: Demo login successful, redirecting...');
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
        console.log(`📢 AuthPage: Status [${type}]:`, message);
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

    redirectToDashboard() {
        console.log('🏠 AuthPage: Redirecting to dashboard...');
        window.location.href = './index.html';
    }
}

// Initialize auth page
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AuthPage: DOM loaded, initializing...');
    new AuthPage();
});