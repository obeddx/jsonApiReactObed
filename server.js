const express = require('express');
const fs = require('fs');
const path = require('path');
const { mergeJsonFiles } = require('./merge-json.cjs');

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Path ke file database
const dbFile = path.join(__dirname, 'db.json');

// Function untuk reload database
function reloadDatabase() {
  try {
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(content);
    }
    return {};
  } catch (error) {
    console.error('Error loading database:', error.message);
    return {};
  }
}

// Inisialisasi database saat server start
let db = {};

function initializeDatabase() {
  console.log('Initializing database...');
  
  // Merge JSON files terlebih dahulu
  const mergeSuccess = mergeJsonFiles();
  
  if (mergeSuccess) {
    db = reloadDatabase();
    console.log('Database loaded successfully');
  } else {
    console.warn('Failed to merge JSON files, using empty database');
  }
}

// API Routes

// GET all data dari collection tertentu
app.get('/api/:collection', (req, res) => {
  const { collection } = req.params;
  
  if (db[collection]) {
    res.json(db[collection]);
  } else {
    res.status(404).json({ error: `Collection '${collection}' not found` });
  }
});

// GET data by ID dari collection tertentu
app.get('/api/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  
  if (!db[collection]) {
    return res.status(404).json({ error: `Collection '${collection}' not found` });
  }
  
  const item = db[collection].find(item => item.id == id);
  
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: `Item with id '${id}' not found in collection '${collection}'` });
  }
});

// POST - Reload database (merge ulang dari folder db/)
app.post('/api/reload', (req, res) => {
  console.log('Reloading database...');
  
  const mergeSuccess = mergeJsonFiles();
  
  if (mergeSuccess) {
    db = reloadDatabase();
    res.json({ 
      success: true, 
      message: 'Database reloaded successfully',
      collections: Object.keys(db)
    });
  } else {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reload database' 
    });
  }
});

// GET - Status database
app.get('/api/status', (req, res) => {
  const collections = Object.keys(db);
  const status = {};
  
  collections.forEach(collection => {
    status[collection] = {
      count: Array.isArray(db[collection]) ? db[collection].length : 'Not an array',
      type: Array.isArray(db[collection]) ? 'array' : typeof db[collection]
    };
  });
  
  res.json({
    status: 'running',
    collections: status,
    lastReload: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Initialize database after server starts
  initializeDatabase();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});