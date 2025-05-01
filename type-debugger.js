import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the resources.json file
const resourcesPath = path.join(__dirname, 'public', 'data', 'resources.json');
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

// Function to extract unique types from resource data
function extractResourceTypes(data) {
    const resourceTypes = new Set();
    const nodeTypeMapping = {};
    
    if (!data.options || !Array.isArray(data.options)) {
        console.log('Invalid data structure: missing options array');
        return { resourceTypes: [], nodeTypeMapping: {} };
    }
    
    // Process categories
    data.options.forEach(category => {
        if (!category.options || !Array.isArray(category.options)) return;
        
        // Process subcategories
        category.options.forEach(subCategory => {
            if (!subCategory.options || !Array.isArray(subCategory.options)) return;
            
            // Process resource types
            subCategory.options.forEach(resourceType => {
                if (!resourceType.markers || !Array.isArray(resourceType.markers)) return;
                
                // Add resource type name to set
                resourceTypes.add(resourceType.name);
                
                // Process resource nodes to get unique types
                resourceType.markers.forEach(node => {
                    if (node.type) {
                        // Map resource type name to node type
                        if (!nodeTypeMapping[resourceType.name]) {
                            nodeTypeMapping[resourceType.name] = new Set();
                        }
                        nodeTypeMapping[resourceType.name].add(node.type);
                    }
                });
            });
        });
    });
    
    // Convert nodeTypeMapping sets to arrays
    const mappingResult = {};
    Object.keys(nodeTypeMapping).forEach(key => {
        mappingResult[key] = Array.from(nodeTypeMapping[key]);
    });
    
    return { 
        resourceTypes: Array.from(resourceTypes),
        nodeTypeMapping: mappingResult
    };
}

// Extract resource types
const { resourceTypes, nodeTypeMapping } = extractResourceTypes(resourcesData);

// Output results
console.log('=== RESOURCE TYPES ===');
console.log(resourceTypes);

console.log('\n=== NODE TYPE MAPPING ===');
console.log(JSON.stringify(nodeTypeMapping, null, 2));

// Write mapping to file
const outputPath = path.join(__dirname, 'node-type-mapping.json');
fs.writeFileSync(outputPath, JSON.stringify(nodeTypeMapping, null, 2));
console.log(`\nMapping written to ${outputPath}`);

// Generate icon mapping code
console.log('\n=== ICON MAPPING CODE ===');
console.log('const resourceIconMapping = {');

// Iterate through the mapping and generate code
Object.keys(nodeTypeMapping).forEach(resourceName => {
    const nodeTypes = nodeTypeMapping[resourceName];
    const iconName = getIconNameForResource(resourceName);
    
    // For each node type, generate a mapping entry
    nodeTypes.forEach(nodeType => {
        console.log(`    '${nodeType.toLowerCase()}': '/assets/icons/${iconName}',`);
    });
    
    // Also add the resource name itself
    console.log(`    '${resourceName.toLowerCase()}': '/assets/icons/${iconName}',`);
});

console.log('};');

// Helper function to get icon name for resource
function getIconNameForResource(resourceName) {
    const resourceNameLower = resourceName.toLowerCase();
    
    // Map resource names to icon file names
    if (resourceNameLower.includes('limestone')) return 'Stone_256.png';
    if (resourceNameLower.includes('iron')) return 'IconDesc_iron_new_256.png';
    if (resourceNameLower.includes('copper')) return 'IconDesc_copper_new_256.png';
    if (resourceNameLower.includes('caterium')) return 'IconDesc_CateriumOre_256.png';
    if (resourceNameLower.includes('coal')) return 'IconDesc_CoalOre_256.png';
    if (resourceNameLower.includes('crude oil')) return 'LiquidOil_Pipe_256.png';
    if (resourceNameLower.includes('sulfur')) return 'Sulfur_256.png';
    if (resourceNameLower.includes('bauxite')) return 'IconDesc_Bauxite_256.png';
    if (resourceNameLower.includes('quartz')) return 'IconDesc_QuartzCrystal_256.png';
    if (resourceNameLower.includes('uranium')) return 'IconDesc_UraniumOre_256.png';
    if (resourceNameLower.includes('sam')) return 'SAMOre_256.png';
    if (resourceNameLower.includes('water')) return 'LiquidWater_Pipe_256.png';
    if (resourceNameLower.includes('nitrogen')) return 'IconDesc_NitricAcid_256.png';
    if (resourceNameLower.includes('blue power slug')) return 'PowerSlugGreen_256.png';
    if (resourceNameLower.includes('yellow power slug')) return 'PowerSlugYellow_256.png';
    if (resourceNameLower.includes('purple power slug')) return 'PowerSlugPurple_256.png';
    if (resourceNameLower.includes('mercer')) return 'mercer_256.png';
    if (resourceNameLower.includes('somersloop')) return 'somersloom_256.png';
    if (resourceNameLower.includes('hard drive')) return 'HardDrive_256.png';
    if (resourceNameLower.includes('paleberry')) return 'IconDesc_Berry_256.png';
    if (resourceNameLower.includes('beryl nut')) return 'Nut_256_New.png';
    if (resourceNameLower.includes('bacon')) return 'Mushroom_256.png';
    
    // Fallback
    return 'Stone_256.png';
}
