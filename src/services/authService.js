// Authentication Service
export class AuthService {
    constructor() {
        this.currentUser = null;
        this.initializeDemo();
    }

    initializeDemo() {
        // Check if users exist
        const users = this.getUsers();

        // Create demo user if it doesn't exist
        if (!users.find(u => u.email === 'demo@example.com')) {
            users.push({
                id: 'demo-user',
                email: 'demo@example.com',
                password: this.hashPassword('demo123'),
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('guitarJournalUsers', JSON.stringify(users));
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('guitarJournalUsers') || '[]');
    }

    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            return this.currentUser;
        }

        return null;
    }

    async login(email, password) {
        // Simulate network delay
        await this.delay(500);

        const users = this.getUsers();
        const hashedPassword = this.hashPassword(password);
        const user = users.find(u => u.email === email && u.password === hashedPassword);

        if (user) {
            this.currentUser = {
                id: user.id,
                email: user.email
            };
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        }

        return { success: false, error: 'Invalid email or password' };
    }

    async register(email, password) {
        // Simulate network delay
        await this.delay(500);

        const users = this.getUsers();

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'An account with this email already exists' };
        }

        // Create new user
        const newUser = {
            id: 'user-' + Date.now(),
            email: email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('guitarJournalUsers', JSON.stringify(users));

        // Auto-login after registration
        this.currentUser = {
            id: newUser.id,
            email: newUser.email
        };
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        return { success: true, user: this.currentUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    hashPassword(password) {
        // Simple hash function (use bcrypt in production)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}