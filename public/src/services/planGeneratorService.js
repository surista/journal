// AI-Powered Practice Plan Generator Service
export class PlanGeneratorService {
    constructor() {
        // Practice elements database
        this.practiceElements = {
            lead: {
                beginner: [
                    { name: 'Minor Pentatonic Scale - Position 1', duration: 10, type: 'scale' },
                    { name: 'Basic Bending Technique', duration: 10, type: 'technique' },
                    { name: 'Simple Lead Licks', duration: 15, type: 'licks' }
                ],
                intermediate: [
                    { name: 'All 5 Pentatonic Positions', duration: 15, type: 'scale' },
                    { name: 'Major Scale Patterns', duration: 15, type: 'scale' },
                    { name: 'Vibrato and Bending Control', duration: 10, type: 'technique' },
                    { name: 'Classic Rock Solos', duration: 20, type: 'songs' }
                ],
                advanced: [
                    { name: 'Modal Scales Practice', duration: 20, type: 'scale' },
                    { name: 'Sweep Picking Arpeggios', duration: 15, type: 'technique' },
                    { name: 'Jazz Improvisation', duration: 20, type: 'improvisation' }
                ]
            },
            rhythm: {
                beginner: [
                    { name: 'Open Chord Transitions', duration: 15, type: 'chords' },
                    { name: 'Basic Strumming Patterns', duration: 15, type: 'rhythm' },
                    { name: 'Timing with Metronome', duration: 10, type: 'timing' }
                ],
                intermediate: [
                    { name: 'Barre Chord Practice', duration: 15, type: 'chords' },
                    { name: 'Rhythm Guitar Techniques', duration: 15, type: 'rhythm' },
                    { name: 'Chord Progressions', duration: 15, type: 'theory' }
                ],
                advanced: [
                    { name: 'Complex Chord Voicings', duration: 15, type: 'chords' },
                    { name: 'Fingerstyle Patterns', duration: 20, type: 'fingerstyle' },
                    { name: 'Jazz Comping', duration: 20, type: 'rhythm' }
                ]
            },
            technique: {
                all: [
                    { name: 'Chromatic Exercises', duration: 10, type: 'warmup' },
                    { name: 'Spider Walk Exercise', duration: 10, type: 'dexterity' },
                    { name: 'Alternate Picking Drills', duration: 15, type: 'picking' },
                    { name: 'Legato Exercises', duration: 15, type: 'legato' },
                    { name: 'String Skipping', duration: 10, type: 'accuracy' }
                ]
            },
            theory: {
                beginner: [
                    { name: 'Note Names on Fretboard', duration: 15, type: 'fretboard' },
                    { name: 'Basic Music Theory', duration: 15, type: 'theory' },
                    { name: 'Interval Recognition', duration: 10, type: 'ear' }
                ],
                intermediate: [
                    { name: 'Scale Construction', duration: 15, type: 'theory' },
                    { name: 'Chord Theory', duration: 15, type: 'theory' },
                    { name: 'Key Signatures', duration: 10, type: 'theory' }
                ],
                advanced: [
                    { name: 'Modal Theory', duration: 20, type: 'theory' },
                    { name: 'Chord Substitutions', duration: 15, type: 'theory' },
                    { name: 'Advanced Harmony', duration: 20, type: 'theory' }
                ]
            }
        };

        // Genre-specific exercises
        this.genreExercises = {
            Rock: ['Power Chord Riffs', 'Rock Rhythm Patterns', 'Classic Rock Solos'],
            Metal: ['Palm Muting', 'Galloping Rhythms', 'Metal Riffs', 'Downpicking Endurance'],
            Blues: ['12-Bar Blues', 'Blues Bends', 'Shuffle Rhythm', 'Blues Turnarounds'],
            Jazz: ['ii-V-I Progressions', 'Jazz Standards', 'Chord Melody', 'Walking Bass Lines'],
            Classical: ['Fingerstyle Technique', 'Classical Pieces', 'Sight Reading'],
            Folk: ['Fingerpicking Patterns', 'Open Tunings', 'Folk Strumming'],
            Funk: ['Funk Rhythms', 'Muted Strumming', 'Syncopation', 'Funk Chords']
        };
    }

