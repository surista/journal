// Drills Service - Manages guitar practice drills
// Provides CRUD operations for drills with search, filter, and categorization

import { firebaseSyncService } from './firebaseSyncService.js';

class DrillsService {
    constructor() {
        this.drills = [];
        this.categories = [
            'Scales',
            'Chords',
            'Arpeggios',
            'Technique',
            'Rhythm',
            'Theory',
            'Ear Training',
            'Sight Reading',
            'Improvisation',
            'Repertoire'
        ];
        this.difficulties = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
        this.initialized = false;
        this.initPromise = this.init();
    }

    async init() {
        if (this.initialized) return;
        
        console.log('DrillsService: Starting initialization...');
        
        try {
            // Load drills from localStorage first
            await this.loadFromLocalStorage();
            console.log('DrillsService: Loaded from localStorage:', this.drills.length);
            
            // If no drills exist, load default drills
            if (this.drills.length === 0) {
                console.log('DrillsService: No drills in localStorage, loading defaults...');
                await this.loadDefaultDrills();
            }
            
            // Try to sync with Firebase if available
            if (firebaseSyncService.isAuthenticated()) {
                await this.syncWithFirebase();
            }
            
            this.initialized = true;
            console.log('DrillsService: Initialization complete. Total drills:', this.drills.length);
        } catch (error) {
            console.error('Failed to initialize DrillsService:', error);
            this.initialized = true; // Mark as initialized even on error
        }
    }

