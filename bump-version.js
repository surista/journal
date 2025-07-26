#!/usr/bin/env node
// bump-version.js - Handle version bumping for the project

const fs = require('fs');
const path = require('path');

// Get the bump type from command line
const bumpType = process.argv[2];

if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: node bump-version.js [major|minor|patch]');
    process.exit(1);
}

// Read current version from package.json
const packagePath = path.resolve('package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageData.version;

// Parse version
const versionParts = currentVersion.split('.').map(n => parseInt(n) || 0);
while (versionParts.length < 3) {
    versionParts.push(0);
}

let [major, minor, patch] = versionParts;

// Bump the appropriate part
switch (bumpType) {
    case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
    case 'minor':
        minor++;
        patch = 0;
        break;
    case 'patch':
        patch++;
        break;
}

// Create new version
const newVersion = `${major}.${minor}.${patch}`;

// Update package.json
packageData.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);