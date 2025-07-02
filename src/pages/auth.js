// Auth Page Component
export class AuthPage {
    constructor(authService) {
        this.authService = authService;
        this.container = null;
        this.onLoginSuccess = null;
    }

    async init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-page">
                <div class="auth-container">
                    <div class="auth-card">
                        <div class="auth-header">
                            <h1>🎸 Guitar Practice Journal</h1>
                            <p class="subtitle">Track your progress, achieve your goals</p>
                        </div>

                        <div class="auth-tabs">
                            <div class="auth-tab active" data-tab="login">Login</div>
                            <div class="auth-tab" data-tab="register">Register</div>
                        </div>

                        <!-- Login Form -->
                        <form class="auth-form active" id="loginForm" data-form="login">
                            <div class="form-group">
                                <label for="loginEmail">Email</label>
                                <input type="email" id="loginEmail" required placeholder="your@email.com">
                                <div class="error-message" id="loginEmailError"></div>
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" required placeholder="Enter your password">
                                <div class="error-message" id="loginPasswordError"></div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-full">
                                🚀 Enter
                            </button>
                        </form>

                        <!-- Register Form -->
                        <form class="auth-form" id="registerForm" data-form="register">
                            <div class="form-group">
                                <label for="registerEmail">Email</label>
                                <input type="email" id="registerEmail" required placeholder="your@email.com">
                                <div class="error-message" id="registerEmailError"></div>
                            </div>
                            <div class="form-group">
                                <label for="registerPassword">Password</label>
                                <input type="password" id="registerPassword" required placeholder="Create a password (min 6 characters)" minlength="6">
                                <div class="error-message" id="registerPasswordError"></div>
                            </div>
                            <div class="form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <input type="password" id="confirmPassword" required placeholder="Confirm your password">
                                <div class="error-message" id="confirmPasswordError"></div>
                            </div>
                            <button type="submit" class="btn btn-success btn-full">
                                ✨ Create Account
                            </button>
                        </form>

                        <div class="demo-info">
                            <p><strong>Demo Account:</strong></p>
                            <div class="demo-credentials" id="demoCredentials">
                                Email: demo@example.com<br>
                                Password: demo123
                            </div>
                            <div class="device-note">
                                <p><strong>Note:</strong> Accounts are stored locally on each device. To use your account on another device:</p>
                                <ul>
                                    <li>Register with the same email/password on each device</li>
                                    <li>Use Export/Import to transfer your practice data</li>
                                    <li>Or use the demo account available on all devices</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="notification" class="notification"></div>
        `;

        this.container = app.querySelector('.auth-page');
    }

    attachEventListeners() {
        // Tab switching
        const tabs = this.container.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Form submissions
        const loginForm = this.container.querySelector('#loginForm');
        const registerForm = this.container.querySelector('#registerForm');

        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Demo credentials click
        const demoCredentials = this.container.querySelector('#demoCredentials');
        demoCredentials.addEventListener('click', () => this.fillDemoCredentials());
    }

    switchTab(tabName) {
        // Update active tab
        const tabs = this.container.querySelectorAll('.auth-tab');
        const forms = this.container.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        forms.forEach(form => {
            form.classList.toggle('active', form.dataset.form === tabName);
        });

        // Clear errors
        this.clearErrors();
    }

    async handleLogin(event) {
        event.preventDefault();
        this.clearErrors();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validate
        if (!this.authService.isValidEmail(email)) {
            this.showError('loginEmailError', 'Please enter a valid email address');
            return;
        }

        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const result = await this.authService.login(email, password);

            if (result.success) {
                this.showNotification('Login successful! Welcome back! 🎸');

                // Call success callback if provided
                if (this.onLoginSuccess) {
                    setTimeout(() => {
                        this.onLoginSuccess(result.user);
                    }, 500);
                }
            } else {
                this.showError('loginPasswordError', result.error);
            }
        } catch (error) {
            this.showError('loginPasswordError', 'An error occurred. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        this.clearErrors();

        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate
        if (!this.authService.isValidEmail(email)) {
            this.showError('registerEmailError', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('registerPasswordError', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
            return;
        }

        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        try {
            const result = await this.authService.register(email, password);

            if (result.success) {
                this.showNotification('Account created successfully! Welcome! 🎉');

                // Call success callback if provided
                if (this.onLoginSuccess) {
                    setTimeout(() => {
                        this.onLoginSuccess(result.user);
                    }, 500);
                }
            } else {
                this.showError('registerEmailError', result.error);
            }
        } catch (error) {
            this.showError('registerEmailError', 'An error occurred. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    fillDemoCredentials() {
        // Switch to login tab
        this.switchTab('login');

        // Fill demo credentials
        document.getElementById('loginEmail').value = 'demo@example.com';
        document.getElementById('loginPassword').value = 'demo123';

        // Focus login button
        const loginBtn = this.container.querySelector('#loginForm button[type="submit"]');
        loginBtn.focus();

        this.showNotification('Demo credentials filled! Click Login to continue.');
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearErrors() {
        const errorElements = this.container.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;

            if (type === 'error') {
                notification.style.background = 'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)';
            } else {
                notification.style.background = 'linear-gradient(135deg, var(--success) 0%, #059669 100%)';
            }

            notification.style.display = 'block';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 3000);
        }
    }

    destroy() {
        if (this.container) {
            this.container.remove();
        }
    }
}