// Enhanced firebaseService.js with real-time sync capabilities
import {initializeApp} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import {getAnalytics} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    enableMultiTabIndexedDbPersistence
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your existing config
const firebaseConfig = {
    apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
    authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
    projectId: "guitar-practice-journal-9f064",
    storageBucket: "guitar-practice-journal-9f064.firebasestorage.app",
    messagingSenderId: "657026172181",
    appId: "1:657026172181:web:3a41e0793d0763e229d51c",
    measurementId: "G-XRW7J1FY1M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Enable offline persistence
try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log('✅ Firestore offline persistence enabled');
} catch (err) {
    if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab');
    } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support offline persistence');
    }
}

class CloudStorage {
    constructor() {
        this.currentUser = null;
        this.isReady = false;
        this.listeners = new Map();
        this.deviceId = this.getDeviceId();
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.init();
        this.setupNetworkListeners();
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.isReady = true;
            console.log(user ? '✅ User authenticated' : '❌ User not authenticated');

            if (user) {
                this.processOfflineQueue();
            } else {
                this.stopAllListeners();
            }

            window.dispatchEvent(new CustomEvent('authStateChanged', {detail: {user}}));

            // Auto-update UI when auth state changes
            setTimeout(() => {
                if (window.app?.currentPage?.cloudSyncHandler) {
                    window.app.currentPage.cloudSyncHandler.updateCloudStatus();
                }
            }, 500);
        });
    }

    async ensureInitialized() {
        while (!this.isReady) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Authentication methods (enhanced)
    async signIn(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return {success: true, user: result.user};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    async signUp(email, password, displayName = null) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);

            if (displayName) {
                await updateProfile(result.user, { displayName });
            }

            // Create user profile document
            await this.createUserProfile(result.user);

            return {success: true, user: result.user};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    async signOut() {
        this.stopAllListeners();
        await signOut(auth);
    }

    async createUserProfile(user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName || '',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            preferences: {
                theme: 'dark',
                notifications: true,
                autoSync: true
            }
        });
    }

    // Real-time sync methods
    startRealtimeSync(collectionName, callback) {
        if (!this.currentUser) {
            console.warn('Cannot start sync - user not authenticated');
            return;
        }

        const userId = this.currentUser.uid;
        const q = query(
            collection(db, collectionName),
            where('userId', '==', userId),
            orderBy('metadata.updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const changes = snapshot.docChanges();
            changes.forEach(change => {
                if (callback) {
                    callback(change.type, change.doc.id, change.doc.data());
                }
            });
        }, (error) => {
            console.error(`❌ Realtime sync error for ${collectionName}:`, error);
        });

        this.listeners.set(collectionName, unsubscribe);
        console.log(`🔄 Started realtime sync for ${collectionName}`);
    }

    stopRealtimeSync(collectionName) {
        const unsubscribe = this.listeners.get(collectionName);
        if (unsubscribe) {
            unsubscribe();
            this.listeners.delete(collectionName);
            console.log(`⏹️ Stopped realtime sync for ${collectionName}`);
        }
    }

    stopAllListeners() {
        this.listeners.forEach((unsubscribe, collectionName) => {
            unsubscribe();
            console.log(`⏹️ Stopped listener for ${collectionName}`);
        });
        this.listeners.clear();
    }

    // Data operations with sync metadata
    addSyncMetadata(record) {
        const now = new Date();
        return {
            ...record,
            userId: this.currentUser?.uid,
            metadata: {
                createdAt: record.metadata?.createdAt || now,
                updatedAt: now,
                version: (record.metadata?.version || 0) + 1,
                deviceId: this.deviceId,
                syncStatus: 'synced'
            }
        };
    }

    // Practice Sessions
    async savePracticeSession(entry) {
        if (!this.currentUser) {
            this.queueOperation('savePracticeSession', entry);
            return;
        }

        const sessionId = entry.id || `session_${Date.now()}`;
        const sessionData = this.addSyncMetadata({...entry, id: sessionId});

        const docRef = doc(db, 'practiceSessions', sessionId);
        await setDoc(docRef, sessionData);

        console.log('✅ Practice session saved to cloud:', sessionId);
        return sessionId;
    }

    async getPracticeSessions() {
        if (!this.currentUser) return [];

        const q = query(
            collection(db, 'practiceSessions'),
            where('userId', '==', this.currentUser.uid),
            orderBy('date', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    }

    async updatePracticeSession(sessionId, updates) {
        if (!this.currentUser) {
            this.queueOperation('updatePracticeSession', {sessionId, updates});
            return;
        }

        const docRef = doc(db, 'practiceSessions', sessionId);
        const updateData = this.addSyncMetadata(updates);
        await updateDoc(docRef, updateData);
    }

    async deletePracticeSession(sessionId) {
        if (!this.currentUser) {
            this.queueOperation('deletePracticeSession', sessionId);
            return;
        }

        const docRef = doc(db, 'practiceSessions', sessionId);
        await deleteDoc(docRef);
    }

    // Goals
    async saveGoal(goal) {
        if (!this.currentUser) {
            this.queueOperation('saveGoal', goal);
            return;
        }

        const goalId = goal.id || `goal_${Date.now()}`;
        const goalData = this.addSyncMetadata({...goal, id: goalId});

        const docRef = doc(db, 'goals', goalId);
        await setDoc(docRef, goalData);

        console.log('✅ Goal saved to cloud:', goalId);
        return goalId;
    }

    async getGoals() {
        if (!this.currentUser) return [];

        const q = query(
            collection(db, 'goals'),
            where('userId', '==', this.currentUser.uid)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    }

    async updateGoal(goalId, updates) {
        if (!this.currentUser) {
            this.queueOperation('updateGoal', {goalId, updates});
            return;
        }

        const docRef = doc(db, 'goals', goalId);
        const updateData = this.addSyncMetadata(updates);
        await updateDoc(docRef, updateData);
    }

    async deleteGoal(goalId) {
        if (!this.currentUser) {
            this.queueOperation('deleteGoal', goalId);
            return;
        }

        const docRef = doc(db, 'goals', goalId);
        await deleteDoc(docRef);
    }

    // Repertoire
    async saveRepertoireSong(song) {
        if (!this.currentUser) {
            this.queueOperation('saveRepertoireSong', song);
            return;
        }

        const songId = song.id || `song_${Date.now()}`;
        const songData = this.addSyncMetadata({...song, id: songId});

        const docRef = doc(db, 'repertoire', songId);
        await setDoc(docRef, songData);

        console.log('✅ Repertoire song saved to cloud:', songId);
        return songId;
    }

    async getRepertoire() {
        if (!this.currentUser) return [];

        const q = query(
            collection(db, 'repertoire'),
            where('userId', '==', this.currentUser.uid)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    }

    async updateRepertoireSong(songId, updates) {
        if (!this.currentUser) {
            this.queueOperation('updateRepertoireSong', {songId, updates});
            return;
        }

        const docRef = doc(db, 'repertoire', songId);
        const updateData = this.addSyncMetadata(updates);
        await updateDoc(docRef, updateData);
    }

    async deleteRepertoireSong(songId) {
        if (!this.currentUser) {
            this.queueOperation('deleteRepertoireSong', songId);
            return;
        }

        const docRef = doc(db, 'repertoire', songId);
        await deleteDoc(docRef);
    }

    // Bulk operations for migration
    async bulkUpload(collectionName, records) {
        if (!this.currentUser || !records.length) return;

        const batch = writeBatch(db);
        let batchCount = 0;

        for (const record of records) {
            if (batchCount >= 500) {
                await batch.commit();
                batch = writeBatch(db);
                batchCount = 0;
            }

            const recordData = this.addSyncMetadata(record);
            const docRef = doc(db, collectionName, record.id);
            batch.set(docRef, recordData);
            batchCount++;
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        console.log(`✅ Bulk uploaded ${records.length} ${collectionName} records`);
    }

    // Offline queue management
    queueOperation(method, data) {
        this.syncQueue.push({
            method,
            data,
            timestamp: Date.now()
        });
        console.log(`📴 Queued operation: ${method}`);
    }

    async processOfflineQueue() {
        if (!this.currentUser || !this.isOnline || this.syncQueue.length === 0) {
            return;
        }

        console.log(`🔄 Processing ${this.syncQueue.length} queued operations`);

        const operations = [...this.syncQueue];
        this.syncQueue = [];

        for (const operation of operations) {
            try {
                await this.executeQueuedOperation(operation);
            } catch (error) {
                console.error('❌ Failed to execute queued operation:', error);
                // Re-queue failed operations
                this.syncQueue.push(operation);
            }
        }
    }

    async executeQueuedOperation(operation) {
        const {method, data} = operation;

        switch (method) {
            case 'savePracticeSession':
                await this.savePracticeSession(data);
                break;
            case 'updatePracticeSession':
                await this.updatePracticeSession(data.sessionId, data.updates);
                break;
            case 'deletePracticeSession':
                await this.deletePracticeSession(data);
                break;
            case 'saveGoal':
                await this.saveGoal(data);
                break;
            case 'updateGoal':
                await this.updateGoal(data.goalId, data.updates);
                break;
            case 'deleteGoal':
                await this.deleteGoal(data);
                break;
            case 'saveRepertoireSong':
                await this.saveRepertoireSong(data);
                break;
            case 'updateRepertoireSong':
                await this.updateRepertoireSong(data.songId, data.updates);
                break;
            case 'deleteRepertoireSong':
                await this.deleteRepertoireSong(data);
                break;
        }
    }

    // Conflict resolution helpers
    hasConflict(localRecord, remoteRecord) {
        if (!localRecord.metadata || !remoteRecord.metadata) return false;

        const localTime = new Date(localRecord.metadata.updatedAt);
        const remoteTime = new Date(remoteRecord.metadata.updatedAt);

        // Conflict if both modified within 5 seconds and from different devices
        return (
            Math.abs(localTime - remoteTime) < 5000 &&
            localRecord.metadata.deviceId !== remoteRecord.metadata.deviceId
        );
    }

    resolveConflict(localRecord, remoteRecord, strategy = 'auto') {
        switch (strategy) {
            case 'last-write-wins':
                const localTime = new Date(localRecord.metadata.updatedAt);
                const remoteTime = new Date(remoteRecord.metadata.updatedAt);
                return localTime > remoteTime ? localRecord : remoteRecord;

            case 'auto':
                return this.smartMerge(localRecord, remoteRecord);

            default:
                return remoteRecord; // Default to remote
        }
    }

    smartMerge(localRecord, remoteRecord) {
        // Smart merge logic based on record type
        const merged = {...remoteRecord};

        // For practice sessions, keep longer duration
        if (localRecord.duration && remoteRecord.duration) {
            merged.duration = Math.max(localRecord.duration, remoteRecord.duration);
        }

        // For goals, keep higher progress
        if (localRecord.current !== undefined && remoteRecord.current !== undefined) {
            merged.current = Math.max(localRecord.current, remoteRecord.current);
        }

        // Merge notes if different
        if (localRecord.notes && remoteRecord.notes && localRecord.notes !== remoteRecord.notes) {
            merged.notes = `${remoteRecord.notes}\n--- Merged from other device ---\n${localRecord.notes}`;
        }

        // Update metadata
        merged.metadata = {
            ...remoteRecord.metadata,
            version: Math.max(localRecord.metadata.version, remoteRecord.metadata.version) + 1,
            updatedAt: new Date(),
            syncStatus: 'synced'
        };

        return merged;
    }

    // Migration helper
    async migrateLocalData(localData) {
        console.log('🔄 Starting migration to cloud...');

        const {practiceSessions, goals, repertoire} = localData;

        // Upload in batches
        if (practiceSessions?.length) {
            await this.bulkUpload('practiceSessions', practiceSessions);
        }

        if (goals?.length) {
            await this.bulkUpload('goals', goals);
        }

        if (repertoire?.length) {
            await this.bulkUpload('repertoire', repertoire);
        }

        console.log('✅ Migration completed');

        // Dispatch event
        window.dispatchEvent(new CustomEvent('migrationComplete'));
    }

    // Legacy methods for backward compatibility
    async saveData(key, data) {
        // Legacy method - map to new structure
        if (key === 'practiceEntries') {
            // Migrate old practice entries
            if (Array.isArray(data)) {
                for (const entry of data) {
                    await this.savePracticeSession(entry);
                }
            }
        }
    }

    async loadData(key) {
        // Legacy method - map to new structure
        if (key === 'practiceEntries') {
            return await this.getPracticeSessions();
        }
        return null;
    }

    // Utility methods
    getQueueSize() {
        return this.syncQueue.length;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUserId() {
        return this.currentUser?.uid || null;
    }

    getDeviceInfo() {
        return {
            deviceId: this.deviceId,
            userAgent: navigator.userAgent,
            isOnline: this.isOnline
        };
    }
}

export const cloudStorage = new CloudStorage();
export {auth, db, analytics};