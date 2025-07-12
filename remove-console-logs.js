#!/usr/bin/env node
// Script to remove console.log statements from the codebase
// Preserves console.error statements as they might be important for debugging

const fs = require('fs');
const path = require('path');

let totalRemoved = 0;
let filesModified = 0;

// Patterns to remove
const consolePatterns = [
    /console\.log\s*\([^)]*\);?\s*\n?/g,
    /console\.warn\s*\([^)]*\);?\s*\n?/g,
    /console\.info\s*\([^)]*\);?\s*\n?/g,
    /console\.debug\s*\([^)]*\);?\s*\n?/g,
    /console\.trace\s*\([^)]*\);?\s*\n?/g,
    /console\.time\s*\([^)]*\);?\s*\n?/g,
    /console\.timeEnd\s*\([^)]*\);?\s*\n?/g,
];

// Files/directories to skip
const skipPatterns = [
    'node_modules',
    '.git',
    'remove-console-logs.js',
    '.json',
    '.md',
    '.css',
    '.html'
];

function shouldSkip(filePath) {
    return skipPatterns.some(pattern => filePath.includes(pattern));
}

function removeConsoleLogs(filePath) {
    if (shouldSkip(filePath)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let fileRemovals = 0;

        // Count and remove console statements
        consolePatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                fileRemovals += matches.length;
                content = content.replace(pattern, '');
            }
        });

        // Clean up extra blank lines (more than 2 consecutive)
        content = content.replace(/\n{3,}/g, '\n\n');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${filePath}: Removed ${fileRemovals} console statements`);
            totalRemoved += fileRemovals;
            filesModified++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !shouldSkip(fullPath)) {
            processDirectory(fullPath);
        } else if (stat.isFile() && fullPath.endsWith('.js')) {
            removeConsoleLogs(fullPath);
        }
    });
}

console.log('🔍 Scanning for console.log statements...\n');

// Process the public/src directory
const srcPath = path.join(__dirname, 'public', 'src');
if (fs.existsSync(srcPath)) {
    processDirectory(srcPath);
} else {
    console.error('❌ Could not find public/src directory');
    process.exit(1);
}

console.log('\n📊 Summary:');
console.log(`Total console statements removed: ${totalRemoved}`);
console.log(`Files modified: ${filesModified}`);
console.log('\n✨ Console.log cleanup complete!');