#!/usr/bin/env node

/**
 * Asset Manager for Satisfactory Interactive Map
 * 
 * This script handles:
 * 1. Renaming asset files if needed to follow a consistent pattern
 * 2. Generating an icon atlas (sprite sheet) from individual icons
 * 
 * Run this script during the build process to generate necessary assets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage } from 'canvas';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ICON_DIR = path.resolve(PROJECT_ROOT, 'public/assets/icons');
const OUTPUT_DIR = path.resolve(PROJECT_ROOT, 'public/assets');
const ATLAS_FILENAME = 'icon-atlas.png';
const METADATA_FILENAME = 'icon-atlas.json';

// Atlas configuration
const ICON_SIZE = 64; // Target size for each icon in the atlas
const COLUMNS = 5;    // Number of columns in the atlas grid

// Mapping of old filenames to standardized names
const fileRenameMap = {
  // Core resources
  'IconDesc_iron_new_256.png': 'iron_256.png',
  'IconDesc_copper_new_256.png': 'copper_256.png',
  'IconDesc_Bauxite_256.png': 'bauxite_256.png',
  'IconDesc_CateriumOre_256.png': 'caterium_256.png',
  'IconDesc_CoalOre_256.png': 'coal_256.png',
  'IconDesc_QuartzCrystal_256.png': 'quartz_256.png',
  'IconDesc_UraniumOre_256.png': 'uranium_256.png',
  'Stone_256.png': 'limestone_256.png',
  'Sulfur_256.png': 'sulfur_256.png',
  'SAMOre_256.png': 'sam_ore_256.png',
  
  // Liquids and gases
  'LiquidOil_Pipe_256.png': 'oil_256.png',
  'LiquidWater_Pipe_256.png': 'water_256.png',
  'IconDesc_NitricAcid_256.png': 'nitrogen_gas_256.png',
  'IconDesc_HotSprings_256.png': 'geyser_256.png',
  
  // Collectibles
  'HardDrive_256.png': 'hard_drive_256.png',
  'PowerSlugGreen_256.png': 'slug_green_256.png',
  'PowerSlugPurple_256.png': 'slug_purple_256.png',
  'PowerSlugYellow_256.png': 'slug_yellow_256.png',
  'mercer_256.png': 'mercer_sphere_256.png',
  'somersloom_256.png': 'somers_loop_256.png',
  
  // Flora
  'IconDesc_Berry_256.png': 'paleberry_256.png',
  'Mushroom_256.png': 'bacon_agaric_256.png',
  'Nut_256_New.png': 'beryl_nut_256.png'
};

// Define mapping for resource types to icon files
const resourceToIconMapping = {
  // Core resources
  'limestone': 'limestone_256.png',
  'iron': 'iron_256.png',
  'copper': 'copper_256.png',
  'caterium': 'caterium_256.png',
  'coal': 'coal_256.png',
  'oil': 'oil_256.png',
  'sulfur': 'sulfur_256.png',
  'bauxite': 'bauxite_256.png',
  'quartz': 'quartz_256.png',
  'uranium': 'uranium_256.png',
  'sam_ore': 'sam_ore_256.png',
  'water': 'water_256.png',
  'nitrogen_gas': 'nitrogen_gas_256.png',
  'geyser': 'geyser_256.png',
  'slug_green': 'slug_green_256.png',
  'slug_yellow': 'slug_yellow_256.png',
  'slug_purple': 'slug_purple_256.png',
  'mercer_sphere': 'mercer_sphere_256.png',
  'somers_loop': 'somers_loop_256.png',
  'hard_drive': 'hard_drive_256.png',
  'beryl_nut': 'beryl_nut_256.png',
  'paleberry': 'paleberry_256.png',
  'bacon_agaric': 'bacon_agaric_256.png',
  'gaspillar': 'nitrogen_gas_256.png',
  'sporeflower': 'paleberry_256.png',
  
  // Aliases for UI names
  'limestone (impure)': 'limestone_256.png',
  'limestone (normal)': 'limestone_256.png',
  'limestone (pure)': 'limestone_256.png',
  'iron ore (impure)': 'iron_256.png',
  'iron ore (normal)': 'iron_256.png',
  'iron ore (pure)': 'iron_256.png',
  'copper ore (impure)': 'copper_256.png',
  'copper ore (normal)': 'copper_256.png',
  'copper ore (pure)': 'copper_256.png',
  'crude oil (impure)': 'oil_256.png',
  'crude oil (normal)': 'oil_256.png',
  'crude oil (pure)': 'oil_256.png',
  'geyser (unknown)': 'geyser_256.png',
  'geyser (impure)': 'geyser_256.png',
  'geyser (normal)': 'geyser_256.png',
  'geyser (pure)': 'geyser_256.png',
  'blue power slug': 'slug_green_256.png',
  'yellow power slug': 'slug_yellow_256.png',
  'purple power slug': 'slug_purple_256.png',
  'hard drive': 'hard_drive_256.png',
  'beryl nut': 'beryl_nut_256.png',
  'paleberry': 'paleberry_256.png',
  'bacon agaric': 'bacon_agaric_256.png',
  'gas pillars': 'nitrogen_gas_256.png',
  'spore flowers': 'paleberry_256.png',
  'mercer sphere': 'mercer_sphere_256.png'
};

/**
 * Rename asset files to follow a consistent naming pattern
 */
