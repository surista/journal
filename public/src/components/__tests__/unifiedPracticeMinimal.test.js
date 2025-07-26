import { UnifiedPracticeMinimal } from '../unifiedPracticeMinimal.js';
import { StorageService } from '../../services/storageService.js';

// Mock dependencies
jest.mock('../../services/storageService.js');
jest.mock('../modules/timer.js');
jest.mock('../modules/metronome.js');
jest.mock('../modules/imageManager.js');
jest.mock('../modules/uiController.js');
jest.mock('../modules/sessionManager.js');

describe('UnifiedPracticeMinimal - Image Loading', () => {
  let unifiedPractice;
  let mockStorageService;
  let mockImageManager;
  let mockUIController;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="practiceContainer"></div>';
    
    // Create mock instances
    mockStorageService = {
      getPracticeEntries: jest.fn().mockResolvedValue([]),
      getSessionAreas: jest.fn().mockResolvedValue(['Scales', 'Chords']),
      savePracticeEntry: jest.fn().mockResolvedValue(true)
    };
    
    mockImageManager = {
      currentImage: null,
      setImageLoadCallback: jest.fn(),
      initialize: jest.fn()
    };
    
    mockUIController = {
      showImagePreview: jest.fn(),
      showNotification: jest.fn(),
      updateTimerControls: jest.fn(),
      showModal: jest.fn()
    };

    // Mock the module imports
    StorageService.mockImplementation(() => mockStorageService);
    
    // Create instance
    unifiedPractice = new UnifiedPracticeMinimal();
    unifiedPractice.storageService = mockStorageService;
    unifiedPractice.imageManager = mockImageManager;
    unifiedPractice.uiController = mockUIController;
  });

  describe('loadPracticeSessionData', () => {
    it('should load image when session has sheetMusicImage', async () => {
      const mockSessionData = {
        id: 'test123',
        name: 'Test Session',
        sheetMusicImage: 'data:image/png;base64,mockImageData',
        tempo: 120,
        practiceArea: 'Scales'
      };

      await unifiedPractice.loadPracticeSessionData(mockSessionData);

      // Should set the image on imageManager
      expect(mockImageManager.currentImage).toBe(mockSessionData.sheetMusicImage);
      
      // Should call uiController to show the image
      expect(mockUIController.showImagePreview).toHaveBeenCalledWith(mockSessionData.sheetMusicImage);
    });

    it('should not attempt to load image when session has no image', async () => {
      const mockSessionData = {
        id: 'test456',
        name: 'No Image Session',
        tempo: 80,
        practiceArea: 'Chords'
      };

      await unifiedPractice.loadPracticeSessionData(mockSessionData);

      // Should not set any image
      expect(mockImageManager.currentImage).toBeNull();
      
      // Should not call showImagePreview
      expect(mockUIController.showImagePreview).not.toHaveBeenCalled();
    });

    it('should handle missing imageManager gracefully', async () => {
      unifiedPractice.imageManager = null;
      
      const mockSessionData = {
        sheetMusicImage: 'data:image/png;base64,test'
      };

      // Should not throw
      await expect(
        unifiedPractice.loadPracticeSessionData(mockSessionData)
      ).resolves.not.toThrow();
    });
  });

  describe('Practice Session with Images', () => {
    it('should save image with practice session', async () => {
      // Set up image in imageManager
      mockImageManager.getCurrentImage = jest.fn().mockReturnValue('data:image/png;base64,savedImage');
      
      // Mock the save session flow
      const duration = 1800; // 30 minutes
      unifiedPractice.currentMode = 'metronome';
      unifiedPractice.metronome = { state: { bpm: 100 } };
      
      // Simulate saving a session
      await unifiedPractice.savePracticeSession({
        sessionName: 'Image Test Session',
        practiceArea: 'Scales',
        duration: duration
      });

      // Check that saved entry includes the image
      expect(mockStorageService.savePracticeEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          sheetMusicImage: 'data:image/png;base64,savedImage'
        })
      );
    });

    it('should not save image field when no image present', async () => {
      mockImageManager.getCurrentImage = jest.fn().mockReturnValue(null);
      
      const duration = 900; // 15 minutes
      unifiedPractice.currentMode = 'metronome';
      unifiedPractice.metronome = { state: { bpm: 80 } };
      
      await unifiedPractice.savePracticeSession({
        sessionName: 'No Image Session',
        practiceArea: 'Chords',
        duration: duration
      });

      const savedEntry = mockStorageService.savePracticeEntry.mock.calls[0][0];
      expect(savedEntry).not.toHaveProperty('sheetMusicImage');
    });
  });

  describe('History Tab Integration', () => {
    it('should load session from history with image', async () => {
      const mockHistorySession = {
        id: 'history123',
        name: 'Historical Session',
        sheetMusicImage: 'data:image/jpeg;base64,historyImage',
        tempo: 140,
        timeSignature: '3/4',
        practiceArea: 'Jazz Standards'
      };

      // Simulate clicking "Practice Again" from history
      sessionStorage.setItem('loadPracticeSession', JSON.stringify({
        mode: 'metronome',
        sheetMusicImage: mockHistorySession.sheetMusicImage,
        tempo: mockHistorySession.tempo,
        timeSignature: mockHistorySession.timeSignature,
        practiceArea: mockHistorySession.practiceArea
      }));

      // Trigger the load event
      const loadEvent = new CustomEvent('loadPracticeSession', {
        detail: { sessionId: mockHistorySession.id }
      });
      window.dispatchEvent(loadEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should have loaded the image
      expect(mockUIController.showImagePreview).toHaveBeenCalledWith(
        mockHistorySession.sheetMusicImage
      );
    });
  });

  describe('Image Manager Callbacks', () => {
    it('should register image load callback on initialization', () => {
      unifiedPractice.initialize();
      
      expect(mockImageManager.setImageLoadCallback).toHaveBeenCalled();
      
      // Get the callback that was registered
      const callback = mockImageManager.setImageLoadCallback.mock.calls[0][0];
      expect(typeof callback).toBe('function');
    });

    it('should handle image load callback correctly', () => {
      unifiedPractice.initialize();
      
      // Get and call the callback
      const callback = mockImageManager.setImageLoadCallback.mock.calls[0][0];
      const testImage = 'data:image/png;base64,callbackTest';
      
      callback(testImage);
      
      // Should update UI with the loaded image
      expect(mockUIController.showImagePreview).toHaveBeenCalledWith(testImage);
    });
  });
});