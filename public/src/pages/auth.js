// Enhanced auth page with Firebase
import { AuthService } from '../services/authService.js';
import { cloudStorage } from '../services/firebaseService.js';

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

        this.showStatus('Signing in...', 'info');

        const result = await this.authService.login(email, password);

        if (result.success) {
            this.showStatus('Success! Redirecting...', 'success');
            setTimeout(() => this.redirectToDashboard(), 1000);
        } else {
            this.showStatus(result.error || 'Login failed', 'error');
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

        this.showStatus('Creating account...', 'info');

        const result = await this.authService.signup(email, password);

        if (result.success) {
            this.showStatus('Account created! Redirecting...', 'success');
            setTimeout(() => this.redirectToDashboard(), 1000);
        } else {
            this.showStatus(result.error || 'Signup failed', 'error');
        }
    }

    async handleDemoLogin() {
        this.showStatus('Loading demo mode...', 'info');

        const result = await this.authService.login('demo@example.com', 'demo123');

        if (result.success) {
            this.showStatus('Demo mode activated!', 'success');
            setTimeout(() => this.redirectToDashboard(), 1000);
        } else {
            this.showStatus('Demo mode unavailable', 'error');
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

    redirectToDashboard() {
        window.location.href = './index.html';
    }
}

// Initialize auth page
document.addEventListener('DOMContentLoaded', () => {
    new AuthPage();
});