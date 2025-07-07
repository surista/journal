// indexedDBService.js - Robust IndexedDB Implementation
export class IndexedDBService {
    constructor(userId) {
        this.userId = userId;
        this.dbName = `guitarJournal_${userId}`;
        this.version = 3; // Increment when schema changes
        this.db = null;
        this.isInitialized = false;
        this.initPromise = null;

        // Store names
        this.stores = {
            sessions: 'practiceSessions',
            goals: 'practiceGoals',
            loops: 'practiceLoops',
            areaGoals: 'practiceAreaGoals',
            achievements: 'achievements',
            settings: 'settings'
        };
    }

    async init() {
        // Return existing promise if already initializing
        if (this.initPromise) {
            return this.initPromise;
        }

        // Already initialized
        if (this.isInitialized && this.db) {
            return this.db;
        }

        this.initPromise = this._initializeDB();

        try {
            await this.initPromise;
            this.isInitialized = true;
            return this.db;
        } catch (error) {
            console.error('IndexedDB initialization failed:', error);
            this.initPromise = null;
            throw error;
        }
    }

    async _initializeDB() {
        return new Promise((resolve, reject) => {
            // Check if IndexedDB is available
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB is not supported in this browser'));
                return;
            }

            console.log(`Opening IndexedDB: ${this.dbName} v${this.version}`);

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(new Error(`Failed to open database: ${request.error?.message || 'Unknown error'}`));
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB opened successfully');

                // Handle database closing unexpectedly
                this.db.onclose = () => {
                    console.log('Database connection closed');
                    this.db = null;
                    this.isInitialized = false;
                    this.initPromise = null;
                };

                this.db.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                };

                this.db.onabort = () => {
                    console.error('Database transaction aborted');
                };

                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log('Upgrading IndexedDB schema...');
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                try {
                    // Create or upgrade practice sessions store
                    if (!db.objectStoreNames.contains(this.stores.sessions)) {
                        const sessionsStore = db.createObjectStore(this.stores.sessions, {
                            keyPath: 'id',
                            autoIncrement: false
                        });

                        // Indexes for efficient querying
                        sessionsStore.createIndex('date', 'date', { unique: false });
                        sessionsStore.createIndex('practiceArea', 'practiceArea', { unique: false });
                        sessionsStore.createIndex('dateArea', ['date', 'practiceArea'], { unique: false });

                        console.log('Created practice sessions store');
                    }

                    // Create or upgrade goals store
                    if (!db.objectStoreNames.contains(this.stores.goals)) {
                        const goalsStore = db.createObjectStore(this.stores.goals, {
                            keyPath: 'id',
                            autoIncrement: false
                        });
                        goalsStore.createIndex('createdAt', 'createdAt', { unique: false });
                        goalsStore.createIndex('status', 'status', { unique: false });

                        console.log('Created goals store');
                    }

                    // Create or upgrade practice loops store
                    if (!db.objectStoreNames.contains(this.stores.loops)) {
                        const loopsStore = db.createObjectStore(this.stores.loops, {
                            keyPath: 'id',
                            autoIncrement: true
                        });
                        loopsStore.createIndex('createdAt', 'createdAt', { unique: false });

                        console.log('Created practice loops store');
                    }

                    // Create or upgrade area goals store
                    if (!db.objectStoreNames.contains(this.stores.areaGoals)) {
                        const areaGoalsStore = db.createObjectStore(this.stores.areaGoals, {
                            keyPath: 'id',
                            autoIncrement: true
                        });
                        areaGoalsStore.createIndex('area', 'area', { unique: false });

                        console.log('Created area goals store');
                    }

                    // Create achievements store (v2)
                    if (oldVersion < 2 && !db.objectStoreNames.contains(this.stores.achievements)) {
                        const achievementsStore = db.createObjectStore(this.stores.achievements, {
                            keyPath: 'id',
                            autoIncrement: false
                        });
                        achievementsStore.createIndex('unlockedAt', 'unlockedAt', { unique: false });

                        console.log('Created achievements store');
                    }

                    // Create settings store
                    if (!db.objectStoreNames.contains(this.stores.settings)) {
                        db.createObjectStore(this.stores.settings, {
                            keyPath: 'key'
                        });

                        console.log('Created settings store');
                    }

                    // Create backups store
                    if (!db.objectStoreNames.contains('backups')) {
                        db.createObjectStore('backups', {
                            keyPath: 'key'
                        });
                        console.log('Created backups store');
                    }

                    console.log('IndexedDB schema upgrade completed');
                } catch (error) {
                    console.error('Error during schema upgrade:', error);
                    throw error;
                }
            };

