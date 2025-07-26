#!/usr/bin/env node
// generate-sri.js - Generate SRI hashes for external scripts

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// External scripts to generate SRI for
const externalScripts = [
    {
        url: 'https://unpkg.com/tone@14.8.49/build/Tone.js',
        id: 'tone-js',
        crossorigin: 'anonymous'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/dist/soundtouch.min.js',
        id: 'soundtouch-js',
        crossorigin: 'anonymous'
    },
    {
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
        id: 'firebase-app',
        crossorigin: 'anonymous'
    },
    {
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js',
        id: 'firebase-auth',
        crossorigin: 'anonymous'
    },
    {
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js',
        id: 'firebase-firestore',
        crossorigin: 'anonymous'
    },
    {
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check-compat.js',
        id: 'firebase-app-check',
        crossorigin: 'anonymous'
    }
];

// Function to fetch content from URL
function fetchContent(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        client.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        }).on('error', reject);
    });
}

// Function to generate SRI hash
function generateSRI(content) {
    const hash = crypto.createHash('sha384');
    hash.update(content);
    return `sha384-${hash.digest('base64')}`;
}

// Main function
async function generateAllSRI() {
    console.log('🔐 Generating SRI hashes for external scripts...\n');
    
    const results = [];
    
    for (const script of externalScripts) {
        try {
            console.log(`📥 Fetching: ${script.url}`);
            const content = await fetchContent(script.url);
            const sri = generateSRI(content);
            
            results.push({
                ...script,
                sri,
                size: (content.length / 1024).toFixed(2) + ' KB'
            });
            
            console.log(`✅ Generated SRI: ${sri.substring(0, 50)}...`);
            console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB\n`);
        } catch (error) {
            console.error(`❌ Failed to process ${script.url}: ${error.message}\n`);
            results.push({
                ...script,
                sri: null,
                error: error.message
            });
        }
    }
    
    // Generate report
    console.log('\n📋 SRI Generation Report:');
    console.log('========================\n');
    
    results.forEach(result => {
        console.log(`Script: ${result.id}`);
        console.log(`URL: ${result.url}`);
        if (result.sri) {
            console.log(`SRI: ${result.sri}`);
            console.log(`Size: ${result.size}`);
        } else {
            console.log(`Error: ${result.error}`);
        }
        console.log('---\n');
    });
    
    // Generate HTML snippets
    console.log('\n📝 HTML snippets with SRI:\n');
    
    results.forEach(result => {
        if (result.sri) {
            if (result.id === 'tone-js') {
                // Special handling for Tone.js which is loaded dynamically
                console.log(`// For ${result.id} (loaded dynamically):`);
                console.log(`script.integrity = '${result.sri}';`);
                console.log(`script.crossOrigin = '${result.crossorigin}';\n`);
            } else if (result.id === 'soundtouch-js') {
                // Special handling for SoundTouch which is loaded dynamically
                console.log(`// For ${result.id} (loaded dynamically):`);
                console.log(`script.integrity = '${result.sri}';`);
                console.log(`script.crossOrigin = '${result.crossorigin}';\n`);
            } else {
                console.log(`<script src="${result.url}" integrity="${result.sri}" crossorigin="${result.crossorigin}"></script>`);
            }
        }
    });
    
    // Save results to file
    const fs = require('fs');
    const outputPath = 'sri-hashes.json';
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 SRI hashes saved to ${outputPath}`);
}

// Run the script
generateAllSRI().catch(console.error);