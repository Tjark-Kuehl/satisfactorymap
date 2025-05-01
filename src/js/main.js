// Import Leaflet
import L from 'leaflet';
import { initializeMap } from './components/map.js';

// Global variables
let map;
let markerClusters = {};
let resourceData;
let iconAtlas = null; // Will store the atlas metadata

// Add CSS to the document for atlas icons
document.head.insertAdjacentHTML('beforeend', `
<style>
.atlas-icon {
    background-color: transparent !important;
}
.atlas-icon-container {
    background-repeat: no-repeat !important;
    width: 100%;
    height: 100%;
    transform: scale(0.375); /* Scale down from 64px to 24px */
    transform-origin: 0 0;
}
.resource-toggle-label {
    display: flex;
    align-items: center;
    gap: 5px;
}
.resource-icon {
    display: inline-block;
}
</style>
`);

// Icon atlas configuration
const ATLAS_URL = '/public/assets/icon-atlas.json';
const ATLAS_IMAGE_URL = '/public/assets/icon-atlas.png';
const DEFAULT_DISPLAY_SIZE = 24;

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Get the loading spinner overlay
    const loadingSpinner = document.getElementById('map-loading');
    
    // Show loading spinner at start
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
    
    try {
        // First load the icon atlas
        const atlasLoaded = await loadIconAtlas();
        
        if (!atlasLoaded) {
            console.error('Failed to load icon atlas. Cannot continue.');
            document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><h1>Error</h1><p>Failed to load icon atlas. Please check the console for more information.</p></div>';
            return;
        }
        
        // Preload the atlas image before showing icons
        await preloadAtlasImage();
        
        // Fetch resource data (single fetch operation)
        const response = await fetch('/public/data/resources.json');
        if (!response.ok) {
            throw new Error(`Failed to load resources: ${response.status}`);
        }
        
        resourceData = await response.json();
        
        // Initialize the map (this can take time)
        map = initializeMap();
        
        // Initialize UI elements immediately
        initSidebarToggle();
        initHideAllNodesButton();
        
        // Create sidebar first (quick operation)
        // With preloaded atlas, icons should appear immediately
        createSidebar(resourceData);
        
        // Process and place map markers in the background
        // This is the heavy operation that takes time
        setTimeout(() => {
            processResources(resourceData);
            
            // Hide loading spinner after processing completes
            if (loadingSpinner) {
                loadingSpinner.classList.add('hidden');
            }
        }, 10);
        
        // Initialize debug panel toggle
        const debugToggle = document.getElementById('icon-debug-toggle');
        if (debugToggle) {
            debugToggle.addEventListener('click', () => {
                const debugPanel = document.getElementById('icon-debug');
                if (debugPanel) {
                    if (debugPanel.style.display === 'none') {
                        debugPanel.style.display = 'block';
                        debugToggle.textContent = 'Hide Debug';
                    } else {
                        debugPanel.style.display = 'none';
                        debugToggle.textContent = 'Debug Icons';
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error initializing application:', error);
        document.body.innerHTML = '<div style="padding: 2rem; text-align: center;"><h1>Error</h1><p>Failed to initialize the application. Please check the console for more information.</p></div>';
        
        // Hide loading spinner on error
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
    }
});

/**
 * Initialize Hide All Nodes button functionality
 */
function initHideAllNodesButton() {
    const hideAllButton = document.getElementById('toggle-all-nodes');
    if (!hideAllButton) {
        console.error('Hide All Nodes button not found');
        return;
    }
    
    let allNodesVisible = true; // Track the current state
    
    hideAllButton.addEventListener('click', () => {
        // Toggle visibility state
        allNodesVisible = !allNodesVisible;
        
        // Update button text
        hideAllButton.textContent = allNodesVisible ? 'Hide All Nodes' : 'Show All Nodes';
        
        // Toggle all checkboxes
        document.querySelectorAll('.resource-toggle').forEach(checkbox => {
            if (checkbox.checked !== allNodesVisible) {
                checkbox.checked = allNodesVisible;
                
                // Trigger the change event to update visibility
                const resourceId = checkbox.dataset.resourceId;
                toggleResourceVisibility(resourceId, allNodesVisible);
            }
        });
    });
}

/**
 * Load the icon atlas from the server
 */
async function loadIconAtlas() {
    try {
        const response = await fetch(ATLAS_URL);
        if (!response.ok) {
            throw new Error(`Failed to load icon atlas: ${response.status}`);
        }
        
        iconAtlas = await response.json();
        return true;
    } catch (error) {
        console.error('⚠️ Error loading icon atlas:', error);
        appendDebugInfo(`Failed to load icon atlas: ${error.message}`, 'red');
        return false;
    }
}

/**
 * Initialize sidebar toggle functionality
 */
function initSidebarToggle() {
    const toggleButton = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    } else {
        console.error('Sidebar toggle elements not found:', { toggleButton, sidebar });
    }
}

/**
 * Append debug info to the debug panel
 */
function appendDebugInfo(text, color = 'white') {
    const debugPanel = document.getElementById('icon-debug');
    if (!debugPanel) return;
    
    const p = document.createElement('p');
    p.style.color = color;
    p.textContent = text;
    debugPanel.appendChild(p);
    
    // Scroll to bottom
    debugPanel.scrollTop = debugPanel.scrollHeight;
    
    // Keep debug panel tidy
    if (debugPanel.children.length > 50) {
        debugPanel.removeChild(debugPanel.firstChild);
    }
}

/**
 * Create a Leaflet icon from the icon atlas
 * @param {string} resourceType - The resource type
 * @returns {L.DivIcon} - Leaflet icon
 */
function createAtlasIcon(resourceType) {
    // Clean up the resource type - normalize by removing purity in parentheses and converting to lowercase
    const resourceKey = resourceType.toLowerCase().replace(/\s+\([^)]+\)/g, '');
    
    // Try each matching approach in order
    let position = null;
    
    // 1. First try direct match in resourceMapping
    if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[resourceKey]) {
        position = iconAtlas.resourceMapping[resourceKey];
    }
    
    // 2. Try matching in iconPositions
    if (!position && iconAtlas.iconPositions) {
        // If the resource has "256" suffix, try without it
        const normalizedKey = resourceKey.replace(/256$/, '');
        
        // First check for exact match
        if (iconAtlas.iconPositions[resourceKey]) {
            position = iconAtlas.iconPositions[resourceKey];
        }
        // Then try a normalized match
        else if (iconAtlas.iconPositions[normalizedKey]) {
            position = iconAtlas.iconPositions[normalizedKey];
        }
        // Then try a partial match
        else {
            for (const key in iconAtlas.iconPositions) {
                const cleanKey = key.toLowerCase().replace(/256$/, '');
                if (cleanKey.includes(normalizedKey) || normalizedKey.includes(cleanKey)) {
                    position = iconAtlas.iconPositions[key];
                    break;
                }
            }
        }
    }
    
    // Fallback to known resource type aliases
    if (!position) {
        // Common aliases map
        const aliases = {
            'limestone': 'stone',
            'iron': 'icondesc_iron_new',
            'copper': 'icondesc_copper_new',
            'caterium': 'icondesc_cateriumore',
            'coal': 'icondesc_coalore',
            'oil': 'liquidoil_pipe',
            'geyser': 'icondesc_hotsprings',
            'sulfur': 'sulfur',
            'bauxite': 'icondesc_bauxite',
            'quartz': 'icondesc_quartzcrystal',
            'uranium': 'icondesc_uraniumore',
            'beryl nut': 'nut',
            'berylnut': 'nut',
            'paleberry': 'icondesc_berry',
            'bacon agaric': 'mushroom',
            'blue power slug': 'powersluggreen',
            'green power slug': 'powersluggreen',
            'yellow power slug': 'powerslugyellow',
            'purple power slug': 'powerslugpurple'
        };
        
        // Try to find a match using aliases
        if (aliases[resourceKey]) {
            const aliasKey = aliases[resourceKey];
            
            // Try both direct icon positions and resource mapping
            if (iconAtlas.iconPositions && iconAtlas.iconPositions[aliasKey]) {
                position = iconAtlas.iconPositions[aliasKey];
            }
            else if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[aliasKey]) {
                position = iconAtlas.resourceMapping[aliasKey];
            }
            // Try with common suffixes
            else {
                const aliasWithSuffix = aliasKey + '256';
                if (iconAtlas.iconPositions && iconAtlas.iconPositions[aliasWithSuffix]) {
                    position = iconAtlas.iconPositions[aliasWithSuffix];
                }
                else if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[aliasWithSuffix]) {
                    position = iconAtlas.resourceMapping[aliasWithSuffix];
                }
            }
        }
    }
    
    if (!position) {
        appendDebugInfo(`No atlas position for: ${resourceKey}`, 'red');
        // Use a default position - choosing stone as a reasonable fallback
        position = iconAtlas.resourceMapping['stone'] || { x: 0, y: 0 };
    }
    
    // Use the original size from the atlas (64px)
    const atlasIconSize = iconAtlas.iconSize;
    // Fixed display size
    const displaySize = DEFAULT_DISPLAY_SIZE;
    
    // Create an HTML element that shows the correct sprite at the original atlas size
    // and use CSS transform to scale it down
    const html = `
        <div class="atlas-icon-container" style="
            width: ${atlasIconSize}px; 
            height: ${atlasIconSize}px; 
            background-image: url('${ATLAS_IMAGE_URL}');
            background-position: ${-position.x * atlasIconSize}px ${-position.y * atlasIconSize}px;
            background-size: ${iconAtlas.columns * atlasIconSize}px ${iconAtlas.rows * iconAtlas.iconSize}px;
        "></div>
    `;
    
    // Use a divIcon with the HTML content
    return L.divIcon({
        className: 'atlas-icon',
        html: html,
        iconSize: [displaySize, displaySize],
        iconAnchor: [displaySize/2, displaySize/2],
        popupAnchor: [0, -displaySize/2]
    });
}

