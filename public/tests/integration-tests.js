// Integration Tests for Guitar Practice Journal
// Run these tests by including this file in a test HTML page or running in the browser console

class IntegrationTests {
    constructor() {
        this.results = [];
        this.testAudioFile = '/assets/audio/Tightrope.mp3';
        this.testYouTubeUrl = 'https://www.youtube.com/watch?v=rXIoV3g3Yjo';
    }

    async runAllTests() {
        console.log('🧪 Starting Integration Tests...\n');
        
        try {
            // Core functionality tests
            await this.testStorageService();
            await this.testPracticeLog();
            await this.testAudioFileLoading();
            await this.testYouTubeLoading();
            await this.testLoopFunctionality();
            await this.testMetronome();
            await this.testTimer();
            
            // Display results
            this.displayResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testStorageService() {
        console.log('📦 Testing Storage Service...');
        
        try {
            const { StorageService } = await import('../src/services/storageService.js');
            const storage = new StorageService('test-user');
            
            // Test basic storage operations
            const testData = { 
                id: Date.now() + Math.random(),
                date: new Date().toISOString(),
                duration: 1800,
                practiceArea: 'Test',
                notes: 'Test entry'
            };
            
            // Save data
            const saved = await storage.savePracticeEntry(testData);
            
            if (!saved) {
                this.addResult('Storage Service - Save/Retrieve', false, 'Failed to save entry');
                return;
            }
            
            // Retrieve data
            const entries = await storage.getPracticeEntries();
            const retrieved = entries.find(e => e.id === testData.id);
            
            if (retrieved && retrieved.practiceArea === 'Test') {
                this.addResult('Storage Service - Save/Retrieve', true);
            } else {
                this.addResult('Storage Service - Save/Retrieve', false, 'Data mismatch');
            }
            
            // Clean up
            await storage.deletePracticeEntry(testData.id);
            
        } catch (error) {
            this.addResult('Storage Service', false, error.message);
        }
    }

    async testPracticeLog() {
        console.log('📝 Testing Practice Log...');
        
        try {
            const { StorageService } = await import('../src/services/storageService.js');
            const storage = new StorageService('test-user');
            
            // Create a test practice session
            const testSession = {
                id: Date.now() + Math.random(),
                date: new Date().toISOString(),
                duration: 1800, // 30 minutes
                notes: 'Test practice session',
                practiceArea: 'Scales, Chord Changes',
                audioFile: null,
                goals: ['Improve speed', 'Clean tone']
            };
            
            // Save the session
            const saved = await storage.savePracticeEntry(testSession);
            
            if (!saved) {
                this.addResult('Practice Log - Save Session', false, 'Failed to save session');
                return;
            }
            
            // Retrieve all sessions
            const sessions = await storage.getPracticeEntries();
            const found = sessions.find(s => s.id === testSession.id);
            
            if (found && found.duration === 1800) {
                this.addResult('Practice Log - Save Session', true);
            } else {
                this.addResult('Practice Log - Save Session', false, 'Session not found or data mismatch');
            }
            
            // Clean up
            await storage.deletePracticeEntry(testSession.id);
            
        } catch (error) {
            this.addResult('Practice Log', false, error.message);
        }
    }

    async testAudioFileLoading() {
        console.log('🎵 Testing Audio File Loading...');
        
        try {
            const { AudioService } = await import('../src/services/audioService.js');
            const audioService = new AudioService();
            
            // Simulate user gesture for audio context
            document.dispatchEvent(new Event('click'));
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Test loading audio file - adjust path for relative URL
            // From /public/tests/ we need to go up one level to reach /public/assets/
            const audioPath = '../assets/audio/Tightrope.mp3';
            const response = await fetch(audioPath);
            if (response.ok) {
                const blob = await response.blob();
                
                // Create a mock file object
                const file = new File([blob], 'Tightrope.mp3', { type: 'audio/mp3' });
                
                if (file.size > 0) {
                    this.addResult('Audio File - Load from assets', true);
                } else {
                    this.addResult('Audio File - Load from assets', false, 'File is empty');
                }
            } else {
                this.addResult('Audio File - Load from assets', false, 'Failed to fetch file');
            }
            
        } catch (error) {
            this.addResult('Audio File Loading', false, error.message);
        }
    }

    async testYouTubeLoading() {
        console.log('📺 Testing YouTube Loading...');
        
        try {
            // Extract video ID from URL
            const videoId = this.testYouTubeUrl.match(/v=([^&]+)/)?.[1];
            
            if (videoId === 'rXIoV3g3Yjo') {
                this.addResult('YouTube - Extract Video ID', true);
                
                // Test creating YouTube player container
                const testContainer = document.createElement('div');
                testContainer.id = 'test-youtube-player';
                testContainer.innerHTML = `
                    <iframe 
                        width="560" 
                        height="315" 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allowfullscreen>
                    </iframe>
                `;
                
                if (testContainer.querySelector('iframe')) {
                    this.addResult('YouTube - Create Player', true);
                } else {
                    this.addResult('YouTube - Create Player', false, 'Failed to create iframe');
                }
            } else {
                this.addResult('YouTube - Extract Video ID', false, 'Invalid video ID');
            }
            
        } catch (error) {
            this.addResult('YouTube Loading', false, error.message);
        }
    }

    async testLoopFunctionality() {
        console.log('🔁 Testing Loop Functionality...');
        
        try {
            const { StorageService } = await import('../src/services/storageService.js');
            const storage = new StorageService('test-user');
            
            // Test saving audio session with loops
            const testFileName = 'test-audio.mp3';
            const testSession = {
                name: 'Test Loop Session',
                notes: 'Testing loop functionality',
                timestamp: Date.now(),
                fileName: testFileName,
                speed: 100,
                pitch: 0,
                loopStart: 0,
                loopEnd: 30,
                loopEnabled: true,
                tempoProgression: {
                    enabled: false,
                    incrementValue: 5,
                    incrementType: 'percentage',
                    loopInterval: 2
                },
                isYouTubeMode: false
            };
            
            // Save the session
            const saved = storage.saveAudioSession(testFileName, testSession);
            
            if (!saved) {
                this.addResult('Loops - Save/Load', false, 'Failed to save audio session');
                return;
            }
            
            // Retrieve sessions
            const savedSessions = storage.getAudioSessions(testFileName);
            
            if (savedSessions && savedSessions.length > 0 && savedSessions[0].name === 'Test Loop Session') {
                this.addResult('Loops - Save/Load', true);
            } else {
                this.addResult('Loops - Save/Load', false, 'Session not saved correctly');
            }
            
            // Test loop validation
            const savedLoop = savedSessions[0];
            if (savedLoop.loopStart < savedLoop.loopEnd) {
                this.addResult('Loops - Validation', true);
            } else {
                this.addResult('Loops - Validation', false, 'Invalid loop times');
            }
            
            // Clean up
            localStorage.removeItem(`${storage.prefix}audio_sessions_${testFileName}`);
            
        } catch (error) {
            this.addResult('Loop Functionality', false, error.message);
        }
    }

    async testMetronome() {
        console.log('🎵 Testing Metronome...');
        
        try {
            const { Metronome } = await import('../src/components/metronome.js');
            const { AudioService } = await import('../src/services/audioService.js');
            
            // Create test container
            const container = document.createElement('div');
            document.body.appendChild(container); // Add to DOM for proper rendering
            const audioService = new AudioService();
            
            // Simulate user gesture
            document.dispatchEvent(new Event('click'));
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const metronome = new Metronome(container, audioService);
            
            // Wait for render and ensure DOM elements exist
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Verify DOM elements were created
            const bpmValueElement = document.getElementById('bpmValue');
            if (!bpmValueElement) {
                this.addResult('Metronome - DOM Creation', false, 'Required DOM elements not created');
                document.body.removeChild(container);
                return;
            }
            
            // Test BPM setting
            metronome.setBpm(140);
            if (metronome.bpm === 140) {
                this.addResult('Metronome - Set BPM', true);
            } else {
                this.addResult('Metronome - Set BPM', false, 'BPM not set correctly');
            }
            
            // Test time signature
            metronome.setTimeSignature(3);
            if (metronome.beatsPerMeasure === 3) {
                this.addResult('Metronome - Set Time Signature', true);
            } else {
                this.addResult('Metronome - Set Time Signature', false, 'Time signature not set');
            }
            
            // Clean up
            metronome.destroy();
            document.body.removeChild(container);
            
        } catch (error) {
            this.addResult('Metronome', false, error.message);
        }
    }

    async testTimer() {
        console.log('⏱️ Testing Timer...');
        
        try {
            const { Timer } = await import('../src/components/timer.js');
            
            // Create test container
            const container = document.createElement('div');
            const timer = new Timer(container);
            
            // Test timer start/stop
            timer.start();
            
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            timer.stop();
            const elapsed = timer.getElapsedTime();
            
            if (elapsed >= 1 && elapsed <= 2) {
                this.addResult('Timer - Start/Stop', true);
            } else {
                this.addResult('Timer - Start/Stop', false, `Unexpected elapsed time: ${elapsed}`);
            }
            
            // Test reset
            timer.reset();
            if (timer.getElapsedTime() === 0) {
                this.addResult('Timer - Reset', true);
            } else {
                this.addResult('Timer - Reset', false, 'Timer not reset');
            }
            
        } catch (error) {
            this.addResult('Timer', false, error.message);
        }
    }

    addResult(testName, passed, error = null) {
        this.results.push({
            name: testName,
            passed: passed,
            error: error,
            timestamp: new Date().toISOString()
        });
        
        const icon = passed ? '✅' : '❌';
        const message = error ? ` - ${error}` : '';
        console.log(`${icon} ${testName}${message}`);
    }

    displayResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} (${Math.round(passed/total * 100)}%)`);
        console.log(`Failed: ${failed} (${Math.round(failed/total * 100)}%)`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`);
            });
        }
        
        console.log('\n✨ Test run completed!');
        
        return {
            total,
            passed,
            failed,
            results: this.results
        };
    }
}

// Export for use in other modules
export { IntegrationTests };

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
    window.integrationTests = new IntegrationTests();
    console.log('Integration tests ready. Run: integrationTests.runAllTests()');
}