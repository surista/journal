#!/usr/bin/env node
// build.js - Auto-update version numbers across the project

const fs = require('fs');
const path = require('path');

// Get version from package.json or command line argument
function getVersion() {
    // First try command line argument
    if (process.argv[2]) {
        return process.argv[2];
    }

    // Otherwise read from package.json
    try {
        const packagePath = path.resolve('package.json');
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return pkg.version;
        }
    } catch (error) {
        console.warn('Could not read version from package.json:', error.message);
    }

    // Fallback to default
    return '8.7';
}

const VERSION = getVersion();
const BUILD_DATE = new Date().toISOString();
const BUILD_NUMBER = Math.floor(Date.now() / 1000);

console.log(`🔨 Building Guitar Practice Journal v${VERSION}`);
console.log(`📅 Build Date: ${BUILD_DATE}`);
console.log(`🔢 Build Number: ${BUILD_NUMBER}`);

// Files to update with their specific update functions
const files = [
    {
        path: 'src/config/version.js',
        update: (content) => {
            // Replace the entire file content to ensure consistency
            return `// src/config/version.js - Version and build information
export const APP_VERSION = '${VERSION}';
export const BUILD_DATE = '${BUILD_DATE}';
export const BUILD_NUMBER = ${BUILD_NUMBER};

export const APP_CONFIG = {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    buildNumber: BUILD_NUMBER,
    features: {
        youtubeIntegration: true,
        compactAudioControls: true,
        enhancedLoopMarkers: true,
        smartLoopValidation: true,
        footerNavigation: true,
        cloudSync: true,
        autoUpdates: true
    }
};

console.log(\`🎸 Guitar Practice Journal v\${APP_VERSION} (Build \${BUILD_NUMBER})\`);
console.log(\`📅 Built: \${BUILD_DATE}\`);`;
        }
    },
    {
        path: 'src/config.js',
        update: (content) => {
            return content.replace(
                /const APP_VERSION = '[^']*';/,
                `const APP_VERSION = '${VERSION}';`
            );
        }
    },
    {
        path: 'index.html',
        update: (content) => {
            // Update multiple version references in index.html
            let updated = content;

            // Update hardcoded loading text
            updated = updated.replace(
                /<p style="color: #e0e0e0; margin-top: 20px;">Loading Guitar Practice Journal v[\d.]+\./,
                `<p style="color: #e0e0e0; margin-top: 20px;">Loading Guitar Practice Journal v${VERSION}.`
            );

            // Update fallback loading text in JavaScript
            updated = updated.replace(
                /loadingText\.textContent = 'Loading Guitar Practice Journal v[\d.]+\.\.\.';/,
                `loadingText.textContent = 'Loading Guitar Practice Journal v${VERSION}...';`
            );

            // Update window.APP_VERSION if present
            updated = updated.replace(
                /window\.APP_VERSION = '[\d.]+';/,
                `window.APP_VERSION = '${VERSION}';`
            );

            // Update any title tags with version
            updated = updated.replace(
                /<title>Guitar Practice Journal v[\d.]+<\/title>/,
                `<title>Guitar Practice Journal v${VERSION}</title>`
            );

            return updated;
        }
    },
    {
        path: 'manifest.json',
        update: (content) => {
            const manifest = JSON.parse(content);
            manifest.version = VERSION;
            return JSON.stringify(manifest, null, 2);
        }
    },
    {
        path: 'package.json',
        update: (content) => {
            const pkg = JSON.parse(content);
            pkg.version = VERSION;
            return JSON.stringify(pkg, null, 2);
        }
    }
];

// Update all files
let updateCount = 0;
files.forEach(({ path: filePath, update }) => {
    try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const updated = update(content);

            // Only write if content actually changed
            if (updated !== content) {
                fs.writeFileSync(fullPath, updated, 'utf8');
                console.log(`✅ Updated ${filePath}`);
                updateCount++;
            } else {
                console.log(`📝 ${filePath} - no changes needed`);
            }
        } else {
            console.warn(`⚠️  File not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
});

// Generate build info
const buildInfo = {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildNumber: BUILD_NUMBER,
    timestamp: Date.now(),
    filesUpdated: updateCount
};

fs.writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2));
console.log('📄 Generated build-info.json');

console.log(`🎉 Build complete! Updated ${updateCount} files for Guitar Practice Journal v${VERSION}`);

// Show what to do next
console.log('\n📝 Next steps:');
console.log('1. Test the app locally');
console.log('2. Deploy to Firebase: firebase deploy --only hosting');