            request.onblocked = () => {
                console.warn('Database upgrade blocked - please close other tabs');
                reject(new Error('Database upgrade blocked by other tabs'));
            };
        });
    }

    async ensureConnection() {
        if (!this.db || !this.isInitialized) {
            await this.init();
        }
        return this.db;
    }

    async transaction(storeNames, mode = 'readonly') {
        const db = await this.ensureConnection();

        // Ensure storeNames is an array
        const stores = Array.isArray(storeNames) ? storeNames : [storeNames];

        try {
            return db.transaction(stores, mode);
        } catch (error) {
            console.error('Failed to create transaction:', error);
            // Try to reinitialize if the database was closed
            if (error.name === 'InvalidStateError') {
                this.db = null;
                this.isInitialized = false;
                this.initPromise = null;
                await this.init();
                return db.transaction(stores, mode);
            }
            throw error;
        }
    }

    // Generic CRUD operations with better error handling
    async add(storeName, data) {
        try {
            const tx = await this.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = store.add(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(`Failed to add to ${storeName}: ${request.error}`));

                tx.oncomplete = () => console.log(`Added item to ${storeName}`);
                tx.onerror = () => reject(new Error(`Transaction failed: ${tx.error}`));
            });
        } catch (error) {
            console.error(`Error adding to ${storeName}:`, error);
            throw error;
        }
    }

    async put(storeName, data) {
        try {
            const tx = await this.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = store.put(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(`Failed to update ${storeName}: ${request.error}`));
            });
        } catch (error) {
            console.error(`Error updating ${storeName}:`, error);
            throw error;
        }
    }

    async get(storeName, key) {
        try {
            const tx = await this.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(`Failed to get from ${storeName}: ${request.error}`));
            });
        } catch (error) {
            console.error(`Error getting from ${storeName}:`, error);
            throw error;
        }
    }

    async getAll(storeName, query = null, count = null) {
        try {
            const tx = await this.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = query
                    ? store.getAll(query, count)
                    : store.getAll(count);

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(new Error(`Failed to get all from ${storeName}: ${request.error}`));
            });
        } catch (error) {
            console.error(`Error getting all from ${storeName}:`, error);
            throw error;
        }
    }

    async delete(storeName, key) {
        try {
            const tx = await this.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error(`Failed to delete from ${storeName}: ${request.error}`));
            });
        } catch (error) {
            console.error(`Error deleting from ${storeName}:`, error);
            throw error;
        }
    }

    async clear(storeName) {
        try {
            const tx = await this.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error(`Failed to clear ${storeName}: ${request.error}`));
            });
        } catch (error) {
            console.error(`Error clearing ${storeName}:`, error);
            throw error;
        }
    }

    // Practice Sessions specific methods
    async savePracticeSession(session) {
        // Ensure session has an ID
        if (!session.id) {
            session.id = Date.now();
        }

        // Ensure date is ISO string
        if (session.date && typeof session.date !== 'string') {
            session.date = new Date(session.date).toISOString();
        }

        return this.put(this.stores.sessions, session);
    }

    async getPracticeSessions(limit = null) {
        const sessions = await this.getAll(this.stores.sessions, null, limit);

        // Sort by date descending (newest first)
        return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async getSessionsByDateRange(startDate, endDate) {
        try {
            const tx = await this.transaction(this.stores.sessions, 'readonly');
            const store = tx.objectStore(this.stores.sessions);
            const index = store.index('date');

            const range = IDBKeyRange.bound(
                new Date(startDate).toISOString(),
                new Date(endDate).toISOString()
            );

            return new Promise((resolve, reject) => {
                const request = index.getAll(range);

                request.onsuccess = () => {
                    const results = request.result || [];
                    resolve(results.sort((a, b) => new Date(b.date) - new Date(a.date)));
                };

                request.onerror = () => reject(new Error(`Failed to query sessions: ${request.error}`));
            });
        } catch (error) {
            console.error('Error querying sessions by date:', error);
            throw error;
        }
    }

    async getSessionsByArea(practiceArea, limit = null) {
        try {
            const tx = await this.transaction(this.stores.sessions, 'readonly');
            const store = tx.objectStore(this.stores.sessions);
            const index = store.index('practiceArea');

            return new Promise((resolve, reject) => {
                const request = limit
                    ? index.getAll(practiceArea, limit)
                    : index.getAll(practiceArea);

                request.onsuccess = () => {
                    const results = request.result || [];
                    resolve(results.sort((a, b) => new Date(b.date) - new Date(a.date)));
                };

                request.onerror = () => reject(new Error(`Failed to query sessions by area: ${request.error}`));
            });
        } catch (error) {
            console.error('Error querying sessions by area:', error);
            throw error;
        }
    }

    // Goals specific methods
    async saveGoal(goal) {
        if (!goal.id) {
            goal.id = `goal_${Date.now()}`;
        }
        if (!goal.createdAt) {
            goal.createdAt = new Date().toISOString();
        }
        return this.put(this.stores.goals, goal);
    }

    async getGoals() {
        const goals = await this.getAll(this.stores.goals);
        return goals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async updateGoal(goalId, updates) {
        const goal = await this.get(this.stores.goals, goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        const updatedGoal = { ...goal, ...updates };
        await this.put(this.stores.goals, updatedGoal);
        return updatedGoal;
    }

    // Import/Export functionality
    async exportData() {
        const data = {
            sessions: await this.getAll(this.stores.sessions),
            goals: await this.getAll(this.stores.goals),
            loops: await this.getAll(this.stores.loops),
            areaGoals: await this.getAll(this.stores.areaGoals),
            achievements: await this.getAll(this.stores.achievements),
            settings: await this.getAll(this.stores.settings),
            exportDate: new Date().toISOString(),
            version: this.version
        };

        return data;
    }

    async importData(data) {
        const stores = [
            { name: this.stores.sessions, data: data.sessions || [] },
            { name: this.stores.goals, data: data.goals || [] },
            { name: this.stores.loops, data: data.loops || data.practiceLoops || [] },
            { name: this.stores.areaGoals, data: data.areaGoals || data.practiceAreaGoals || [] },
            { name: this.stores.achievements, data: data.achievements || [] },
            { name: this.stores.settings, data: data.settings || [] }
        ];

        for (const { name, data: items } of stores) {
            if (items && items.length > 0) {
                // Clear existing data
                await this.clear(name);

                // Import new data
                for (const item of items) {
                    try {
                        await this.add(name, item);
                    } catch (error) {
                        console.warn(`Failed to import item to ${name}:`, error, item);
                    }
                }

                console.log(`Imported ${items.length} items to ${name}`);
            }
        }
    }

    // Storage info
    async getStorageInfo() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return { usage: 0, quota: 0 };
        }

        try {
            const estimate = await navigator.storage.estimate();
            const info = {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                usageInMB: ((estimate.usage || 0) / 1024 / 1024).toFixed(2),
                quotaInMB: ((estimate.quota || 0) / 1024 / 1024).toFixed(2),
                percentUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0
            };

            // Get store counts
            const stores = Object.values(this.stores);
            info.stores = {};

            for (const storeName of stores) {
                try {
                    const count = await this.count(storeName);
                    info.stores[storeName] = count;
                } catch (error) {
                    info.stores[storeName] = 0;
                }
            }

            return info;
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { usage: 0, quota: 0 };
        }
    }

    async count(storeName) {
        try {
            const tx = await this.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);

            return new Promise((resolve, reject) => {
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new Error(`Failed to count ${storeName}: ${request.error}`));
            });
        } catch (error) {
            console.error(`Error counting ${storeName}:`, error);
            return 0;
        }
    }

    // Clear all data from all stores
    async clearAll() {
        try {
            const stores = Object.values(this.stores);

            for (const storeName of stores) {
                try {
                    await this.clear(storeName);
                    console.log(`Cleared store: ${storeName}`);
                } catch (error) {
                    console.error(`Error clearing ${storeName}:`, error);
                }
            }

            console.log('All IndexedDB stores cleared');
            return { success: true };
        } catch (error) {
            console.error('Error clearing all stores:', error);
            return { success: false, error };
        }
    }

    // Backup-related methods
    async saveBackup(backupData) {
        try {
            // Create a backups store if it doesn't exist
            const tx = await this.transaction('backups', 'readwrite');
            const store = tx.objectStore('backups');

            // Store with timestamp as key
            const key = new Date().toISOString();
            await store.put({ key, data: backupData, timestamp: Date.now() });

            // Keep only last 5 backups
            const allBackups = await store.getAllKeys();
            if (allBackups.length > 5) {
                // Delete oldest backups
                const toDelete = allBackups.slice(0, allBackups.length - 5);
                for (const key of toDelete) {
                    await store.delete(key);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('IndexedDB backup save error:', error);
            return { success: false, error };
        }
    }

    async getLatestBackup() {
        try {
            const tx = await this.transaction('backups', 'readonly');
            const store = tx.objectStore('backups');

            const allBackups = await store.getAll();
            if (allBackups.length === 0) return null;

            // Sort by timestamp and return latest
            allBackups.sort((a, b) => b.timestamp - a.timestamp);
            return allBackups[0].data;
        } catch (error) {
            console.error('IndexedDB backup retrieve error:', error);
            return null;
        }
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            this.initPromise = null;
            console.log('IndexedDB connection closed');
        }
    }

    // Delete entire database
    async deleteDatabase() {
        this.close();

        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);

            request.onsuccess = () => {
                console.log('Database deleted successfully');
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to delete database:', request.error);
                reject(new Error(`Failed to delete database: ${request.error}`));
            };

            request.onblocked = () => {
                console.warn('Database deletion blocked - close other tabs');
                reject(new Error('Database deletion blocked by other tabs'));
            };
        });
    }
}