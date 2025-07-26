// Script to generate SRI hashes for external scripts
const https = require('https');
const crypto = require('crypto');

const scripts = [
    {
        name: 'firebase-app',
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js'
    },
    {
        name: 'firebase-auth',
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
    },
    {
        name: 'firebase-firestore',
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
    },
    {
        name: 'firebase-app-check',
        url: 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-check-compat.js'
    },
    {
        name: 'tone-js',
        url: 'https://unpkg.com/tone@14.8.49/build/Tone.js'
    },
    {
        name: 'soundtouch',
        url: 'https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/dist/soundtouch.min.js'
    }
];

function fetchAndHash(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const hash256 = crypto.createHash('sha256').update(data).digest('base64');
                const hash384 = crypto.createHash('sha384').update(data).digest('base64');
                const hash512 = crypto.createHash('sha512').update(data).digest('base64');
                resolve({
                    sha256: `sha256-${hash256}`,
                    sha384: `sha384-${hash384}`,
                    sha512: `sha512-${hash512}`
                });
            });
        }).on('error', reject);
    });
}

async function generateSRIHashes() {
    console.log('Generating SRI hashes for external scripts...\n');
    
    for (const script of scripts) {
        try {
            console.log(`Fetching ${script.name} from ${script.url}...`);
            const hashes = await fetchAndHash(script.url);
            console.log(`${script.name}:`);
            console.log(`  integrity="${hashes.sha384}"`);
            console.log(`  crossorigin="anonymous"\n`);
        } catch (error) {
            console.error(`Error fetching ${script.name}:`, error.message);
        }
    }
}

generateSRIHashes();