# Testing Guide

## Overview
This project uses Jest as its testing framework with Testing Library for DOM testing. The setup supports ES6 modules and includes mocks for browser APIs.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- utils.test.js

# Run tests in verbose mode
npm run test:verbose
```

## Test Structure

Tests are located in `public/__tests__/` with the following structure:
```
public/__tests__/
├── services/       # Service layer tests
├── components/     # Component tests
└── utils/          # Utility function tests
```

## Writing Tests

### Basic Test Structure
```javascript
import { functionToTest } from '../src/module.js';

describe('Module Name', () => {
  describe('functionToTest', () => {
    test('should handle normal case', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected output');
    });

    test('should handle edge case', () => {
      expect(functionToTest(null)).toBe('default');
    });
  });
});
```

### Testing Async Functions
```javascript
test('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

// Or with promises
test('should handle promises', () => {
  return asyncFunction().then(result => {
    expect(result).toBe('expected');
  });
});
```

### Mocking Dependencies
```javascript
// Mock entire module
jest.mock('../src/services/api.js', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'test' })
}));

// Mock specific functions
const mockFn = jest.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async mocked value');
```

## Available Mocks

The following browser APIs are pre-mocked in `jest.setup.js`:
- `localStorage` - Full mock with getItem, setItem, removeItem, clear
- `IndexedDB` - Basic mock for database operations
- `Audio` - Mock for audio playback
- `AudioContext` - Mock for Web Audio API

## Testing Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Test public APIs, not internal implementation details

2. **Use Descriptive Test Names**
   ```javascript
   // Good
   test('should return 0 for empty array', () => {});
   
   // Bad
   test('test1', () => {});
   ```

3. **Follow AAA Pattern**
   ```javascript
   test('should calculate total', () => {
     // Arrange
     const items = [{ price: 10 }, { price: 20 }];
     
     // Act
     const total = calculateTotal(items);
     
     // Assert
     expect(total).toBe(30);
   });
   ```

4. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays/objects
   - Boundary values
   - Error conditions

5. **Keep Tests Independent**
   - Each test should be able to run in isolation
   - Use beforeEach/afterEach for setup/teardown
   - Don't rely on test execution order

## Coverage Goals

The project aims for the following coverage targets:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

View coverage report after running `npm run test:coverage` in:
`coverage/lcov-report/index.html`

## Debugging Tests

1. **Use console.log**
   ```javascript
   test('debugging example', () => {
     const result = complexFunction();
     console.log('Result:', result);
     expect(result).toBeDefined();
   });
   ```

2. **Run single test**
   ```javascript
   test.only('focus on this test', () => {
     // Only this test will run
   });
   ```

3. **Skip tests**
   ```javascript
   test.skip('work in progress', () => {
     // This test will be skipped
   });
   ```

## Common Issues

### Module Resolution
If you get module resolution errors, ensure:
- File extensions are included in imports (`.js`)
- Paths are relative to the test file location
- Mocked modules match the exact import path

### Async Timeouts
For long-running async operations:
```javascript
test('long operation', async () => {
  // Increase timeout to 15 seconds
  await longOperation();
}, 15000);
```

### Mock Not Working
Ensure mocks are defined before imports:
```javascript
// Define mock first
jest.mock('../src/service.js');

// Then import
import { serviceFunction } from '../src/service.js';
```

## Next Steps

1. Add tests for critical paths:
   - Authentication flow
   - Practice session recording
   - Data persistence
   - Audio processing

2. Set up CI/CD to run tests automatically

3. Add visual regression testing for UI components

4. Consider adding E2E tests with Playwright or Cypress