    async generatePlan(userProfile) {
        const level = this.determineLevel(userProfile);
        const planStructure = this.createPlanStructure(userProfile, level);
        const detailedPlan = this.populatePlanDetails(planStructure, userProfile, level);

        return detailedPlan;
    }

    determineLevel(profile) {
        let score = 0;

        // Playing duration scoring
        const durationScores = {
            beginner: 0,
            '6months': 1,
            '1year': 2,
            '2years': 3,
            '5years': 4
        };
        score += durationScores[profile.currentAbility.duration] || 0;

        // Skills scoring
        const skillCount = profile.currentAbility.skills?.length || 0;
        score += Math.min(skillCount * 0.5, 3);

        // Assessment scoring
        if (profile.assessmentResults.chromaticTempo > 120) score += 1;
        if (profile.assessmentResults.chromaticTempo > 160) score += 1;
        if (profile.assessmentResults.chordChanges > 30) score += 1;
        if (profile.assessmentResults.pentatonicPositions?.length >= 3) score += 1;

        // Determine level based on score
        if (score < 3) return 'beginner';
        if (score < 6) return 'intermediate';
        return 'advanced';
    }

    createPlanStructure(profile, level) {
        const duration = 4; // 4-week plan
        const sessionsPerWeek = parseInt(profile.practiceFrequency) || 3;
        const sessionDuration = parseInt(profile.sessionDuration) || 30;

        return {
            id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: this.generatePlanTitle(profile, level),
            description: this.generatePlanDescription(profile, level),
            level: level,
            duration: `${duration} weeks`,
            sessionsPerWeek: sessionsPerWeek,
            sessionDuration: sessionDuration,
            difficulty: this.mapLevelToDifficulty(level),
            createdAt: new Date().toISOString(),
            weeks: this.generateWeeklyThemes(profile, level, duration)
        };
    }

    generatePlanTitle(profile, level) {
        const goalMap = {
            lead: 'Lead Guitar Mastery',
            rhythm: 'Rhythm Guitar Excellence',
            fingerstyle: 'Fingerstyle Journey',
            theory: 'Music Theory Foundation',
            technique: 'Technical Proficiency',
            songs: 'Song Repertoire Building'
        };

        const primaryGoal = profile.goals[0] || 'lead';
        const levelPrefix = level.charAt(0).toUpperCase() + level.slice(1);

        return `${levelPrefix} ${goalMap[primaryGoal]} Plan`;
    }

    generatePlanDescription(profile, level) {
        const genres = profile.interests.slice(0, 2).join(' and ') || 'various';
        const artists =
            profile.favoriteArtists.slice(0, 2).join(' and ') || 'your favorite artists';

        return (
            `A personalized ${level} plan focusing on ${genres} styles, ` +
            `inspired by artists like ${artists}. This plan will progressively ` +
            `build your skills over 4 weeks with structured practice sessions.`
        );
    }

    mapLevelToDifficulty(level) {
        const map = {
            beginner: 'Foundational',
            intermediate: 'Progressive',
            advanced: 'Challenging'
        };
        return map[level];
    }

    generateWeeklyThemes(profile, level, duration) {
        const themes = {
            beginner: [
                'Foundation Building',
                'Technique Development',
                'Applying Basics',
                'Putting It Together'
            ],
            intermediate: [
                'Skill Refinement',
                'Advanced Techniques',
                'Style Development',
                'Performance Ready'
            ],
            advanced: [
                'Technical Mastery',
                'Creative Expression',
                'Genre Specialization',
                'Professional Level'
            ]
        };

        return themes[level].map((theme, index) => ({
            weekNumber: index + 1,
            theme: theme,
            goals: this.generateWeeklyGoals(profile, level, index),
            sessions: []
        }));
    }

