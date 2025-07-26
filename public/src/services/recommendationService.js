// Exercise Recommendation Service
export class RecommendationService {
    constructor(storageService) {
        this.storageService = storageService;
        this.sessionAreas = null; // Will be loaded dynamically
        this.exercises = {
            scales: [
                {
                    name: 'Major Scale Pattern',
                    difficulty: 'beginner',
                    focus: 'technique',
                    duration: 10
                },
                {
                    name: 'Minor Pentatonic Box Shapes',
                    difficulty: 'beginner',
                    focus: 'improvisation',
                    duration: 15
                },
                {
                    name: 'Three-Note-Per-String Scales',
                    difficulty: 'intermediate',
                    focus: 'speed',
                    duration: 20
                },
                {
                    name: 'Modal Scale Practice',
                    difficulty: 'advanced',
                    focus: 'theory',
                    duration: 25
                }
            ],
            chords: [
                {
                    name: 'Open Chord Transitions',
                    difficulty: 'beginner',
                    focus: 'rhythm',
                    duration: 10
                },
                {
                    name: 'Barre Chord Workout',
                    difficulty: 'intermediate',
                    focus: 'strength',
                    duration: 15
                },
                {
                    name: 'Jazz Chord Voicings',
                    difficulty: 'advanced',
                    focus: 'harmony',
                    duration: 20
                },
                {
                    name: 'Quick Chord Changes',
                    difficulty: 'intermediate',
                    focus: 'speed',
                    duration: 10
                }
            ],
            arpeggios: [
                {
                    name: 'Basic Triad Arpeggios',
                    difficulty: 'beginner',
                    focus: 'technique',
                    duration: 15
                },
                {
                    name: 'Sweep Picking Patterns',
                    difficulty: 'advanced',
                    focus: 'speed',
                    duration: 20
                },
                {
                    name: '7th Chord Arpeggios',
                    difficulty: 'intermediate',
                    focus: 'theory',
                    duration: 20
                }
            ],
            technique: [
                {
                    name: 'Alternate Picking Exercise',
                    difficulty: 'beginner',
                    focus: 'speed',
                    duration: 10
                },
                {
                    name: 'Legato Runs',
                    difficulty: 'intermediate',
                    focus: 'fluidity',
                    duration: 15
                },
                {
                    name: 'String Skipping Patterns',
                    difficulty: 'advanced',
                    focus: 'accuracy',
                    duration: 20
                },
                {
                    name: 'Finger Independence Drill',
                    difficulty: 'intermediate',
                    focus: 'dexterity',
                    duration: 15
                }
            ],
            rhythm: [
                {
                    name: 'Metronome Timing Exercise',
                    difficulty: 'beginner',
                    focus: 'timing',
                    duration: 10
                },
                {
                    name: 'Syncopated Rhythm Patterns',
                    difficulty: 'intermediate',
                    focus: 'groove',
                    duration: 15
                },
                {
                    name: 'Odd Time Signatures',
                    difficulty: 'advanced',
                    focus: 'counting',
                    duration: 20
                }
            ],
            earTraining: [
                {
                    name: 'Interval Recognition',
                    difficulty: 'beginner',
                    focus: 'listening',
                    duration: 15
                },
                {
                    name: 'Chord Progression Identification',
                    difficulty: 'intermediate',
                    focus: 'harmony',
                    duration: 20
                },
                {
                    name: 'Transcribe Simple Melodies',
                    difficulty: 'intermediate',
                    focus: 'listening',
                    duration: 25
                }
            ]
        };
    }

    async loadSessionAreas() {
        if (!this.sessionAreas) {
            this.sessionAreas = await this.storageService.getSessionAreas();
        }
        return this.sessionAreas;
    }

