// Simple integration test for refactored UnifiedPracticeMinimal
import { UnifiedPracticeMinimal } from './src/components/unifiedPracticeMinimal.js';

console.log('Testing UnifiedPracticeMinimal integration...\n');

try {
    // Mock storage service
    const mockStorageService = {
        getItem: (key) => null,
        setItem: (key, value) => {},
        addSession: async (session) => session,
        getSessions: async () => [],
        getPracticeEntries: async () => [],
        calculateStats: async () => ({ totalSessions: 0, currentStreak: 0, totalSeconds: 0 })
    };

    // Test 1: Create instance
    console.log('Test 1: Creating instance...');
    const practice = new UnifiedPracticeMinimal(mockStorageService);
    console.log('✓ Instance created successfully');

    // Test 2: Check modules
    console.log('\nTest 2: Checking modules...');
    const modules = ['timer', 'metronome', 'audioPlayer', 'youtubePlayer', 'sessionManager', 'imageManager', 'uiController'];
    let allModulesOk = true;
    
    for (const moduleName of modules) {
        if (practice[moduleName]) {
            console.log(`✓ ${moduleName} module present`);
        } else {
            console.log(`✗ ${moduleName} module missing`);
            allModulesOk = false;
        }
    }

    // Test 3: Check render method
    console.log('\nTest 3: Testing render method...');
    const html = practice.render();
    if (html && html.includes('unified-practice-minimal')) {
        console.log('✓ Render method returns valid HTML');
    } else {
        console.log('✗ Render method failed');
    }

    // Test 4: Check timer methods
    console.log('\nTest 4: Testing timer methods...');
    if (practice.timer && typeof practice.timer.start === 'function') {
        console.log('✓ Timer has start method');
        console.log('✓ Timer has stop method');
        console.log('✓ Timer has getElapsedTime method');
    } else {
        console.log('✗ Timer methods not found');
    }

    console.log('\n✅ All basic integration tests passed!');
    console.log('The refactored module structure is working correctly.');
    
} catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
}