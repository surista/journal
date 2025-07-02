// services/indexedDBService.js - IndexedDB for larger data storage

export class IndexedDBService {
    constructor(userId) {
        this.userId = userId;
        this.dbName = 'GuitarPracticeJournal';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Practice Sessions store
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    sessionStore.createIndex('userId', 'userId', { unique: false });
                    sessionStore.createIndex('date', 'date', { unique: false });
                    sessionStore.createIndex('practiceArea', 'practiceArea', { unique: false });
                }

                // Audio files store
                if (!db.objectStoreNames.contains('audioFiles')) {
                    const audioStore = db.createObjectStore('audioFiles', {
                        keyPath: 'id'
                    });
                    audioStore.createIndex('userId', 'userId', { unique: false });
                    audioStore.createIndex('fileName', 'fileName', { unique: false });
                }

                // Practice loops store
                if (!db.objectStoreNames.contains('practiceLoops')) {
                    const loopsStore = db.createObjectStore('practiceLoops', {
                        keyPath: 'id'
                    });
                    loopsStore.createIndex('userId', 'userId', { unique: false });
                    loopsStore.createIndex('audioFileId', 'audioFileId', { unique: false });
                }

                // Large data cache
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }
            };
        });
    }

    // Practice Sessions Methods
    async savePracticeSession(session) {
        const enrichedSession = {
            ...session,
            userId: this.userId,
            timestamp: Date.now()
        };

        return this.executeTransaction('sessions', 'readwrite', (store) => {
            return store.add(enrichedSession);
        });
    }

    async getPracticeSessions(limit = 100, offset = 0) {
        return this.executeTransaction('sessions', 'readonly', (store) => {
            const index = store.index('userId');
            const range = IDBKeyRange.only(this.userId);
            const sessions = [];

            return new Promise((resolve, reject) => {
                let count = 0;
                const request = index.openCursor(range, 'prev');

                request.onsuccess = (event) => {
                    const cursor = event.target.result;

                    if (cursor && sessions.length < limit + offset) {
                        if (count >= offset) {
                            sessions.push(cursor.value);
                        }
                        count++;
                        cursor.continue();
                    } else {
                        resolve(sessions);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        });
    }

    async getSessionsByDateRange(startDate, endDate) {
        return this.executeTransaction('sessions', 'readonly', (store) => {
            const index = store.index('date');
            const range = IDBKeyRange.bound(
                startDate.toISOString(),
                endDate.toISOString()
            );

            return this.getAllFromIndex(index, range);
        });
    }

    async getSessionsByPracticeArea(area) {
        return this.executeTransaction('sessions', 'readonly', (store) => {
            const index = store.index('practiceArea');
            const range = IDBKeyRange.only(area);

            return this.getAllFromIndex(index, range);
        });
    }

    // Audio Files Methods
    async saveAudioFile(fileName, arrayBuffer) {
        const id = `${this.userId}_${fileName}_${Date.now()}`;

        const audioFile = {
            id,
            userId: this.userId,
            fileName,
            data: arrayBuffer,
            size: arrayBuffer.byteLength,
            uploadDate: new Date().toISOString()
        };

        return this.executeTransaction('audioFiles', 'readwrite', (store) => {
            return store.add(audioFile);
        });
    }

    async getAudioFile(id) {
        return this.executeTransaction('audioFiles', 'readonly', (store) => {
            return store.get(id);
        });
    }

    async getAudioFileByName(fileName) {
        return this.executeTransaction('audioFiles', 'readonly', (store) => {
            const index = store.index('fileName');
            const range = IDBKeyRange.only(fileName);

            return new Promise((resolve, reject) => {
                const request = index.openCursor(range);

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && cursor.value.userId === this.userId) {
                        resolve(cursor.value);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => reject(request.error);
            });
        });
    }

    async deleteAudioFile(id) {
        return this.executeTransaction('audioFiles', 'readwrite', (store) => {
            return store.delete(id);
        });
    }

    // Practice Loops Methods
    async savePracticeLoop(loop) {
        const enrichedLoop = {
            ...loop,
            id: `${this.userId}_${Date.now()}`,
            userId: this.userId
        };

        return this.executeTransaction('practiceLoops', 'readwrite', (store) => {
            return store.add(enrichedLoop);
        });
    }

    async getPracticeLoopsByAudioFile(audioFileId) {
        return this.executeTransaction('practiceLoops', 'readonly', (store) => {
            const index = store.index('audioFileId');
            const range = IDBKeyRange.only(audioFileId);

            return this.getAllFromIndex(index, range);
        });
    }

    // Cache Methods for large data
    async cacheData(key, data) {
        const cacheEntry = {
            key: `${this.userId}_${key}`,
            data,
            timestamp: Date.now()
        };

        return this.executeTransaction('cache', 'readwrite', (store) => {
            return store.put(cacheEntry);
        });
    }

    async getCachedData(key) {
        const fullKey = `${this.userId}_${key}`;

        return this.executeTransaction('cache', 'readonly', (store) => {
            return store.get(fullKey);
        });
    }

    async clearOldCache(daysOld = 30) {
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

        return this.executeTransaction('cache', 'readwrite', (store) => {
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;

                if (cursor) {
                    if (cursor.value.timestamp < cutoffTime) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
            };
        });
    }

    // Storage size management
    async getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentage: (estimate.usage / estimate.quota) * 100
            };
        }
        return null;
    }

    // Helper methods
    executeTransaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);

            transaction.oncomplete = () => {
                resolve(result);
            };

            transaction.onerror = () => {
                reject(transaction.error);
            };

            let result;
            try {
                result = callback(store);

                if (result && typeof result.onsuccess === 'function') {
                    result.onsuccess = () => {
                        resolve(result.result);
                    };
                    result.onerror = () => {
                        reject(result.error);
                    };
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    getAllFromIndex(index, range) {
        return new Promise((resolve, reject) => {
            const results = [];
            const request = range ? index.openCursor(range) : index.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;

                if (cursor) {
                    if (!this.userId || cursor.value.userId === this.userId) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Export/Import for backup
    async exportAllData() {
        const sessions = await this.getPracticeSessions(Infinity, 0);
        const audioFiles = await this.executeTransaction('audioFiles', 'readonly', (store) => {
            return this.getAllFromIndex(store.index('userId'), IDBKeyRange.only(this.userId));
        });
        const practiceLoops = await this.executeTransaction('practiceLoops', 'readonly', (store) => {
            return this.getAllFromIndex(store.index('userId'), IDBKeyRange.only(this.userId));
        });

        return {
            sessions,
            audioFiles: audioFiles.map(file => ({
                ...file,
                data: null // Don't include actual audio data in export
            })),
            practiceLoops,
            exportDate: new Date().toISOString(),
            userId: this.userId
        };
    }

    async importData(data) {
        // Import sessions
        if (data.sessions) {
            for (const session of data.sessions) {
                await this.savePracticeSession(session);
            }
        }

        // Import practice loops
        if (data.practiceLoops) {
            for (const loop of data.practiceLoops) {
                await this.savePracticeLoop(loop);
            }
        }
    }

    // Clear all user data
    async clearAllData() {
        const stores = ['sessions', 'audioFiles', 'practiceLoops', 'cache'];

        for (const storeName of stores) {
            await this.executeTransaction(storeName, 'readwrite', (store) => {
                const index = store.index('userId');
                const range = IDBKeyRange.only(this.userId);
                const request = index.openCursor(range);

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };
            });
        }
    }
}