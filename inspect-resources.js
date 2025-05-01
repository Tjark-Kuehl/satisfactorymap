import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the resources.json file
const resourcesPath = path.join(__dirname, 'public', 'data', 'resources.json');
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

// Function to extract the first 3 resources of each type that has resources
function extractSampleResources(data) {
    const samples = {};
    let totalResourceCount = 0;
    
    // Check if data has options property
    if (!data.options || !Array.isArray(data.options)) {
        console.log('Invalid data structure: missing options array');
        return { samples, totalResourceCount };
    }
    
    // Process categories
    data.options.forEach((category, catIndex) => {
        if (!category.options || !Array.isArray(category.options)) return;
        
        const categoryName = category.name || `Category ${catIndex}`;
        samples[categoryName] = {};
        
        // Process subcategories
        category.options.forEach((subcategory, subIndex) => {
            if (!subcategory.options || !Array.isArray(subcategory.options)) return;
            
            const subcategoryName = subcategory.name || `Subcategory ${subIndex}`;
            samples[categoryName][subcategoryName] = {};
            
            // Process resource types
            subcategory.options.forEach((resourceType, typeIndex) => {
                if (!resourceType.resources || !Array.isArray(resourceType.resources)) return;
                
                const resourceTypeName = resourceType.name || `Resource Type ${typeIndex}`;
                const resources = resourceType.resources;
                
                // Check if there are any resources
                if (resources.length > 0) {
                    // Get the first 3 resources
                    const sampleResources = resources.slice(0, 3);
                    samples[categoryName][subcategoryName][resourceTypeName] = sampleResources;
                    
                    // Add to total count
                    totalResourceCount += resources.length;
                    
                    console.log(`Found ${resources.length} resources of type "${resourceTypeName}" in "${subcategoryName}" (${categoryName})`);
                }
            });
        });
    });
    
    return { samples, totalResourceCount };
}

// Extract sample resources
const { samples, totalResourceCount } = extractSampleResources(resourcesData);

// Output summary
console.log('\n=== RESOURCE SUMMARY ===');
console.log(`Total resources found: ${totalResourceCount}`);

// Write sample data to file
const outputPath = path.join(__dirname, 'resource-samples.json');
fs.writeFileSync(outputPath, JSON.stringify(samples, null, 2));
console.log(`\nSample data written to ${outputPath}`);

// Output the structure of the first resource
if (totalResourceCount > 0) {
    const firstCategoryName = Object.keys(samples)[0];
    if (firstCategoryName) {
        const firstSubcategoryName = Object.keys(samples[firstCategoryName])[0];
        if (firstSubcategoryName) {
            const firstResourceTypeName = Object.keys(samples[firstCategoryName][firstSubcategoryName])[0];
            if (firstResourceTypeName) {
                const firstResource = samples[firstCategoryName][firstSubcategoryName][firstResourceTypeName][0];
                console.log('\n=== FIRST RESOURCE STRUCTURE ===');
                console.log(JSON.stringify(firstResource, null, 2));
            }
        }
    }
}
