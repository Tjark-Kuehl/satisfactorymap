#!/usr/bin/env node

/**
 * Preprocess resources.json to:
 * 1. Filter out unknown or undefined categories and nodes
 * 2. Convert to a JavaScript module for better performance
 * 3. Optimize structure for faster access
 * 4. Standardize resource naming and icon mapping
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths for input and output files
const inputFile = path.resolve(__dirname, '../resources.json'); 
const outputFile = path.resolve(__dirname, '../src/data/resources.js');
const outputDir = path.resolve(__dirname, '../src/data');

console.log('Processing resources data to optimize performance...');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created directory: ${outputDir}`);
}

// Read the resources data
let resourcesData;
try {
  const fileContent = fs.readFileSync(inputFile, 'utf8');
  resourcesData = JSON.parse(fileContent);
  console.log(`Successfully loaded resources.json from: ${inputFile}`);
} catch (error) {
  console.error('Error reading resources.json:', error);
  process.exit(1);
}

// Resource name standardization mapping
// This maps various resource name formats to a standardized name for icon lookup
const resourceStandardization = {
  // Core resources
  'iron ore': 'iron',
  'copper ore': 'copper',
  'limestone': 'limestone',
  'coal': 'coal',
  'caterium ore': 'caterium',
  'bauxite': 'bauxite',
  'sulfur': 'sulfur',
  'uranium': 'uranium',
  'sam ore': 'sam_ore',
  'raw quartz': 'quartz',
  
  // Liquids and gases
  'crude oil': 'oil',
  'water': 'water',
  'nitrogen gas': 'nitrogen_gas',
  'geyser': 'geyser',
  
  // Collectibles
  'power slug': 'slug_green',
  'green power slug': 'slug_green',
  'yellow power slug': 'slug_yellow',
  'purple power slug': 'slug_purple',
  'blue power slug': 'slug_green',
  'hard drive': 'hard_drive',
  'somers loop': 'somers_loop',
  'somersloop': 'somers_loop',
  'mercer sphere': 'mercer_sphere',
  
  // Flora
  'beryl nut': 'beryl_nut',
  'paleberry': 'paleberry',
  'bacon agaric': 'bacon_agaric',
  'spore flower': 'paleberry', // Spore flowers use paleberry icon
  
  // Default fallback
  'unknown': 'limestone'
};

// Filter function to remove unwanted entries
function isValidName(name) {
  if (name === undefined || name === null || name === '') return false;
  if (typeof name === 'string' && (
      name.toLowerCase().includes('unknown') || 
      name.toLowerCase().includes('undefined'))) return false;
  return true;
}

// Get standardized resource key for consistent icon mapping
function getStandardizedResourceKey(resourceName, resourceType) {
  if (!resourceName) return 'unknown';
  
  // Extract base name without purity
  const baseName = resourceName.toLowerCase().replace(/\s*\((?:impure|normal|pure|unknown)\)\s*/g, '');
  
  // Try direct match in our standardization map
  if (resourceStandardization[baseName]) {
    return resourceStandardization[baseName];
  }
  
  // For specific resource types
  if (resourceType) {
    const typeKey = resourceType.toLowerCase();
    if (typeKey.includes('slug') && typeKey.includes('green')) return 'slug_green';
    if (typeKey.includes('slug') && typeKey.includes('purple')) return 'slug_purple';
    if (typeKey.includes('slug') && typeKey.includes('yellow')) return 'slug_yellow';
    if (typeKey.includes('hard') && typeKey.includes('drive')) return 'hard_drive';
    if (typeKey.includes('sphere')) return 'mercer_sphere';
    if (typeKey.includes('loop')) return 'somers_loop';
  }
  
  // Convert to snake_case for use with our new asset naming convention
  return baseName.replace(/\s+/g, '_');
}

// Process the data structure and optimize for performance
let totalRemoved = 0;
let optimizedData = {
  categories: [],
  resourceMap: {}  // For quick lookups by ID
};

