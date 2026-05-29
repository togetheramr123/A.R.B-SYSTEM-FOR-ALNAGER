const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// We split the schema into lines
const lines = schemaContent.split('\n');
const newLines = [];

let inModel = false;
let currentModelFields = [];
let currentModelIndexes = [];
let modelEndLineIndex = -1;

// Regex to detect models, fields, and indexes
const modelStartRegex = /^model\s+(\w+)\s*\{/;
const fieldRegex = /^\s+(\w+)\s+([A-Za-z0-9_]+)(\?)?(\s+@.*)?$/;
const indexRegex = /^\s+@@index\(\[([^\]]+)\]\)/;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (modelStartRegex.test(line)) {
    inModel = true;
    currentModelFields = [];
    currentModelIndexes = [];
    newLines.push(line);
    continue;
  }

  if (inModel) {
    if (line.trim() === '}') {
      // End of model, let's inject missing indexes!
      const missingIndexes = [];
      
      // We want to index fields that:
      // 1. end with 'Id'
      // 2. don't have @unique
      // 3. aren't already indexed
      for (const field of currentModelFields) {
        if (field.name.endsWith('Id') && field.name !== 'id' && !field.isUnique && !field.isId) {
          const hasIndex = currentModelIndexes.some(idx => idx.includes(field.name));
          if (!hasIndex) {
            missingIndexes.push(`  @@index([${field.name}])`);
          }
        }
      }

      if (missingIndexes.length > 0) {
        newLines.push(...missingIndexes);
      }

      newLines.push(line);
      inModel = false;
      continue;
    }

    // Capture fields
    const fieldMatch = line.match(fieldRegex);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const attributes = fieldMatch[4] || '';
      currentModelFields.push({
        name: fieldName,
        isUnique: attributes.includes('@unique'),
        isId: attributes.includes('@id')
      });
    }

    // Capture indexes
    const indexMatch = line.match(indexRegex);
    if (indexMatch) {
      currentModelIndexes.push(indexMatch[1]);
    }
  }

  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'), 'utf-8');
console.log('Successfully injected missing indexes!');
