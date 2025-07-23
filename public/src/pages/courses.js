import courseService from '../services/courseService.js';
import { showToast } from '../utils/toast.js';
import { escapeHtml, sanitizeUrl } from '../utils/sanitizer.js';

class CoursesPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.courses = [];
        this.userProgress = {};
        this.selectedCourse = null;
        this.selectedLesson = null;
    }

    async render(container) {
        const html = `
            <div class="courses-container">
                <header class="courses-header">
                    <h1>Guitar Courses</h1>
                    <p>Structured lessons to improve your skills</p>
                </header>

                <div class="courses-content">
                    <div class="course-list" id="courseList">
                        <div class="loading">Loading courses...</div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add modals to body to ensure they're on top
        this.createModals();
        
        await this.init();
    }

    async init() {
        // Prevent multiple initializations
        if (this.initialized) return;
        this.initialized = true;
        
        window.coursesPage = this;
        await courseService.initializeDefaultCourses();
        await this.loadCourses();
    }

    async loadCourses() {
        try {
            this.courses = await courseService.getAllCourses();
            const user = this.authService.getCurrentUser();
            
            // Load progress for all courses
            if (user) {
                for (const course of this.courses) {
                    const progress = await courseService.getCourseProgress(user.id, course.id);
                    this.userProgress[course.id] = progress;
                }
            }

            this.renderCourseList();
        } catch (error) {
            console.error('Error loading courses:', error);
            showToast('Failed to load courses', 'error');
        }
    }

    renderCourseList() {
        const courseList = document.getElementById('courseList');
        
        if (this.courses.length === 0) {
            courseList.innerHTML = '<p class="no-courses">No courses available yet.</p>';
            return;
        }

        courseList.innerHTML = this.courses.map(course => {
            const progress = this.userProgress[course.id];
            const progressPercent = Math.min(100, Math.max(0, progress?.percentComplete || 0));
            
            return `
                <div class="course-card" data-course-id="${escapeHtml(course.id)}">
                    <div class="course-thumbnail">
                        ${course.thumbnail 
                            ? `<img src="${sanitizeUrl(course.thumbnail) || ''}" alt="${escapeHtml(course.title)}">`
                            : `<div class="placeholder-thumb">${this.getIcon(course.category)}</div>`
                        }
                        <div class="course-difficulty ${escapeHtml(course.difficulty)}">${escapeHtml(course.difficulty)}</div>
                    </div>
                    <div class="course-info">
                        <h3>${escapeHtml(course.title)}</h3>
                        <p>${escapeHtml(course.description)}</p>
                        <div class="course-meta">
                            <span class="lesson-count">${escapeHtml(course.lessons.length)} lessons</span>
                            <span class="duration">~${escapeHtml(course.estimatedHours)}h</span>
                        </div>
                        ${progress ? `
                            <div class="course-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <span class="progress-text">${escapeHtml(progress.completedLessons)}/${escapeHtml(progress.totalLessons)} completed</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click listeners to course cards
        courseList.querySelectorAll('.course-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Prevent multiple rapid clicks
                if (this.isOpening) return;
                
                const courseId = card.dataset.courseId;
                await this.openCourse(courseId);
            });
        });
    }

    async openCourse(courseId) {
        if (this.isOpening) return;
        this.isOpening = true;
        
        try {
            this.selectedCourse = await courseService.getCourse(courseId);
            
            if (!this.selectedCourse) {
                console.error('Course not found:', courseId);
                showToast('Course not found', 'error');
                return;
            }


            const modal = document.getElementById('courseModal');
            const title = document.getElementById('courseTitle');
            const content = document.getElementById('courseContent');

            if (!modal || !title || !content) {
                console.error('Modal elements not found');
                return;
            }

            title.textContent = this.selectedCourse.title;
            const courseDetailsHTML = await this.renderCourseDetails();
            content.innerHTML = courseDetailsHTML;
            

            modal.classList.add('open');
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
        } catch (error) {
            console.error('Error opening course:', error);
            showToast('Failed to open course', 'error');
        } finally {
            this.isOpening = false;
        }
    }

    async renderCourseDetails() {
        const user = this.authService.getCurrentUser();
        const progress = this.userProgress[this.selectedCourse.id];

        const lessonProgress = {};
        if (user) {
            const userProgress = await courseService.getUserProgress(user.id, this.selectedCourse.id);
            userProgress.forEach(p => {
                lessonProgress[p.lessonId] = p;
            });
        }

        return `
            <div class="course-details">
                <div class="course-overview">
                    <p>${this.selectedCourse.description}</p>
                    <div class="course-stats">
                        <div class="stat">
                            <span class="stat-value">${this.selectedCourse.lessons.length}</span>
                            <span class="stat-label">Lessons</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${this.selectedCourse.estimatedHours}h</span>
                            <span class="stat-label">Duration</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${progress?.percentComplete || 0}%</span>
                            <span class="stat-label">Complete</span>
                        </div>
                    </div>
                </div>

                <div class="lesson-list">
                    <h3>Lessons</h3>
                    ${this.selectedCourse.lessons.map((lesson, index) => {
                        const lessonProg = lessonProgress[lesson.id];
                        const isCompleted = lessonProg?.completed;
                        const isLocked = index > 0 && lesson.requiresPrevious && !lessonProgress[this.selectedCourse.lessons[index - 1].id]?.completed;
                        
                        return `
                            <div class="lesson-item ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}" 
                                 onclick="window.coursesPage.openLesson('${lesson.id}')"
                                 data-lesson-id="${lesson.id}">
                                <div class="lesson-number">${index + 1}</div>
                                <div class="lesson-info">
                                    <h4>${lesson.title}</h4>
                                    <p>${lesson.description}</p>
                                    ${lesson.goals.length > 0 ? `
                                        <span class="goal-count">${lesson.goals.length} practice goals</span>
                                    ` : ''}
                                </div>
                                <div class="lesson-status">
                                    ${isCompleted ? '✓' : isLocked ? '🔒' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    async openLesson(lessonId) {
        const user = this.authService.getCurrentUser();
        if (!user) {
            showToast('Please sign in to access lessons', 'error');
            return;
        }

        // Check if user can access this lesson
        const requirements = await courseService.checkLessonRequirements(
            user.id,
            this.selectedCourse.id,
            lessonId
        );

        if (!requirements.canAccess) {
            showToast(requirements.reason, 'error');
            return;
        }

        this.selectedLesson = this.selectedCourse.lessons.find(l => l.id === lessonId);
        if (!this.selectedLesson) {
            showToast('Lesson not found', 'error');
            return;
        }

        const modal = document.getElementById('lessonModal');
        const title = document.getElementById('lessonTitle');
        const content = document.getElementById('lessonContent');

        title.textContent = this.selectedLesson.title;
        content.innerHTML = await this.renderLessonContent();

        modal.classList.add('open');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    }

    async renderLessonContent() {
        const user = this.authService.getCurrentUser();
        const progress = await courseService.getLessonProgress(
            user.id,
            this.selectedCourse.id,
            this.selectedLesson.id
        );

        let contentHtml = '<div class="lesson-content">';

        // Render lesson sections
        for (const section of this.selectedLesson.content.sections) {
            switch (section.type) {
                case 'hero':
                    contentHtml += `
                        <div class="lesson-hero">
                            ${section.image ? `<img src="${section.image}" alt="${section.title}">` : ''}
                            <div class="hero-content">
                                <h1>${section.title}</h1>
                                ${section.subtitle ? `<p class="hero-subtitle">${section.subtitle}</p>` : ''}
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'text':
                    contentHtml += `<div class="lesson-text">${this.parseMarkdown(section.content)}</div>`;
                    break;
                    
                case 'image':
                    contentHtml += `
                        <div class="lesson-image">
                            <img src="${section.url}" alt="${section.alt || section.caption}">
                            ${section.caption ? `<p class="image-caption">${section.caption}</p>` : ''}
                        </div>
                    `;
                    break;
                    
                case 'tab':
                    contentHtml += `
                        <div class="guitar-tab">
                            ${section.title ? `<h4>${section.title}</h4>` : ''}
                            <pre>${section.content}</pre>
                        </div>
                    `;
                    break;
                    
                case 'exercise':
                    contentHtml += `
                        <div class="lesson-exercise">
                            <h3>${section.title}</h3>
                            ${section.content.description ? `<p>${section.content.description}</p>` : ''}
                            ${section.content.tab ? `<pre class="exercise-tab">${section.content.tab}</pre>` : ''}
                            ${section.content.tempo ? `<p class="exercise-tempo"><strong>Tempo:</strong> ${section.content.tempo}</p>` : ''}
                            ${section.content.focus ? `<p class="exercise-focus"><strong>Focus:</strong> ${section.content.focus}</p>` : ''}
                            ${section.content.steps ? `
                                <ol class="exercise-steps">
                                    ${section.content.steps.map(step => `<li>${step}</li>`).join('')}
                                </ol>
                            ` : ''}
                            ${section.content.challenge ? `<p class="exercise-challenge"><strong>Challenge:</strong> ${section.content.challenge}</p>` : ''}
                        </div>
                    `;
                    break;
                    
                case 'callout':
                    contentHtml += `
                        <div class="lesson-callout callout-${section.style}">
                            ${section.content}
                        </div>
                    `;
                    break;
                    
                case 'video':
                    contentHtml += `
                        <div class="lesson-video">
                            <div class="video-placeholder" data-embed-id="${section.embedId}">
                                <div class="video-thumbnail">
                                    <div class="play-button">▶</div>
                                    <p>${section.title}</p>
                                    <span class="video-duration">${section.duration}</span>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'practice':
                    contentHtml += `
                        <div class="lesson-practice">
                            <h3>${section.title}</h3>
                            <ul class="practice-points">
                                ${section.points.map(point => `<li>${point}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                    break;
                    
                case 'backing-track':
                    contentHtml += `
                        <div class="backing-track">
                            <h4>${section.title}</h4>
                            <div class="track-info">
                                <span>Key: ${section.key}</span>
                                <span>Tempo: ${section.tempo} BPM</span>
                                <span>Style: ${section.style}</span>
                                <span>Duration: ${section.duration}</span>
                            </div>
                            <button class="play-backing-track" onclick="window.coursesPage.playBackingTrack('${section.key}', ${section.tempo})">
                                Play Backing Track
                            </button>
                        </div>
                    `;
                    break;
                    
                case 'interactive':
                    contentHtml += `
                        <div class="lesson-interactive" data-component="${section.component}" data-config='${JSON.stringify(section.data)}'>
                            <div class="interactive-placeholder">Interactive ${section.component} component</div>
                        </div>
                    `;
                    break;
                    
                case 'diagram':
                    contentHtml += `<div class="lesson-diagram" data-diagram="${section.content}">Diagram: ${section.content}</div>`;
                    break;
            }
        }

        // Render practice goals
        if (this.selectedLesson.goals.length > 0) {
            contentHtml += `
                <div class="lesson-goals">
                    <h3>Practice Goals</h3>
                    ${this.selectedLesson.goals.map(goal => {
                        const isCompleted = progress?.goalsCompleted?.includes(goal.id);
                        return `
                            <div class="practice-goal ${isCompleted ? 'completed' : ''}" data-goal-id="${goal.id}">
                                <div class="goal-status">${isCompleted ? '✓' : '○'}</div>
                                <div class="goal-info">
                                    <p>${goal.description}</p>
                                    ${goal.type === 'metronome' ? `
                                        <div class="goal-details">
                                            <span>BPM: ${goal.bpm}</span>
                                            <span>Duration: ${goal.duration}s</span>
                                        </div>
                                        <button class="practice-btn" onclick="window.coursesPage.startMetronomePractice('${goal.id}', ${goal.bpm}, ${goal.duration})">
                                            Start Practice
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // Complete lesson button
        const allGoalsCompleted = this.selectedLesson.goals.every(g => 
            progress?.goalsCompleted?.includes(g.id)
        );

        if (!progress?.completed && (this.selectedLesson.goals.length === 0 || allGoalsCompleted)) {
            contentHtml += `
                <div class="lesson-actions">
                    <button class="complete-lesson-btn" onclick="window.coursesPage.completeLesson()">
                        Complete Lesson
                    </button>
                </div>
            `;
        }

        contentHtml += '</div>';
        return contentHtml;
    }

    async startMetronomePractice(goalId, bpm, duration) {
        try {
            // Import metronome component
            const { default: metronome } = await import('../components/metronome.js');
            
            // Configure metronome for this goal
            metronome.setBPM(bpm);
            metronome.start();

            // Track practice time
            let timeElapsed = 0;
            const timer = setInterval(() => {
                timeElapsed++;
                
                if (timeElapsed >= duration) {
                    clearInterval(timer);
                    metronome.stop();
                    this.completeGoal(goalId);
                    showToast('Goal completed! Well done!', 'success');
                }
            }, 1000);

            // Show practice overlay
            this.showPracticeOverlay(goalId, bpm, duration, timer);

        } catch (error) {
            console.error('Error starting metronome practice:', error);
            showToast('Failed to start metronome', 'error');
        }
    }

    showPracticeOverlay(goalId, bpm, duration, timer) {
        const overlay = document.createElement('div');
        overlay.className = 'practice-overlay';
        overlay.innerHTML = `
            <div class="practice-modal">
                <h3>Metronome Practice</h3>
                <p>BPM: ${bpm}</p>
                <div class="practice-timer" id="practiceTimer">0 / ${duration}s</div>
                <button onclick="window.coursesPage.stopPractice('${timer}')">Stop</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Update timer display
        let elapsed = 0;
        const updateTimer = setInterval(() => {
            elapsed++;
            document.getElementById('practiceTimer').textContent = `${elapsed} / ${duration}s`;
            
            if (elapsed >= duration) {
                clearInterval(updateTimer);
                overlay.remove();
            }
        }, 1000);

        overlay.dataset.updateTimer = updateTimer;
    }

    stopPractice(timerId) {
        clearInterval(timerId);
        const overlay = document.querySelector('.practice-overlay');
        if (overlay) {
            clearInterval(overlay.dataset.updateTimer);
            overlay.remove();
        }

        // Stop metronome
        import('../components/metronome.js').then(({ default: metronome }) => {
            metronome.stop();
        });
    }

    async completeGoal(goalId) {
        const user = this.authService.getCurrentUser();
        const progress = await courseService.getLessonProgress(
            user.id,
            this.selectedCourse.id,
            this.selectedLesson.id
        ) || { goalsCompleted: [] };

        if (!progress.goalsCompleted.includes(goalId)) {
            progress.goalsCompleted.push(goalId);
            
            await courseService.saveProgress({
                userId: user.id,
                courseId: this.selectedCourse.id,
                lessonId: this.selectedLesson.id,
                goalsCompleted: progress.goalsCompleted,
                completed: false
            });

            // Update UI
            const goalElement = document.querySelector(`[data-goal-id="${goalId}"]`);
            if (goalElement) {
                goalElement.classList.add('completed');
                goalElement.querySelector('.goal-status').textContent = '✓';
            }

            // Check if all goals are completed
            const allCompleted = this.selectedLesson.goals.every(g => 
                progress.goalsCompleted.includes(g.id)
            );

            if (allCompleted && this.selectedLesson.goals.length > 0) {
                this.renderLessonContent();
            }
        }
    }

    async completeLesson() {
        const user = this.authService.getCurrentUser();
        await courseService.completeLesson(
            user.id,
            this.selectedCourse.id,
            this.selectedLesson.id
        );

        showToast('Lesson completed! Great work!', 'success');
        
        // Refresh course details
        await this.loadCourses();
        await this.renderCourseDetails();
        
        // Close lesson modal
        this.closeLessonModal();
    }

    parseMarkdown(text) {
        // Simple markdown parser
        return text
            .replace(/# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/- (.*?)$/gm, '<li>$1</li>')
            .replace(/(\d+)\. (.*?)$/gm, '<li>$1. $2</li>');
    }

    getIcon(category) {
        const icons = {
            scales: '🎸',
            chords: '🎵',
            theory: '📚',
            technique: '🎯',
            songs: '🎼'
        };
        return icons[category] || '🎸';
    }
    
    createModals() {
        // Remove existing modals if they exist
        const existingCourseModal = document.getElementById('courseModal');
        const existingLessonModal = document.getElementById('lessonModal');
        if (existingCourseModal) existingCourseModal.remove();
        if (existingLessonModal) existingLessonModal.remove();
        
        // Create modal HTML
        const modalsHtml = `
            <!-- Course Detail Modal -->
            <div id="courseModal" class="modal course-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="courseTitle"></h2>
                        <button class="close-btn" onclick="window.coursesPage.closeCourseModal()">×</button>
                    </div>
                    <div class="modal-body" id="courseContent">
                        <!-- Course content will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Lesson Modal -->
            <div id="lessonModal" class="modal lesson-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <button class="back-btn" onclick="window.coursesPage.backToCourse()">← Back</button>
                        <h2 id="lessonTitle"></h2>
                        <button class="close-btn" onclick="window.coursesPage.closeLessonModal()">×</button>
                    </div>
                    <div class="modal-body" id="lessonContent">
                        <!-- Lesson content will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        // Add modals to body
        document.body.insertAdjacentHTML('beforeend', modalsHtml);
    }

    closeCourseModal() {
        const modal = document.getElementById('courseModal');
        if (modal) {
            modal.classList.remove('open');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
        }
        this.selectedCourse = null;
    }

    closeLessonModal() {
        const modal = document.getElementById('lessonModal');
        if (modal) {
            modal.classList.remove('open');
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
        }
        this.selectedLesson = null;
    }

    backToCourse() {
        this.closeLessonModal();
        // Refresh course content to show updated progress
        this.renderCourseDetails();
    }

    playBackingTrack(key, tempo) {
        // Placeholder for backing track functionality
        showToast(`Playing backing track in ${key} at ${tempo} BPM`, 'info');
        
        // In a real implementation, this would:
        // 1. Load an audio file or generate a backing track
        // 2. Set the tempo using Web Audio API
        // 3. Play the track with proper time sync
    }
    
    cleanup() {
        // Remove modals when leaving the page
        const courseModal = document.getElementById('courseModal');
        const lessonModal = document.getElementById('lessonModal');
        if (courseModal) courseModal.remove();
        if (lessonModal) lessonModal.remove();
        
        // Clear window reference
        if (window.coursesPage === this) {
            window.coursesPage = null;
        }
    }
}

export default CoursesPage;