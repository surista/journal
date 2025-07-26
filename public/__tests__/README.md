# Guitar Practice Journal - Test Suite

This directory contains the automated test suite for the Guitar Practice Journal application.

## Test Structure

```
__tests__/
├── components/           # Component-specific tests
├── services/            # Service layer tests  
├── integration.test.js  # End-to-end integration tests
├── testUtils.js        # Shared test utilities and mocks
└── README.md           # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

## Test Coverage Areas

### 1. Storage Service Tests (`services/storageService.test.js`)
- Practice area management (custom areas, defaults)
- User-specific data separation
- Practice session CRUD operations
- Error handling and data corruption recovery

### 2. Version Management Tests (`build.test.js`)
- Version number propagation across files
- Build script functionality
- Git integration
- Error handling

### 3. Image Loading Tests (`components/unifiedPracticeMinimal.test.js`)
- Loading sessions with saved images
- Image display in metronome
- Image manager integration
- History tab "Practice Again" functionality

### 4. History Tab Tests (`components/tabs/HistoryTab.test.js`)
- Dynamic practice area dropdown population
- Custom practice area support
- Edit session functionality
- XSS protection

### 5. Integration Tests (`integration.test.js`)
- Complete user workflows
- Cross-component communication
- Error recovery scenarios
- Multi-user support

## Key Test Utilities

The `testUtils.js` file provides helpful utilities:

- `createMockSession()` - Generate test session data
- `createMockStorageService()` - Mock storage service
- `createMockTimer()` - Mock timer functionality
- `createMockMetronome()` - Mock metronome
- `setupTestDOM()` - Initialize DOM for tests
- `flushPromises()` - Wait for async operations

## Writing New Tests

When adding new features, follow these guidelines:

1. **Unit Tests**: Test individual functions/methods in isolation
2. **Component Tests**: Test component behavior and user interactions
3. **Integration Tests**: Test complete user workflows
4. **Use Mocks**: Mock external dependencies to isolate functionality
5. **Test Edge Cases**: Include error scenarios and boundary conditions

Example test structure:

```javascript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do expected behavior', () => {
    // Arrange
    const input = createTestData();
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

## Coverage Goals

- Minimum 50% coverage for all metrics (branches, functions, lines, statements)
- Critical paths should have >80% coverage
- Focus on testing business logic over UI implementation details

## Continuous Integration

Tests are automatically run on:
- Pre-commit hooks (if configured)
- Pull requests
- Deploy pipeline

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   - Ensure all imports use correct paths
   - Check that mocks are properly configured

2. **DOM-Related Failures**
   - Use `setupTestDOM()` before DOM manipulation
   - Clean up with `cleanupTestDOM()` after tests

3. **Async Test Failures**
   - Use `async/await` for asynchronous operations
   - Call `flushPromises()` to wait for pending promises

4. **localStorage/IndexedDB Errors**
   - Mocks are configured in `jest.setup.js`
   - Clear storage between tests

## Contributing

When adding new tests:
1. Follow existing patterns and conventions
2. Write descriptive test names
3. Include both positive and negative test cases
4. Update this README if adding new test categories