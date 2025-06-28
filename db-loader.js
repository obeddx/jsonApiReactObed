const fs = require('fs');
const path = require('path');

function loadDatabase() {
  const dbFolder = path.join(__dirname, 'db');
  const dbFile = path.join(__dirname, 'db.json');
  
  // Cek apakah db.json sudah ada
  if (fs.existsSync(dbFile)) {
    try {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading db.json:', error.message);
    }
  }
  
  // Jika tidak ada, generate dari folder db/
  if (fs.existsSync(dbFolder)) {
    const files = fs.readdirSync(dbFolder).filter(f => f.endsWith('.json'));
    const combined = {};
    
    files.forEach(file => {
      const key = path.basename(file, '.json');
      const filePath = path.join(dbFolder, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        combined[key] = JSON.parse(content);
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
      }
    });
    
    return combined;
  }
  
  // Fallback: return empty database
  console.warn('No database files found, returning empty database');
  return {};
}

module.exports = { loadDatabase };