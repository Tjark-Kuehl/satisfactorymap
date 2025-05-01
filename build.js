import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runBuild() {
  try {
    console.log('Building the application...');

    // Bundle the JavaScript
    const result = await build({
      entryPoints: ['src/js/main.js'],
      bundle: true,
      minify: false,  // Disable minification for debugging
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
      logLevel: 'info',  // More verbose logging
    });

    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

runBuild();
