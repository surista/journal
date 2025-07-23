const COURSES_STORE = 'courses';
const PROGRESS_STORE = 'courseProgress';
const DB_VERSION = 1;

class CourseService {
    constructor() {
        this.dbName = 'CourseDB';
        this.db = null;
        this.initPromise = this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Courses store
                if (!db.objectStoreNames.contains(COURSES_STORE)) {
                    const courseStore = db.createObjectStore(COURSES_STORE, { keyPath: 'id' });
                    courseStore.createIndex('category', 'category', { unique: false });
                    courseStore.createIndex('difficulty', 'difficulty', { unique: false });
                }

                // Progress store
                if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
                    const progressStore = db.createObjectStore(PROGRESS_STORE, { keyPath: 'id', autoIncrement: true });
                    progressStore.createIndex('courseId', 'courseId', { unique: false });
                    progressStore.createIndex('lessonId', 'lessonId', { unique: false });
                    progressStore.createIndex('userId', 'userId', { unique: false });
                    progressStore.createIndex('composite', ['userId', 'courseId', 'lessonId'], { unique: true });
                }
            };
        });
    }

    async getDB() {
        if (!this.db) {
            await this.initPromise;
        }
        return this.db;
    }

    // Course CRUD operations
    async getAllCourses() {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([COURSES_STORE], 'readonly');
            const store = transaction.objectStore(COURSES_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getCourse(courseId) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([COURSES_STORE], 'readonly');
            const store = transaction.objectStore(COURSES_STORE);
            const request = store.get(courseId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveCourse(course) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([COURSES_STORE], 'readwrite');
            const store = transaction.objectStore(COURSES_STORE);
            const request = store.put(course);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCourse(courseId) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([COURSES_STORE], 'readwrite');
            const store = transaction.objectStore(COURSES_STORE);
            const request = store.delete(courseId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Progress tracking
    async getUserProgress(userId, courseId = null) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROGRESS_STORE], 'readonly');
            const store = transaction.objectStore(PROGRESS_STORE);
            const index = courseId 
                ? store.index('composite')
                : store.index('userId');
            
            const key = courseId ? [userId, courseId] : userId;
            const request = index.getAll(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getLessonProgress(userId, courseId, lessonId) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROGRESS_STORE], 'readonly');
            const store = transaction.objectStore(PROGRESS_STORE);
            const index = store.index('composite');
            const request = index.get([userId, courseId, lessonId]);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveProgress(progressData) {
        const existing = await this.getLessonProgress(
            progressData.userId,
            progressData.courseId,
            progressData.lessonId
        );

        if (existing) {
            progressData.id = existing.id;
        }

        progressData.lastUpdated = new Date().toISOString();
        
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROGRESS_STORE], 'readwrite');
            const store = transaction.objectStore(PROGRESS_STORE);
            const request = store.put(progressData);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async completeLesson(userId, courseId, lessonId, data = {}) {
        const progressData = {
            userId,
            courseId,
            lessonId,
            completed: true,
            completedAt: new Date().toISOString(),
            ...data
        };

        await this.saveProgress(progressData);

        // Check if next lesson should be unlocked
        const course = await this.getCourse(courseId);
        if (course) {
            const currentLessonIndex = course.lessons.findIndex(l => l.id === lessonId);
            if (currentLessonIndex !== -1 && currentLessonIndex < course.lessons.length - 1) {
                const nextLesson = course.lessons[currentLessonIndex + 1];
                if (nextLesson.requiresPrevious) {
                    // Unlock next lesson
                    await this.saveProgress({
                        userId,
                        courseId,
                        lessonId: nextLesson.id,
                        unlocked: true,
                        completed: false
                    });
                }
            }
        }

        return progressData;
    }

    // Check if user meets lesson requirements
    async checkLessonRequirements(userId, courseId, lessonId) {
        const course = await this.getCourse(courseId);
        if (!course) return { canAccess: false, reason: 'Course not found' };

        const lesson = course.lessons.find(l => l.id === lessonId);
        if (!lesson) return { canAccess: false, reason: 'Lesson not found' };

        // First lesson is always accessible
        const lessonIndex = course.lessons.findIndex(l => l.id === lessonId);
        if (lessonIndex === 0) return { canAccess: true };

        // Check if previous lesson is completed
        if (lesson.requiresPrevious && lessonIndex > 0) {
            const prevLesson = course.lessons[lessonIndex - 1];
            const prevProgress = await this.getLessonProgress(userId, courseId, prevLesson.id);
            
            if (!prevProgress || !prevProgress.completed) {
                return { 
                    canAccess: false, 
                    reason: `Complete "${prevLesson.title}" first`,
                    requiredLesson: prevLesson.id
                };
            }
        }

        return { canAccess: true };
    }

    // Get overall course progress
    async getCourseProgress(userId, courseId) {
        const course = await this.getCourse(courseId);
        if (!course) return null;

        const progress = await this.getUserProgress(userId, courseId);
        const completedLessons = progress.filter(p => p.completed).length;
        const totalLessons = course.lessons.length;
        
        return {
            courseId,
            completedLessons,
            totalLessons,
            percentComplete: Math.round((completedLessons / totalLessons) * 100),
            lastActivity: progress.length > 0 
                ? Math.max(...progress.map(p => new Date(p.lastUpdated).getTime()))
                : null
        };
    }

    // Initialize default courses
    async initializeDefaultCourses() {
        try {
            const existingCourses = await this.getAllCourses();
            console.log('Existing courses:', existingCourses.length);
            
            // Always update the courses to get latest changes
            const pentatonicCourse = await this.getPentatonicScaleCourse();
            await this.saveCourse(pentatonicCourse);
            
            const sweepPickingCourse = await this.getSweepPickingCourse();
            await this.saveCourse(sweepPickingCourse);
            
            console.log('Courses updated with latest data');
        } catch (error) {
            console.error('Error initializing courses:', error);
        }
    }

    async getPentatonicScaleCourse() {
        // Import comprehensive lessons
        const pentatonicModule = await import('../data/pentatonicLessons.js');
        const pentatonicLessons = pentatonicModule.default || pentatonicModule.pentatonicLessons;
        
        return {
            id: 'pentatonic-scale-mastery',
            title: 'Pentatonic Scale Mastery',
            description: 'Master the pentatonic scale for soloing and improvisation',
            category: 'scales',
            difficulty: 'beginner',
            estimatedHours: 20,
            thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
            lessons: pentatonicLessons
        };
    }

    async getSweepPickingCourse() {
        // Import sweep picking lessons
        const sweepModule = await import('../data/sweepPickingLessons.js');
        const sweepPickingLessons = sweepModule.default || sweepModule.sweepPickingLessons;
        
        return {
            id: 'sweep-picking-mastery',
            title: 'Sweep Picking Mastery',
            description: 'Master sweep picking technique for lightning-fast arpeggios',
            category: 'technique',
            difficulty: 'intermediate',
            estimatedHours: 16,
            thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop',
            lessons: sweepPickingLessons
        };
    }
}

export default new CourseService();