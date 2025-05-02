#!/usr/bin/env node

/**
 * Build Script for Satisfactory Interactive Map
 * 
 * This script handles the complete build process:
 * 1. Asset management (icon renaming and atlas generation)
 * 2. Resource processing (generating resources.js from resources.json)
 * 3. Running the Vite build process
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('==== SATISFACTORY INTERACTIVE MAP BUILD PROCESS ====');
console.log(`Started at: ${new Date().toISOString()}`);
console.log(`Project root: ${projectRoot}`);

// Check if resources.json exists at the root
const resourcesJsonPath = path.join(projectRoot, 'resources.json');
if (!fs.existsSync(resourcesJsonPath)) {
  console.error(`❌ ERROR: resources.json file not found at ${resourcesJsonPath}`);
  console.error('Please ensure resources.json exists in the project root directory.');
  process.exit(1);
}

// Function to run a command and handle errors
function runStep(name, command) {
  console.log(`\n---- STEP: ${name} ----`);
  console.log(`Running: ${command}`);
  
  try {
    execSync(command, { 
      cwd: projectRoot, 
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: true
      }
    });
    console.log(`✅ ${name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed with error:`);
    console.error(error.message);
    return false;
  }
}

// Step 1: Asset Management
if (!runStep('Asset Management', 'node scripts/asset-manager.js')) {
  console.error('Build failed at asset management step');
  process.exit(1);
}

// Step 2: Resource Processing
if (!runStep('Resource Processing', 'node scripts/process-resources.js')) {
  console.error('Build failed at resource processing step');
  process.exit(1);
}

// Step 3: Vite Build
if (!runStep('Vite Build', 'vite build')) {
  console.error('Build failed at Vite build step');
  process.exit(1);
}

console.log('\n==== BUILD COMPLETED SUCCESSFULLY ====');
console.log(`Finished at: ${new Date().toISOString()}`);
console.log('The application has been built and is ready to be deployed!');
console.log('Build output is in the "dist" directory');
