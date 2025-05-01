import L from 'leaflet';

// Icon mapping for resource types
const resourceIconMap = {
    // Ores
    'IRON': 'IconDesc_iron_new_256.png',
    'COPPER': 'IconDesc_copper_new_256.png',
    'LIMESTONE': 'Stone_256.png',
    'COAL': 'IconDesc_CoalOre_256.png',
    'CATERIUM': 'IconDesc_CateriumOre_256.png',
    'SULFUR': 'Sulfur_256.png',
    'QUARTZ': 'IconDesc_QuartzCrystal_256.png',
    'URANIUM': 'IconDesc_UraniumOre_256.png',
    'BAUXITE': 'IconDesc_Bauxite_256.png',
    'SAM': 'SAMOre_256.png',
    
    // Liquids
    'CRUDE': 'LiquidOil_Pipe_256.png',
    'OIL': 'LiquidOil_Pipe_256.png',
    'WATER': 'LiquidWater_Pipe_256.png',
    
    // Power Slugs
    'GREEN': 'PowerSlugGreen_256.png',
    'YELLOW': 'PowerSlugYellow_256.png',
    'PURPLE': 'PowerSlugPurple_256.png',
    'SLUG': 'PowerSlugGreen_256.png',
    'POWER': 'PowerSlugGreen_256.png',
    
    // Alien Artifacts
    'MERCER': 'mercer_256.png',
    'SOMERS': 'somersloom_256.png',
    
    // Flora
    'BERRY': 'IconDesc_Berry_256.png',
    'MUSHROOM': 'Mushroom_256.png',
    'NUT': 'Nut_256_New.png',
    
    // Default icon for unknown types
    'DEFAULT': 'HardDrive_256.png'
};

// Additional mappings for full resource names
const fullNameIconMap = {
    'IRON ORE': 'IconDesc_iron_new_256.png',
    'COPPER ORE': 'IconDesc_copper_new_256.png',
    'LIMESTONE': 'Stone_256.png',
    'COAL': 'IconDesc_CoalOre_256.png',
    'CATERIUM ORE': 'IconDesc_CateriumOre_256.png',
    'SULFUR': 'Sulfur_256.png',
    'RAW QUARTZ': 'IconDesc_QuartzCrystal_256.png',
    'URANIUM': 'IconDesc_UraniumOre_256.png',
    'BAUXITE': 'IconDesc_Bauxite_256.png',
    'S.A.M. ORE': 'SAMOre_256.png',
    'CRUDE OIL': 'LiquidOil_Pipe_256.png',
    'WATER': 'LiquidWater_Pipe_256.png',
    'GREEN POWER SLUG': 'PowerSlugGreen_256.png',
    'YELLOW POWER SLUG': 'PowerSlugYellow_256.png',
    'PURPLE POWER SLUG': 'PowerSlugPurple_256.png',
    'POWER SLUG': 'PowerSlugGreen_256.png',
    'MERCER SPHERE': 'mercer_256.png',
    'SOMERSLOOP': 'somersloom_256.png',
    'ALIEN CARAPACE': 'HardDrive_256.png',
    'FLOWER PETALS': 'IconDesc_Berry_256.png',
    'MYCELIA': 'Mushroom_256.png',
    'PALEBERRY': 'IconDesc_Berry_256.png',
    'BACON AGARIC': 'Mushroom_256.png',
    'BERYL NUT': 'Nut_256_New.png'
};

// Icon size configuration
const iconSizeMap = {
    'small': [16, 16],
    'medium': [24, 24],
    'large': [32, 32]
};

/**
 * Create a custom marker icon using the resource type
 * @param {string} resourceType - The resource type (e.g., 'IRON', 'COAL')
 * @param {string} purity - The resource purity ('IMPURE', 'NORMAL', 'PURE')
 * @param {string} size - Icon size ('small', 'medium', 'large')
 * @returns {L.Icon} - A Leaflet Icon
 */
export function createIcon(resourceType, purity = 'NORMAL', size = 'medium') {
    // Normalize resource type
    const resourceTypeUpper = (resourceType || '').toUpperCase();
    console.log(`Creating icon for: ${resourceTypeUpper}, purity: ${purity}`);
    
    // Try to match the full resource name first
    let iconFile = fullNameIconMap[resourceTypeUpper];
    
    // If no match, try individual words
    if (!iconFile) {
        const words = resourceTypeUpper.split(' ');
        for (const word of words) {
            if (resourceIconMap[word]) {
                iconFile = resourceIconMap[word];
                break;
            }
        }
    }
    
    // Fallback to default if still no match
    if (!iconFile) {
        console.warn(`No icon found for resource type: ${resourceTypeUpper}, using default`);
        iconFile = resourceIconMap['DEFAULT'];
    }
    
    // Determine icon size
    const iconSize = iconSizeMap[size] || iconSizeMap['medium'];
    
    // Apply purity effect through CSS class
    let purityClass = '';
    if (purity === 'IMPURE') {
        purityClass = 'resource-icon-impure';
    } else if (purity === 'PURE') {
        purityClass = 'resource-icon-pure';
    }
    
    // Create icon
    return L.icon({
        iconUrl: `/assets/icons/${iconFile}`,
        iconSize: iconSize,
        iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
        popupAnchor: [0, -iconSize[1] / 2],
        className: `resource-icon ${purityClass}`
    });
}
