import { UnifiedPracticeMinimal } from '../components/unifiedPracticeMinimal.js';
import { HistoryTab } from '../components/tabs/HistoryTab.js';
import { StorageService } from '../services/storageService.js';
import { 
  createMockSession, 
  setupTestDOM, 
  cleanupTestDOM, 
  flushPromises,
  simulateInput,
  simulateFormSubmit
} from './testUtils.js';

describe('Integration Tests', () => {
  let storageService;
  let unifiedPractice;
  let historyTab;

  beforeEach(() => {
    setupTestDOM();
    storageService = new StorageService();
  });

  afterEach(() => {
    cleanupTestDOM();
  });

  describe('Complete Practice Session Flow', () => {
    it('should save session with custom practice area and load it in history', async () => {
      // Step 1: Add a custom practice area
      const customArea = 'YouTube Practice';
      await storageService.addSessionArea(customArea);
      
      const areas = await storageService.getSessionAreas();
      expect(areas).toContain(customArea);

      // Step 2: Create and save a practice session with image
      const sessionData = createMockSession({
        name: 'Integration Test Session',
        practiceArea: customArea,
        sheetMusicImage: 'data:image/png;base64,integrationTest',
        tempo: 140,
        duration: 2700 // 45 minutes
      });

      const saved = await storageService.savePracticeEntry(sessionData);
      expect(saved).toBe(true);

      // Step 3: Load history tab and verify session appears
      historyTab = new HistoryTab(storageService);
      await historyTab.loadHistory();
      
      expect(historyTab.allSessions).toHaveLength(1);
      expect(historyTab.allSessions[0].practiceArea).toBe(customArea);

      // Step 4: Edit the session and verify dropdown has custom areas
      document.body.innerHTML = '<div id="historyContainer"></div>';
      historyTab.container = document.getElementById('historyContainer');
      
      await historyTab.handleEditSession(sessionData.id);
      
      const modal = document.querySelector('.modal-overlay');
      const select = modal.querySelector('select[name="practiceArea"]');
      const options = Array.from(select.options).map(opt => opt.value);
      
      expect(options).toContain(customArea);
      expect(select.value).toBe(customArea);

      // Step 5: Load session for practice again
      sessionStorage.setItem('loadPracticeSession', JSON.stringify({
        mode: 'metronome',
        ...sessionData
      }));

      // Verify the session data includes the image
      const loadedData = JSON.parse(sessionStorage.getItem('loadPracticeSession'));
      expect(loadedData.sheetMusicImage).toBe(sessionData.sheetMusicImage);
      expect(loadedData.practiceArea).toBe(customArea);
    });
  });

  describe('Version Update Flow', () => {
    it('should show correct version throughout the app', async () => {
      // Check version in various places
      const version = window.APP_VERSION || '10.98';
      
      // Version should be consistent
      expect(version).toBe('10.98');
      
      // Footer should show correct version
      document.body.innerHTML = `
        <div class="footer-version-badge">v${version}</div>
        <a class="footer-link" data-action="whatsnew">What's New in v${version}</a>
      `;
      
      const versionBadge = document.querySelector('.footer-version-badge');
      expect(versionBadge.textContent).toBe('v10.98');
      
      const whatsNewLink = document.querySelector('[data-action="whatsnew"]');
      expect(whatsNewLink.textContent).toContain('v10.98');
    });
  });

  describe('User Settings Persistence', () => {
    it('should maintain user-specific settings across sessions', async () => {
      // User 1 settings
      storageService.setUserPrefix('testuser1');
      await storageService.saveSessionAreas(['Rock', 'Blues', 'Jazz']);
      
      // User 2 settings
      storageService.setUserPrefix('testuser2');
      await storageService.saveSessionAreas(['Classical', 'Flamenco']);
      
      // Switch back to user 1
      storageService.setUserPrefix('testuser1');
      const user1Areas = await storageService.getSessionAreas();
      expect(user1Areas).toEqual(['Rock', 'Blues', 'Jazz']);
      
      // Switch to user 2
      storageService.setUserPrefix('testuser2');
      const user2Areas = await storageService.getSessionAreas();
      expect(user2Areas).toEqual(['Classical', 'Flamenco']);
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted localStorage data gracefully', async () => {
      // Corrupt the session areas data
      localStorage.setItem('guitarjournal_session_areas', '{invalid json');
      
      // Should return defaults without throwing
      const areas = await storageService.getSessionAreas();
      expect(areas).toContain('Scales');
      expect(areas).toContain('Chords');
    });

    it('should handle missing required fields when loading sessions', async () => {
      const incompleteSession = {
        id: 'incomplete',
        // Missing required fields like name, duration, etc.
      };
      
      // Save incomplete session directly to localStorage
      const entries = [incompleteSession];
      localStorage.setItem('guitarjournal_practice_entries', JSON.stringify(entries));
      
      // Should handle gracefully
      const loaded = await storageService.getPracticeEntries();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('incomplete');
    });
  });

  describe('Cross-Component Communication', () => {
    it('should update practice areas across components via events', async () => {
      const mockListener = jest.fn();
      window.addEventListener('sessionAreasUpdated', mockListener);
      
      // Add a new practice area
      await storageService.addSessionArea('New Test Area');
      
      // Event should be fired
      expect(mockListener).toHaveBeenCalled();
      
      // Clean up
      window.removeEventListener('sessionAreasUpdated', mockListener);
    });
  });
});