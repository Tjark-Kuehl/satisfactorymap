/**
 * Icon Atlas Generator for Satisfactory Interactive Map
 * 
 * This script generates a single sprite sheet containing all map icons
 * to improve performance by reducing HTTP requests.
 */

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';

// Get current directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ICON_SIZE = 64; // Target size for each icon in the atlas
const COLUMNS = 5;    // Number of columns in the atlas grid
const ICON_DIR = '/root/InteractiveMap/public/assets/icons';  // Corrected path to icons
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');
const ATLAS_FILENAME = 'icon-atlas.png';
const METADATA_FILENAME = 'icon-atlas.json';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define explicit mapping for resource type to icon file
const resourceToIconMapping = {
    'limestone': 'Stone_256.png',
    'iron': 'IconDesc_iron_new_256.png',
    'copper': 'IconDesc_copper_new_256.png',
    'caterium': 'IconDesc_CateriumOre_256.png',
    'coal': 'IconDesc_CoalOre_256.png',
    'oil': 'LiquidOil_Pipe_256.png',
    'sulfur': 'Sulfur_256.png',
    'bauxite': 'IconDesc_Bauxite_256.png',
    'quartz': 'IconDesc_QuartzCrystal_256.png',
    'uranium': 'IconDesc_UraniumOre_256.png',
    'sam': 'SAMOre_256.png',
    'water': 'LiquidWater_Pipe_256.png',
    'nitrogengas': 'IconDesc_NitricAcid_256.png',
    'geyser': 'IconDesc_HotSprings_256.png',
    'green': 'PowerSlugGreen_256.png',
    'yellow': 'PowerSlugYellow_256.png',
    'purple': 'PowerSlugPurple_256.png',
    'mercer': 'mercer_256.png',
    'somersloop': 'somersloom_256.png',
    'harddrive': 'HardDrive_256.png',
    'beryl': 'Nut_256_New.png',
    'berry': 'IconDesc_Berry_256.png',
    'mushroom': 'Mushroom_256.png',
    'gaspillar': 'IconDesc_NitricAcid_256.png',
    'sporeflower': 'IconDesc_Berry_256.png',
    
    // Aliases for UI names
    'limestone (impure)': 'Stone_256.png',
    'limestone (normal)': 'Stone_256.png',
    'limestone (pure)': 'Stone_256.png',
    'iron ore (impure)': 'IconDesc_iron_new_256.png',
    'iron ore (normal)': 'IconDesc_iron_new_256.png',
    'iron ore (pure)': 'IconDesc_iron_new_256.png',
    'copper ore (impure)': 'IconDesc_copper_new_256.png',
    'copper ore (normal)': 'IconDesc_copper_new_256.png',
    'copper ore (pure)': 'IconDesc_copper_new_256.png',
    'crude oil (impure)': 'LiquidOil_Pipe_256.png',
    'crude oil (normal)': 'LiquidOil_Pipe_256.png',
    'crude oil (pure)': 'LiquidOil_Pipe_256.png',
    'geyser (unknown)': 'IconDesc_HotSprings_256.png',
    'geyser (impure)': 'IconDesc_HotSprings_256.png',
    'geyser (normal)': 'IconDesc_HotSprings_256.png',
    'geyser (pure)': 'IconDesc_HotSprings_256.png',
    'blue power slug': 'PowerSlugGreen_256.png',
    'yellow power slug': 'PowerSlugYellow_256.png',
    'purple power slug': 'PowerSlugPurple_256.png',
    'hard drive': 'HardDrive_256.png',
    'beryl nut': 'Nut_256_New.png',
    'paleberry': 'IconDesc_Berry_256.png',
    'bacon agaric': 'Mushroom_256.png',
    'gas pillars': 'IconDesc_NitricAcid_256.png',
    'spore flowers': 'IconDesc_Berry_256.png',
    'mercer sphere': 'mercer_256.png'
};

async function generateAtlas() {
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
            
            // Generate icon key from filename (without extension)
            const iconKey = path.basename(file, path.extname(file))
                .toLowerCase()
                .replace(/iconDesc_/i, '') // Remove IconDesc_ prefix if present
                .replace(/_/g, '');         // Remove underscores
            
            // Track position in the atlas
            const position = { x: col, y: row };
            
            // Load the icon
            const iconPath = path.join(ICON_DIR, file);
            const img = await loadImage(iconPath);
            
            // Draw the icon to the canvas
            ctx.drawImage(img, x, y, ICON_SIZE, ICON_SIZE);
            
            // Store position in metadata
            iconPositions[iconKey] = position;
            
            // Create resource mappings in a more direct way
            // Map all resource types that use this icon file to this position
            for (const [resourceType, iconFileName] of Object.entries(resourceToIconMapping)) {
                if (iconFileName === file) {
                    resourceMapping[resourceType] = position;
                    console.log(`Mapped resource '${resourceType}' to icon at position [${col}, ${row}] (${file})`);
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
        atlasUrl: `/public/assets/${ATLAS_FILENAME}`,
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
}

// Run the generator
generateAtlas().catch(err => {
    console.error('Error generating atlas:', err);
    process.exit(1);
});
