/**
 * Utility functions for working with the icon atlas
 */

/**
 * Finds the position of an icon in the atlas based on resource type
 * @param {Object} iconAtlas - The icon atlas configuration
 * @param {string} resourceKey - The standardized resource key to find
 * @returns {Object|null} - The position {x, y} of the icon in the atlas, or null if not found
 */
export function findIconPosition(iconAtlas, resourceKey) {
  if (!iconAtlas || !resourceKey) return null;
  
  // Convert the resourceKey to lowercase for consistency
  const key = resourceKey.toLowerCase();
  
  // Replace spaces with underscores and ensure we have the _256 suffix for iconPositions
  const atlasKey = key.replace(/\s+/g, '_') + (key.endsWith('_256') ? '' : '_256');
  
  // Try direct match in iconPositions first (this is now the most reliable with our standardized naming)
  if (iconAtlas.iconPositions && iconAtlas.iconPositions[atlasKey]) {
    return iconAtlas.iconPositions[atlasKey];
  }
  
  // Try direct match in resourceMapping as fallback
  if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[key]) {
    return iconAtlas.resourceMapping[key];
  }
  
  // For geyser, handle specially (might not be in the atlas)
  if (key === 'geyser') {
    return { x: 1, y: 2 }; // Use water icon as fallback
  }
  
  // If all else fails, use limestone as default
  return iconAtlas.iconPositions['limestone_256'] || { x: 3, y: 3 };
}

/**
 * Gets the background position CSS for an icon
 * @param {Object} iconPosition - The position {x, y} of the icon in the atlas
 * @param {number} iconSize - The size of each icon in the atlas
 * @returns {string} - The CSS background-position value
 */
export function getIconBackgroundPosition(iconPosition, iconSize) {
  if (!iconPosition) return '0 0';
  return `-${iconPosition.x * iconSize}px -${iconPosition.y * iconSize}px`;
}

/**
 * Load the icon atlas JSON file
 * @param {string} baseUrl - The base URL for the application
 * @returns {Promise<Object>} - A promise that resolves to the icon atlas configuration
 */
export async function loadIconAtlas(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}assets/icon-atlas.json`);
    if (!response.ok) {
      throw new Error(`Failed to load icon atlas: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading icon atlas:', error);
    return null;
  }
}
