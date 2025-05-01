import L from 'leaflet';
import { createIcon } from '../utils/icons.js';
import { resourceGroups } from '../data/resources.js';

// Store a cache of created markers to avoid recreating them
const markerCache = new Map();
// Track which markers are currently visible
const visibleMarkers = new Set();
// Throttle variable to limit update frequency
let updateThrottled = false;
// Store the map instance
let mapInstance = null;

// Global map reference
let map;

// Layer groups to manage visibility
export const layerGroups = {};

// Store all resource points data
let allResourceData = {};

/**
 * Sets the map reference for use in this module
 * @param {L.Map} mapInstance - The Leaflet map instance
 */
export function setMap(mapInstance) {
    map = mapInstance;
    
    // Add event listeners for view changes
    if (map) {
        map.on('moveend', updateVisibleMarkers);
        map.on('zoomend', updateVisibleMarkers);
    }
}

/**
 * Load resources from the server
 * @returns {Promise<Object>} - Promise that resolves to the resource data
 */
export async function loadResources() {
    try {
        const response = await fetch('/public/data/resources.json');
        if (!response.ok) {
            throw new Error(`Failed to load resources: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading resources:', error);
        return null;
    }
}

/**
 * Process resource data and create markers for the map
 * @param {Object} data - Resource data from the JSON file
 * @param {L.Map} map - The Leaflet map instance (optional)
 */
export function processResources(data, map) {
    // Set map instance if provided
    if (map) {
        mapInstance = map;
    }
    
    if (!mapInstance) {
        console.error('Map instance not set. Please provide a map instance.');
        return;
    }
    
    console.log('Processing resources:', data);
    
    // Process resource data
    if (data && data.options) {
        data.options.forEach(tab => {
            if (tab && tab.options) {
                tab.options.forEach(category => {
                    if (category && category.options) {
                        category.options.forEach(resourceType => {
                            // Create markers for each resource type
                            createMarkers(resourceType);
                        });
                    }
                });
            }
        });
    } else {
        console.error('Invalid resource data structure:', data);
    }
    
    // Initial update of visible markers
    updateVisibleMarkers();
    
    // Add event listeners for pan and zoom to update visible markers
    mapInstance.on('moveend', throttledUpdate);
    mapInstance.on('zoomend', throttledUpdate);
    
    return data;
}

/**
 * Throttle updates to avoid performance issues with frequent map movements
 */
function throttledUpdate() {
    if (updateThrottled) return;
    
    updateThrottled = true;
    setTimeout(() => {
        updateVisibleMarkers();
        updateThrottled = false;
    }, 100); // 100ms throttle
}

/**
 * Creates markers for a resource type
 * @param {Object} resourceType - Resource type data
 */
function createMarkers(resourceType) {
    // Get resource data
    const resources = resourceType.resources || [];
    
    if (!resources.length) {
        console.log(`No resources found for ${resourceType.name}`);
        return;
    }
    
    console.log(`Creating ${resources.length} markers for ${resourceType.name}`);
    
    // Store markers for this resource type
    const markers = [];
    
    // Create a marker for each resource
    resources.forEach(resource => {
        // Create a unique ID for this marker
        const markerId = `${resourceType.id || 'unknown'}_${resource.x}_${resource.y}`;
        
        // Store marker data for later use (don't create Leaflet markers yet)
        markers.push({
            id: markerId,
            resource: resource,
            resourceType: resourceType,
            coords: { x: resource.x, y: resource.y },
            visible: false
        });
        
        // Add to marker cache
        markerCache.set(markerId, markers[markers.length - 1]);
    });
    
    // Store markers for this resource type
    resourceType.markers = markers;
}

/**
 * Updates which markers are visible based on current viewport
 */
function updateVisibleMarkers() {
    if (!mapInstance) {
        console.error('Map instance not set for updateVisibleMarkers');
        return;
    }
    
    console.log('Updating visible markers...');
    
    // Get current map bounds
    const bounds = mapInstance.getBounds();
    
    // Clear previous markers from map
    visibleMarkers.forEach(markerId => {
        const marker = markerCache.get(markerId);
        if (marker && marker.leafletMarker) {
            marker.leafletMarker.remove();
            marker.visible = false;
        }
    });
    
    // Clear the visible markers set
    visibleMarkers.clear();
    
    // Get current zoom level for level-of-detail control
    const zoom = mapInstance.getZoom();
    console.log('Current zoom level:', zoom);
    
    // Directly use all cached markers to display resources
    // This ensures resources show up even without UI initialization
    console.log(`Total markers in cache: ${markerCache.size}`);
    
    // If cache is empty, initialize it from direct resource data
    if (markerCache.size === 0) {
        initializeMarkerCache();
    }
    
    // Process all marker types
    const markersToAdd = [];
    
    // Use all markers in the cache
    markerCache.forEach((marker, markerId) => {
        if (!marker || !marker.resource) return;
        
        // Get coordinates
        const gameX = marker.resource.x;
        const gameY = marker.resource.y;
        
        // Get map configuration with scale factor
        const config = window.mapConfig || {
            mapSize: 500000,
            scaleFactor: 0.2
        };
        
        // Apply scaling and invert Y for Leaflet's coordinate system
        const leafletX = gameX * config.scaleFactor;
        const leafletY = -gameY * config.scaleFactor;
        
        // Create LatLng object for Leaflet
        const latlng = L.latLng(leafletY, leafletX);
        
        // Skip if not in view (viewport filtering)
        if (!bounds.contains(latlng)) return;
        
        markersToAdd.push({
            id: markerId,
            latlng: latlng,
            resourceType: marker.resourceType,
            resource: marker.resource,
            marker: marker
        });
        
        visibleMarkers.add(markerId);
    });
    
    console.log(`Adding ${markersToAdd.length} markers to the map`);
    
    // Batch addition of markers to minimize DOM operations
    markersToAdd.forEach(item => {
        try {
            // Create or reuse leaflet marker
            if (!item.marker.leafletMarker) {
                // Create the marker icon based on resource type
                const iconPath = item.resourceType?.iconPath || '/public/assets/icons/unknown.png';
                
                // Use simpler icons for performance when zoomed out
                const size = zoom >= -5 ? 24 : 16;
                
                // Create icon
                const icon = L.icon({
                    iconUrl: iconPath,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                    popupAnchor: [0, -size / 2]
                });
                
                // Create a marker with the icon
                const leafletMarker = L.marker(item.latlng, { icon: icon })
                    .addTo(mapInstance);
                    
                // Add popup if we have resource data
                if (item.resourceType && item.resource) {
                    leafletMarker.bindPopup(createPopupContent(item.resourceType, item.resource));
                }
                
                // Store leaflet marker reference
                item.marker.leafletMarker = leafletMarker;
            } else {
                // Reuse existing marker
                item.marker.leafletMarker.setLatLng(item.latlng).addTo(mapInstance);
            }
            
            // Mark as visible
            item.marker.visible = true;
        } catch (error) {
            console.error('Error creating marker:', error, item);
        }
    });
}

/**
 * Initialize marker cache directly from resource data
 * This is used as a fallback when UI elements aren't available
 */
function initializeMarkerCache() {
    console.log('Initializing marker cache from resource data...');
    
    // Use global resources from marker processor
    fetch('/public/data/resources.json')
        .then(response => response.json())
        .then(data => {
            if (!data || !data.options) {
                console.error('Invalid resource data for cache initialization');
                return;
            }
            
            let totalMarkers = 0;
            
            // Process all resource categories
            data.options.forEach(category => {
                if (!category.options) return;
                
                category.options.forEach(subCategory => {
                    if (!subCategory.options) return;
                    
                    subCategory.options.forEach(resourceType => {
                        if (!resourceType.resources) return;
                        
                        // Process each resource
                        resourceType.resources.forEach(resource => {
                            // Create unique ID
                            const markerId = `${resourceType.id || 'unknown'}_${resource.x}_${resource.y}`;
                            
                            // Add to cache
                            markerCache.set(markerId, {
                                id: markerId,
                                resource: resource,
                                resourceType: resourceType,
                                visible: false
                            });
                            
                            totalMarkers++;
                        });
                    });
                });
            });
            
            console.log(`Initialized cache with ${totalMarkers} markers`);
            
            // Refresh markers on the map
            updateVisibleMarkers();
        })
        .catch(error => {
            console.error('Error initializing marker cache:', error);
        });
}

/**
 * Creates an icon for a resource marker
 * @param {Object} resourceType - Resource type data
 * @param {Object} resource - Resource data
 * @returns {L.Icon} - Leaflet icon
 */
function createMarkerIcon(resourceType, resource) {
    // Get icon path
    const iconPath = resourceType.iconPath || '';
    
    // Use simpler icons for performance when zoomed out
    const zoom = mapInstance ? mapInstance.getZoom() : -6;
    const size = zoom >= -5 ? 24 : 16;
    
    // Create icon
    return L.icon({
        iconUrl: iconPath,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
}

/**
 * Creates popup content for a resource marker
 * @param {Object} resourceType - Resource type data
 * @param {Object} resource - Resource data
 * @returns {String} - HTML content for popup
 */
function createPopupContent(resourceType, resource) {
    // Create popup content
    let content = `<div class="popup-content">`;
    content += `<h3>${resourceType.name}</h3>`;
    
    // Add purity if available
    if (resource.purity) {
        content += `<p>Purity: ${getPurityLabel(resource.purity)}</p>`;
    }
    
    // Add coordinates
    content += `<p>Coordinates: X: ${resource.x}, Y: ${resource.y}</p>`;
    content += `</div>`;
    
    return content;
}

/**
 * Gets a label for a purity level
 * @param {Number} purity - Purity level
 * @returns {String} - Purity label
 */
function getPurityLabel(purity) {
    switch (purity) {
        case 1: return 'Impure';
        case 2: return 'Normal';
        case 3: return 'Pure';
        default: return 'Unknown';
    }
}

/**
 * Finds a resource type by ID
 * @param {String} id - Resource type ID
 * @returns {Object|null} - Resource type or null if not found
 */
function findResourceTypeById(id) {
    // This is a simple implementation
    // A more efficient approach would be to maintain a lookup table
    let found = null;
    
    document.querySelectorAll('.resource-tab').forEach(tab => {
        const resourceTypes = tab.querySelectorAll('.resource-type');
        resourceTypes.forEach(type => {
            if (type.dataset.id === id) {
                found = JSON.parse(type.dataset.resource || '{}');
            }
        });
    });
    
    return found;
}

/**
 * Toggle resource visibility
 * @param {string} resourceName - Name of the resource to toggle
 * @param {boolean} visible - Whether the resource should be visible
 */
export function toggleResource(resourceName, visible) {
    if (layerGroups[resourceName]) {
        if (visible) {
            map.addLayer(layerGroups[resourceName]);
        } else {
            map.removeLayer(layerGroups[resourceName]);
        }
        updateVisibleMarkers();
    }
}

/**
 * Categorize resources into types
 * @param {Object} data - The resource data to categorize
 * @returns {Object} - Resources grouped by category
 */
export function categorizeResources(data) {
    if (!data || !data.options) return {};
    
    // Define category order for better organization
    const categoryOrder = [
        "ORE", 
        "LIQUID", 
        "GEYSER", 
        "POWER_SLUG", 
        "ALIEN",
        "SPECIAL", 
        "FLORA", 
        "MISC"
    ];
    
    // Initialize ordered categories
    const categories = {};
    categoryOrder.forEach(cat => {
        categories[cat] = [];
    });
    
    // Process all resource options and group them
    data.options.forEach(tab => {
        if (!tab || !tab.options) return;
        
        tab.options.forEach(category => {
            if (!category || !category.options) return;
            
            category.options.forEach(resourceType => {
                if (!resourceType || !resourceType.name) return;
                
                const resourceName = resourceType.name;
                const resourceParts = resourceName.split(' ');
                const resourceTypeKey = resourceParts[0].toUpperCase();
                
                // Get category from resource groups or default to MISC
                const resourceInfo = resourceGroups[resourceTypeKey] || {};
                const categoryName = resourceInfo.category || 'MISC';
                
                // Add to category if it exists, otherwise add to MISC
                if (categories[categoryName]) {
                    categories[categoryName].push(resourceType);
                } else {
                    categories['MISC'].push(resourceType);
                }
            });
        });
    });
    
    // Sort resources alphabetically within each category
    for (const category in categories) {
        categories[category].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    }
    
    // Filter out empty categories
    const filteredCategories = {};
    for (const category in categories) {
        if (categories[category].length > 0) {
            filteredCategories[category] = categories[category];
        }
    }
    
    return filteredCategories;
}