    async getRecommendations() {
        // Ensure session areas are loaded
        await this.loadSessionAreas();

        const recommendations = {
            repertoire: [],
            goals: [],
            general: []
        };

        // Get current repertoire items that need work
        const repertoire = await this.storageService.getRepertoire();
        const learningItems = repertoire.filter(
            (item) => item.status === 'learning' || item.status === 'polishing'
        );

        // Get active goals
        const goals = await this.storageService.getGoals();
        const activeGoals = goals.filter((goal) => !goal.completed);

        // Generate repertoire-based recommendations
        for (const item of learningItems.slice(0, 3)) {
            // Top 3 items
            const recommendation = await this.getRepertoireRecommendation(item);
            if (recommendation) {
                recommendations.repertoire.push(recommendation);
            }
        }

        // Generate goal-based recommendations
        for (const goal of activeGoals.slice(0, 3)) {
            // Top 3 goals
            const recommendation = this.getGoalRecommendation(goal);
            if (recommendation) {
                recommendations.goals.push(recommendation);
            }
        }

        // Generate general recommendations based on practice history
        const practiceHistory = await this.storageService.getPracticeEntries();
        const generalRecs = this.getGeneralRecommendations(practiceHistory);
        recommendations.general = generalRecs;

        return recommendations;
    }

    async getRepertoireRecommendation(item) {
        // Analyze what the song needs
        const recommendations = [];

        if (item.status === 'learning') {
            // For learning songs, focus on breaking it down
            recommendations.push({
                type: 'repertoire',
                title: `Work on "${item.title}"`,
                description: 'Practice slowly with metronome, focusing on difficult sections',
                exercises: [
                    { name: 'Slow Practice (50% tempo)', duration: 15, focus: 'accuracy' },
                    { name: 'Loop Difficult Sections', duration: 10, focus: 'problem-solving' },
                    { name: 'Practice Transitions', duration: 10, focus: 'fluidity' }
                ],
                relatedItem: item
            });
        } else if (item.status === 'polishing') {
            // For polishing, focus on performance
            recommendations.push({
                type: 'repertoire',
                title: `Polish "${item.title}"`,
                description: 'Refine dynamics, timing, and expression',
                exercises: [
                    {
                        name: 'Full Play-Through',
                        duration: item.duration || 5,
                        focus: 'performance'
                    },
                    { name: 'Record and Review', duration: 10, focus: 'self-assessment' },
                    { name: 'Dynamic Expression Practice', duration: 10, focus: 'musicality' }
                ],
                relatedItem: item
            });
        }

        // Add technique exercises based on song difficulty
        if (item.difficulty === 'hard' || item.difficulty === 'expert') {
            const techniqueExercise = this.getRandomExercise('technique', 'advanced');
            if (techniqueExercise) {
                recommendations[0].exercises.push({
                    ...techniqueExercise,
                    name: `Warmup: ${techniqueExercise.name}`
                });
            }
        }

        return recommendations[0];
    }

    getGoalRecommendation(goal) {
        // Ensure goal has the required properties
        if (!goal || !goal.goal || typeof goal.goal !== 'string') {
            console.warn('Invalid goal object:', goal);
            return null;
        }

        const exercisesByArea = {
            'Master barre chords': ['chords', 'intermediate'],
            'Improve speed': ['technique', 'intermediate'],
            'Learn scales': ['scales', 'beginner'],
            'Better rhythm': ['rhythm', 'intermediate'],
            'Music theory': ['scales', 'advanced'],
            'Ear training': ['earTraining', 'intermediate'],
            Fingerpicking: ['arpeggios', 'intermediate']
        };

        // Find matching exercise category
        let category = 'technique';
        let difficulty = 'intermediate';

        const goalText = goal.goal.toLowerCase();
        for (const [keyword, [cat, diff]] of Object.entries(exercisesByArea)) {
            if (goalText.includes(keyword.toLowerCase())) {
                category = cat;
                difficulty = diff;
                break;
            }
        }

        const exercises = this.getExerciseSet(category, difficulty, 3);

        return {
            type: 'goal',
            title: `Goal: ${goal.goal}`,
            description: `Exercises to help achieve your goal`,
            exercises: exercises,
            relatedGoal: goal,
            estimatedDuration: exercises.reduce((sum, ex) => sum + ex.duration, 0)
        };
    }

