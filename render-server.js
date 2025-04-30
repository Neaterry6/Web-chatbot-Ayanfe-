import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import process from 'process';

// Import the server app
import serverApp from './dist/index.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file will be used specifically for Render deployment
// It combines both the API server and static file serving

// Create Express application
const app = express();

// Force production mode
process.env.NODE_ENV = 'production';

console.log('Starting Render server in production mode');

// Serve static files from the build directory
const distPath = path.join(__dirname, 'dist', 'public');
console.log(`Serving static files from: ${distPath}`);

if (!fs.existsSync(distPath)) {
  console.error(`Build directory ${distPath} not found!`);
  console.error('Contents of current directory:', fs.readdirSync(__dirname));
  console.error('Contents of dist directory (if exists):', 
    fs.existsSync(path.join(__dirname, 'dist')) ? 
    fs.readdirSync(path.join(__dirname, 'dist')) : 
    'dist directory not found');
  // Don't exit - try to continue anyway
}

// Verify that index.html exists
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ index.html found in build directory');
} else {
  console.error('❌ index.html NOT found in build directory!');
  // Don't exit - try to continue anyway
}

// List files in the dist directory (for debugging)
try {
  const files = fs.existsSync(distPath) ? fs.readdirSync(distPath) : [];
  console.log('Files in dist directory:', files);
} catch (error) {
  console.error('Error reading dist directory:', error);
}

// Set up middleware and error handlers
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Serve static assets with caching
app.use(express.static(distPath, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set Cache-Control header for assets
    if (filePath.endsWith('.js') || 
        filePath.endsWith('.css') || 
        filePath.endsWith('.woff2') ||
        filePath.endsWith('.jpg') || 
        filePath.endsWith('.png') || 
        filePath.endsWith('.svg') ||
        filePath.endsWith('.ico')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
  }
}));

// Use the imported server app for all API routes
app.use('/api', (req, res, next) => {
  // Forward to the main server app
  serverApp(req, res, next);
});

// For any other request, send the index.html
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // As a fallback, try to generate some HTML
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AYANFE AI</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; }
          h1 { color: #333; }
          .message { background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 2rem 0; }
          .error { color: #721c24; background: #f8d7da; padding: 0.5rem; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>AYANFE AI</h1>
        <div class="message">
          <p>The application is running, but the frontend files could not be found.</p>
          <p>This might be a deployment issue - please check that the build process completed successfully.</p>
        </div>
        <div class="error">
          <p>Error: index.html not found in build directory (${indexPath})</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: true,
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Render production server running on port ${PORT}`);
  console.log(`Server time: ${new Date().toISOString()}`);
});