// Process categories
if (resourcesData.options) {
  const originalCategoryCount = resourcesData.options.length;
  
  // Filter and transform categories
  resourcesData.options.forEach(category => {
    if (!category || !isValidName(category.name)) {
      totalRemoved++;
      return;
    }
    
    const optimizedCategory = {
      id: category.tabId || category.name.toLowerCase().replace(/\s+/g, '_'),
      name: category.name,
      subcategories: []
    };
    
    // Filter subcategories
    if (category.options) {
      const originalSubCategoryCount = category.options.length;
      let validSubcategories = 0;
      
      category.options.forEach(subcategory => {
        if (!subcategory || !isValidName(subcategory.name)) {
          totalRemoved++;
          return;
        }
        
        const optimizedSubcategory = {
          id: subcategory.name.toLowerCase().replace(/\s+/g, '_'),
          name: subcategory.name,
          resources: []
        };
        
        // Filter resource types
        if (subcategory.options) {
          const originalResourceCount = subcategory.options.length;
          let validResources = 0;
          
          subcategory.options.forEach(resource => {
            if (!resource || !isValidName(resource.name)) {
              totalRemoved++;
              return;
            }
            
            const resourceId = resource.layerId || resource.name.toLowerCase().replace(/\s+/g, '_');
            
            // Get standardized resource key for icon mapping
            const iconKey = getStandardizedResourceKey(resource.name, resource.type);
            
            // Create optimized resource object
            const optimizedResource = {
              id: resourceId,
              name: resource.name,
              type: resource.type || '',
              purity: resource.purity || '',
              iconKey: iconKey, // Standardized key for icon lookup
              outsideColor: resource.outsideColor || '#cccccc',
              insideColor: resource.insideColor || '#666666',
              markers: resource.markers || []
            };
            
            // Add to subcategory
            optimizedSubcategory.resources.push(optimizedResource);
            
            // Also add to resourceMap for quick lookups
            optimizedData.resourceMap[resourceId] = optimizedResource;
            
            validResources++;
          });
          
          console.log(`  - ${subcategory.name}: Processed ${validResources} resources (removed ${originalResourceCount - validResources})`);
          
          // Only add subcategory if it has resources
          if (optimizedSubcategory.resources.length > 0) {
            optimizedCategory.subcategories.push(optimizedSubcategory);
            validSubcategories++;
          }
        }
      });
      
      console.log(`- ${category.name}: Processed ${validSubcategories} subcategories (removed ${originalSubCategoryCount - validSubcategories})`);
      
      // Only add category if it has subcategories
      if (optimizedCategory.subcategories.length > 0) {
        optimizedData.categories.push(optimizedCategory);
      }
    }
  });
  
  console.log(`Top level: Processed ${optimizedData.categories.length} categories (removed ${originalCategoryCount - optimizedData.categories.length})`);
}

// Generate JavaScript module with the optimized data
const jsContent = `/**
 * Generated resources data - DO NOT EDIT DIRECTLY
 * This file is auto-generated by process-resources.js
 * Last updated: ${new Date().toISOString()}
 */

// Optimized resource data structure
export const resourceData = ${JSON.stringify(optimizedData, null, 2)};

// Helper function to get all visible resources
export function getDefaultVisibleResources() {
  const visibleResources = {};
  
  resourceData.categories.forEach(category => {
    category.subcategories.forEach(subcategory => {
      subcategory.resources.forEach(resource => {
        visibleResources[resource.id] = true;
      });
    });
  });
  
  return visibleResources;
}

// Helper to find a resource by ID
export function getResourceById(id) {
  return resourceData.resourceMap[id] || null;
}

// Helper to get total marker count
export function getTotalMarkerCount() {
  let count = 0;
  resourceData.categories.forEach(category => {
    category.subcategories.forEach(subcategory => {
      subcategory.resources.forEach(resource => {
        count += resource.markers ? resource.markers.length : 0;
      });
    });
  });
  return count;
}

/**
 * Get the standardized icon key for a resource
 * This provides a clean, consistent mapping between resource names and icons
 * @param {string} resourceId - The ID of the resource to look up
 * @returns {string} The standardized icon key
 */
export function getResourceIconKey(resourceId) {
  const resource = getResourceById(resourceId);
  if (!resource) return 'unknown';
  return resource.iconKey || 'unknown';
}

export default resourceData;
`;

// Write the processed JS module
try {
  fs.writeFileSync(outputFile, jsContent);
  console.log(`\nProcessing complete! Removed ${totalRemoved} invalid entries.`);
  console.log(`Optimized JavaScript module saved to ${outputFile}`);
} catch (error) {
  console.error('Error writing processed data:', error);
  process.exit(1);
}
