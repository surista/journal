// Firebase Sync Service - Proper implementation with automatic cloud sync
// Uses Firebase compat SDK for compatibility with existing setup

const firebaseConfig = {
    apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
    authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
    projectId: "guitar-practice-journal-9f064",
    storageBucket: "guitar-practice-journal-9f064.firebasestorage.app",
    messagingSenderId: "657026172181",
    appId: "1:657026172181:web:3a41e0793d0763e229d51c",
    measurementId: "G-XRW7J1FY1M"
};

class FirebaseSyncService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.isInitialized = false;
        this.syncInProgress = false;
        this.listeners = new Map();
        this.pendingWrites = [];
        this.retryTimeout = null;
        
        // Initialize Firebase when ready
        this.initialize();
    }

    async initialize() {
        try {
            // Wait for Firebase to be available
            let attempts = 0;
            while (typeof firebase === 'undefined' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded');
            }

            // Initialize Firebase app
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.app();
            }

            this.auth = firebase.auth();
            this.db = firebase.firestore();

            // Enable offline persistence
            try {
                await this.db.enablePersistence();
                console.log('✅ Firestore offline persistence enabled');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open, persistence already enabled');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Browser doesn\'t support offline persistence');
                }
            }

            // Set up auth state listener
            this.auth.onAuthStateChanged(async (user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ User authenticated:', user.email);
                    await this.ensureUserDocument();
                    this.processPendingWrites();
                    // Temporarily disable real-time listeners to avoid permission errors
                    // this.setupRealtimeListeners();
                    console.log('⚠️ Real-time listeners disabled for now');
                } else {
                    console.log('❌ User not authenticated');
                    this.removeRealtimeListeners();
                }
            });

            // Monitor connection state - disabled due to permission issues
            // Note: .info/connected requires special permissions
            /*
            this.db.collection('.info').doc('connected').onSnapshot((snapshot) => {
                const isConnected = snapshot.data()?.connected || false;
                if (isConnected && this.currentUser) {
                    console.log('🔗 Connected to Firestore');
                    this.processPendingWrites();
                }
            });
            */

            this.isInitialized = true;
            console.log('✅ Firebase Sync Service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase:', error);
            this.isInitialized = false;
        }
    }

    async ensureUserDocument() {
        if (!this.currentUser) return;

        const userRef = this.db.collection('users').doc(this.currentUser.uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                preferences: {
                    theme: 'dark',
                    notifications: true,
                    autoSync: true
                }
            });
            console.log('✅ User document created');
        } else {
            await userRef.update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    // ===================
    // Practice Sessions
    // ===================
    
    async savePracticeSession(session) {
        if (!session.id) {
            session.id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Add metadata
        const sessionData = {
            ...session,
            userId: this.currentUser?.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: session.createdAt || firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!this.currentUser || !this.isInitialized) {
            // Save to pending writes for later sync
            this.pendingWrites.push({
                type: 'practice_session',
                operation: 'save',
                data: sessionData
            });
            return session.id;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('practice_sessions')
                .doc(String(session.id))
                .set(sessionData);
            
            console.log('✅ Practice session saved to cloud:', session.id);
            return session.id;
        } catch (error) {
            console.error('❌ Failed to save practice session:', error);
            this.pendingWrites.push({
                type: 'practice_session',
                operation: 'save',
                data: sessionData
            });
            throw error;
        }
    }

    async getPracticeSessions() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('practice_sessions')
                .orderBy('date', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Failed to get practice sessions:', error);
            return [];
        }
    }

    async updatePracticeSession(sessionId, updates) {
        const updateData = {
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'practice_session',
                operation: 'update',
                id: sessionId,
                data: updateData
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('practice_sessions')
                .doc(String(sessionId))
                .update(updateData);
            
            console.log('✅ Practice session updated:', sessionId);
        } catch (error) {
            console.error('❌ Failed to update practice session:', error);
            this.pendingWrites.push({
                type: 'practice_session',
                operation: 'update',
                id: sessionId,
                data: updateData
            });
            throw error;
        }
    }

    async deletePracticeSession(sessionId) {
        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'practice_session',
                operation: 'delete',
                id: sessionId
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('practice_sessions')
                .doc(String(sessionId))
                .delete();
            
            console.log('✅ Practice session deleted:', sessionId);
        } catch (error) {
            console.error('❌ Failed to delete practice session:', error);
            this.pendingWrites.push({
                type: 'practice_session',
                operation: 'delete',
                id: sessionId
            });
            throw error;
        }
    }

    // ===================
    // Goals
    // ===================

    async saveGoal(goal) {
        if (!goal.id) {
            goal.id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        const goalData = {
            ...goal,
            userId: this.currentUser?.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: goal.createdAt || firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'goal',
                operation: 'save',
                data: goalData
            });
            return goal.id;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('goals')
                .doc(String(goal.id))
                .set(goalData);
            
            console.log('✅ Goal saved to cloud:', goal.id);
            return goal.id;
        } catch (error) {
            console.error('❌ Failed to save goal:', error);
            this.pendingWrites.push({
                type: 'goal',
                operation: 'save',
                data: goalData
            });
            throw error;
        }
    }

    async getGoals() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('goals')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Failed to get goals:', error);
            return [];
        }
    }

    async updateGoal(goalId, updates) {
        const updateData = {
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'goal',
                operation: 'update',
                id: goalId,
                data: updateData
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('goals')
                .doc(String(goalId))
                .update(updateData);
            
            console.log('✅ Goal updated:', goalId);
        } catch (error) {
            console.error('❌ Failed to update goal:', error);
            this.pendingWrites.push({
                type: 'goal',
                operation: 'update',
                id: goalId,
                data: updateData
            });
            throw error;
        }
    }

    async deleteGoal(goalId) {
        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'goal',
                operation: 'delete',
                id: goalId
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('goals')
                .doc(String(goalId))
                .delete();
            
            console.log('✅ Goal deleted:', goalId);
        } catch (error) {
            console.error('❌ Failed to delete goal:', error);
            this.pendingWrites.push({
                type: 'goal',
                operation: 'delete',
                id: goalId
            });
            throw error;
        }
    }

    // ===================
    // Repertoire
    // ===================

    async saveRepertoireSong(song) {
        if (!song.id) {
            song.id = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        const songData = {
            ...song,
            userId: this.currentUser?.uid,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: song.createdAt || firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'repertoire',
                operation: 'save',
                data: songData
            });
            return song.id;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('repertoire')
                .doc(String(song.id))
                .set(songData);
            
            console.log('✅ Repertoire song saved to cloud:', song.id);
            return song.id;
        } catch (error) {
            console.error('❌ Failed to save repertoire song:', error);
            this.pendingWrites.push({
                type: 'repertoire',
                operation: 'save',
                data: songData
            });
            throw error;
        }
    }

    async getRepertoire() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('repertoire')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('❌ Failed to get repertoire:', error);
            return [];
        }
    }

    async updateRepertoireSong(songId, updates) {
        const updateData = {
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'repertoire',
                operation: 'update',
                id: songId,
                data: updateData
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('repertoire')
                .doc(String(songId))
                .update(updateData);
            
            console.log('✅ Repertoire song updated:', songId);
        } catch (error) {
            console.error('❌ Failed to update repertoire song:', error);
            this.pendingWrites.push({
                type: 'repertoire',
                operation: 'update',
                id: songId,
                data: updateData
            });
            throw error;
        }
    }

    async deleteRepertoireSong(songId) {
        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'repertoire',
                operation: 'delete',
                id: songId
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .collection('repertoire')
                .doc(String(songId))
                .delete();
            
            console.log('✅ Repertoire song deleted:', songId);
        } catch (error) {
            console.error('❌ Failed to delete repertoire song:', error);
            this.pendingWrites.push({
                type: 'repertoire',
                operation: 'delete',
                id: songId
            });
            throw error;
        }
    }

    // ===================
    // Settings & Preferences
    // ===================

    async saveSettings(settings) {
        if (!this.currentUser || !this.isInitialized) {
            this.pendingWrites.push({
                type: 'settings',
                operation: 'save',
                data: settings
            });
            return;
        }

        try {
            await this.db.collection('users')
                .doc(this.currentUser.uid)
                .update({
                    settings: settings,
                    'settings.updatedAt': firebase.firestore.FieldValue.serverTimestamp()
                });
            
            console.log('✅ Settings saved to cloud');
        } catch (error) {
            console.error('❌ Failed to save settings:', error);
            this.pendingWrites.push({
                type: 'settings',
                operation: 'save',
                data: settings
            });
            throw error;
        }
    }

    async getSettings() {
        if (!this.currentUser) return null;

        try {
            const userDoc = await this.db.collection('users')
                .doc(this.currentUser.uid)
                .get();

            if (userDoc.exists) {
                return userDoc.data().settings || {};
            }
            return {};
        } catch (error) {
            console.error('❌ Failed to get settings:', error);
            return {};
        }
    }

    // ===================
    // Real-time Listeners
    // ===================

    setupRealtimeListeners() {
        if (!this.currentUser) return;

        // Practice Sessions listener
        const practiceUnsubscribe = this.db.collection('users')
            .doc(this.currentUser.uid)
            .collection('practice_sessions')
            .limit(50)
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const data = { id: change.doc.id, ...change.doc.data() };
                    
                    // Dispatch events for UI updates
                    window.dispatchEvent(new CustomEvent('practiceSessionSync', {
                        detail: {
                            type: change.type,
                            data: data
                        }
                    }));
                });
            }, (error) => {
                console.error('Practice sessions listener error:', error);
            });

        this.listeners.set('practice_sessions', practiceUnsubscribe);

        // Goals listener
        const goalsUnsubscribe = this.db.collection('users')
            .doc(this.currentUser.uid)
            .collection('goals')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const data = { id: change.doc.id, ...change.doc.data() };
                    
                    window.dispatchEvent(new CustomEvent('goalSync', {
                        detail: {
                            type: change.type,
                            data: data
                        }
                    }));
                });
            }, (error) => {
                console.error('Goals listener error:', error);
            });

        this.listeners.set('goals', goalsUnsubscribe);

        // Repertoire listener
        const repertoireUnsubscribe = this.db.collection('users')
            .doc(this.currentUser.uid)
            .collection('repertoire')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const data = { id: change.doc.id, ...change.doc.data() };
                    
                    window.dispatchEvent(new CustomEvent('repertoireSync', {
                        detail: {
                            type: change.type,
                            data: data
                        }
                    }));
                });
            }, (error) => {
                console.error('Repertoire listener error:', error);
            });

        this.listeners.set('repertoire', repertoireUnsubscribe);

        console.log('✅ Real-time listeners set up');
    }

    removeRealtimeListeners() {
        this.listeners.forEach((unsubscribe, key) => {
            unsubscribe();
            console.log(`⏹️ Removed listener: ${key}`);
        });
        this.listeners.clear();
    }

    // ===================
    // Offline Queue Processing
    // ===================

    async processPendingWrites() {
        if (this.pendingWrites.length === 0 || !this.currentUser) return;

        console.log(`🔄 Processing ${this.pendingWrites.length} pending writes...`);
        const writes = [...this.pendingWrites];
        this.pendingWrites = [];

        for (const write of writes) {
            try {
                await this.executePendingWrite(write);
            } catch (error) {
                console.error('Failed to process pending write:', error);
                // Re-add to queue if failed
                this.pendingWrites.push(write);
            }
        }

        // Retry failed writes after delay
        if (this.pendingWrites.length > 0) {
            if (this.retryTimeout) clearTimeout(this.retryTimeout);
            this.retryTimeout = setTimeout(() => this.processPendingWrites(), 5000);
        }
    }

    async executePendingWrite(write) {
        switch (write.type) {
            case 'practice_session':
                if (write.operation === 'save') {
                    await this.savePracticeSession(write.data);
                } else if (write.operation === 'update') {
                    await this.updatePracticeSession(write.id, write.data);
                } else if (write.operation === 'delete') {
                    await this.deletePracticeSession(write.id);
                }
                break;

            case 'goal':
                if (write.operation === 'save') {
                    await this.saveGoal(write.data);
                } else if (write.operation === 'update') {
                    await this.updateGoal(write.id, write.data);
                } else if (write.operation === 'delete') {
                    await this.deleteGoal(write.id);
                }
                break;

            case 'repertoire':
                if (write.operation === 'save') {
                    await this.saveRepertoireSong(write.data);
                } else if (write.operation === 'update') {
                    await this.updateRepertoireSong(write.id, write.data);
                } else if (write.operation === 'delete') {
                    await this.deleteRepertoireSong(write.id);
                }
                break;

            case 'settings':
                if (write.operation === 'save') {
                    await this.saveSettings(write.data);
                }
                break;
        }
    }

    // ===================
    // Migration Helper
    // ===================

    async migrateFromLocalStorage(storageService) {
        if (!this.currentUser) {
            console.error('Cannot migrate: User not authenticated');
            return false;
        }

        console.log('🔄 Starting migration from local storage to Firebase...');

        try {
            // Migrate practice sessions
            const localSessions = await storageService.getPracticeEntries();
            console.log(`Found ${localSessions.length} practice sessions to migrate`);
            
            for (const session of localSessions) {
                try {
                    await this.savePracticeSession(session);
                } catch (error) {
                    console.error('Failed to migrate session:', session.id, error);
                }
            }

            // Migrate goals
            const localGoals = await storageService.getGoals();
            console.log(`Found ${localGoals.length} goals to migrate`);
            
            for (const goal of localGoals) {
                try {
                    await this.saveGoal(goal);
                } catch (error) {
                    console.error('Failed to migrate goal:', goal.id, error);
                }
            }

            // Migrate repertoire
            const localRepertoire = await storageService.getRepertoire();
            console.log(`Found ${localRepertoire.length} repertoire songs to migrate`);
            
            for (const song of localRepertoire) {
                try {
                    await this.saveRepertoireSong(song);
                } catch (error) {
                    console.error('Failed to migrate song:', song.id, error);
                }
            }

            console.log('✅ Migration completed successfully');
            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }

    // ===================
    // Auth Methods
    // ===================

    async signIn(email, password) {
        try {
            const credential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: credential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signUp(email, password, displayName = null) {
        try {
            const credential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            if (displayName) {
                await credential.user.updateProfile({ displayName });
            }

            await this.ensureUserDocument();
            
            return { success: true, user: credential.user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            this.removeRealtimeListeners();
            await this.auth.signOut();
            this.currentUser = null;
            console.log('✅ Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }

    // ===================
    // Utility Methods
    // ===================

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getPendingWritesCount() {
        return this.pendingWrites.length;
    }

    async waitForInitialization() {
        let attempts = 0;
        while (!this.isInitialized && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        return this.isInitialized;
    }
}

// Export singleton instance
export const firebaseSyncService = new FirebaseSyncService();
export default firebaseSyncService;