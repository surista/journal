// Daily Practice Suggestion Component - Shows one dismissible suggestion per day
import { getRecommendationService } from '../services/recommendationService.js';

export class DailyPracticeSuggestion {
    constructor(storageService) {
        this.storageService = storageService;
        this.recommendationService = getRecommendationService(storageService);
        this.container = null;
        this.currentSuggestion = null;
    }

    async init(container) {
        this.container = container;
        
        // Check if suggestion was already dismissed today
        if (this.wasDismissedToday()) {
            this.container.innerHTML = '';
            return;
        }

        await this.loadSuggestion();
        this.render();
    }

    wasDismissedToday() {
        const dismissedDate = localStorage.getItem('practiceSuggestionDismissed');
        if (!dismissedDate) return false;
        
        const today = new Date().toDateString();
        return dismissedDate === today;
    }

    dismissSuggestion() {
        const today = new Date().toDateString();
        localStorage.setItem('practiceSuggestionDismissed', today);
        
        // Animate out and remove
        const suggestionEl = this.container.querySelector('.daily-practice-suggestion');
        if (suggestionEl) {
            suggestionEl.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                this.container.innerHTML = '';
            }, 300);
        }
    }

    async loadSuggestion() {
        try {
            const recommendations = await this.recommendationService.getRecommendations();
            
            // Combine all recommendations and pick the most relevant one
            const allSuggestions = [];
            
            // Priority 1: Repertoire that needs practice
            if (recommendations.repertoire.length > 0) {
                allSuggestions.push({
                    type: 'repertoire',
                    priority: 1,
                    ...recommendations.repertoire[0]
                });
            }
            
            // Priority 2: Goals that need attention
            if (recommendations.goals.length > 0) {
                allSuggestions.push({
                    type: 'goal',
                    priority: 2,
                    ...recommendations.goals[0]
                });
            }
            
            // Priority 3: General practice suggestions
            if (recommendations.general.length > 0) {
                allSuggestions.push({
                    type: 'general',
                    priority: 3,
                    ...recommendations.general[0]
                });
            }
            
            // If no specific suggestions, provide a default one
            if (allSuggestions.length === 0) {
                this.currentSuggestion = this.getDefaultSuggestion();
            } else {
                // Pick the highest priority suggestion
                this.currentSuggestion = allSuggestions.sort((a, b) => a.priority - b.priority)[0];
            }
            
        } catch (error) {
            console.error('Error loading suggestion:', error);
            this.currentSuggestion = this.getDefaultSuggestion();
        }
    }

    async getDefaultSuggestion() {
        // Get user's custom session areas
        let sessionAreas = [];
        try {
            sessionAreas = await this.storageService.getSessionAreas();
        } catch (error) {
            console.error('Error loading session areas:', error);
            sessionAreas = [];
        }
        
        // Create suggestions based on user's session areas
        const suggestions = [];
        
        // Always include a warmup suggestion
        suggestions.push({
            type: 'warmup',
            title: 'Start with a Warm-up',
            description: 'Begin your practice with 5-10 minutes of finger exercises and stretches to prevent injury and improve dexterity.',
            icon: '🤸',
            actionText: 'Start Warm-up Timer',
            exercises: [
                { name: 'Finger stretches', duration: 2 },
                { name: 'Chromatic runs', duration: 3 },
                { name: 'Spider exercise', duration: 5 }
            ]
        });
        
        // Add suggestions based on user's session areas
        sessionAreas.forEach(area => {
            const areaLower = area.toLowerCase();
            
            if (areaLower.includes('scale')) {
                suggestions.push({
                    type: 'scales',
                    title: `${area} Practice`,
                    description: 'Focus on scales in different positions. This builds muscle memory and improves your fretboard knowledge.',
                    icon: '🎼',
                    actionText: `Practice ${area}`,
                    exercises: [
                        { name: 'Major scales - 5 positions', duration: 10 },
                        { name: 'Minor scales - 5 positions', duration: 10 },
                        { name: 'Scale sequences', duration: 10 }
                    ]
                });
            } else if (areaLower.includes('chord')) {
                suggestions.push({
                    type: 'chords',
                    title: `${area} Practice`,
                    description: 'Work on chord shapes, transitions, and voicings to improve your rhythm playing.',
                    icon: '🎸',
                    actionText: `Practice ${area}`,
                    exercises: [
                        { name: 'Open chord transitions', duration: 10 },
                        { name: 'Barre chord practice', duration: 10 },
                        { name: 'Chord progressions', duration: 10 }
                    ]
                });
            } else if (areaLower.includes('rhythm')) {
                suggestions.push({
                    type: 'rhythm',
                    title: `${area} Focus`,
                    description: 'Work on your timing with a metronome. Start slow and gradually increase tempo while maintaining accuracy.',
                    icon: '🥁',
                    actionText: 'Start Metronome',
                    exercises: [
                        { name: 'Quarter note exercises', duration: 5 },
                        { name: 'Syncopation patterns', duration: 10 },
                        { name: 'Strumming patterns', duration: 10 }
                    ]
                });
            } else if (areaLower.includes('technique')) {
                suggestions.push({
                    type: 'technique',
                    title: `${area} Building`,
                    description: 'Dedicate time to specific techniques to expand your playing abilities.',
                    icon: '🎸',
                    actionText: `Work on ${area}`,
                    exercises: [
                        { name: 'String bending exercises', duration: 10 },
                        { name: 'Vibrato practice', duration: 5 },
                        { name: 'Hammer-ons and pull-offs', duration: 10 }
                    ]
                });
            } else if (areaLower.includes('ear')) {
                suggestions.push({
                    type: 'ear',
                    title: `${area} Session`,
                    description: 'Develop your musical ear by playing along to songs or working on interval recognition.',
                    icon: '👂',
                    actionText: `Start ${area}`,
                    exercises: [
                        { name: 'Interval recognition', duration: 10 },
                        { name: 'Chord identification', duration: 10 },
                        { name: 'Melody transcription', duration: 10 }
                    ]
                });
            } else if (areaLower.includes('arpeggio')) {
                suggestions.push({
                    type: 'arpeggios',
                    title: `${area} Practice`,
                    description: 'Work on broken chord patterns to improve your finger independence and melodic playing.',
                    icon: '🎵',
                    actionText: `Practice ${area}`,
                    exercises: [
                        { name: 'Basic triad arpeggios', duration: 10 },
                        { name: 'Seventh chord arpeggios', duration: 10 },
                        { name: 'Arpeggio sequences', duration: 10 }
                    ]
                });
            } else {
                // Generic suggestion for custom areas
                suggestions.push({
                    type: 'custom',
                    title: `${area} Practice`,
                    description: `Focus on improving your ${area} skills with dedicated practice time.`,
                    icon: '🎵',
                    actionText: `Practice ${area}`,
                    exercises: [
                        { name: `${area} fundamentals`, duration: 10 },
                        { name: `${area} exercises`, duration: 10 },
                        { name: `${area} application`, duration: 10 }
                    ],
                    practiceArea: area
                });
            }
        });
        
        // If no suggestions were created from session areas, use defaults
        if (suggestions.length === 1) { // Only warmup
            suggestions.push(
                {
                    type: 'scales',
                    title: 'Scale Practice Day',
                    description: 'Focus on major and minor scales in different positions.',
                    icon: '🎼',
                    actionText: 'Practice Scales',
                    exercises: [
                        { name: 'Major scales - 5 positions', duration: 10 },
                        { name: 'Minor scales - 5 positions', duration: 10 },
                        { name: 'Scale sequences', duration: 10 }
                    ]
                },
                {
                    type: 'technique',
                    title: 'Technique Building',
                    description: 'Dedicate time to specific techniques.',
                    icon: '🎸',
                    actionText: 'Work on Technique',
                    exercises: [
                        { name: 'String bending exercises', duration: 10 },
                        { name: 'Vibrato practice', duration: 5 },
                        { name: 'Hammer-ons and pull-offs', duration: 10 }
                    ]
                }
            );
        }
        
        // Pick a random suggestion based on the day
        const dayIndex = new Date().getDate() % suggestions.length;
        return suggestions[dayIndex];
    }

    async render() {
        if (!this.container || !this.currentSuggestion) return;

        // Make sure we have a current suggestion
        if (!this.currentSuggestion) {
            this.currentSuggestion = await this.getDefaultSuggestion();
        }

        const totalDuration = this.currentSuggestion.exercises
            ? this.currentSuggestion.exercises.reduce((sum, ex) => sum + ex.duration, 0)
            : 0;

        this.container.innerHTML = `
            <div class="daily-practice-suggestion">
                <button class="dismiss-btn" aria-label="Dismiss suggestion">×</button>
                <div class="suggestion-header">
                    <span class="suggestion-icon">${this.currentSuggestion.icon || '💡'}</span>
                    <h3 class="suggestion-title">Today's Practice Suggestion</h3>
                </div>
                <div class="suggestion-content">
                    <h4>${this.currentSuggestion.title}</h4>
                    <p class="suggestion-description">${this.currentSuggestion.description}</p>
                    ${this.currentSuggestion.exercises ? `
                        <div class="suggested-exercises">
                            <h5>Suggested Routine (${totalDuration} min):</h5>
                            <ul class="exercise-list">
                                ${this.currentSuggestion.exercises.map(ex => `
                                    <li class="exercise-item">
                                        <span class="exercise-name">${ex.name}</span>
                                        <span class="exercise-duration">${ex.duration} min</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    <button class="btn btn-primary start-suggestion-btn">
                        ${this.currentSuggestion.actionText || 'Start Practice'}
                    </button>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Dismiss button
        const dismissBtn = this.container.querySelector('.dismiss-btn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismissSuggestion());
        }

        // Start practice button
        const startBtn = this.container.querySelector('.start-suggestion-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.handleStartPractice();
                this.dismissSuggestion();
            });
        }
    }

    handleStartPractice() {
        const suggestion = this.currentSuggestion;
        
        if (suggestion.type === 'repertoire' && suggestion.relatedItem) {
            // Navigate to repertoire tab
            window.location.hash = '#repertoire';
            window.dispatchEvent(new CustomEvent('selectRepertoireItem', {
                detail: { itemId: suggestion.relatedItem.id }
            }));
        } else if (suggestion.type === 'goal' && suggestion.exercises) {
            // Start exercise routine
            window.dispatchEvent(new CustomEvent('startExerciseRoutine', {
                detail: { exercises: suggestion.exercises }
            }));
        } else if (suggestion.type === 'rhythm') {
            // Open metronome
            window.dispatchEvent(new CustomEvent('openMetronome'));
        } else {
            // Default: start a general practice session
            window.dispatchEvent(new CustomEvent('startPracticeSession', {
                detail: { 
                    practiceArea: suggestion.practiceArea || suggestion.title,
                    exercises: suggestion.exercises 
                }
            }));
        }
    }

    async refresh() {
        if (!this.wasDismissedToday()) {
            await this.loadSuggestion();
            this.render();
        }
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// CSS for the daily suggestion (add to components.css)
const dailySuggestionStyles = `
.daily-practice-suggestion {
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.3s ease;
}

.dismiss-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 24px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.dismiss-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
}

.suggestion-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.suggestion-icon {
    font-size: 1.5rem;
}

.suggestion-title {
    margin: 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.9;
}

.suggestion-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
}

.suggestion-description {
    margin: 0 0 1rem 0;
    opacity: 0.95;
    line-height: 1.5;
}

.suggested-exercises {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.suggested-exercises h5 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    opacity: 0.9;
}

.exercise-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.exercise-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.exercise-item:last-child {
    border-bottom: none;
}

.exercise-name {
    opacity: 0.95;
}

.exercise-duration {
    font-size: 0.85rem;
    opacity: 0.8;
}

.start-suggestion-btn {
    background: white;
    color: var(--primary);
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.start-suggestion-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
}

@media (max-width: 768px) {
    .daily-practice-suggestion {
        padding: 1.25rem;
    }
    
    .suggestion-content h4 {
        font-size: 1.1rem;
    }
    
    .suggestion-description {
        font-size: 0.9rem;
    }
}`;