async function renameAssets() {
  console.log('=== ASSET RENAMING ===');
  console.log('Checking for asset files that need renaming...');

  // Make sure the icons directory exists
  if (!fs.existsSync(ICON_DIR)) {
    console.error(`Icons directory not found: ${ICON_DIR}`);
    return false;
  }

  // Get the list of files in the icons directory
  const existingFiles = fs.readdirSync(ICON_DIR);
  
  // Process each file in the rename map
  let renamedCount = 0;
  for (const [oldFilename, newFilename] of Object.entries(fileRenameMap)) {
    const oldPath = path.join(ICON_DIR, oldFilename);
    const newPath = path.join(ICON_DIR, newFilename);
    
    // Check if the old file exists and needs renaming
    if (existingFiles.includes(oldFilename)) {
      // Rename the file directly (no backup)
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${oldFilename} → ${newFilename}`);
      renamedCount++;
    }
  }

  if (renamedCount === 0) {
    console.log('No files needed renaming. Assets already have standardized names.');
  } else {
    console.log(`Renamed ${renamedCount} files to standardized naming.`);
  }
  
  console.log('Asset renaming complete!');
  return true;
}

/**
 * Generate an icon atlas from individual icon files
 */
async function generateAtlas() {
  console.log('\n=== ATLAS GENERATION ===');
  console.log('Generating icon atlas from individual icons...');

  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`Created output directory: ${OUTPUT_DIR}`);
    }

    // Get all icon files
    const iconFiles = fs.readdirSync(ICON_DIR).filter(file => 
      file.endsWith('.png') || file.endsWith('.jpg')
    );
    
    console.log(`Found ${iconFiles.length} icon files to process`);
    
    // Calculate atlas dimensions
    const rows = Math.ceil(iconFiles.length / COLUMNS);
    const atlasWidth = COLUMNS * ICON_SIZE;
    const atlasHeight = rows * ICON_SIZE;
    
    // Create canvas for the atlas
    const canvas = createCanvas(atlasWidth, atlasHeight);
    const ctx = canvas.getContext('2d');
    
    // Fill with transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, atlasWidth, atlasHeight);
    
    // Create metadata for icon positions and resource mappings
    const iconPositions = {};
    const resourceMapping = {};
    
    // Load and draw each icon
    const iconPromises = iconFiles.map(async (file, index) => {
      try {
        // Calculate position in the grid
        const col = index % COLUMNS;
        const row = Math.floor(index / COLUMNS);
        const x = col * ICON_SIZE;
        const y = row * ICON_SIZE;
        
        // Generate standardized icon key from filename
        // Keep snake_case format and ensure _256 suffix is present
        let iconKey = path.basename(file, path.extname(file));
        if (!iconKey.endsWith('_256')) {
          iconKey += '_256';
        }
        
        // Track position in the atlas
        const position = { x: col, y: row };
        
        // Load the icon
        const iconPath = path.join(ICON_DIR, file);
        const img = await loadImage(iconPath);
        
        // Draw the icon to the canvas
        ctx.drawImage(img, x, y, ICON_SIZE, ICON_SIZE);
        
        // Store position in metadata
        iconPositions[iconKey] = position;
        
        // Find all resource types that map to this icon file 
        for (const [resourceType, iconFileName] of Object.entries(resourceToIconMapping)) {
          if (iconFileName === file) {
            resourceMapping[resourceType] = position;
            console.log(`Mapped resource '${resourceType}' to icon at position [${col}, ${row}]`);
          }
        }
        
        console.log(`Processed icon: ${file} → ${iconKey} at position [${col}, ${row}]`);
      } catch (err) {
        console.error(`Error processing icon ${file}:`, err);
      }
    });
    
    // Wait for all icons to be processed
    await Promise.all(iconPromises);
    
    // Save the atlas image
    const atlasPath = path.join(OUTPUT_DIR, ATLAS_FILENAME);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(atlasPath, buffer);
    
    // Save metadata with both raw positions and resource mappings
    const metadata = {
      atlasUrl: `/assets/${ATLAS_FILENAME}`,
      iconSize: ICON_SIZE,
      columns: COLUMNS,
      rows: rows,
      iconPositions: iconPositions,
      resourceMapping: resourceMapping
    };
    
    const metadataPath = path.join(OUTPUT_DIR, METADATA_FILENAME);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`
Atlas generation complete!
Atlas saved to: ${atlasPath}
Metadata saved to: ${metadataPath}
Atlas dimensions: ${atlasWidth}x${atlasHeight} pixels
Icons processed: ${Object.keys(iconPositions).length}
Resource mappings: ${Object.keys(resourceMapping).length}
    `);
    
    return true;
  } catch (err) {
    console.error('Error generating atlas:', err);
    return false;
  }
}

// Main function to run the entire asset management process
async function main() {
  console.log('Starting Satisfactory Interactive Map asset management...');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Working directory: ${process.cwd()}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
  
  // Step 1: Rename assets to standard format
  const renameSuccess = await renameAssets();
  
  // Step 2: Generate the icon atlas
  if (renameSuccess) {
    const atlasSuccess = await generateAtlas();
    
    if (atlasSuccess) {
      console.log('\n✅ Asset management completed successfully!');
      console.log('You can now use the updated icon atlas in your application.');
    } else {
      console.error('\n❌ Atlas generation failed. Please check the error messages above.');
      process.exit(1);
    }
  } else {
    console.error('\n❌ Asset renaming failed. Atlas generation was skipped.');
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error in asset management:', err);
  process.exit(1);
});
