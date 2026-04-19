const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

// Dictionary mapping extensions to standard MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Log all requests
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  
  // Default to index.html for root requests
  let urlPath = req.url === '/' ? '/index.html' : req.url;
  
  // Strip query parameters if present
  urlPath = urlPath.split('?')[0];

  let filePath = path.join(__dirname, urlPath);
  const extname = path.extname(filePath).toLowerCase();
  
  // Default fallback contentType
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Internal Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('-------------------------------------------');
  console.log(`🚀 Server successfully running on port ${PORT}`);
  console.log(`👉 View your app at: http://localhost:${PORT}/`);
  console.log('-------------------------------------------');
  console.log('Press Ctrl+C to stop.');
});
