// api/server.js
const jsonServer = require('json-server');
const { mergeJsonFiles } = require('./merge-json.cjs'); // sesuaikan path

const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// Generate db.json saat startup
console.log('Generating database...');
mergeJsonFiles();

// Load database
const router = jsonServer.router('db.json');

// Middleware
server.use(middlewares);

// Enable CORS for all origins
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', '*');
  next();
});

// Custom routes (jika diperlukan)
server.use(jsonServer.bodyParser);

// Use default router
server.use('/', router);

// Root endpoint untuk info
server.get('/', (req, res) => {
  res.json({
    message: 'JSON Server is running on Vercel!',
    endpoints: {
      dosen: '/dosen',
      matkul: '/matkul',
      // tambahkan endpoint lain sesuai data Anda
    },
    docs: 'https://github.com/typicode/json-server'
  });
});

module.exports = server;