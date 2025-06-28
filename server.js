const express = require('express');
const { loadDatabase } = require('./db-loader');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Load database
let db = loadDatabase();

console.log('Available collections:', Object.keys(db));

// Routes
app.get('/api/:collection', (req, res) => {
  const { collection } = req.params;
  
  console.log(`Requested collection: ${collection}`);
  console.log('Available collections:', Object.keys(db));
  
  if (db[collection]) {
    res.json(db[collection]);
  } else {
    res.status(404).json({ 
      error: `Collection '${collection}' not found`,
      available: Object.keys(db)
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    collections: Object.keys(db),
    platform: 'Vercel',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Database loaded with collections:', Object.keys(db));
});