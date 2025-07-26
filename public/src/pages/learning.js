// My Learning Page - AI-powered personalized learning plans
import { planGeneratorService } from '../services/planGeneratorService.js';

export default class LearningPage {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.currentStep = 0;
        this.userProfile = {
            goals: [],
            interests: [],
            favoriteArtists: [],
            currentAbility: {},
            assessmentResults: {},
            practiceFrequency: '',
            sessionDuration: '',
            equipment: []
        };
        this.steps = [
            'goals',
            'interests',
            'artists',
            'ability',
            'assessment',
            'schedule',
            'equipment'
        ];
        this.metronomeInterval = null;
        this.timerInterval = null;
        this.audioContext = null;
    }

    async render(container) {
        this.container = container;

        // Check if user has existing profile
        const existingProfile = await this.storageService.getLearningProfile();
        if (existingProfile) {
            this.userProfile = existingProfile;
            this.showDashboard();
        } else {
            this.showQuestionnaire();
        }
    }

    showQuestionnaire() {
        this.container.innerHTML = `
            <div class="learning-page">
                <div class="learning-header">
                    <h1>🎯 Create Your Personalized Learning Plan</h1>
                    <p>Let's understand your goals and create a custom practice plan just for you</p>
                </div>
                
                <div class="questionnaire-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(this.currentStep / this.steps.length) * 100}%"></div>
                    </div>
                    
                    <div class="question-content" id="questionContent">
                        ${this.renderCurrentStep()}
                    </div>
                    
                    <div class="navigation-buttons">
                        <button class="btn btn-secondary" id="backBtn" ${this.currentStep === 0 ? 'disabled' : ''}>
                            Back
                        </button>
                        <button class="btn btn-primary" id="nextBtn">
                            ${this.currentStep === this.steps.length - 1 ? 'Generate Plan' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderCurrentStep() {
        switch (this.steps[this.currentStep]) {
            case 'goals':
                return this.renderGoalsStep();
            case 'interests':
                return this.renderInterestsStep();
            case 'artists':
                return this.renderArtistsStep();
            case 'ability':
                return this.renderAbilityStep();
            case 'assessment':
                return this.renderAssessmentStep();
            case 'schedule':
                return this.renderScheduleStep();
            case 'equipment':
                return this.renderEquipmentStep();
            default:
                return '';
        }
    }

    renderGoalsStep() {
        const goals = [
            { id: 'lead', label: '🎸 Lead Guitar', desc: 'Solos, scales, and improvisation' },
            { id: 'rhythm', label: '🎵 Rhythm Guitar', desc: 'Chords, strumming, and timing' },
            {
                id: 'fingerstyle',
                label: '🤌 Fingerstyle',
                desc: 'Fingerpicking patterns and techniques'
            },
            {
                id: 'theory',
                label: '📚 Music Theory',
                desc: 'Understanding scales, modes, and harmony'
            },
            { id: 'songwriting', label: '✍️ Songwriting', desc: 'Creating original music' },
            { id: 'technique', label: '💪 Technique', desc: 'Speed, accuracy, and dexterity' },
            { id: 'songs', label: '🎵 Learn Songs', desc: 'Master specific songs' },
            { id: 'performance', label: '🎤 Performance', desc: 'Stage presence and live playing' }
        ];

        return `
            <div class="step-content">
                <h2>What are your guitar goals?</h2>
                <p>Select all that apply</p>
                
                <div class="goals-grid">
                    ${goals
                        .map(
                            (goal) => `
                        <div class="goal-card ${this.userProfile.goals.includes(goal.id) ? 'selected' : ''}" 
                             data-goal="${goal.id}">
                            <div class="goal-icon">${goal.label.split(' ')[0]}</div>
                            <h3>${goal.label}</h3>
                            <p>${goal.desc}</p>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    renderInterestsStep() {
        const defaultGenres = [
            'Rock',
            'Metal',
            'Blues',
            'Jazz',
            'Classical',
            'Pop',
            'Country',
            'Folk',
            'Punk',
            'Indie',
            'R&B',
            'Funk',
            'Progressive',
            'Acoustic',
            'Alternative'
        ];

        // Get custom genres (ones not in default list)
        const customGenres = this.userProfile.interests.filter((g) => !defaultGenres.includes(g));

        // Combine all genres for display
        const allGenres = [...defaultGenres, ...customGenres];

        return `
            <div class="step-content">
                <h2>What music styles interest you?</h2>
                <p>Select your favorite genres</p>
                
                <div class="interests-grid">
                    ${allGenres
                        .map(
                            (genre) => `
                        <button class="genre-tag ${this.userProfile.interests.includes(genre) ? 'selected' : ''}"
                                data-genre="${genre}">
                            ${genre}
                        </button>
                    `
                        )
                        .join('')}
                </div>
                
                <div class="custom-input-section">
                    <label>Other genres:</label>
                    <input type="text" id="customGenre" placeholder="Type a genre and press Enter..." 
                           class="form-input">
                    <p style="font-size: 0.813rem; color: var(--text-secondary); margin-top: 0.25rem;">Press Enter to add</p>
                </div>
            </div>
        `;
    }

    renderArtistsStep() {
        return `
            <div class="step-content">
                <h2>Who are your favorite artists?</h2>
                <p>This helps us understand your musical taste</p>
                
                <div class="artists-input">
                    <div class="artist-tags">
                        ${this.userProfile.favoriteArtists
                            .map(
                                (artist) => `
                            <span class="artist-tag">
                                ${artist}
                                <button class="remove-tag" data-artist="${artist}">×</button>
                            </span>
                        `
                            )
                            .join('')}
                    </div>
                    
                    <input type="text" id="artistInput" 
                           placeholder="Type an artist name and press Enter..."
                           class="form-input">
                    
                    <div class="artist-suggestions">
                        <p>Popular suggestions based on your genres:</p>
                        <div class="suggestion-tags">
                            ${this.getArtistSuggestions()
                                .map(
                                    (artist) => `
                                <button class="suggestion-tag" data-artist="${artist}">
                                    + ${artist}
                                </button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAbilityStep() {
        return `
            <div class="step-content">
                <h2>Current Ability Assessment</h2>
                <p>Help us understand your current level</p>
                
                <div class="ability-form">
                    <div class="form-group">
                        <label>How long have you been playing?</label>
                        <select id="playingDuration" class="form-select">
                            <option value="">Select...</option>
                            <option value="beginner">Less than 6 months</option>
                            <option value="6months">6 months - 1 year</option>
                            <option value="1year">1-2 years</option>
                            <option value="2years">2-5 years</option>
                            <option value="5years">5+ years</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>What can you play comfortably?</label>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0.5rem 0 1rem 0;">Check all that apply:</p>
                        <div class="skill-checkboxes">
                            <label class="checkbox-label">
                                <input type="checkbox" value="open-chords"> Open chords (G, C, D, etc.)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="barre-chords"> Barre chords
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="power-chords"> Power chords
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="pentatonic"> Pentatonic scales
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="major-scales"> Major scales
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="modes"> Modal scales
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="arpeggios"> Arpeggios
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Specific skills/knowledge:</label>
                        <textarea id="specificSkills" class="form-textarea" rows="3"
                                  placeholder="E.g., 'I know all 5 pentatonic shapes', 'I can play Stairway to Heaven solo at 80% speed'"
                                  >${this.userProfile.currentAbility.specificSkills || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    renderAssessmentStep() {
        return `
            <div class="step-content">
                <h2>Quick Skill Assessment</h2>
                <p>Let's test your current abilities with some simple exercises</p>
                
                <div class="assessment-section">
                    <div class="drill-card">
                        <h3>📏 Chromatic Speed Test</h3>
                        <p>Play the chromatic scale (frets 1-2-3-4) on each string</p>
                        <div class="tempo-test">
                            <label>Maximum clean tempo:</label>
                            <div class="tempo-input">
                                <input type="range" id="chromaticTempo" min="60" max="200" 
                                       value="${this.userProfile.assessmentResults.chromaticTempo || 80}">
                                <span class="tempo-display">${this.userProfile.assessmentResults.chromaticTempo || 80} BPM</span>
                            </div>
                            <div class="metronome-controls">
                                <button class="btn btn-sm" id="startMetronome">
                                    <span class="metronome-icon">🎵</span> Start Metronome
                                </button>
                                <div class="metronome-indicator" id="metronomeIndicator"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="drill-card">
                        <h3>🎸 Chord Changes</h3>
                        <p>How many clean G-C-D chord changes in 60 seconds?</p>
                        <div class="timer-section">
                            <button class="btn btn-sm" id="startTimer">
                                <span class="timer-icon">⏱️</span> Start 60s Timer
                            </button>
                            <div class="timer-display" id="timerDisplay">60s</div>
                        </div>
                        <div class="count-input">
                            <button class="count-btn minus">-</button>
                            <input type="number" id="chordChanges" 
                                   value="${this.userProfile.assessmentResults.chordChanges || 0}" 
                                   min="0" max="100">
                            <button class="count-btn plus">+</button>
                        </div>
                    </div>
                    
                    <div class="drill-card">
                        <h3>🎵 Scale Knowledge</h3>
                        <p>Which pentatonic positions can you play?</p>
                        <div class="position-selector">
                            ${[1, 2, 3, 4, 5]
                                .map(
                                    (pos) => `
                                <label class="position-checkbox">
                                    <input type="checkbox" value="position-${pos}"
                                           ${this.userProfile.assessmentResults.pentatonicPositions?.includes(pos) ? 'checked' : ''}>
                                    <span>Position ${pos}</span>
                                </label>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderScheduleStep() {
        return `
            <div class="step-content">
                <h2>Practice Schedule Preferences</h2>
                <p>When and how often can you practice?</p>
                
                <div class="schedule-form">
                    <div class="form-group">
                        <label>How many days per week can you practice?</label>
                        <div class="frequency-selector">
                            ${[1, 2, 3, 4, 5, 6, 7]
                                .map(
                                    (days) => `
                                <button class="frequency-btn ${this.userProfile.practiceFrequency == days ? 'selected' : ''}"
                                        data-days="${days}">
                                    ${days} ${days === 1 ? 'day' : 'days'}
                                </button>
                            `
                                )
                                .join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>How long per session?</label>
                        <div class="duration-selector">
                            <button class="duration-btn ${this.userProfile.sessionDuration === '15' ? 'selected' : ''}" data-duration="15">15 min</button>
                            <button class="duration-btn ${this.userProfile.sessionDuration === '30' ? 'selected' : ''}" data-duration="30">30 min</button>
                            <button class="duration-btn ${this.userProfile.sessionDuration === '45' ? 'selected' : ''}" data-duration="45">45 min</button>
                            <button class="duration-btn ${this.userProfile.sessionDuration === '60' ? 'selected' : ''}" data-duration="60">1 hour</button>
                            <button class="duration-btn ${this.userProfile.sessionDuration === '90' ? 'selected' : ''}" data-duration="90">1.5 hours</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Preferred practice times:</label>
                        <div class="time-preferences">
                            <label class="checkbox-label">
                                <input type="checkbox" value="morning"> Morning (6am-12pm)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="afternoon"> Afternoon (12pm-5pm)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="evening"> Evening (5pm-9pm)
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" value="night"> Night (9pm+)
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEquipmentStep() {
        return `
            <div class="step-content">
                <h2>Your Equipment</h2>
                <p>What gear do you have available?</p>
                
                <div class="equipment-form">
                    <div class="equipment-grid">
                        <label class="equipment-item">
                            <input type="checkbox" value="electric-guitar">
                            <span>🎸 Electric Guitar</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="acoustic-guitar">
                            <span>🎸 Acoustic Guitar</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="classical-guitar">
                            <span>🎸 Classical Guitar</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="amp">
                            <span>🔊 Amplifier</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="pedals">
                            <span>🎛️ Effect Pedals</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="metronome">
                            <span>⏱️ Metronome</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="capo">
                            <span>🎵 Capo</span>
                        </label>
                        <label class="equipment-item">
                            <input type="checkbox" value="picks">
                            <span>🎯 Picks</span>
                        </label>
                    </div>
                    
                    <div class="final-notes">
                        <label>Anything else we should know?</label>
                        <textarea id="additionalNotes" class="form-textarea" rows="3"
                                  placeholder="E.g., injuries, time constraints, specific songs you want to learn..."
                                  >${this.userProfile.additionalNotes || ''}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    getArtistSuggestions() {
        const genreArtists = {
            Rock: ['Led Zeppelin', 'Pink Floyd', 'Queen', 'AC/DC'],
            Metal: ['Metallica', 'Iron Maiden', 'Black Sabbath', 'Pantera'],
            Blues: ['B.B. King', 'Stevie Ray Vaughan', 'Eric Clapton', 'Buddy Guy'],
            Jazz: ['Joe Pass', 'Pat Metheny', 'George Benson', 'Wes Montgomery'],
            Grunge: ['Nirvana', 'Pearl Jam', 'Soundgarden', 'Alice in Chains'],
            Alternative: ['Radiohead', 'Foo Fighters', 'Red Hot Chili Peppers', 'Muse']
        };

        let suggestions = [];
        this.userProfile.interests.forEach((genre) => {
            if (genreArtists[genre]) {
                suggestions = [...suggestions, ...genreArtists[genre]];
            }
        });

        return [...new Set(suggestions)].slice(0, 8);
    }

    attachEventListeners() {
        // Navigation buttons
        document.getElementById('nextBtn')?.addEventListener('click', () => this.handleNext());
        document.getElementById('backBtn')?.addEventListener('click', () => this.handleBack());

        // Step-specific listeners
        this.attachStepListeners();
    }

    attachStepListeners() {
        const step = this.steps[this.currentStep];

        switch (step) {
            case 'goals':
                document.querySelectorAll('.goal-card').forEach((card) => {
                    card.addEventListener('click', (e) => {
                        const goal = e.currentTarget.dataset.goal;
                        e.currentTarget.classList.toggle('selected');

                        if (this.userProfile.goals.includes(goal)) {
                            this.userProfile.goals = this.userProfile.goals.filter(
                                (g) => g !== goal
                            );
                        } else {
                            this.userProfile.goals.push(goal);
                        }
                    });
                });
                break;

            case 'interests':
                document.querySelectorAll('.genre-tag').forEach((tag) => {
                    tag.addEventListener('click', (e) => {
                        const genre = e.currentTarget.dataset.genre;
                        e.currentTarget.classList.toggle('selected');

                        if (this.userProfile.interests.includes(genre)) {
                            this.userProfile.interests = this.userProfile.interests.filter(
                                (g) => g !== genre
                            );
                        } else {
                            this.userProfile.interests.push(genre);
                        }
                    });
                });

                // Handle custom genre input
                const customGenreInput = document.getElementById('customGenre');
                customGenreInput?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                        const genre = e.target.value.trim();
                        if (!this.userProfile.interests.includes(genre)) {
                            this.userProfile.interests.push(genre);
                            // Re-render the step to show the new genre
                            const questionContent = document.getElementById('questionContent');
                            if (questionContent) {
                                questionContent.innerHTML = this.renderCurrentStep();
                                this.attachStepListeners();
                            }
                        }
                        e.target.value = '';
                    }
                });
                break;

            case 'artists':
                const artistInput = document.getElementById('artistInput');
                artistInput?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                        this.addArtist(e.target.value.trim());
                        e.target.value = '';
                        this.updateArtistDisplay();
                    }
                });

                document.querySelectorAll('.suggestion-tag').forEach((tag) => {
                    tag.addEventListener('click', (e) => {
                        this.addArtist(e.currentTarget.dataset.artist);
                        this.updateArtistDisplay();
                    });
                });
                break;

            case 'assessment':
                // Tempo slider
                const tempoSlider = document.getElementById('chromaticTempo');
                tempoSlider?.addEventListener('input', (e) => {
                    document.querySelector('.tempo-display').textContent = `${e.target.value} BPM`;
                    this.userProfile.assessmentResults.chromaticTempo = parseInt(e.target.value);
                    // Update metronome tempo if running
                    if (this.metronomeInterval) {
                        this.stopMetronome();
                        this.startMetronome(parseInt(e.target.value));
                    }
                });

                // Metronome button
                const metronomeBtn = document.getElementById('startMetronome');
                metronomeBtn?.addEventListener('click', () => {
                    if (this.metronomeInterval) {
                        this.stopMetronome();
                    } else {
                        const tempo = parseInt(tempoSlider.value);
                        this.startMetronome(tempo);
                    }
                });

                // Timer button
                const timerBtn = document.getElementById('startTimer');
                timerBtn?.addEventListener('click', () => {
                    this.startChordTimer();
                });

                // Chord changes counter
                document.querySelectorAll('.count-btn').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        const input = document.getElementById('chordChanges');
                        const current = parseInt(input.value) || 0;

                        if (e.target.classList.contains('plus')) {
                            input.value = Math.min(100, current + 1);
                        } else {
                            input.value = Math.max(0, current - 1);
                        }

                        this.userProfile.assessmentResults.chordChanges = parseInt(input.value);
                    });
                });
                break;

            case 'schedule':
                document.querySelectorAll('.frequency-btn').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        document
                            .querySelectorAll('.frequency-btn')
                            .forEach((b) => b.classList.remove('selected'));
                        e.currentTarget.classList.add('selected');
                        this.userProfile.practiceFrequency = e.currentTarget.dataset.days;
                    });
                });

                document.querySelectorAll('.duration-btn').forEach((btn) => {
                    btn.addEventListener('click', (e) => {
                        document
                            .querySelectorAll('.duration-btn')
                            .forEach((b) => b.classList.remove('selected'));
                        e.currentTarget.classList.add('selected');
                        this.userProfile.sessionDuration = e.currentTarget.dataset.duration;
                    });
                });
                break;
        }
    }

    addArtist(artist) {
        if (!this.userProfile.favoriteArtists.includes(artist)) {
            this.userProfile.favoriteArtists.push(artist);
        }
    }

    updateArtistDisplay() {
        const content = document.getElementById('questionContent');
        content.innerHTML = this.renderCurrentStep();
        this.attachStepListeners();
    }

    async handleNext() {
        console.log(
            'handleNext called, current step:',
            this.currentStep,
            'of',
            this.steps.length - 1
        );

        // Save current step data
        this.saveStepData();

        if (this.currentStep === this.steps.length - 1) {
            console.log('Last step reached, generating plan...');
            // Generate plan
            await this.generatePlan();
        } else {
            this.currentStep++;
            this.showQuestionnaire();
        }
    }

    handleBack() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showQuestionnaire();
        }
    }

    saveStepData() {
        const step = this.steps[this.currentStep];

        switch (step) {
            case 'ability':
                const duration = document.getElementById('playingDuration')?.value;
                const skills = Array.from(
                    document.querySelectorAll('.skill-checkboxes input:checked')
                ).map((cb) => cb.value);
                const specific = document.getElementById('specificSkills')?.value;

                this.userProfile.currentAbility = {
                    duration,
                    skills,
                    specificSkills: specific
                };
                break;

            case 'assessment':
                const positions = Array.from(
                    document.querySelectorAll('.position-selector input:checked')
                ).map((cb) => parseInt(cb.value.split('-')[1]));
                this.userProfile.assessmentResults.pentatonicPositions = positions;
                break;

            case 'schedule':
                const times = Array.from(
                    document.querySelectorAll('.time-preferences input:checked')
                ).map((cb) => cb.value);
                this.userProfile.preferredTimes = times;
                break;

            case 'equipment':
                const equipment = Array.from(
                    document.querySelectorAll('.equipment-grid input:checked')
                ).map((cb) => cb.value);
                const notes = document.getElementById('additionalNotes')?.value;

                this.userProfile.equipment = equipment;
                this.userProfile.additionalNotes = notes;
                break;
        }
    }

    async generatePlan() {
        // Show loading state
        this.container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <h2>Creating your personalized learning plan...</h2>
                <p>Analyzing your goals and crafting the perfect practice routine</p>
            </div>
        `;

        try {
            // Ensure we have required data
            if (!this.userProfile.goals || this.userProfile.goals.length === 0) {
                this.userProfile.goals = ['lead']; // Default goal
            }
            if (!this.userProfile.interests || this.userProfile.interests.length === 0) {
                this.userProfile.interests = ['Rock']; // Default genre
            }
            if (!this.userProfile.currentAbility) {
                this.userProfile.currentAbility = { duration: 'beginner', skills: [] };
            }
            if (!this.userProfile.assessmentResults) {
                this.userProfile.assessmentResults = { chromaticTempo: 80, chordChanges: 0 };
            }

            console.log('User profile before generation:', this.userProfile);

            // Save profile
            await this.storageService.saveLearningProfile(this.userProfile);

            // Generate plan using AI service
            const plan = await planGeneratorService.generatePlan(this.userProfile);
            console.log('Generated plan:', plan);

            if (!plan) {
                throw new Error('Plan generation returned null');
            }

            // Save plan
            const saved = await this.storageService.saveLearningPlan(plan);
            console.log('Plan saved:', saved);

            // Wait a moment to ensure storage is complete
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Show dashboard with plan
            await this.showDashboard();
        } catch (error) {
            console.error('Error generating plan:', error);
            this.showError(`Failed to generate plan: ${error.message}`);
        }
    }

    async showDashboard() {
        const plan = await this.storageService.getCurrentLearningPlan();

        this.container.innerHTML = `
            <div class="learning-dashboard">
                <div class="dashboard-header">
                    <h1>🎯 Your Learning Journey</h1>
                    <button class="btn btn-secondary" id="editProfileBtn">
                        Edit Profile
                    </button>
                </div>
                
                ${plan ? this.renderPlan(plan) : this.renderNoPlan()}
            </div>
        `;

        document.getElementById('editProfileBtn')?.addEventListener('click', () => {
            this.currentStep = 0;
            this.showQuestionnaire();
        });

        document.getElementById('startQuestionnaireBtn')?.addEventListener('click', () => {
            this.currentStep = 0;
            this.showQuestionnaire();
        });
    }

    renderPlan(plan) {
        return `
            <div class="learning-plan">
                <div class="plan-overview">
                    <h2>${plan.title}</h2>
                    <p>${plan.description}</p>
                    
                    <div class="plan-stats">
                        <div class="stat">
                            <span class="stat-value">${plan.duration}</span>
                            <span class="stat-label">Duration</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${plan.sessionsPerWeek}</span>
                            <span class="stat-label">Sessions/Week</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${plan.difficulty}</span>
                            <span class="stat-label">Difficulty</span>
                        </div>
                    </div>
                </div>
                
                <div class="weekly-schedule">
                    ${plan.weeks.map((week, index) => this.renderWeek(week, index + 1, plan.id)).join('')}
                </div>
            </div>
        `;
    }

    renderWeek(week, weekNumber, planId) {
        return `
            <div class="week-card">
                <div class="week-header">
                    <h3>Week ${weekNumber}: ${week.theme}</h3>
                    <span class="week-progress">${week.completedSessions || 0}/${week.sessions.length} sessions</span>
                </div>
                
                <div class="week-goals">
                    <h4>Goals:</h4>
                    <ul>
                        ${week.goals.map((goal) => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="week-sessions">
                    ${week.sessions
                        .map(
                            (session) => `
                        <div class="session-card ${session.completed ? 'completed' : ''}" 
                             data-session-id="${session.id}">
                            <h5>${session.title}</h5>
                            <p>${session.duration} min</p>
                            <div class="session-hover-details">
                                <div class="exercises-preview">
                                    <h6>Today's Exercises:</h6>
                                    ${
                                        session.exercises
                                            ? session.exercises
                                                  .map(
                                                      (ex) => `
                                        <div class="exercise-item">
                                            <span class="exercise-name">${ex.name}</span>
                                            <span class="exercise-time">${ex.duration}min</span>
                                            ${ex.tempo ? `<span class="exercise-tempo">${ex.tempo}</span>` : ''}
                                            ${ex.description ? `<p class="exercise-desc">${ex.description}</p>` : ''}
                                        </div>
                                    `
                                                  )
                                                  .join('')
                                            : '<p>Loading exercises...</p>'
                                    }
                                </div>
                            </div>
                            <button class="btn btn-sm ${session.completed ? 'btn-secondary' : 'btn-primary'}"
                                    data-plan-id="${planId}"
                                    data-session-id="${session.id}">
                                ${session.completed ? 'Review' : 'Start Practice'}
                            </button>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    renderNoPlan() {
        return `
            <div class="no-plan">
                <h2>No active learning plan</h2>
                <p>Complete the questionnaire to get your personalized practice plan</p>
                <button class="btn btn-primary" id="startQuestionnaireBtn">
                    Start Questionnaire
                </button>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-container">
                <h2>⚠️ Error</h2>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }

    startMetronome(tempo) {
        // Initialize audio context if needed
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const interval = 60000 / tempo; // Convert BPM to milliseconds
        const nextBeat = this.audioContext.currentTime;

        const metronomeBtn = document.getElementById('startMetronome');
        if (metronomeBtn) {
            metronomeBtn.innerHTML = '<span class="metronome-icon">⏸</span> Stop Metronome';
        }

        this.metronomeInterval = setInterval(() => {
            // Visual indicator
            const indicator = document.getElementById('metronomeIndicator');
            if (indicator) {
                indicator.classList.add('beat');
                setTimeout(() => indicator.classList.remove('beat'), 100);
            }

            // Audio click
            const oscillator = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            oscillator.connect(gain);
            gain.connect(this.audioContext.destination);

            oscillator.frequency.value = 1000;
            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.05);
        }, interval);
    }

    stopMetronome() {
        if (this.metronomeInterval) {
            clearInterval(this.metronomeInterval);
            this.metronomeInterval = null;

            const metronomeBtn = document.getElementById('startMetronome');
            if (metronomeBtn) {
                metronomeBtn.innerHTML = '<span class="metronome-icon">🎵</span> Start Metronome';
            }
        }
    }

    startChordTimer() {
        let timeLeft = 60;
        const timerDisplay = document.getElementById('timerDisplay');
        const timerBtn = document.getElementById('startTimer');

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            timerDisplay.textContent = '60s';
            timerBtn.innerHTML = '<span class="timer-icon">⏱️</span> Start 60s Timer';
            return;
        }

        timerBtn.innerHTML = '<span class="timer-icon">⏹️</span> Stop Timer';

        this.timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
                timerDisplay.textContent = 'Time\'s up!';
                timerBtn.innerHTML = '<span class="timer-icon">⏱️</span> Start 60s Timer';

                // Play a sound to indicate time's up
                if (this.audioContext) {
                    const oscillator = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();

                    oscillator.connect(gain);
                    gain.connect(this.audioContext.destination);

                    oscillator.frequency.value = 800;
                    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(
                        0.001,
                        this.audioContext.currentTime + 0.5
                    );

                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                }
            }
        }, 1000);
    }

    destroy() {
        // Clean up
        this.stopMetronome();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.container = null;
    }
}