    getGeneralRecommendations(practiceHistory) {
        const recommendations = [];

        // Analyze practice patterns
        const recentPractice = practiceHistory.slice(-30); // Last 30 sessions
        const practicedAreas = {};

        recentPractice.forEach((session) => {
            if (session.practiceArea) {
                practicedAreas[session.practiceArea] =
                    (practicedAreas[session.practiceArea] || 0) + 1;
            }
        });

        // Find least practiced areas from user's custom session areas
        const allAreas = this.sessionAreas || [];
        const neglectedAreas = allAreas.filter(
            (area) => !practicedAreas[area] || practicedAreas[area] < 3
        );

        // Recommend neglected areas
        if (neglectedAreas.length > 0) {
            const area = neglectedAreas[0];
            const category = area.toLowerCase().replace(' ', '');
            const exercises = this.getExerciseSet(category, 'intermediate', 3);

            recommendations.push({
                type: 'balance',
                title: `Focus on ${area}`,
                description: `You haven't practiced ${area} much recently`,
                exercises: exercises,
                priority: 'high'
            });
        }

        // Daily warmup recommendation
        recommendations.push({
            type: 'warmup',
            title: 'Daily Warmup Routine',
            description: 'Start your practice with these exercises',
            exercises: [
                this.getRandomExercise('scales', 'beginner'),
                this.getRandomExercise('technique', 'beginner'),
                this.getRandomExercise('chords', 'beginner')
            ].filter(Boolean),
            priority: 'medium'
        });

        return recommendations;
    }

    getExerciseSet(category, difficulty, count = 3) {
        // Handle custom session areas by mapping them to exercise categories
        const normalizedCategory = category.toLowerCase().replace(/\s+/g, '');

        // Try to find exercises for this category
        let availableExercises = this.exercises[normalizedCategory];

        // If no direct match, try to find a related category
        if (!availableExercises) {
            // Map custom areas to existing exercise categories
            const categoryMappings = {
                sightreading: 'scales',
                improvisation: 'scales',
                songs: 'chords',
                theory: 'scales',
                audiopractice: 'technique',
                fingerpicking: 'arpeggios',
                strumming: 'rhythm',
                lead: 'scales',
                fingerstyle: 'arpeggios'
            };

            const mappedCategory = categoryMappings[normalizedCategory];
            availableExercises = mappedCategory
                ? this.exercises[mappedCategory]
                : this.exercises.technique;
        }

        const filtered = availableExercises.filter(
            (ex) => !difficulty || ex.difficulty === difficulty
        );

        // Shuffle and take requested count
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    getRandomExercise(category, difficulty) {
        const exercises = this.getExerciseSet(category, difficulty, 1);
        return exercises[0] || null;
    }

    async getQuickRecommendation() {
        // Ensure session areas are loaded
        await this.loadSessionAreas();

        // Get a single, contextual recommendation for the practice page
        const repertoire = await this.storageService.getRepertoire();
        const learningItems = repertoire.filter(
            (item) => item.status === 'learning' || item.status === 'polishing'
        );

        if (learningItems.length > 0) {
            // Recommend working on a current song
            const item = learningItems[0];
            return {
                message: `🎵 Continue working on "${item.title}" - ${item.status === 'learning' ? 'Take it slow and focus on accuracy' : 'Time to add your personal touch!'}`,
                action: 'repertoire',
                itemId: item.id
            };
        }

        // Otherwise, suggest a practice area from user's custom areas
        const userAreas = this.sessionAreas || [];
        // Map to exercise categories (lowercase, no spaces)
        const mappedAreas = userAreas
            .map((area) => area.toLowerCase().replace(/\s+/g, ''))
            .filter((area) => this.exercises[area]); // Only keep areas that have exercises

        // Fallback to some defaults if no mapped areas
        const availableAreas =
            mappedAreas.length > 0 ? mappedAreas : ['scales', 'chords', 'technique', 'rhythm'];
        const randomArea = availableAreas[Math.floor(Math.random() * availableAreas.length)];
        const exercise = this.getRandomExercise(randomArea, 'intermediate');

        return {
            message: `💪 Try this: ${exercise.name} (${exercise.duration} min)`,
            action: 'exercise',
            exercise: exercise
        };
    }
}

// Create singleton instance
let recommendationServiceInstance = null;

export function getRecommendationService(storageService) {
    if (!recommendationServiceInstance) {
        recommendationServiceInstance = new RecommendationService(storageService);
    }
    return recommendationServiceInstance;
}