    generateWeeklyGoals(profile, level, weekIndex) {
        const goalTemplates = {
            lead: {
                beginner: [
                    ['Learn pentatonic position 1', 'Practice basic bends', 'Play simple licks'],
                    ['Expand to position 2', 'Improve bend accuracy', 'Connect positions'],
                    ['Add vibrato technique', 'Learn full solo phrases', 'Increase speed'],
                    ['Play complete solos', 'Improvise over backing tracks', 'Performance ready']
                ],
                intermediate: [
                    ['Master all pentatonic positions', 'Advanced bending techniques'],
                    ['Major scale integration', 'Hybrid picking introduction'],
                    ['Modal playing basics', 'Style-specific techniques'],
                    ['Full song solos', 'Live performance preparation']
                ]
            },
            rhythm: {
                beginner: [
                    ['Clean chord changes', 'Basic strumming patterns', 'Steady timing'],
                    ['Barre chord introduction', 'Dynamic strumming', 'Rhythm variations'],
                    ['Song rhythm parts', 'Palm muting basics', 'Groove development'],
                    ['Full song performances', 'Rhythm guitar confidence', 'Band-ready skills']
                ]
            }
        };

        const primaryGoal = profile.goals[0] || 'lead';
        const templates = goalTemplates[primaryGoal]?.[level] || goalTemplates.lead.beginner;

        return (
            templates[weekIndex] || ['Continue practice', 'Refine techniques', 'Build confidence']
        );
    }

    populatePlanDetails(structure, profile, level) {
        structure.weeks = structure.weeks.map((week, weekIndex) => {
            week.sessions = this.generateWeeklySessions(
                profile,
                level,
                weekIndex,
                structure.sessionsPerWeek,
                structure.sessionDuration
            );
            return week;
        });

        return structure;
    }

    generateWeeklySessions(profile, level, weekIndex, sessionsPerWeek, sessionDuration) {
        const sessions = [];

        for (let i = 0; i < sessionsPerWeek; i++) {
            const session = {
                id: `week${weekIndex + 1}-session${i + 1}`,
                title: `Day ${i + 1} Practice`,
                duration: sessionDuration,
                completed: false,
                exercises: this.selectExercises(profile, level, sessionDuration, weekIndex)
            };
            sessions.push(session);
        }

        return sessions;
    }

    selectExercises(profile, level, totalDuration, weekIndex) {
        const exercises = [];
        let remainingTime = totalDuration;

        // Always start with warmup
        exercises.push({
            name: 'Warmup - Chromatic Runs',
            duration: 5,
            type: 'warmup',
            tempo: this.getWarmupTempo(profile),
            description: 'Start slowly and gradually increase speed'
        });
        remainingTime -= 5;

        // Add progressive speed exercise
        const speedExercise = this.getWeeklySpeedExercise(weekIndex, level);
        exercises.push(speedExercise);
        remainingTime -= speedExercise.duration;

        // Add main exercises based on goals
        const primaryGoal = profile.goals[0] || 'lead';
        const goalExercises =
            this.practiceElements[primaryGoal]?.[level] || this.practiceElements.lead.beginner;

        // Progressive difficulty through weeks
        const difficultyMultiplier = 1 + weekIndex * 0.1;

        // Add goal-specific exercises
        for (const exercise of goalExercises) {
            if (remainingTime >= exercise.duration) {
                exercises.push({
                    ...exercise,
                    tempo: Math.floor(
                        (profile.assessmentResults.chromaticTempo || 80) * difficultyMultiplier
                    ),
                    week: weekIndex + 1
                });
                remainingTime -= exercise.duration;
            }
        }

        // Add genre-specific exercises
        if (remainingTime > 10) {
            const genreExercise = this.selectGenreExercise(profile, level);
            if (genreExercise) {
                exercises.push({
                    name: genreExercise,
                    duration: Math.min(remainingTime - 5, 15),
                    type: 'genre',
                    description: `Focus on ${profile.interests[0]} style`
                });
                remainingTime -= 15;
            }
        }

        // Cool down with a fun song or jam
        if (remainingTime >= 5) {
            exercises.push({
                name: 'Cool Down - Play Along',
                duration: remainingTime,
                type: 'cooldown',
                description: `Play along to ${profile.favoriteArtists[0] || 'your favorite artist'}`
            });
        }

        return exercises;
    }

    getWarmupTempo(profile) {
        const baseTempo = profile.assessmentResults.chromaticTempo || 80;
        return Math.max(60, baseTempo - 20); // Start 20 BPM slower than max
    }

