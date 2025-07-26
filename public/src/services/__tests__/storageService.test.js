import { StorageService } from '../storageService.js';

describe('StorageService', () => {
  let storageService;
  let mockLocalStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    
    // Create a new instance for each test with a test user ID
    storageService = new StorageService('testuser');
  });

  describe('Session Areas', () => {
    describe('getSessionAreas', () => {
      it('should return default session areas when none are stored', async () => {
        const areas = await storageService.getSessionAreas();
        
        expect(areas).toContain('Scales');
        expect(areas).toContain('Chords');
        expect(areas).toContain('Arpeggios');
        expect(areas).toContain('Songs');
        expect(areas).toContain('Technique');
        expect(areas).toContain('Theory');
        expect(areas).toContain('Improvisation');
        expect(areas).toContain('Sight Reading');
        expect(areas).toContain('Ear Training');
        expect(areas).toContain('Rhythm');
        expect(areas).toContain('Repertoire');
        expect(areas).toContain('Audio Practice');
        expect(areas).not.toContain('YouTube Practice');
      });

      it('should return stored session areas when available', async () => {
        const customAreas = ['Rock Songs', 'Jazz Standards', 'Blues Licks'];
        localStorage.setItem('guitarpractice_testuser_session_areas', JSON.stringify(customAreas));
        
        const areas = await storageService.getSessionAreas();
        
        expect(areas).toEqual(customAreas);
      });

      it('should handle corrupted data gracefully', async () => {
        localStorage.setItem('guitarpractice_testuser_session_areas', 'invalid json');
        
        const areas = await storageService.getSessionAreas();
        
        // Should return defaults on error
        expect(areas).toContain('Scales');
        expect(areas).toContain('Chords');
      });

      it('should use user-specific prefix for session areas', async () => {
        const customAreas = ['Classical', 'Fingerstyle'];
        localStorage.setItem('guitarpractice_testuser_session_areas', JSON.stringify(customAreas));
        
        const areas = await storageService.getSessionAreas();
        
        expect(areas).toEqual(customAreas);
      });
    });

    describe('saveSessionAreas', () => {
      it('should save session areas to localStorage', async () => {
        const customAreas = ['Metal Riffs', 'Progressive Rock', 'Acoustic'];
        
        await storageService.saveSessionAreas(customAreas);
        
        const stored = localStorage.getItem('guitarpractice_testuser_session_areas');
        expect(JSON.parse(stored)).toEqual(customAreas);
      });

      it('should trigger sessionAreasUpdated event', async () => {
        const mockEventListener = jest.fn();
        window.addEventListener('sessionAreasUpdated', mockEventListener);
        
        await storageService.saveSessionAreas(['Test Area']);
        
        expect(mockEventListener).toHaveBeenCalled();
        
        window.removeEventListener('sessionAreasUpdated', mockEventListener);
      });

      it('should handle save errors gracefully', async () => {
        // Mock localStorage.setItem to throw an error
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = jest.fn(() => {
          throw new Error('Storage quota exceeded');
        });
        
        const result = await storageService.saveSessionAreas(['Test']);
        
        expect(result).toBe(false);
        
        // Restore original method
        localStorage.setItem = originalSetItem;
      });
    });

    describe('addSessionArea', () => {
      it('should add a new session area', async () => {
        await storageService.addSessionArea('Flamenco');
        
        const areas = await storageService.getSessionAreas();
        expect(areas).toContain('Flamenco');
      });

      it('should not add duplicate areas', async () => {
        // First add
        await storageService.addSessionArea('Scales');
        
        const areas = await storageService.getSessionAreas();
        const scalesCount = areas.filter(area => area === 'Scales').length;
        
        expect(scalesCount).toBe(1);
      });

      it('should add areas with whitespace as-is', async () => {
        await storageService.addSessionArea('  Country Songs  ');
        
        const areas = await storageService.getSessionAreas();
        expect(areas).toContain('  Country Songs  ');
      });

      it('should allow empty areas', async () => {
        const result = await storageService.addSessionArea('');
        
        expect(result).toBe(true);
        
        const areas = await storageService.getSessionAreas();
        expect(areas).toContain('');
      });
    });

    describe('removeSessionArea', () => {
      it('should remove an existing session area', async () => {
        const customAreas = ['Test1', 'Test2', 'Test3'];
        await storageService.saveSessionAreas(customAreas);
        
        await storageService.removeSessionArea('Test2');
        
        const areas = await storageService.getSessionAreas();
        expect(areas).toContain('Test1');
        expect(areas).toContain('Test3');
        expect(areas).not.toContain('Test2');
      });

      it('should handle removing non-existent areas gracefully', async () => {
        const result = await storageService.removeSessionArea('NonExistent');
        
        expect(result).toBe(true); // Should still return true
      });
    });
  });

  describe('Practice Entries', () => {
    const mockPracticeEntry = {
      id: 'test123',
      name: 'Test Session',
      duration: 1800,
      practiceArea: 'Scales',
      date: new Date().toISOString(),
      sheetMusicImage: 'data:image/png;base64,test'
    };

    describe('savePracticeEntry', () => {
      it('should save a practice entry', async () => {
        const result = await storageService.savePracticeEntry(mockPracticeEntry);
        
        expect(result).toBe(true);
        
        const entries = await storageService.getPracticeEntries();
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject(mockPracticeEntry);
      });

      it('should handle entries with custom practice areas', async () => {
        const entryWithCustomArea = {
          ...mockPracticeEntry,
          practiceArea: 'YouTube Practice'
        };
        
        await storageService.savePracticeEntry(entryWithCustomArea);
        
        const entries = await storageService.getPracticeEntries();
        expect(entries[0].practiceArea).toBe('YouTube Practice');
      });
    });

    describe('updatePracticeEntry', () => {
      it('should update an existing practice entry', async () => {
        await storageService.savePracticeEntry(mockPracticeEntry);
        
        const updates = {
          name: 'Updated Session',
          practiceArea: 'Chords'
        };
        
        const result = await storageService.updatePracticeEntry(mockPracticeEntry.id, updates);
        
        expect(result).toBe(true);
        
        const entries = await storageService.getPracticeEntries();
        expect(entries[0].name).toBe('Updated Session');
        expect(entries[0].practiceArea).toBe('Chords');
        expect(entries[0].duration).toBe(mockPracticeEntry.duration); // Unchanged
      });

      it('should return false when updating non-existent entry', async () => {
        const result = await storageService.updatePracticeEntry('nonexistent', { name: 'Test' });
        
        expect(result).toBe(false);
      });
    });
  });

});