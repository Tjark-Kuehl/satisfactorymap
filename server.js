import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3002;

// Build the application first
async function buildApp() {
  console.log('Building the application...');
  
  try {
    // Bundle the JavaScript
    await build({
      entryPoints: ['src/js/main.js'],
      bundle: true,
      minify: false,  // Disable minification for development
      sourcemap: true,
      outfile: 'dist/bundle.js',
      platform: 'browser',
      format: 'esm',
      loader: {
        '.js': 'js',
        '.png': 'file',
        '.jpg': 'file',
        '.svg': 'file',
        '.webp': 'file',
      },
      define: {
        'process.env.NODE_ENV': '"development"'
      },
    });
    
    console.log('✅ Build completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error);
    return false;
  }
}

// Start the server
async function startServer() {
  // Build the app first
  const buildSuccess = await buildApp();
  if (!buildSuccess) {
    console.error('Server not started due to build failure');
    process.exit(1);
  }
  
  // Enable CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  // Log all requests for debugging
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
  });

  // Static routes - serve public directory directly at both /public and root paths
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
  app.use('/dist', express.static(path.join(__dirname, 'dist')));

  // Debug routes
  app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug.html'));
  });
  
  app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'resource-test.html'));
  });
  
  app.get('/basic', (req, res) => {
    res.sendFile(path.join(__dirname, 'basic-map.html'));
  });
  
  app.get('/icon-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'icon-test.html'));
  });

  // Serve static files from the root directory for HTML, CSS, JS, and bundled files
  app.use(express.static(__dirname));

  // Add middleware to debug 404 errors for asset requests
  app.use((req, res, next) => {
    const path = req.path;
    if (path.includes('/assets/') || path.includes('/public/assets/')) {
      console.log(`[DEBUG] Asset request: ${path}`);
    }
    next();
  });

  // Handle all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`View the app at http://localhost:${port}/`);
  });
}

// Start everything
startServer();
