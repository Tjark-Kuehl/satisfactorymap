import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the resources.json file
const resourcesPath = path.join(__dirname, 'public', 'data', 'resources.json');
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

console.log('=== RESOURCE DATA STRUCTURE ANALYSIS ===');

// Check top level structure
if (resourcesData.options && Array.isArray(resourcesData.options)) {
    console.log(`Found ${resourcesData.options.length} top-level categories`);
    
    // Analyze first category
    const firstCategory = resourcesData.options[0];
    console.log(`\nFirst category: ${firstCategory.name}`);
    console.log(`tabId: ${firstCategory.tabId}`);
    
    if (firstCategory.options && Array.isArray(firstCategory.options)) {
        console.log(`Contains ${firstCategory.options.length} subcategories`);
        
        // Analyze first subcategory
        const firstSubCategory = firstCategory.options[0];
        console.log(`\nFirst subcategory: ${firstSubCategory.name}`);
        console.log(`type: ${firstSubCategory.type}`);
        
        if (firstSubCategory.options && Array.isArray(firstSubCategory.options)) {
            console.log(`Contains ${firstSubCategory.options.length} resource types`);
            
            // Analyze first resource type
            const firstResourceType = firstSubCategory.options[0];
            console.log(`\nFirst resource type: ${firstResourceType.name}`);
            console.log(`layerId: ${firstResourceType.layerId}`);
            console.log(`purity: ${firstResourceType.purity}`);
            
            // Check for markers
            if (firstResourceType.markers && Array.isArray(firstResourceType.markers)) {
                console.log(`Contains ${firstResourceType.markers.length} markers (resource nodes)`);
                
                // Show sample of first 3 markers
                if (firstResourceType.markers.length > 0) {
                    console.log('\n=== SAMPLE MARKERS ===');
                    
                    for (let i = 0; i < Math.min(3, firstResourceType.markers.length); i++) {
                        const marker = firstResourceType.markers[i];
                        console.log(`\nMarker ${i+1}:`);
                        console.log(`pathName: ${marker.pathName}`);
                        console.log(`x: ${marker.x}`);
                        console.log(`y: ${marker.y}`);
                        console.log(`z: ${marker.z}`);
                        console.log(`type: ${marker.type}`);
                        console.log(`purity: ${marker.purity}`);
                    }
                    
                    // Count total nodes across all resources
                    let totalNodes = 0;
                    resourcesData.options.forEach(category => {
                        if (category.options && Array.isArray(category.options)) {
                            category.options.forEach(subcategory => {
                                if (subcategory.options && Array.isArray(subcategory.options)) {
                                    subcategory.options.forEach(resourceType => {
                                        if (resourceType.markers && Array.isArray(resourceType.markers)) {
                                            totalNodes += resourceType.markers.length;
                                        }
                                    });
                                }
                            });
                        }
                    });
                    
                    console.log(`\nTotal resource nodes in file: ${totalNodes}`);
                }
            } else {
                console.log('No markers array found or it is empty');
            }
        }
    }
} else {
    console.log('Invalid data structure: options is not an array or is missing');
}
