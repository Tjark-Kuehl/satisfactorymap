/**
 * This script demonstrates how to create and use a Leaflet icon atlas
 * to improve performance by reducing HTTP requests and memory usage.
 */

// Sample code to create a single icon atlas with CSS sprites
const createIconAtlas = () => {
  // List of all icon paths to include in the atlas
  const iconPaths = [
    '/assets/icons/Stone_256.png',
    '/assets/icons/IconDesc_iron_new_256.png',
    '/assets/icons/IconDesc_copper_new_256.png',
    '/assets/icons/IconDesc_CateriumOre_256.png',
    '/assets/icons/IconDesc_CoalOre_256.png',
    '/assets/icons/LiquidOil_Pipe_256.png',
    '/assets/icons/Sulfur_256.png',
    '/assets/icons/IconDesc_Bauxite_256.png',
    '/assets/icons/IconDesc_QuartzCrystal_256.png',
    '/assets/icons/IconDesc_UraniumOre_256.png',
    '/assets/icons/SAMOre_256.png',
    '/assets/icons/LiquidWater_Pipe_256.png',
    '/assets/icons/IconDesc_NitricAcid_256.png',
    '/assets/icons/IconDesc_HotSprings_256.png',
    '/assets/icons/PowerSlugGreen_256.png',
    '/assets/icons/PowerSlugYellow_256.png',
    '/assets/icons/PowerSlugPurple_256.png',
    '/assets/icons/mercer_256.png',
    '/assets/icons/somersloom_256.png',
    '/assets/icons/HardDrive_256.png',
    '/assets/icons/Nut_256_New.png',
    '/assets/icons/IconDesc_Berry_256.png',
    '/assets/icons/Mushroom_256.png'
  ];

  // This would be implemented with canvas to create a combined image
  // For example, a 4x6 grid of 64x64 icons
  // In a production implementation, this would:
  // 1. Load all icons using Image objects
  // 2. Create a canvas of the proper size
  // 3. Draw each icon at a specific position
  // 4. Export the canvas as a single PNG/JPG
  // 5. Generate a CSS file with sprite positions
  
  return {
    // This would return metadata about the atlas:
    // - The URL to the combined image
    // - Coordinates for each icon within the atlas
    // - CSS classes that could be used
    atlasUrl: '/assets/icon-atlas.png',
    iconSize: 64,
    columns: 4,
    iconPositions: {
      'limestone': { x: 0, y: 0 },
      'iron': { x: 1, y: 0 },
      'copper': { x: 2, y: 0 },
      // etc.
    }
  };
};

/**
 * Example of how to use the icon atlas with Leaflet
 */
const createAtlasIcon = (iconType, atlas) => {
  const position = atlas.iconPositions[iconType];
  if (!position) {
    console.error(`Icon position not found for: ${iconType}`);
    return null;
  }

  // Calculate the background position
  const bgX = -position.x * atlas.iconSize;
  const bgY = -position.y * atlas.iconSize;

  // Create a custom icon using CSS background positioning
  return L.divIcon({
    className: 'atlas-icon',
    html: `<div style="
      width: ${atlas.iconSize}px;
      height: ${atlas.iconSize}px;
      background-image: url('${atlas.atlasUrl}');
      background-position: ${bgX}px ${bgY}px;
      background-repeat: no-repeat;
    "></div>`,
    iconSize: [atlas.iconSize, atlas.iconSize],
    iconAnchor: [atlas.iconSize/2, atlas.iconSize/2]
  });
};

// Usage with Leaflet:
// const atlas = createIconAtlas();
// const marker = L.marker([lat, lng], {
//   icon: createAtlasIcon('iron', atlas)
// });
