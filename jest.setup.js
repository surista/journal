// Jest setup file
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn().mockReturnValue({
    onsuccess: jest.fn(),
    onerror: jest.fn(),
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn(),
    }
  })
};

// Mock Audio
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn(),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
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
  destination: {},
  currentTime: 0
}));

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};