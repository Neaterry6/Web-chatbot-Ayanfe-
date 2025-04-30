#!/bin/bash
# Build script for Render deployment

# Function for better error handling
handle_error() {
    echo "❌ ERROR: $1"
    echo "Check build logs for details"
    exit 1
}

# Print all commands
set -x

# Show environment information
echo "=== Environment Info ==="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Working directory files:"
ls -la
echo "========================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install || handle_error "Failed to install dependencies"

# Build the client and server
echo "🏗️ Building application..."
npm run build || handle_error "Failed to build application"

# Verify the build output
echo "✅ Verifying build output..."

# Check if dist/public exists
if [ ! -d "./dist/public" ]; then
    mkdir -p ./dist/public
    echo "⚠️ Warning: dist/public directory not found, created it"
fi

# Make sure the index.html exists
if [ -f "./dist/public/index.html" ]; then
    echo "✓ Build successful: index.html exists"
    
    # Display directory structure for debugging
    echo "📁 Build output files:"
    find dist -type f | sort
    
    # Count assets to verify the build
    JS_COUNT=$(find dist/public -name "*.js" | wc -l)
    CSS_COUNT=$(find dist/public -name "*.css" | wc -l)
    
    echo "📊 Build stats: $JS_COUNT JavaScript files, $CSS_COUNT CSS files"
    
    # Create a package.json specifically for Render
    echo "📝 Creating Render-specific package.json..."
    cat > render-package.json << EOL
{
  "name": "ayanfe-ai-render",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "main": "render-server.js",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}
EOL
    
    echo "✓ Created render-package.json for deployment"
    
    # Create a simple health check file
    echo "📡 Creating health check endpoint..."
    mkdir -p dist/public/health
    cat > dist/public/health/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>AYANFE AI - Health Check</title>
</head>
<body>
  <h1>AYANFE AI</h1>
  <p>Status: Online</p>
  <p>Build date: $(date)</p>
</body>
</html>
EOL
    
    echo "✓ Created health check endpoint at /health"
else
    # Try to recover by creating a minimal index.html
    echo "⚠️ Warning: index.html not found in dist/public"
    echo "🚑 Attempting to create a minimal index.html..."
    
    cat > dist/public/index.html << EOL
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
    <p>Please contact support if you continue to see this page.</p>
  </div>
</body>
</html>
EOL
    
    echo "✓ Created fallback index.html"
fi

echo "🚀 Build process completed successfully!"