const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Function to load database
function loadDatabase() {
  try {
    // Try to load from db.json first
    const dbFile = path.join(__dirname, '../db.json');
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    }
    
    // Fallback: load from db folder
    const dbFolder = path.join(__dirname, '../db');
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
    
    // Ultimate fallback
    return {
      dosen: [
        { id: 1, nama: "Dr. John Doe", nidn: "1234567890" }
      ],
      mahasiswa: [
        { id: 1, nama: "Jane Smith", nim: "12345678" }
      ]
    };
    
  } catch (error) {
    console.error('Database loading error:', error);
    return {};
  }
}

// Load database
const db = loadDatabase();

// Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    collections: Object.keys(db),
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    itemCounts: Object.keys(db).reduce((acc, key) => {
      acc[key] = Array.isArray(db[key]) ? db[key].length : 'not array';
      return acc;
    }, {})
  });
});

app.get('/api/:collection', (req, res) => {
  const { collection } = req.params;
  
  if (db[collection]) {
    res.json(db[collection]);
  } else {
    res.status(404).json({ 
      error: `Collection '${collection}' not found`,
      available: Object.keys(db),
      debug: {
        requested: collection,
        dbKeys: Object.keys(db),
        dbType: typeof db
      }
    });
  }
});

app.get('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  
  if (!db[collection]) {
    return res.status(404).json({ 
      error: `Collection '${collection}' not found`,
      available: Object.keys(db)
    });
  }
  
  const item = db[collection].find(item => item.id == id);
  
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ 
      error: `Item with id '${id}' not found in collection '${collection}'`,
      totalItems: db[collection].length
    });
  }
});

// Catch all for debugging
app.get('*', (req, res) => {
  res.json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      '/api/status',
      '/api/:collection',
      '/api/:collection/:id'
    ]
  });
});

module.exports = app;