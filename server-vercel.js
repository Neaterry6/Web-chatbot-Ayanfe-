// Server adapter for Vercel
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import process from 'process';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express application
const app = express();

// Force production mode when running on Vercel
process.env.NODE_ENV = 'production';

// Basic Express configuration
app.use(express.json());

console.log('Starting Vercel server adapter...');
console.log(`Server environment: ${process.env.NODE_ENV}`);
console.log(`Vercel environment: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Try to import server components with error handling
try {
  console.log('Importing server components...');
  
  // Import routes setup and other modules
  const { registerRoutes } = await import('./server/routes.js');
  const { setupAuth } = await import('./server/auth.js');
  const { setupNotificationRoutes } = await import('./server/notification-service.js');

  // Setup authentication
  console.log('Setting up authentication...');
  setupAuth(app);

  // Setup notification routes
  console.log('Setting up notification routes...');
  setupNotificationRoutes(app);

  // Register API routes
  console.log('Registering API routes...');
  await registerRoutes(app);
  
  console.log('Server components initialized successfully');
} catch (error) {
  console.error('Error initializing server components:', error);
  
  // Add fallback API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'API in recovery mode', error: error.message });
  });
  
  app.use('/api', (req, res) => {
    res.status(500).json({ 
      error: true, 
      message: 'API initialization failed',
      path: req.path,
      details: error.message 
    });
  });
}

// Static file serving for Vercel
console.log('Setting up static file serving...');

// Serve the static files from the build directory
const distPath = path.join(__dirname, 'dist', 'public');

// Check if the build directory exists
if (fs.existsSync(distPath)) {
  console.log(`Found static files at: ${distPath}`);
  
  // List files in the directory for debugging
  try {
    const files = fs.readdirSync(distPath);
    console.log(`Files in ${distPath}:`, files);
  } catch (e) {
    console.error(`Error reading directory ${distPath}:`, e);
  }
  
  // Serve static files with aggressive caching for assets
  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        // No caching for HTML
        res.setHeader('Cache-Control', 'no-cache');
      } else if (
        filePath.endsWith('.js') || 
        filePath.endsWith('.css') || 
        filePath.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|otf)$/i)
      ) {
        // Long caching for assets
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
} else {
  console.error(`WARNING: Static files directory not found at: ${distPath}`);
  console.error('Contents of current directory:', fs.readdirSync(__dirname));
  
  // Create a minimal dist directory if it doesn't exist
  if (!fs.existsSync(distPath)) {
    try {
      fs.mkdirSync(distPath, { recursive: true });
      
      // Create a minimal index.html
      fs.writeFileSync(path.join(distPath, 'index.html'), `
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
          </style>
        </head>
        <body>
          <h1>AYANFE AI</h1>
          <div class="message">
            <p>The application is running in recovery mode.</p>
            <p>The build files could not be found.</p>
          </div>
        </body>
        </html>
      `);
      
      console.log('Created fallback index.html');
    } catch (error) {
      console.error('Failed to create fallback files:', error);
    }
  }
}

// For any non-API routes, serve the index.html for client-side routing
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Return index.html for client-side routing
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if index.html doesn't exist
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
        </style>
      </head>
      <body>
        <h1>AYANFE AI</h1>
        <div class="message">
          <p>The application is running, but in recovery mode.</p>
          <p>Please try again later or contact support.</p>
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
    path: req.path,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export default app for Vercel
export default app;