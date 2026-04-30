const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const dir = __dirname;
const assetsDir = path.join(dir, 'assets');

console.log("--- Starting Optimization ---");

// 1. Minify CSS and JS to .min files
console.log("Minifying CSS and JS...");
try {
    execSync('npx -y clean-css-cli -o style.min.css style.css', { stdio: 'inherit' });
    execSync('npx -y terser main.js -o main.min.js -c -m', { stdio: 'inherit' });
} catch (e) {
    console.error("Failed to minify:", e.message);
}

// 2. Update HTML files
console.log("Updating HTML files...");
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    
    // Add display=swap to google fonts
    if (content.includes('fonts.googleapis.com/css2') && !content.includes('display=swap')) {
        content = content.replace(/href="https:\/\/fonts.googleapis.com\/css2\?family=([^"]+)"/, 'href="https://fonts.googleapis.com/css2?family=$1&display=swap"');
    }

    // Add preconnect for Google Fonts
    if (!content.includes('rel="preconnect"')) {
        content = content.replace(/<link rel="stylesheet" href="style/i, 
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link rel="stylesheet" href="style');
    }

    // Defer FontAwesome
    content = content.replace(/<link rel="stylesheet" href="https:\/\/cdnjs.cloudflare.com\/ajax\/libs\/font-awesome\/([^"]+)">/g, 
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/$1" media="print" onload="this.media=\'all\'">');

    // Point to minified assets
    content = content.replace(/href="style.css"/g, 'href="style.min.css"');
    content = content.replace(/src="main.js"/g, 'src="main.min.js"');

    fs.writeFileSync(path.join(dir, f), content);
});

// 3. Compress Images
console.log("Compressing Images...");
const imgFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.webp') && f !== 'favicon.webp');
console.log(`Found ${imgFiles.length} images to compress.`);

imgFiles.forEach(file => {
    const inputPath = path.join(assetsDir, file);
    const tempPath = path.join(assetsDir, 'temp_' + file);
    
    console.log(`Compressing ${file}...`);
    try {
        // resize to max 500x500 and compress webp to quality 80
        execSync(`npx -y sharp-cli@latest -i "${inputPath}" -o "${tempPath}" resize 500 500 --fit inside --withoutEnlargement webp --quality 80`);
        
        // Replace original with compressed
        if (fs.existsSync(tempPath)) {
            const statsBefore = fs.statSync(inputPath).size;
            fs.renameSync(tempPath, inputPath);
            const statsAfter = fs.statSync(inputPath).size;
            console.log(`  -> Size reduced from ${(statsBefore/1024).toFixed(2)}KB to ${(statsAfter/1024).toFixed(2)}KB`);
        }
    } catch (e) {
        console.error(`Failed to compress ${file}:`, e.message);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
});

console.log("--- Optimization Complete ---");