/**
 * Create sidebar from resource data
 * @param {Object} data - Resource data
 */
function createSidebar(data) {
    const resourceList = document.getElementById('resources-tab');
    if (!resourceList) {
        console.error('Resources tab element not found');
        return;
    }
    
    // Clear existing content
    resourceList.innerHTML = '';
    
    // Create resource categories
    if (data && data.options) {
        data.options.forEach(category => {
            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.textContent = category.name || category.tabId || 'Unknown Category';
            resourceList.appendChild(categoryHeader);
            
            if (category.options) {
                category.options.forEach(subCategory => {
                    // Skip if no subcategory name
                    if (!subCategory || !subCategory.name) {
                        return;
                    }
                    
                    // Create subcategory section
                    const subCategorySection = document.createElement('div');
                    subCategorySection.className = 'subcategory';
                    
                    // Add subcategory title
                    const subCategoryTitle = document.createElement('h3');
                    subCategoryTitle.textContent = subCategory.name;
                    subCategoryTitle.className = 'subcategory-title';
                    subCategorySection.appendChild(subCategoryTitle);
                    
                    if (subCategory.options && Array.isArray(subCategory.options)) {
                        subCategory.options.forEach(resourceType => {
                            // Skip null or undefined resource types
                            if (!resourceType) {
                                return;
                            }
                            
                            // Skip if no name is provided
                            if (!resourceType.name) {
                                return;
                            }
                            
                            const resourceId = resourceType.layerId || resourceType.name.toLowerCase().replace(/\s+/g, '_');
                            
                            // Create resource item
                            const resourceItem = document.createElement('div');
                            resourceItem.className = 'resource-item';
                            
                            // Create resource toggle
                            const resourceToggle = document.createElement('label');
                            resourceToggle.className = 'resource-toggle-label';
                            
                            // Create checkbox
                            const checkbox = document.createElement('input');
                            checkbox.type = 'checkbox';
                            checkbox.className = 'resource-toggle';
                            checkbox.dataset.resourceId = resourceId;
                            checkbox.checked = true;
                            
                            // Add event listener to toggle resource visibility
                            checkbox.addEventListener('change', () => {
                                toggleResourceVisibility(resourceId, checkbox.checked);
                            });
                            
                            // Create resource icon element using atlas
                            // We'll create a scaled-down version of the atlas icon for the sidebar
                            const resourceKey = resourceType.name.toLowerCase();
                            let position = null;
                            
                            // Try to find position using our improved lookup
                            try {
                                // First try direct mapping
                                if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[resourceKey]) {
                                    position = iconAtlas.resourceMapping[resourceKey];
                                }
                                // Then try known aliases
                                else {
                                    // Common aliases
                                    const aliases = {
                                        'resource deposits': 'stone',
                                        'dropped items': 'harddrive',
                                        'limestone': 'stone',
                                        'iron': 'icondesc_iron_new',
                                        'copper': 'icondesc_copper_new'
                                    };
                                    
                                    const aliasKey = aliases[resourceKey];
                                    if (aliasKey && iconAtlas.resourceMapping && iconAtlas.resourceMapping[aliasKey]) {
                                        position = iconAtlas.resourceMapping[aliasKey];
                                    }
                                }
                                
                                // If still not found, try partial matches
                                if (!position) {
                                    for (const key in iconAtlas.resourceMapping) {
                                        if (key.includes(resourceKey) || resourceKey.includes(key)) {
                                            position = iconAtlas.resourceMapping[key];
                                            break;
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error(`Error finding icon for ${resourceType.name}:`, error);
                            }
                            
                            const iconContainer = document.createElement('div');
                            iconContainer.className = 'resource-icon';
                            iconContainer.style.width = '24px';
                            iconContainer.style.height = '24px';
                            iconContainer.style.position = 'relative';
                            iconContainer.style.overflow = 'hidden';
                            
                            if (position) {
                                // Create the inner icon container
                                const innerIcon = document.createElement('div');
                                innerIcon.style.width = `${iconAtlas.iconSize}px`;
                                innerIcon.style.height = `${iconAtlas.iconSize}px`;
                                innerIcon.style.transform = 'scale(0.375)';
                                innerIcon.style.transformOrigin = 'top left';
                                innerIcon.style.backgroundImage = `url('${ATLAS_IMAGE_URL}')`;
                                innerIcon.style.backgroundPosition = `${-position.x * iconAtlas.iconSize}px ${-position.y * iconAtlas.iconSize}px`;
                                innerIcon.style.backgroundSize = `${iconAtlas.columns * iconAtlas.iconSize}px ${iconAtlas.rows * iconAtlas.iconSize}px`;
                                innerIcon.style.backgroundRepeat = 'no-repeat';
                                
                                iconContainer.appendChild(innerIcon);
                            } else {
                                // Use a default icon (stone) if no icon found
                                const defaultPosition = iconAtlas.resourceMapping['stone'] || { x: 0, y: 0 };
                                
                                const innerIcon = document.createElement('div');
                                innerIcon.style.width = `${iconAtlas.iconSize}px`;
                                innerIcon.style.height = `${iconAtlas.iconSize}px`;
                                innerIcon.style.transform = 'scale(0.375)';
                                innerIcon.style.transformOrigin = 'top left';
                                innerIcon.style.backgroundImage = `url('${ATLAS_IMAGE_URL}')`;
                                innerIcon.style.backgroundPosition = `${-defaultPosition.x * iconAtlas.iconSize}px ${-defaultPosition.y * iconAtlas.iconSize}px`;
                                innerIcon.style.backgroundSize = `${iconAtlas.columns * iconAtlas.iconSize}px ${iconAtlas.rows * iconAtlas.iconSize}px`;
                                innerIcon.style.backgroundRepeat = 'no-repeat';
                                
                                iconContainer.appendChild(innerIcon);
                            }
                            
                            // Create resource name
                            const resourceName = document.createElement('span');
                            resourceName.textContent = resourceType.name;
                            
                            // Add marker count if available
                            if (resourceType.markers && resourceType.markers.length) {
                                resourceName.textContent += ` (${resourceType.markers.length})`;
                            }
                            
                            // Assemble resource item
                            resourceToggle.appendChild(checkbox);
                            resourceToggle.appendChild(iconContainer);
                            resourceToggle.appendChild(resourceName);
                            resourceItem.appendChild(resourceToggle);
                            subCategorySection.appendChild(resourceItem);
                        });
                    }
                    
                    resourceList.appendChild(subCategorySection);
                });
            }
        });
    }
    
    // Add resource filter
    addResourceFilter();
}

/**
 * Add resource filter functionality
 */
function addResourceFilter() {
    const filterInput = document.getElementById('search-input');
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            const filterText = filterInput.value.toLowerCase();
            
            // Filter resource items
            document.querySelectorAll('.resource-item').forEach(item => {
                const name = item.querySelector('span').textContent.toLowerCase();
                if (name.includes(filterText)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    } else {
        console.error('Resource filter input not found');
    }
}

/**
 * Process resources and place markers on map
 * @param {Object} data - Resource data
 */
function processResources(data) {
    if (!data || !data.options) {
        console.error('Invalid resource data structure');
        return;
    }
    
    // Clear existing marker clusters
    clearMarkerClusters();
    
    // Track the total number of markers added
    let totalMarkersAdded = 0;
    
    try {
        // Process each resource category
        data.options.forEach(category => {
            if (!category.options) return;
            
            category.options.forEach(subCategory => {
                if (!subCategory.options) return;
                
                subCategory.options.forEach(resourceType => {
                    // Skip if resource type is invalid
                    if (!resourceType || !resourceType.name) {
                        return;
                    }
                    
                    if (!resourceType.markers || !Array.isArray(resourceType.markers) || resourceType.markers.length === 0) {
                        return;
                    }
                    
                    // IMPORTANT: Use the layerId directly if it exists
                    const resourceId = resourceType.layerId || resourceType.name.toLowerCase().replace(/\s+/g, '_');
                    
                    // Create a new marker cluster group for this resource type
                    markerClusters[resourceId] = L.layerGroup();
                    
                    // Process each resource node
                    let nodesAdded = 0;
                    let errorCount = 0;
                    
                    resourceType.markers.forEach(node => {
                        // Skip markers after we've had too many errors
                        if (errorCount > 10) {
                            if (errorCount === 11) {
                                console.error(`Too many errors for ${resourceType.name}, skipping remaining nodes`);
                                errorCount++; // Only log this once
                            }
                            return;
                        }
                        
                        if (!node || node.x === undefined || node.y === undefined) {
                            errorCount++;
                            return;
                        }
                        
                        try {
                            // Convert game coordinates to Leaflet coordinates
                            // Just invert Y coordinate for Leaflet's coordinate system
                            const leafletY = -node.y;
                            const leafletX = node.x;
                            
                            // Use node.type if available, otherwise fall back to resourceType.name
                            // Fallback to resource type name if node type is missing
                            const iconType = (node.type && typeof node.type === 'string') 
                                ? node.type 
                                : resourceType.name;
                            
                            // Create icon using the atlas - with extra error handling
                            let icon;
                            try {
                                icon = createAtlasIcon(iconType);
                            } catch (iconErr) {
                                // If creating atlas icon fails, use a simple default icon
                                icon = L.divIcon({
                                    className: 'default-icon',
                                    html: '<div style="width:24px;height:24px;background:#ff0000;border-radius:50%;"></div>',
                                    iconSize: [24, 24],
                                    iconAnchor: [12, 12]
                                });
                                errorCount++;
                            }
                            
                            // Create marker
                            const marker = L.marker([leafletY, leafletX], { icon: icon });
                            
                            // Prepare popup content
                            let popupContent = `
                                <strong>${resourceType.name}</strong><br>
                                Purity: ${formatPurity(node.purity)}<br>
                                Coordinates: ${Math.round(node.x)}, ${Math.round(node.y)}
                            `;
                            
                            // Add additional node info if available
                            if (node.pathName) {
                                popupContent += `<br>ID: ${node.pathName.split('.').pop()}`;
                            }
                            
                            // Add popup
                            marker.bindPopup(popupContent);
                            
                            // Add to marker cluster
                            marker.addTo(markerClusters[resourceId]);
                            
                            nodesAdded++;
                            totalMarkersAdded++;
                        } catch (error) {
                            errorCount++;
                        }
                    });
                    
                    // Add marker cluster to map if nodes were added
                    if (nodesAdded > 0) {
                        markerClusters[resourceId].addTo(map);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error processing resources:', error);
    }
    
    // If we didn't add any markers, show an error message
    if (totalMarkersAdded === 0) {
        console.error('Failed to add any markers to the map. Check console for errors.');
        document.body.insertAdjacentHTML('beforeend', `
            <div style="position:fixed; bottom:20px; left:20px; background:rgba(255,0,0,0.8); color:white; padding:10px; z-index:1000; border-radius:5px;">
                Failed to add any markers to the map. Check console for errors.
            </div>
        `);
    }
}

/**
 * Format purity for display
 * @param {string} purity - Purity value from resource data
 * @returns {string} - Formatted purity
 */
function formatPurity(purity) {
    if (!purity) return 'Unknown';
    
    // Capitalize first letter
    return purity.charAt(0).toUpperCase() + purity.slice(1);
}

/**
 * Toggle visibility of resource markers
 * @param {string} resourceId - ID of the resource
 * @param {boolean} visible - Whether the resource should be visible
 */
function toggleResourceVisibility(resourceId, visible) {
    const clusterGroup = markerClusters[resourceId];
    if (!clusterGroup) {
        return;
    }
    
    // Instead of removing/adding the entire layer group (which is expensive),
    // we'll set the opacity of all markers to 0 when hiding
    if (visible) {
        // Make sure the layer is added to the map if it's not already
        if (!map.hasLayer(clusterGroup)) {
            map.addLayer(clusterGroup);
        }
        
        // Set all markers to be visible
        clusterGroup.eachLayer(marker => {
            marker.setOpacity(1);
            marker.getElement().style.display = '';
        });
    } else {
        // Keep the layer on the map, but hide all markers
        clusterGroup.eachLayer(marker => {
            marker.setOpacity(0);
            marker.getElement().style.display = 'none';
        });
    }
}

/**
 * Clear all marker clusters from the map
 */
function clearMarkerClusters() {
    // Remove all existing marker clusters
    Object.values(markerClusters).forEach(cluster => {
        if (map.hasLayer(cluster)) {
            map.removeLayer(cluster);
        }
    });
    
    // Reset clusters object
    markerClusters = {};
}

/**
 * Preload the atlas image to ensure icons appear immediately
 * @returns {Promise} - Resolves when the image is loaded
 */
function preloadAtlasImage() {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Image is now cached in the browser
            resolve();
        };
        img.onerror = () => {
            // Continue even if there's an error, we'll use fallbacks
            console.error('Error preloading atlas image');
            resolve();
        };
        img.src = ATLAS_IMAGE_URL;
    });
}
