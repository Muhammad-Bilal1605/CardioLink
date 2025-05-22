import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert a file from CommonJS to ES modules
function convertToESM(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace require statements with import statements
    content = content.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\)/g, (match, variable, module) => {
      // Handle relative paths
      if (module.startsWith('./') || module.startsWith('../')) {
        return `import ${variable} from '${module}.js'`;
      }
      return `import ${variable} from '${module}'`;
    });

    // Replace module.exports with export default
    content = content.replace(/module\.exports\s*=\s*(\w+)/g, 'export default $1');

    // Replace exports.X with export const X
    content = content.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');

    // Write the converted content back to the file
    fs.writeFileSync(filePath, content);
    console.log(`Converted ${filePath} to ES modules`);
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error);
  }
}

// Function to process a directory recursively
function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      convertToESM(filePath);
    }
  }
}

// Process the backend directory
const backendDir = path.join(__dirname);
processDirectory(backendDir); 