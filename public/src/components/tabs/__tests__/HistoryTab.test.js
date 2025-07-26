import { HistoryTab } from '../HistoryTab.js';
import { StorageService } from '../../../services/storageService.js';

// Mock dependencies
jest.mock('../../../services/storageService.js');

// Helper to escape HTML
global.escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

describe('HistoryTab - Practice Area Dropdown', () => {
  let historyTab;
  let mockStorageService;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create mock storage service
    mockStorageService = {
      getPracticeEntries: jest.fn().mockResolvedValue([]),
      getSessionAreas: jest.fn().mockResolvedValue([
        'Scales', 'Chords', 'Arpeggios', 'Songs', 
        'Custom Area 1', 'Custom Area 2'
      ]),
      updatePracticeEntry: jest.fn().mockResolvedValue(true),
      deletePracticeEntry: jest.fn().mockResolvedValue(true)
    };
    
    StorageService.mockImplementation(() => mockStorageService);
    
    // Create instance
    historyTab = new HistoryTab(mockStorageService);
  });

  describe('handleEditSession', () => {
    const mockSession = {
      id: 'test123',
      name: 'Test Session',
      practiceArea: 'Scales',
      duration: 1800,
      date: new Date().toISOString()
    };

    beforeEach(() => {
      historyTab.allSessions = [mockSession];
      historyTab.showNotification = jest.fn();
    });

    it('should load practice areas from storage service', async () => {
      await historyTab.handleEditSession(mockSession.id);
      
      expect(mockStorageService.getSessionAreas).toHaveBeenCalled();
    });

    it('should create dropdown with dynamic practice areas', async () => {
      await historyTab.handleEditSession(mockSession.id);
      
      // Find the modal in DOM
      const modal = document.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
      
      // Find the practice area select
      const select = modal.querySelector('select[name="practiceArea"]');
      expect(select).toBeTruthy();
      
      // Check options
      const options = Array.from(select.options).map(opt => opt.value);
      expect(options).toContain('Scales');
      expect(options).toContain('Chords');
      expect(options).toContain('Custom Area 1');
      expect(options).toContain('Custom Area 2');
      
      // Should not contain hardcoded YouTube Practice
      expect(options).not.toContain('YouTube Practice');
    });

    it('should select current practice area in dropdown', async () => {
      mockSession.practiceArea = 'Custom Area 1';
      
      await historyTab.handleEditSession(mockSession.id);
      
      const select = document.querySelector('select[name="practiceArea"]');
      expect(select.value).toBe('Custom Area 1');
    });

    it('should handle practice areas not in the list', async () => {
      mockSession.practiceArea = 'YouTube Practice';
      
      await historyTab.handleEditSession(mockSession.id);
      
      const select = document.querySelector('select[name="practiceArea"]');
      const options = Array.from(select.options).map(opt => opt.value);
      
      // Should add the unknown area as an option
      expect(options).toContain('YouTube Practice');
      expect(select.value).toBe('YouTube Practice');
    });

    it('should handle empty practice area', async () => {
      mockSession.practiceArea = '';
      
      await historyTab.handleEditSession(mockSession.id);
      
      const select = document.querySelector('select[name="practiceArea"]');
      expect(select.value).toBe('');
    });

    it('should save updated practice area on form submit', async () => {
      await historyTab.handleEditSession(mockSession.id);
      
      const form = document.querySelector('#editSessionForm');
      const select = document.querySelector('select[name="practiceArea"]');
      
      // Change the practice area
      select.value = 'Custom Area 2';
      
      // Submit the form
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Check that update was called with new practice area
      expect(mockStorageService.updatePracticeEntry).toHaveBeenCalledWith(
        mockSession.id,
        expect.objectContaining({
          practiceArea: 'Custom Area 2'
        })
      );
    });
  });

  describe('Practice Area Integration', () => {
    it('should handle storage service errors gracefully', async () => {
      mockStorageService.getSessionAreas.mockRejectedValue(new Error('Storage error'));
      
      const session = {
        id: 'error-test',
        name: 'Error Test',
        practiceArea: 'Scales'
      };
      historyTab.allSessions = [session];
      
      // Should not throw
      await expect(historyTab.handleEditSession(session.id)).resolves.not.toThrow();
      
      // Modal should still be created
      const modal = document.querySelector('.modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should update UI after successful edit', async () => {
      const session = {
        id: 'ui-test',
        name: 'UI Test',
        practiceArea: 'Scales'
      };
      historyTab.allSessions = [session];
      
      await historyTab.handleEditSession(session.id);
      
      const form = document.querySelector('#editSessionForm');
      const select = document.querySelector('select[name="practiceArea"]');
      
      select.value = 'Arpeggios';
      
      const submitEvent = new Event('submit', { cancelable: true });
      form.dispatchEvent(submitEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Session in memory should be updated
      expect(historyTab.allSessions[0].practiceArea).toBe('Arpeggios');
    });
  });

  describe('Custom Practice Areas', () => {
    it('should display user custom practice areas', async () => {
      mockStorageService.getSessionAreas.mockResolvedValue([
        'Blues Licks',
        'Jazz Standards',
        'Classical Pieces',
        'Fingerstyle Patterns'
      ]);
      
      const session = {
        id: 'custom-test',
        name: 'Custom Test',
        practiceArea: 'Blues Licks'
      };
      historyTab.allSessions = [session];
      
      await historyTab.handleEditSession(session.id);
      
      const select = document.querySelector('select[name="practiceArea"]');
      const options = Array.from(select.options).map(opt => opt.value);
      
      expect(options).toContain('Blues Licks');
      expect(options).toContain('Jazz Standards');
      expect(options).toContain('Classical Pieces');
      expect(options).toContain('Fingerstyle Patterns');
    });

    it('should escape HTML in practice area names', async () => {
      mockStorageService.getSessionAreas.mockResolvedValue([
        '<script>alert("xss")</script>',
        'Normal Area'
      ]);
      
      const session = {
        id: 'xss-test',
        name: 'XSS Test',
        practiceArea: 'Normal Area'
      };
      historyTab.allSessions = [session];
      
      await historyTab.handleEditSession(session.id);
      
      const modal = document.querySelector('.modal-overlay');
      const html = modal.innerHTML;
      
      // Should not contain unescaped script tag
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
  });
});