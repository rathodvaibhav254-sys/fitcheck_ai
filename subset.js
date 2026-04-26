const fs = require('fs');
const path = require('path');

const sourceDirs = ['formal', 'casual', 'T-Shirt', 'Accessories', 'Hoodie', 'Pants', 'Shoes'];
const targetDir = path.join(__dirname, 'images');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}

// Function to get random subset of files
function getRandomFiles(dir, n) {
  let files = [];
  
  if (!fs.existsSync(dir)) return [];

  // Read all files (recursively if needed, but let's just do a flat read + 1 level deep for casual/formal)
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      const subDirFiles = fs.readdirSync(path.join(dir, item.name)).filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
      files.push(...subDirFiles.map(f => path.join(dir, item.name, f)));
    } else if (/\.(jpg|jpeg|png|gif)$/i.test(item.name)) {
      files.push(path.join(dir, item.name));
    }
  }

  // Shuffle and pick n
  for (let i = files.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [files[i], files[j]] = [files[j], files[i]];
  }
  return files.slice(0, n);
}

const copiedFiles = [];

sourceDirs.forEach(dir => {
  const absDir = path.join(__dirname, dir);
  const selectedFiles = getRandomFiles(absDir, 10); // Pick 10 files
  
  selectedFiles.forEach((file, index) => {
    // Generate a new clean name, e.g., formal_1.jpg
    const ext = path.extname(file);
    const newName = `${dir}_${index + 1}${ext}`;
    const targetPath = path.join(targetDir, newName);
    
    fs.copyFileSync(file, targetPath);
    copiedFiles.push({ original: file, new: newName, category: dir });
  });
});

console.log(`Successfully copied ${copiedFiles.length} files to images directory.`);
