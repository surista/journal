// Simple test to verify testing framework is working
describe('AuthService', () => {
  test('testing framework is configured correctly', () => {
    expect(true).toBe(true);
  });

  test('localStorage mock is working', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });

  test('can import AuthService', () => {
    // This test verifies that the module system is working
    const authServiceModule = require('../../src/services/authService.js');
    expect(authServiceModule).toBeDefined();
  });
});