    async loadDefaultDrills() {
        // Default drills to get users started
        this.drills = [
            // Scales
            {
                id: 'drill_scale_major_1',
                title: 'Major Scale - All Positions',
                category: 'Scales',
                difficulty: 'Intermediate',
                description: 'Practice all 5 positions of the major scale across the fretboard',
                instructions: '1. Start with position 1 at the 5th fret (A major)\n2. Play slowly with alternate picking\n3. Move through all 5 positions\n4. Increase tempo gradually',
                tempo: { min: 60, max: 120, recommended: 80 },
                duration: 15, // minutes
                tags: ['scales', 'major', 'positions', 'technique'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            },
            {
                id: 'drill_scale_pentatonic_1',
                title: 'Minor Pentatonic Box Patterns',
                category: 'Scales',
                difficulty: 'Beginner',
                description: 'Master the 5 box patterns of the minor pentatonic scale',
                instructions: '1. Start with box 1 in A minor (5th fret)\n2. Use all downstrokes initially\n3. Focus on clean fretting\n4. Connect boxes once comfortable',
                tempo: { min: 40, max: 100, recommended: 60 },
                duration: 20,
                tags: ['scales', 'pentatonic', 'blues', 'rock'],
                createdAt: new Date().toISOString(),
                isFavorite: true
            },
            
            // Chords
            {
                id: 'drill_chord_changes_1',
                title: 'Basic Open Chord Changes',
                category: 'Chords',
                difficulty: 'Beginner',
                description: 'Smooth transitions between common open chords',
                instructions: '1. Practice G-C-D progression\n2. Strum once per chord\n3. Focus on clean chord shapes\n4. Gradually increase strumming pattern complexity',
                tempo: { min: 60, max: 120, recommended: 90 },
                duration: 10,
                tags: ['chords', 'open', 'rhythm', 'beginner'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            },
            {
                id: 'drill_chord_barre_1',
                title: 'Barre Chord Workout',
                category: 'Chords',
                difficulty: 'Intermediate',
                description: 'Build strength and accuracy with barre chords',
                instructions: '1. Start with F major shape\n2. Move chromatically up the neck\n3. Hold each chord for 4 beats\n4. Include minor shapes',
                tempo: { min: 40, max: 80, recommended: 60 },
                duration: 15,
                tags: ['chords', 'barre', 'strength', 'technique'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            },
            
            // Technique
            {
                id: 'drill_technique_picking_1',
                title: 'Alternate Picking Exercise',
                category: 'Technique',
                difficulty: 'Intermediate',
                description: 'Develop consistent alternate picking across strings',
                instructions: '1. Use chromatic pattern: 1-2-3-4 on each string\n2. Strict down-up picking\n3. Start on 6th string, work to 1st\n4. Reverse the pattern',
                tempo: { min: 60, max: 160, recommended: 100 },
                duration: 10,
                tags: ['technique', 'picking', 'speed', 'accuracy'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            },
            {
                id: 'drill_technique_legato_1',
                title: 'Legato Strength Builder',
                category: 'Technique',
                difficulty: 'Advanced',
                description: 'Build finger strength for hammer-ons and pull-offs',
                instructions: '1. Play 3-note-per-string patterns\n2. Pick only the first note per string\n3. Use hammer-ons ascending\n4. Use pull-offs descending',
                tempo: { min: 40, max: 100, recommended: 70 },
                duration: 15,
                tags: ['technique', 'legato', 'strength', 'advanced'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            },
            
            // Rhythm
            {
                id: 'drill_rhythm_strumming_1',
                title: '16th Note Strumming Patterns',
                category: 'Rhythm',
                difficulty: 'Intermediate',
                description: 'Master common 16th note strumming patterns',
                instructions: '1. Start with all downstrokes on quarter notes\n2. Add upstrokes on "e" and "a"\n3. Practice pattern: D-D-U-X-U-D-U\n4. Mute strings with left hand initially',
                tempo: { min: 60, max: 120, recommended: 80 },
                duration: 15,
                tags: ['rhythm', 'strumming', 'timing', '16th notes'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            },
            
            // Arpeggios
            {
                id: 'drill_arpeggio_triad_1',
                title: 'Major Triad Arpeggios',
                category: 'Arpeggios',
                difficulty: 'Intermediate',
                description: 'Practice major triad shapes across the neck',
                instructions: '1. Start with C major triad\n2. Play root-3rd-5th-3rd-root pattern\n3. Use sweep picking technique\n4. Move through all 12 keys',
                tempo: { min: 60, max: 140, recommended: 90 },
                duration: 20,
                tags: ['arpeggios', 'triads', 'sweep', 'major'],
                createdAt: new Date().toISOString(),
                isFavorite: false
            }
        ];
        
        await this.saveToLocalStorage();
    }

    async loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('guitarDrills');
            console.log('DrillsService: localStorage guitarDrills:', stored ? 'Found' : 'Not found');
            if (stored) {
                this.drills = JSON.parse(stored);
                console.log('DrillsService: Parsed drills from localStorage:', this.drills.length);
            }
        } catch (error) {
            console.error('Failed to load drills from localStorage:', error);
            this.drills = [];
        }
    }

    async saveToLocalStorage() {
        try {
            localStorage.setItem('guitarDrills', JSON.stringify(this.drills));
        } catch (error) {
            console.error('Failed to save drills to localStorage:', error);
        }
    }

    async syncWithFirebase() {
        try {
            if (!firebaseSyncService.isAuthenticated()) return;
            
            // Get drills from Firebase
            const snapshot = await firebaseSyncService.db
                .collection('drills')
                .where('userId', '==', firebaseSyncService.currentUser.uid)
                .get();
            
            const firebaseDrills = [];
            snapshot.forEach(doc => {
                firebaseDrills.push({ id: doc.id, ...doc.data() });
            });
            
            // Merge with local drills (local takes precedence for conflicts)
            const mergedDrills = [...this.drills];
            
            firebaseDrills.forEach(fbDrill => {
                const localIndex = mergedDrills.findIndex(d => d.id === fbDrill.id);
                if (localIndex === -1) {
                    mergedDrills.push(fbDrill);
                }
            });
            
            this.drills = mergedDrills;
            await this.saveToLocalStorage();
            
        } catch (error) {
            console.error('Failed to sync drills with Firebase:', error);
        }
    }

    // CRUD Operations
    async createDrill(drill) {
        await this.initPromise;
        
        const newDrill = {
            ...drill,
            id: `drill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: false
        };
        
        this.drills.push(newDrill);
        await this.saveToLocalStorage();
        
        // Save to Firebase if authenticated
        if (firebaseSyncService.isAuthenticated()) {
            try {
                await firebaseSyncService.db
                    .collection('drills')
                    .doc(newDrill.id)
                    .set({
                        ...newDrill,
                        userId: firebaseSyncService.currentUser.uid
                    });
            } catch (error) {
                console.error('Failed to save drill to Firebase:', error);
            }
        }
        
        return newDrill;
    }

    async updateDrill(id, updates) {
        await this.initPromise;
        
        const index = this.drills.findIndex(d => d.id === id);
        if (index === -1) {
            throw new Error('Drill not found');
        }
        
        this.drills[index] = {
            ...this.drills[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        await this.saveToLocalStorage();
        
        // Update in Firebase if authenticated
        if (firebaseSyncService.isAuthenticated()) {
            try {
                await firebaseSyncService.db
                    .collection('drills')
                    .doc(id)
                    .update({
                        ...updates,
                        updatedAt: new Date().toISOString()
                    });
            } catch (error) {
                console.error('Failed to update drill in Firebase:', error);
            }
        }
        
        return this.drills[index];
    }

    async deleteDrill(id) {
        await this.initPromise;
        
        const index = this.drills.findIndex(d => d.id === id);
        if (index === -1) {
            throw new Error('Drill not found');
        }
        
        this.drills.splice(index, 1);
        await this.saveToLocalStorage();
        
        // Delete from Firebase if authenticated
        if (firebaseSyncService.isAuthenticated()) {
            try {
                await firebaseSyncService.db
                    .collection('drills')
                    .doc(id)
                    .delete();
            } catch (error) {
                console.error('Failed to delete drill from Firebase:', error);
            }
        }
    }

    async toggleFavorite(id) {
        await this.initPromise;
        
        const drill = this.drills.find(d => d.id === id);
        if (!drill) {
            throw new Error('Drill not found');
        }
        
        drill.isFavorite = !drill.isFavorite;
        drill.updatedAt = new Date().toISOString();
        
        await this.saveToLocalStorage();
        
        // Update in Firebase if authenticated
        if (firebaseSyncService.isAuthenticated()) {
            try {
                await firebaseSyncService.db
                    .collection('drills')
                    .doc(id)
                    .update({
                        isFavorite: drill.isFavorite,
                        updatedAt: drill.updatedAt
                    });
            } catch (error) {
                console.error('Failed to update favorite in Firebase:', error);
            }
        }
        
        return drill;
    }

    // Search and Filter
    async searchDrills(query, filters = {}) {
        await this.initPromise;
        
        console.log('Searching drills, total available:', this.drills.length);
        let results = [...this.drills];
        
        // Text search
        if (query) {
            const searchTerms = query.toLowerCase().split(' ');
            results = results.filter(drill => {
                const searchableText = [
                    drill.title,
                    drill.description,
                    drill.instructions,
                    ...(drill.tags || [])
                ].join(' ').toLowerCase();
                
                return searchTerms.every(term => searchableText.includes(term));
            });
        }
        
        // Category filter
        if (filters.category) {
            results = results.filter(drill => drill.category === filters.category);
        }
        
        // Difficulty filter
        if (filters.difficulty) {
            results = results.filter(drill => drill.difficulty === filters.difficulty);
        }
        
        // Favorites filter
        if (filters.favoritesOnly) {
            results = results.filter(drill => drill.isFavorite);
        }
        
        // Duration filter
        if (filters.maxDuration) {
            results = results.filter(drill => drill.duration <= filters.maxDuration);
        }
        
        // Sort
        if (filters.sortBy) {
            results.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'difficulty':
                        const difficultyOrder = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2, 'Expert': 3 };
                        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                    case 'duration':
                        return a.duration - b.duration;
                    case 'newest':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'updated':
                        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
                    default:
                        return 0;
                }
            });
        }
        
        return results;
    }

    async getDrillById(id) {
        await this.initPromise;
        return this.drills.find(d => d.id === id);
    }

    async getDrillsByCategory(category) {
        await this.initPromise;
        return this.drills.filter(d => d.category === category);
    }

    async getFavoriteDrills() {
        await this.initPromise;
        return this.drills.filter(d => d.isFavorite);
    }

    getCategories() {
        return [...this.categories];
    }

    getDifficulties() {
        return [...this.difficulties];
    }

    // Practice session integration
    async startDrillSession(drillId) {
        await this.initPromise;
        
        const drill = this.drills.find(d => d.id === drillId);
        if (!drill) {
            throw new Error('Drill not found');
        }
        
        // Return drill data formatted for practice session
        return {
            practiceArea: 'Drills',
            notes: `${drill.title}\n\n${drill.instructions}`,
            tempo: drill.tempo?.recommended || 0,
            duration: drill.duration * 60, // Convert to seconds
            drillId: drill.id,
            drillData: drill
        };
    }
}

// Export singleton instance
export const drillsService = new DrillsService();
export default drillsService;