#!/usr/bin/env node

/**
 * Debug script to diagnose icon mapping issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths for input files
const resourcesJsPath = path.resolve(__dirname, '../src/data/resources.js');
const iconAtlasPath = path.resolve(__dirname, '../public/assets/icon-atlas.json');

// Read the resources data
let resourceData;
try {
  // We need to extract the data from the JS module
  const resourcesJs = fs.readFileSync(resourcesJsPath, 'utf8');
  // Extract the JSON part from the JS module using regex
  const resourceDataMatch = resourcesJs.match(/resourceData = (\{[\s\S]*?\});/);
  if (resourceDataMatch && resourceDataMatch[1]) {
    // Parse the JSON string
    resourceData = JSON.parse(resourceDataMatch[1]);
    console.log('Successfully loaded resources.js data');
  } else {
    throw new Error('Could not extract resource data from resources.js');
  }
} catch (error) {
  console.error('Error reading resources.js:', error);
  process.exit(1);
}

// Read the icon atlas
let iconAtlas;
try {
  const atlasContent = fs.readFileSync(iconAtlasPath, 'utf8');
  iconAtlas = JSON.parse(atlasContent);
  console.log('Successfully loaded icon-atlas.json');
} catch (error) {
  console.error('Error reading icon-atlas.json:', error);
  process.exit(1);
}

// Helper function to find icon position (simplified version for debugging)
function findIconPosition(iconAtlas, resourceKey) {
  if (!iconAtlas || !resourceKey) return null;
  
  // Convert the resourceKey to lowercase for consistency
  const key = resourceKey.toLowerCase();
  
  // Replace spaces with underscores and ensure we have the _256 suffix for iconPositions
  const atlasKey = key.replace(/\s+/g, '_') + (key.endsWith('_256') ? '' : '_256');
  
  console.log(`Looking up: "${key}" → atlasKey: "${atlasKey}"`);
  
  // Try direct match in iconPositions
  if (iconAtlas.iconPositions && iconAtlas.iconPositions[atlasKey]) {
    console.log(`  ✅ Found in iconPositions as "${atlasKey}"`);
    return iconAtlas.iconPositions[atlasKey];
  }
  
  // Try direct match in resourceMapping
  if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[key]) {
    console.log(`  ✅ Found in resourceMapping as "${key}"`);
    return iconAtlas.resourceMapping[key];
  }
  
  console.log(`  ❌ Not found in atlas! Falling back to default`);
  return null;
}

// Test all resources that have iconKey properties
console.log('\n\n==== TESTING RESOURCE ICON MAPPINGS ====');
Object.values(resourceData.resourceMap).forEach(resource => {
  console.log(`\nResource: ${resource.name} (id: ${resource.id}, iconKey: ${resource.iconKey || 'N/A'})`);
  
  // Test lookup using resource.iconKey
  if (resource.iconKey) {
    console.log(`Testing with iconKey: ${resource.iconKey}`);
    const pos = findIconPosition(iconAtlas, resource.iconKey);
    if (pos) {
      console.log(`  Position: x=${pos.x}, y=${pos.y}`);
    }
  }
  
  // Also test lookup using resource.id for comparison
  console.log(`Testing with id: ${resource.id}`);
  const posById = findIconPosition(iconAtlas, resource.id);
  if (posById) {
    console.log(`  Position: x=${posById.x}, y=${posById.y}`);
  }
});

// Print available keys in iconPositions for reference
console.log('\n\n==== AVAILABLE KEYS IN ICONPOSITIONS ====');
console.log(Object.keys(iconAtlas.iconPositions));

// Print available keys in resourceMapping for reference
console.log('\n\n==== AVAILABLE KEYS IN RESOURCEMAPPING ====');
console.log(Object.keys(iconAtlas.resourceMapping));
