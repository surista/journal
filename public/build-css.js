#!/usr/bin/env node
// build-css.js - Bundle all CSS files into a single minified file

const fs = require('fs');
const path = require('path');

console.log('🎨 Starting CSS bundling process...');

// Read and process CSS imports from main.css
function processCSS() {
    const mainCssPath = path.resolve('styles/main.css');
    const outputPath = path.resolve('styles/bundle.css');
    const outputMinPath = path.resolve('styles/bundle.min.css');

    if (!fs.existsSync(mainCssPath)) {
        console.error('❌ Error: main.css not found at', mainCssPath);
        process.exit(1);
    }

    let bundledCSS = '';
    const processedFiles = new Set();
    const importRegex = /@import\s+(?:url\()?\s*['"]([^'"]+)['"]\s*\)?;?/g;

    function resolveImport(importPath, basePath) {
        // Handle relative paths
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            return path.resolve(path.dirname(basePath), importPath);
        }
        // Handle absolute paths from styles directory
        return path.resolve('styles', importPath);
    }

    function processFile(filePath, depth = 0) {
        // Prevent circular imports
        if (processedFiles.has(filePath)) {
            console.log(`⚠️  Skipping circular import: ${filePath}`);
            return '';
        }

        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  File not found: ${filePath}`);
            return `/* File not found: ${filePath} */\n`;
        }

        processedFiles.add(filePath);
        const indent = '  '.repeat(depth);
        console.log(`${indent}📄 Processing: ${path.relative(process.cwd(), filePath)}`);

        let content = fs.readFileSync(filePath, 'utf8');
        let processedContent = '';

        // Add file marker comment
        processedContent += `\n/* ===== Start: ${path.relative(process.cwd(), filePath)} ===== */\n`;

        // Process imports
        let lastIndex = 0;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            // Add content before the import
            processedContent += content.substring(lastIndex, match.index);

            // Process the imported file
            const importPath = match[1];
            const resolvedPath = resolveImport(importPath, filePath);
            processedContent += processFile(resolvedPath, depth + 1);

            lastIndex = match.index + match[0].length;
        }

        // Add remaining content
        processedContent += content.substring(lastIndex);
        processedContent += `\n/* ===== End: ${path.relative(process.cwd(), filePath)} ===== */\n`;

        return processedContent;
    }

    // Start processing from main.css
    bundledCSS = processFile(mainCssPath);

    // Write bundled CSS
    fs.writeFileSync(outputPath, bundledCSS);
    console.log(
        `✅ Created bundled CSS: ${outputPath} (${(bundledCSS.length / 1024).toFixed(2)} KB)`
    );

    // Create minified version
    let minifiedCSS = bundledCSS
        // Remove comments (except important ones)
        .replace(/\/\*(?!!)[\s\S]*?\*\//g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        // Remove space around selectors
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        // Remove trailing semicolons before closing braces
        .replace(/;}/g, '}')
        // Remove empty rules
        .replace(/[^{}]+\{\s*\}/g, '')
        // Trim
        .trim();

    fs.writeFileSync(outputMinPath, minifiedCSS);
    console.log(
        `✅ Created minified CSS: ${outputMinPath} (${(minifiedCSS.length / 1024).toFixed(2)} KB)`
    );

    // Calculate compression ratio
    const compressionRatio = ((1 - minifiedCSS.length / bundledCSS.length) * 100).toFixed(1);
    console.log(`📊 Compression ratio: ${compressionRatio}% smaller`);

    return {
        bundledPath: outputPath,
        minifiedPath: outputMinPath,
        originalSize: bundledCSS.length,
        minifiedSize: minifiedCSS.length,
        filesProcessed: processedFiles.size
    };
}

// Update build.js to include CSS bundling
function updateBuildScript() {
    const buildScriptPath = path.resolve('build.js');

    if (!fs.existsSync(buildScriptPath)) {
        console.warn('⚠️  build.js not found, skipping integration');
        return;
    }

    let buildContent = fs.readFileSync(buildScriptPath, 'utf8');

    // Check if CSS bundling is already included
    if (buildContent.includes('build-css.js')) {
        console.log('📝 CSS bundling already integrated in build.js');
        return;
    }

    // Add CSS bundling step before the build info generation
    const insertPoint = buildContent.indexOf('// Generate build info');
    if (insertPoint > -1) {
        const cssBundle = `
// Bundle CSS files
console.log('\\n🎨 Bundling CSS files...');
try {
    const { execSync } = require('child_process');
    execSync('node build-css.js', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ CSS bundling failed:', error.message);
}

`;
        buildContent =
            buildContent.slice(0, insertPoint) + cssBundle + buildContent.slice(insertPoint);
        fs.writeFileSync(buildScriptPath, buildContent);
        console.log('✅ Updated build.js to include CSS bundling');
    }
}

// Run the bundling
try {
    const result = processCSS();
    console.log(`\n🎉 CSS bundling complete!`);
    console.log(`📦 Files processed: ${result.filesProcessed}`);
    console.log(`📏 Original size: ${(result.originalSize / 1024).toFixed(2)} KB`);
    console.log(`🗜️  Minified size: ${(result.minifiedSize / 1024).toFixed(2)} KB`);

    // Try to update build.js
    updateBuildScript();

    console.log('\n📝 Next steps:');
    console.log('1. Update index.html to use styles/bundle.min.css instead of styles/main.css');
    console.log('2. Test the application to ensure all styles are working correctly');
    console.log('3. The bundled CSS will be automatically generated when running npm run build');
} catch (error) {
    console.error('❌ CSS bundling failed:', error);
    process.exit(1);
}
