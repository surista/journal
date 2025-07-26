import { 
  getTimer,
  getTimerById,
  registerTimer,
  isTimerSyncEnabled,
  startTimerIfNeeded,
  pauseTimerIfNeeded,
  getTimerState,
  syncTimerWithAudio
} from '../../src/utils/timerUtils.js';

// Mock the timer registry
jest.mock('../../src/services/timerRegistry.js', () => ({
  timerRegistry: {
    getPrimary: jest.fn(),
    get: jest.fn(),
    register: jest.fn(),
    migrateLegacyTimer: jest.fn()
  }
}));

describe('Timer Utilities', () => {
  let mockTimer;
  let timerRegistry;

  beforeEach(() => {
    // Get the mocked registry
    timerRegistry = require('../../src/services/timerRegistry.js').timerRegistry;
    
    // Create a mock timer
    mockTimer = {
      isRunning: false,
      elapsedTime: 0,
      syncWithAudio: true,
      start: jest.fn(),
      pause: jest.fn(),
      getFormattedTime: jest.fn().mockReturnValue('00:00:00')
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getTimer', () => {
    test('returns timer from registry when available', () => {
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      const timer = getTimer();
      
      expect(timer).toBe(mockTimer);
      expect(timerRegistry.getPrimary).toHaveBeenCalled();
    });

    test('attempts migration when registry is empty', () => {
      timerRegistry.getPrimary.mockReturnValue(null);
      timerRegistry.migrateLegacyTimer.mockReturnValue(true);
      timerRegistry.getPrimary.mockReturnValueOnce(null).mockReturnValueOnce(mockTimer);
      
      const timer = getTimer();
      
      expect(timerRegistry.migrateLegacyTimer).toHaveBeenCalled();
      expect(timer).toBe(mockTimer);
    });

    test('returns null when no timer exists', () => {
      timerRegistry.getPrimary.mockReturnValue(null);
      timerRegistry.migrateLegacyTimer.mockReturnValue(false);
      
      const timer = getTimer();
      
      expect(timer).toBeNull();
    });
  });

  describe('getTimerById', () => {
    test('returns timer by ID', () => {
      timerRegistry.get.mockReturnValue(mockTimer);
      
      const timer = getTimerById('test-timer');
      
      expect(timer).toBe(mockTimer);
      expect(timerRegistry.get).toHaveBeenCalledWith('test-timer');
    });
  });

  describe('registerTimer', () => {
    test('registers timer with registry', () => {
      timerRegistry.register.mockReturnValue(true);
      
      const result = registerTimer('test-timer', mockTimer);
      
      expect(result).toBe(true);
      expect(timerRegistry.register).toHaveBeenCalledWith('test-timer', mockTimer);
    });
  });

  describe('isTimerSyncEnabled', () => {
    test('returns true when timer exists and sync is enabled', () => {
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      expect(isTimerSyncEnabled()).toBe(true);
    });

    test('returns false when timer sync is disabled', () => {
      mockTimer.syncWithAudio = false;
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      expect(isTimerSyncEnabled()).toBe(false);
    });

    test('returns false when no timer exists', () => {
      timerRegistry.getPrimary.mockReturnValue(null);
      
      expect(isTimerSyncEnabled()).toBe(false);
    });
  });

  describe('startTimerIfNeeded', () => {
    test('starts timer when not running', () => {
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      const result = startTimerIfNeeded();
      
      expect(result).toBe(true);
      expect(mockTimer.start).toHaveBeenCalled();
    });

    test('does not start timer when already running', () => {
      mockTimer.isRunning = true;
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      const result = startTimerIfNeeded();
      
      expect(result).toBe(false);
      expect(mockTimer.start).not.toHaveBeenCalled();
    });

    test('returns false when no timer exists', () => {
      timerRegistry.getPrimary.mockReturnValue(null);
      
      const result = startTimerIfNeeded();
      
      expect(result).toBe(false);
    });
  });

  describe('pauseTimerIfNeeded', () => {
    test('pauses timer when running', () => {
      mockTimer.isRunning = true;
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      const result = pauseTimerIfNeeded();
      
      expect(result).toBe(true);
      expect(mockTimer.pause).toHaveBeenCalled();
    });

    test('does not pause timer when not running', () => {
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      const result = pauseTimerIfNeeded();
      
      expect(result).toBe(false);
      expect(mockTimer.pause).not.toHaveBeenCalled();
    });
  });

  describe('getTimerState', () => {
    test('returns timer state when timer exists', () => {
      mockTimer.elapsedTime = 12345;
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      const state = getTimerState();
      
      expect(state).toEqual({
        isRunning: false,
        elapsedTime: 12345,
        formattedTime: '00:00:00',
        syncWithAudio: true
      });
    });

    test('returns null when no timer exists', () => {
      timerRegistry.getPrimary.mockReturnValue(null);
      
      const state = getTimerState();
      
      expect(state).toBeNull();
    });
  });

  describe('syncTimerWithAudio', () => {
    beforeEach(() => {
      // Mock console.log to verify logging
      global.console.log = jest.fn();
    });

    test('starts timer when sync enabled and shouldStart is true', () => {
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      syncTimerWithAudio('audio', true);
      
      expect(mockTimer.start).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Timer sync: Starting timer from audio');
    });

    test('pauses timer when sync enabled and shouldStart is false', () => {
      mockTimer.isRunning = true;
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      syncTimerWithAudio('youtube', false);
      
      expect(mockTimer.pause).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Timer sync: Pausing timer from youtube');
    });

    test('does nothing when sync is disabled', () => {
      mockTimer.syncWithAudio = false;
      timerRegistry.getPrimary.mockReturnValue(mockTimer);
      
      syncTimerWithAudio('metronome', true);
      
      expect(mockTimer.start).not.toHaveBeenCalled();
      expect(mockTimer.pause).not.toHaveBeenCalled();
    });

    test('does nothing when no timer exists', () => {
      timerRegistry.getPrimary.mockReturnValue(null);
      
      syncTimerWithAudio('audio', true);
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});