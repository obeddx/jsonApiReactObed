const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { mergeJsonFiles } = require('./merge-json.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Generate db.json saat startup
console.log('Generating database...');
mergeJsonFiles();

// Load database
let database = {};
try {
  const dbPath = path.join(__dirname, 'db.json');
  if (fs.existsSync(dbPath)) {
    database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    console.log('Database loaded successfully');
    console.log('Available data:', Object.keys(database));
  }
} catch (error) {
  console.error('Error loading database:', error);
}

// Helper function untuk membuat route yang aman
function createSafeRoute(key, data) {
  const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '');
  if (!safeKey) return null;
  
  return {
    path: `/api/${safeKey}`,
    handler: (req, res) => {
      res.json({
        success: true,
        endpoint: safeKey,
        data: data,
        count: Array.isArray(data) ? data.length : 1
      });
    }
  };
}

// Routes statis
app.get('/', (req, res) => {
  const availableEndpoints = Object.keys(database)
    .map(key => key.replace(/[^a-zA-Z0-9-_]/g, ''))
    .filter(key => key)
    .map(key => `/api/${key}`);
    
  res.json({
    message: 'Backend API is running!',
    status: 'OK',
    availableEndpoints: availableEndpoints,
    totalEndpoints: availableEndpoints.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'API endpoints available',
    data: Object.keys(database),
    endpoints: Object.keys(database).map(key => `/api/${key.replace(/[^a-zA-Z0-9-_]/g, '')}`)
  });
});

// Buat routes dinamis dengan cara yang lebih aman
Object.keys(database).forEach(key => {
  const route = createSafeRoute(key, database[key]);
  if (route) {
    console.log(`Creating route: ${route.path}`);
    app.get(route.path, route.handler);
  }
});

// Routes spesifik (fallback jika dynamic routing bermasalah)
app.get('/api/dosen', (req, res) => {
  if (database.dosen && database.dosen.length > 0) {
    res.json(database.dosen);
  } else {
    res.status(404).json({
      error: 'Data dosen tidak ditemukan'
    });
  }
});

app.get('/api/matkul', (req, res) => {
  if (database.matkul) {
    res.json({
      success: true,
      data: database.matkul,
      count: Array.isArray(database.matkul) ? database.matkul.length : 1
    });
  } else {
    res.status(404).json({
      error: 'Data matkul tidak ditemukan'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler - menggunakan middleware biasa untuk menghindari masalah routing
app.use((req, res) => {
  const availableEndpoints = Object.keys(database)
    .map(key => key.replace(/[^a-zA-Z0-9-_]/g, ''))
    .filter(key => key)
    .map(key => `/api/${key}`);
    
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Path '${req.originalUrl}' tidak ditemukan`,
    availableEndpoints: availableEndpoints,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Export untuk Vercel
module.exports = app;

// Start server (untuk development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Available endpoints:`);
    Object.keys(database).forEach(key => {
      const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '');
      if (safeKey) {
        console.log(`  - http://localhost:${PORT}/api/${safeKey}`);
      }
    });
  });
}