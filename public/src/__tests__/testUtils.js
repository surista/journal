// Test utilities for Guitar Practice Journal

/**
 * Creates a mock practice session with default values
 * @param {Object} overrides - Values to override defaults
 * @returns {Object} Mock practice session
 */
export function createMockSession(overrides = {}) {
  return {
    id: `session-${Date.now()}`,
    name: 'Test Session',
    duration: 1800, // 30 minutes
    practiceArea: 'Scales',
    date: new Date().toISOString(),
    tempo: 120,
    timeSignature: '4/4',
    ...overrides
  };
}

/**
 * Creates a mock storage service with common methods
 * @param {Object} overrides - Methods to override
 * @returns {Object} Mock storage service
 */
export function createMockStorageService(overrides = {}) {
  return {
    getPracticeEntries: jest.fn().mockResolvedValue([]),
    savePracticeEntry: jest.fn().mockResolvedValue(true),
    updatePracticeEntry: jest.fn().mockResolvedValue(true),
    deletePracticeEntry: jest.fn().mockResolvedValue(true),
    getSessionAreas: jest.fn().mockResolvedValue([
      'Scales', 'Chords', 'Arpeggios', 'Songs',
      'Technique', 'Theory', 'Improvisation',
      'Sight Reading', 'Ear Training', 'Rhythm',
      'Repertoire', 'Audio Practice'
    ]),
    saveSessionAreas: jest.fn().mockResolvedValue(true),
    addSessionArea: jest.fn().mockResolvedValue(true),
    removeSessionArea: jest.fn().mockResolvedValue(true),
    getGoals: jest.fn().mockResolvedValue([]),
    saveGoal: jest.fn().mockResolvedValue(true),
    updateGoal: jest.fn().mockResolvedValue(true),
    deleteGoal: jest.fn().mockResolvedValue(true),
    setUserPrefix: jest.fn(),
    ...overrides
  };
}

/**
 * Creates a mock timer with common methods
 * @param {Object} overrides - Methods/properties to override
 * @returns {Object} Mock timer
 */
export function createMockTimer(overrides = {}) {
  return {
    isRunning: false,
    elapsedTime: 0,
    start: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    getElapsedTime: jest.fn().mockReturnValue(0),
    formatTime: jest.fn().mockImplementation((seconds) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }),
    ...overrides
  };
}

/**
 * Creates a mock metronome with common methods
 * @param {Object} overrides - Methods/properties to override
 * @returns {Object} Mock metronome
 */
export function createMockMetronome(overrides = {}) {
  return {
    state: {
      isPlaying: false,
      bpm: 120,
      timeSignature: 4,
      accentPattern: [true, false, false, false]
    },
    start: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    setBpm: jest.fn(),
    setTimeSignature: jest.fn(),
    setSound: jest.fn(),
    ...overrides
  };
}

/**
 * Creates a mock image manager
 * @param {Object} overrides - Methods/properties to override
 * @returns {Object} Mock image manager
 */
export function createMockImageManager(overrides = {}) {
  return {
    currentImage: null,
    initialize: jest.fn(),
    handleImageFile: jest.fn().mockReturnValue(true),
    handleImageBlob: jest.fn().mockReturnValue(true),
    clearImage: jest.fn(),
    getCurrentImage: jest.fn().mockReturnValue(null),
    generateThumbnail: jest.fn().mockResolvedValue('data:image/jpeg;base64,thumbnail'),
    setImageLoadCallback: jest.fn(),
    setImageClearCallback: jest.fn(),
    setCurrentMode: jest.fn(),
    showLightbox: jest.fn(),
    ...overrides
  };
}

/**
 * Creates a mock UI controller
 * @param {Object} overrides - Methods to override
 * @returns {Object} Mock UI controller
 */
export function createMockUIController(overrides = {}) {
  return {
    showNotification: jest.fn(),
    showModal: jest.fn().mockReturnValue(document.createElement('div')),
    showImagePreview: jest.fn(),
    hideImagePreview: jest.fn(),
    updateTimerDisplay: jest.fn(),
    updateTimerControls: jest.fn(),
    updateBpmDisplay: jest.fn(),
    updateAccentPattern: jest.fn(),
    showLoading: jest.fn(),
    hideLoading: jest.fn(),
    ...overrides
  };
}

/**
 * Waits for all pending promises to resolve
 * Useful for testing async operations
 */
export async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Creates a mock file for testing file uploads
 * @param {string} name - File name
 * @param {string} type - MIME type
 * @param {number} size - File size in bytes
 * @returns {File} Mock file
 */
export function createMockFile(name = 'test.jpg', type = 'image/jpeg', size = 1024) {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/**
 * Creates a mock audio context for testing audio features
 * @returns {Object} Mock audio context
 */
export function createMockAudioContext() {
  return {
    createOscillator: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 }
    })),
    createGain: jest.fn(() => ({
      connect: jest.fn(),
      gain: { value: 1 }
    })),
    createAnalyser: jest.fn(() => ({
      connect: jest.fn(),
      fftSize: 2048,
      getByteTimeDomainData: jest.fn()
    })),
    createScriptProcessor: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn()
    })),
    destination: {},
    currentTime: 0,
    sampleRate: 44100
  };
}

/**
 * Sets up common DOM elements for testing
 */
export function setupTestDOM() {
  document.body.innerHTML = `
    <div id="app">
      <div id="practiceContainer"></div>
      <div id="timerDisplay">00:00:00</div>
      <button id="timerStart">Start</button>
      <button id="timerStop">Stop</button>
      <button id="saveSessionBtn">Save Session</button>
    </div>
  `;
}

/**
 * Cleans up DOM after tests
 */
export function cleanupTestDOM() {
  document.body.innerHTML = '';
  sessionStorage.clear();
  localStorage.clear();
}

/**
 * Creates a mock event with common properties
 * @param {string} type - Event type
 * @param {Object} detail - Event detail
 * @returns {CustomEvent} Mock event
 */
export function createMockEvent(type, detail = {}) {
  return new CustomEvent(type, {
    detail,
    bubbles: true,
    cancelable: true
  });
}

/**
 * Simulates user input in a form field
 * @param {HTMLElement} element - Input element
 * @param {string} value - Value to set
 */
export function simulateInput(element, value) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates form submission
 * @param {HTMLFormElement} form - Form element
 */
export function simulateFormSubmit(form) {
  const submitEvent = new Event('submit', {
    bubbles: true,
    cancelable: true
  });
  form.dispatchEvent(submitEvent);
}