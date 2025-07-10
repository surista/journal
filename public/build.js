#!/usr/bin/env node
// build.js - Auto-update version numbers across the project

const fs = require('fs');
const path = require('path');

// Configuration
const VERSION = process.argv[2] || '8.6'; // Pass version as argument or default
const BUILD_DATE = new Date().toISOString();
const BUILD_NUMBER = Math.floor(Date.now() / 1000);

console.log(`🔨 Building Guitar Practice Journal v${VERSION}`);
console.log(`📅 Build Date: ${BUILD_DATE}`);
console.log(`🔢 Build Number: ${BUILD_NUMBER}`);

// Files to update
const files = [
    {
        path: 'src/config/version.js',
        update: (content) => {
            return content
                .replace(/export const APP_VERSION = '[^']*';/, `export const APP_VERSION = '${VERSION}';`)
                .replace(/export const BUILD_DATE = new Date\(\).toISOString\(\);/, `export const BUILD_DATE = '${BUILD_DATE}';`)
                .replace(/export const BUILD_NUMBER = Math\.floor\(Date\.now\(\) \/ 1000\);/, `export const BUILD_NUMBER = ${BUILD_NUMBER};`);
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
        path: 'index.html',
        update: (content) => {
            return content.replace(
                /<title>Guitar Practice Journal v[\d.]+<\/title>/,
                `<title>Guitar Practice Journal v${VERSION}</title>`
            );
        }
    }
];

// Update files
files.forEach(({ path: filePath, update }) => {
    try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const updated = update(content);
            fs.writeFileSync(fullPath, updated, 'utf8');
            console.log(`✅ Updated ${filePath}`);
        } else {
            console.warn(`⚠️  File not found: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
});

// Update package.json if it exists
const packagePath = path.resolve('package.json');
if (fs.existsSync(packagePath)) {
    try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        pkg.version = VERSION;
        fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2), 'utf8');
        console.log('✅ Updated package.json');
    } catch (error) {
        console.error('❌ Error updating package.json:', error.message);
    }
}

console.log(`🎉 Build complete! Guitar Practice Journal v${VERSION} is ready.`);

// Generate build info
const buildInfo = {
    version: VERSION,
    buildDate: BUILD_DATE,
    buildNumber: BUILD_NUMBER,
    timestamp: Date.now()
};

fs.writeFileSync('build-info.json', JSON.stringify(buildInfo, null, 2));
console.log('📄 Generated build-info.json');