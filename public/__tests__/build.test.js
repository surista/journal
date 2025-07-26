const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock fs and path modules
jest.mock('fs');
jest.mock('child_process');

describe('Version Management (build.js)', () => {
  const mockVersion = '10.98';
  const mockPackageJson = { version: mockVersion };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('package.json')) {
        return JSON.stringify(mockPackageJson);
      }
      return '';
    });
    fs.writeFileSync.mockImplementation(() => {});
  });

  describe('Version Reading', () => {
    it('should read version from parent directory package.json first', () => {
      // Run the build script
      jest.isolateModules(() => {
        require('../build.js');
      });

      // Check that it tried parent directory first
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('..'));
    });

    it('should fall back to current directory if parent package.json not found', () => {
      fs.existsSync.mockImplementation((path) => {
        return !path.includes('..');
      });

      jest.isolateModules(() => {
        require('../build.js');
      });

      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf8'
      );
    });
  });

  describe('File Updates', () => {
    it('should update version.js with correct format', () => {
      jest.isolateModules(() => {
        require('../build.js');
      });

      const versionJsCall = fs.writeFileSync.mock.calls.find(
        call => call[0].includes('version.js')
      );

      expect(versionJsCall).toBeDefined();
      const content = versionJsCall[1];
      
      expect(content).toContain(`export const APP_VERSION = '${mockVersion}'`);
      expect(content).toContain('export const BUILD_DATE');
      expect(content).toContain('export const BUILD_NUMBER');
    });

    it('should update index.html with version number', () => {
      const mockHtml = `
        <html>
          <script>window.APP_VERSION = '8.7';</script>
        </html>
      `;
      
      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(mockPackageJson);
        }
        if (filePath.includes('index.html')) {
          return mockHtml;
        }
        return '';
      });

      jest.isolateModules(() => {
        require('../build.js');
      });

      const htmlCall = fs.writeFileSync.mock.calls.find(
        call => call[0].includes('index.html')
      );

      expect(htmlCall).toBeDefined();
      const updatedHtml = htmlCall[1];
      expect(updatedHtml).toContain(`window.APP_VERSION = '${mockVersion}'`);
      expect(updatedHtml).not.toContain(`window.APP_VERSION = '8.7'`);
    });

    it('should update manifest.json version', () => {
      const mockManifest = {
        name: 'Guitar Practice Journal',
        version: '8.7'
      };

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(mockPackageJson);
        }
        if (filePath.includes('manifest.json')) {
          return JSON.stringify(mockManifest);
        }
        return '';
      });

      jest.isolateModules(() => {
        require('../build.js');
      });

      const manifestCall = fs.writeFileSync.mock.calls.find(
        call => call[0].includes('manifest.json')
      );

      expect(manifestCall).toBeDefined();
      const updatedManifest = JSON.parse(manifestCall[1]);
      expect(updatedManifest.version).toBe(mockVersion);
    });

    it('should update service-worker.js cache version', () => {
      const mockServiceWorker = `
        const CACHE_VERSION = 'v8.7';
        const CACHE_NAME = \`guitar-journal-\${CACHE_VERSION}\`;
      `;

      fs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          return JSON.stringify(mockPackageJson);
        }
        if (filePath.includes('service-worker.js')) {
          return mockServiceWorker;
        }
        return '';
      });

      jest.isolateModules(() => {
        require('../build.js');
      });

      const swCall = fs.writeFileSync.mock.calls.find(
        call => call[0].includes('service-worker.js')
      );

      expect(swCall).toBeDefined();
      const updatedSW = swCall[1];
      expect(updatedSW).toContain(`const CACHE_VERSION = 'v${mockVersion}'`);
      expect(updatedSW).not.toContain(`const CACHE_VERSION = 'v8.7'`);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json gracefully', () => {
      fs.existsSync.mockReturnValue(false);
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      // Should not throw
      expect(() => {
        jest.isolateModules(() => {
          require('../build.js');
        });
      }).not.toThrow();
    });

    it('should handle file write errors', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Should log error but not crash
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      jest.isolateModules(() => {
        require('../build.js');
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Git Integration', () => {
    it('should stage updated files with git add', () => {
      jest.isolateModules(() => {
        require('../build.js');
      });

      // Should call git add for each updated file
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('git add'),
        expect.any(Object)
      );
    });

    it('should handle git command failures gracefully', () => {
      execSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Should not throw
      expect(() => {
        jest.isolateModules(() => {
          require('../build.js');
        });
      }).not.toThrow();

      // Should log that it's not a git repo
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not a git repository')
      );

      consoleSpy.mockRestore();
    });
  });
});