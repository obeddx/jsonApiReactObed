const fs = require('fs');
const path = require('path');

const dbFolder = path.join(__dirname, 'db');
const outputFile = path.join(__dirname, 'db.json');

function mergeJsonFiles() {
  try {
    // Pastikan folder db/ ada
    if (!fs.existsSync(dbFolder)) {
      console.error('Folder db/ tidak ditemukan');
      return false;
    }

    // Ambil semua file .json di folder db/
    const files = fs.readdirSync(dbFolder).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.warn('Tidak ada file JSON ditemukan di folder db/');
      return false;
    }

    const combined = {};
    
    files.forEach(file => {
      const key = path.basename(file, '.json'); // misal: mahasiswa.json → mahasiswa
      const filePath = path.join(dbFolder, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        combined[key] = JSON.parse(content);
        console.log(`✓ Berhasil memuat: ${file}`);
      } catch (error) {
        console.error(`✗ Error memuat ${file}:`, error.message);
      }
    });

    // Tulis file output
    fs.writeFileSync(outputFile, JSON.stringify(combined, null, 2));
    console.log(`✓ Berhasil generate db.json dari folder /db (${files.length} file)`);
    return true;
    
  } catch (error) {
    console.error('Error saat merge JSON files:', error.message);
    return false;
  }
}

// Jika dipanggil langsung
if (require.main === module) {
  mergeJsonFiles();
}

// Export function untuk digunakan di server.js
module.exports = { mergeJsonFiles };