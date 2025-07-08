// Firebase configuration and service
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    writeBatch,
    where,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
    authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
    projectId: "guitar-practice-journal-9f064",
    storageBucket: "guitar-practice-journal-9f064.firebasestorage.app",
    messagingSenderId: "657026172181",
    appId: "1:657026172181:web:3a41e0793d0763e229d51c",
    measurementId: "G-XRW7J1FY1M"
};

// Check if config is still using placeholder values
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn('⚠️ Firebase configuration is using placeholder values. Please update with your actual Firebase credentials.');
}

// Initialize Firebase only if properly configured
let app;
let auth;
let db;

try {
    // Check if this is actually a real Firebase config
    if (firebaseConfig.apiKey === "YOUR_API_KEY" ||
        firebaseConfig.apiKey.length < 10 ||
        !firebaseConfig.projectId) {
        throw new Error('Firebase not configured - using placeholder values');
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    console.warn('⚠️ Running in demo mode without cloud sync');

    // Set flags to disable Firebase features
    auth = null;
    db = null;
}


export class CloudStorageService {
    constructor() {
        this.auth = auth || null;
        this.db = db || null;
        this.firestoreEnabled = !!(auth && db); // Set based on successful initialization
        this.currentUser = null;
        this.syncEnabled = true;
        this.lastSync = null;
        this.syncInProgress = false;
        this.listeners = new Map();
        this.conflictResolution = 'newest';

        // Only set up auth listener if Firebase is initialized
        if (this.auth) {
            // Listen for auth state changes
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                if (user) {
                    console.log('🔥 Firebase: User signed in:', user.email);
                    this.startAutoSync();
                    this.setupRealtimeListeners();
                } else {
                    console.log('🔥 Firebase: User signed out');
                    this.stopAutoSync();
                    this.removeRealtimeListeners();
                }
            });
        } else {
            console.warn('⚠️ CloudStorageService: Firebase not initialized, cloud sync disabled');
        }
    }

    // Authentication methods
    async signUp(email, password) {
        if (!this.auth) {
            return {success: false, error: 'Firebase authentication not available'};
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

            // Initialize user data structure in Firestore
            await this.initializeUserData(userCredential.user.uid);

            return {success: true, user: userCredential.user};
        } catch (error) {
            console.error('Sign up error:', error);
            return {success: false, error: this.getErrorMessage(error)};
        }
    }

    async signIn(email, password) {
        if (!this.auth) {
            return {success: false, error: 'Firebase authentication not available'};
        }

        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return {success: true, user: userCredential.user};
        } catch (error) {
            console.error('Sign in error:', error);
            return {success: false, error: this.getErrorMessage(error)};
        }
    }

    async signOut() {
        if (!this.auth) {
            return {success: false, error: 'Firebase authentication not available'};
        }

        try {
            await signOut(this.auth);
            return {success: true};
        } catch (error) {
            console.error('Sign out error:', error);
            return {success: false, error: error.message};
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return {success: true};
        } catch (error) {
            console.error('Password reset error:', error);
            return {success: false, error: this.getErrorMessage(error)};
        }
    }

    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            return {success: false, error: 'No user signed in'};
        }

        try {
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(
                this.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(this.currentUser, credential);

            // Update password
            await updatePassword(this.currentUser, newPassword);
            return {success: true};
        } catch (error) {
            console.error('Change password error:', error);
            return {success: false, error: this.getErrorMessage(error)};
        }
    }

    // Initialize user data structure
    async initializeUserData(userId) {
        const userRef = doc(this.db, `users/${userId}/data/metadata`);
        await setDoc(userRef, {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            schemaVersion: 1
        });
    }

    // Data sync methods
    async syncPracticeSession(session) {
        if (!this.firestoreEnabled || !this.currentUser || !this.syncEnabled) return;
        if (!this.currentUser || !this.syncEnabled) return;

        try {
            const docRef = doc(this.db, `users/${this.currentUser.uid}/sessions/${session.id}`);
            await setDoc(docRef, {
                ...session,
                syncedAt: new Date().toISOString(),
                deviceInfo: this.getDeviceInfo()
            });

            console.log('🔥 Session synced to cloud:', session.id);
            return {success: true};
        } catch (error) {
            console.error('Sync error:', error);
            return {success: false, error};
        }
    }

    async syncBatch(collection, items) {
        if (!this.currentUser || !this.syncEnabled) return;

        try {
            const batch = writeBatch(this.db);

            items.forEach(item => {
                const docRef = doc(this.db, `users/${this.currentUser.uid}/${collection}/${item.id || Date.now()}`);
                batch.set(docRef, {
                    ...item,
                    syncedAt: new Date().toISOString()
                });
            });

            await batch.commit();
            console.log(`🔥 Batch synced ${items.length} items to ${collection}`);
            return {success: true};
        } catch (error) {
            console.error('Batch sync error:', error);
            return {success: false, error};
        }
    }

    async getAllSessions() {
        if (!this.currentUser) return [];

        try {
            const sessionsRef = collection(this.db, `users/${this.currentUser.uid}/sessions`);
            const q = query(sessionsRef, orderBy('date', 'desc'), limit(1000));
            const querySnapshot = await getDocs(q);

            const sessions = [];
            querySnapshot.forEach((doc) => {
                sessions.push({id: doc.id, ...doc.data()});
            });

            return sessions;
        } catch (error) {
            console.error('Error fetching sessions:', error);
            return [];
        }
    }

    async syncAllData(localData) {
        if (!this.currentUser || !this.syncEnabled || this.syncInProgress) return;

        this.syncInProgress = true;
        console.log('🔥 Starting full sync...');

        try {
            // Create a backup document with all data
            const backupRef = doc(this.db, `users/${this.currentUser.uid}/backups/latest`);
            await setDoc(backupRef, {
                ...localData,
                syncedAt: new Date().toISOString(),
                deviceInfo: this.getDeviceInfo(),
                dataSize: JSON.stringify(localData).length
            });

            // Sync individual collections for easier querying
            const syncPromises = [];

            // Practice sessions
            if (localData.practiceEntries && localData.practiceEntries.length > 0) {
                syncPromises.push(this.syncBatch('sessions', localData.practiceEntries));
            }

            // Goals
            if (localData.goals) {
                const goalsRef = doc(this.db, `users/${this.currentUser.uid}/data/goals`);
                syncPromises.push(setDoc(goalsRef, {
                    goals: localData.goals,
                    syncedAt: new Date().toISOString()
                }));
            }

            // Settings
            if (localData.settings) {
                const settingsRef = doc(this.db, `users/${this.currentUser.uid}/data/settings`);
                syncPromises.push(setDoc(settingsRef, {
                    settings: localData.settings,
                    syncedAt: new Date().toISOString()
                }));
            }

            // Stats
            if (localData.stats) {
                const statsRef = doc(this.db, `users/${this.currentUser.uid}/data/stats`);
                syncPromises.push(setDoc(statsRef, {
                    stats: localData.stats,
                    syncedAt: new Date().toISOString()
                }));
            }

            // Achievements
            if (localData.achievements) {
                const achievementsRef = doc(this.db, `users/${this.currentUser.uid}/data/achievements`);
                syncPromises.push(setDoc(achievementsRef, {
                    achievements: localData.achievements,
                    syncedAt: new Date().toISOString()
                }));
            }

            // Audio sessions
            if (localData.audioSessions) {
                const audioRef = doc(this.db, `users/${this.currentUser.uid}/data/audioSessions`);
                syncPromises.push(setDoc(audioRef, {
                    audioSessions: localData.audioSessions,
                    syncedAt: new Date().toISOString()
                }));
            }

            await Promise.all(syncPromises);

            this.lastSync = new Date();
            this.updateSyncStatus('success');
            console.log('🔥 All data synced to cloud');
            return {success: true};
        } catch (error) {
            console.error('Full sync error:', error);
            this.updateSyncStatus('error', error.message);
            return {success: false, error};
        } finally {
            this.syncInProgress = false;
        }
    }

    async downloadCloudData() {
        if (!this.currentUser) return null;

        try {
            console.log('🔥 Downloading cloud data...');

            // Try to get the latest backup first
            const backupRef = doc(this.db, `users/${this.currentUser.uid}/backups/latest`);
            const backupSnap = await getDoc(backupRef);

            if (backupSnap.exists()) {
                const data = backupSnap.data();
                console.log('🔥 Found backup data');
                return data;
            }

            // If no backup, construct from individual collections
            console.log('🔥 No backup found, fetching individual collections...');

            const data = {
                practiceEntries: await this.getAllSessions(),
                goals: await this.getGoals(),
                settings: await this.getSettings(),
                stats: await this.getStats(),
                achievements: await this.getAchievements(),
                audioSessions: await this.getAudioSessions()
            };

            return data;
        } catch (error) {
            console.error('Error downloading cloud data:', error);
            return null;
        }
    }

    async getGoals() {
        if (!this.currentUser) return [];

        try {
            const goalsRef = doc(this.db, `users/${this.currentUser.uid}/data/goals`);
            const goalsSnap = await getDoc(goalsRef);

            if (goalsSnap.exists()) {
                return goalsSnap.data().goals || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching goals:', error);
            return [];
        }
    }

    async getSettings() {
        if (!this.currentUser) return {};

        try {
            const settingsRef = doc(this.db, `users/${this.currentUser.uid}/data/settings`);
            const settingsSnap = await getDoc(settingsRef);

            if (settingsSnap.exists()) {
                return settingsSnap.data().settings || {};
            }
            return {};
        } catch (error) {
            console.error('Error fetching settings:', error);
            return {};
        }
    }

    async getStats() {
        if (!this.currentUser) return {};

        try {
            const statsRef = doc(this.db, `users/${this.currentUser.uid}/data/stats`);
            const statsSnap = await getDoc(statsRef);

            if (statsSnap.exists()) {
                return statsSnap.data().stats || {};
            }
            return {};
        } catch (error) {
            console.error('Error fetching stats:', error);
            return {};
        }
    }

    async getAchievements() {
        if (!this.currentUser) return {};

        try {
            const achievementsRef = doc(this.db, `users/${this.currentUser.uid}/data/achievements`);
            const achievementsSnap = await getDoc(achievementsRef);

            if (achievementsSnap.exists()) {
                return achievementsSnap.data().achievements || {};
            }
            return {};
        } catch (error) {
            console.error('Error fetching achievements:', error);
            return {};
        }
    }

    async getAudioSessions() {
        if (!this.currentUser) return {};

        try {
            const audioRef = doc(this.db, `users/${this.currentUser.uid}/data/audioSessions`);
            const audioSnap = await getDoc(audioRef);

            if (audioSnap.exists()) {
                return audioSnap.data().audioSessions || {};
            }
            return {};
        } catch (error) {
            console.error('Error fetching audio sessions:', error);
            return {};
        }
    }

    // Real-time listeners
    setupRealtimeListeners() {
        if (!this.currentUser) return;

        // Listen for settings changes
        const settingsRef = doc(this.db, `users/${this.currentUser.uid}/data/settings`);
        const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
            if (doc.exists() && doc.data().syncedAt !== this.lastSync?.toISOString()) {
                console.log('🔥 Settings changed in cloud');
                this.notifyDataChange('settings', doc.data());
            }
        });
        this.listeners.set('settings', unsubscribeSettings);
    }

    removeRealtimeListeners() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }

    notifyDataChange(type, data) {
        window.dispatchEvent(new CustomEvent('cloudDataChanged', {
            detail: {type, data}
        }));
    }

    // Auto-sync functionality
    startAutoSync() {
        // Sync every 5 minutes
        this.syncInterval = setInterval(() => {
            this.performAutoSync();
        }, 5 * 60 * 1000);

        // Initial sync after 2 seconds
        setTimeout(() => this.performAutoSync(), 2000);
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    async performAutoSync() {
        if (!this.syncEnabled || !this.currentUser) return;

        console.log('🔥 Performing auto-sync...');

        // Get local data from storage service
        if (window.app && window.app.storageService) {
            const localData = await window.app.storageService.exportAllData();
            await this.syncAllData(localData);
        }
    }

    // Conflict resolution
    async resolveConflicts(localData, cloudData) {
        console.log('🔥 Resolving conflicts...');

        switch (this.conflictResolution) {
            case 'newest':
                // Compare timestamps and keep newest
                return this.mergeByTimestamp(localData, cloudData);
            case 'local':
                // Always prefer local data
                return localData;
            case 'cloud':
                // Always prefer cloud data
                return cloudData;
            default:
                return localData;
        }
    }

    mergeByTimestamp(localData, cloudData) {
        const merged = {...localData};

        // Merge practice entries
        if (cloudData.practiceEntries) {
            const localMap = new Map(localData.practiceEntries?.map(e => [e.id, e]) || []);
            const cloudMap = new Map(cloudData.practiceEntries.map(e => [e.id, e]));

            cloudMap.forEach((cloudEntry, id) => {
                const localEntry = localMap.get(id);
                if (!localEntry || new Date(cloudEntry.date) > new Date(localEntry.date)) {
                    localMap.set(id, cloudEntry);
                }
            });

            merged.practiceEntries = Array.from(localMap.values())
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // For other data types, use the newer one based on syncedAt
        ['goals', 'settings', 'stats', 'achievements'].forEach(key => {
            if (cloudData[key] && cloudData.syncedAt > (localData.syncedAt || '')) {
                merged[key] = cloudData[key];
            }
        });

        return merged;
    }

    // Utility methods
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        };
    }

    setSyncEnabled(enabled) {
        this.syncEnabled = enabled;
        if (enabled && this.currentUser) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
    }

    setConflictResolution(mode) {
        this.conflictResolution = mode;
    }

    updateSyncStatus(status, message = '') {
        window.dispatchEvent(new CustomEvent('syncStatusChanged', {
            detail: {
                status,
                message,
                lastSync: this.lastSync,
                user: this.currentUser?.email
            }
        }));
    }

    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-not-found': 'No account found with this email. Please sign up.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.'
        };

        return errorMessages[error.code] || error.message;
    }
}

// Export a singleton instance
export const cloudStorage = new CloudStorageService();