    selectGenreExercise(profile, level) {
        const primaryGenre = profile.interests[0];
        const exercises = this.genreExercises[primaryGenre] || [];

        if (exercises.length === 0) return null;

        // Select exercise based on level
        const index =
            level === 'beginner'
                ? 0
                : level === 'intermediate'
                  ? Math.floor(exercises.length / 2)
                  : exercises.length - 1;

        return exercises[Math.min(index, exercises.length - 1)];
    }

    // Generate practice schedule for calendar integration
    generateCalendarEvents(plan, startDate = new Date()) {
        const events = [];
        const currentDate = new Date(startDate);

        plan.weeks.forEach((week, weekIndex) => {
            week.sessions.forEach((session, sessionIndex) => {
                // Skip weekends if not specified in preferences
                while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                events.push({
                    title: `Guitar Practice: ${session.title}`,
                    date: new Date(currentDate),
                    duration: session.duration,
                    description: `Week ${weekIndex + 1}: ${week.theme}`,
                    exercises: session.exercises,
                    planId: plan.id,
                    sessionId: session.id
                });

                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            });
        });

        return events;
    }

    getWeeklySpeedExercise(weekIndex, level) {
        const speedExercises = {
            beginner: [
                {
                    name: 'Minor Pentatonic Speed Building',
                    duration: 10,
                    type: 'speed',
                    tempo: '80-100 BPM',
                    description: 'Pattern 1, alternate picking on two strings',
                    focus: 'Clean alternate picking, start slow'
                },
                {
                    name: 'Pentatonic Sequences',
                    duration: 10,
                    type: 'speed',
                    tempo: '90-110 BPM',
                    description: 'Groups of 3 and 4 notes, position 1',
                    focus: 'Maintain even timing between notes'
                },
                {
                    name: 'Major Scale Runs',
                    duration: 10,
                    type: 'speed',
                    tempo: '100-120 BPM',
                    description: '3 notes per string patterns',
                    focus: 'Economy picking introduction'
                },
                {
                    name: 'Modal Scale Patterns',
                    duration: 10,
                    type: 'speed',
                    tempo: '110-130 BPM',
                    description: 'Dorian and Mixolydian modes',
                    focus: 'Position shifts and string changes'
                }
            ],
            intermediate: [
                {
                    name: 'Extended Pentatonic Runs',
                    duration: 12,
                    type: 'speed',
                    tempo: '120-140 BPM',
                    description: 'All 5 positions connected',
                    focus: 'Smooth position transitions'
                },
                {
                    name: 'Scale Sequences - Advanced',
                    duration: 12,
                    type: 'speed',
                    tempo: '130-150 BPM',
                    description: 'Diatonic thirds and fourths',
                    focus: 'String skipping accuracy'
                },
                {
                    name: 'Eric Johnson Cascading 5s',
                    duration: 12,
                    type: 'speed',
                    tempo: '140-160 BPM',
                    description: 'Signature pentatonic patterns',
                    focus: 'Hybrid picking and economy'
                },
                {
                    name: 'Sweep Picking Foundations',
                    duration: 12,
                    type: 'speed',
                    tempo: '150-170 BPM',
                    description: 'Triad arpeggios across strings',
                    focus: 'Synchronized hands'
                }
            ],
            advanced: [
                {
                    name: 'Shred Sequences',
                    duration: 15,
                    type: 'speed',
                    tempo: '160-180 BPM',
                    description: 'Paul Gilbert style patterns',
                    focus: 'Maximum efficiency'
                },
                {
                    name: 'Advanced Cascading Patterns',
                    duration: 15,
                    type: 'speed',
                    tempo: '170-190 BPM',
                    description: 'Multi-position cascades',
                    focus: 'Fluid position changes'
                },
                {
                    name: 'Yngwie-Style Arpeggios',
                    duration: 15,
                    type: 'speed',
                    tempo: '180-200 BPM',
                    description: 'Diminished and harmonic minor runs',
                    focus: 'Neo-classical precision'
                },
                {
                    name: 'Ultimate Speed Challenge',
                    duration: 15,
                    type: 'speed',
                    tempo: '190-210 BPM',
                    description: 'Combined techniques at max speed',
                    focus: 'Breaking personal barriers'
                }
            ]
        };

        return speedExercises[level][Math.min(weekIndex, 3)];
    }
}

export const planGeneratorService = new PlanGeneratorService();
