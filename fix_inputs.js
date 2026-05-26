const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const dirsToScan = ['./components', './app'];
let files = [];
dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    files = files.concat(walk(dir));
  }
});

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Look for <input tags that don't already have autoComplete defined
  // Using a regex with negative lookahead for autoComplete
  content = content.replace(/<input(?=\s)(?![^>]*autoComplete)/g, '<input autoComplete="off" autoCorrect="off" spellCheck={false}');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Total files updated: ${updatedCount}`);
