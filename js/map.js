// Initialize the map
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -8,
    maxZoom: 2,
    zoomControl: true,
    attributionControl: false
});

// Define bounds for the game map
const mapSize = 500000;
const bounds = [
    [-mapSize, -mapSize],
    [mapSize, mapSize]
];

// Add the map image
const mapImage = L.imageOverlay('/assets/Map.webp', bounds).addTo(map);

// Set initial view
map.fitBounds(bounds);
map.setView([0, 0], -4);

// Initialize global variables
const layerGroups = {};
const iconCache = new Map();
let allResources = [];
let allNodesVisible = true;

// Resource groups with colors
const resourceGroups = {
    "IRON": { insideColor: "#7f5d46", outsideColor: "#583b25", category: "ORE" },
    "COPPER": { insideColor: "#d57800", outsideColor: "#a35c00", category: "ORE" },
    "LIMESTONE": { insideColor: "#d5d5d5", outsideColor: "#a3a3a3", category: "ORE" },
    "COAL": { insideColor: "#2d2d2d", outsideColor: "#1a1a1a", category: "ORE" },
    "OIL": { insideColor: "#0f0f0f", outsideColor: "#0a0a0a", category: "LIQUID" },
    "CRUDE": { insideColor: "#0f0f0f", outsideColor: "#0a0a0a", category: "LIQUID" },
    "CATERIUM": { insideColor: "#fcd014", outsideColor: "#c9a610", category: "ORE" },
    "SULFUR": { insideColor: "#ffe100", outsideColor: "#ccb400", category: "ORE" },
    "QUARTZ": { insideColor: "#ffffff", outsideColor: "#cccccc", category: "ORE" },
    "URANIUM": { insideColor: "#2cff00", outsideColor: "#23cc00", category: "ORE" },
    "BAUXITE": { insideColor: "#c27f46", outsideColor: "#9b6638", category: "ORE" },
    "SAM": { insideColor: "#ff00d4", outsideColor: "#cc00aa", category: "ORE" },
    "WATER": { insideColor: "#5ab9ff", outsideColor: "#4894cc", category: "LIQUID" },
    "GEYSER": { insideColor: "#ff9e44", outsideColor: "#d87500", category: "GEYSER" },
    "GAS": { insideColor: "#9eecff", outsideColor: "#4fcdf0", category: "SPECIAL" },
    "SLUG": { insideColor: "#00ffff", outsideColor: "#00cccc", category: "POWER_SLUG" },
    "POWER": { insideColor: "#00ffff", outsideColor: "#00cccc", category: "POWER_SLUG" },
    "ARTIFACT": { insideColor: "#ff9e44", outsideColor: "#d87500", category: "ARTIFACT" },
    "SPORE": { insideColor: "#a569bd", outsideColor: "#8e44ad", category: "SPECIAL" },
    "FLOWER": { insideColor: "#a569bd", outsideColor: "#8e44ad", category: "FLORA" },
    "PLANT": { insideColor: "#a569bd", outsideColor: "#8e44ad", category: "FLORA" }
};

// Purity levels
const purityLevels = {
    "IMPURE": { color: "#ff6b6b", multiplier: 0.5 },
    "NORMAL": { color: "#ffb56b", multiplier: 1 },
    "PURE": { color: "#6bff6b", multiplier: 2 }
};

// Create icon for resource
function createIcon(resourceName, purity) {
    const cacheKey = `${resourceName}_${purity}`;
    
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey);
    }
    
    // Get resource info or use defaults
    const resourceTypeKey = resourceName.split(' ')[0].toUpperCase();
    const resourceInfo = resourceGroups[resourceTypeKey] || { insideColor: "#CCCCCC", outsideColor: "#888888" };
    
    // Create circle icon
    const size = 16;
    const borderSize = 2;
    
    // Modify color based on purity
    let purityStyle = '';
    if (purity === 'IMPURE') {
        purityStyle = 'filter: brightness(0.7);';
    } else if (purity === 'PURE') {
        purityStyle = 'filter: brightness(1.3);';
    }
    
    const icon = L.divIcon({
        className: 'resource-marker',
        html: `<div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: ${borderSize}px solid ${resourceInfo.outsideColor};
            background-color: ${resourceInfo.insideColor};
            ${purityStyle}
        "></div>`,
        iconSize: [size + borderSize*2, size + borderSize*2],
        iconAnchor: [(size + borderSize*2)/2, (size + borderSize*2)/2]
    });
    
    iconCache.set(cacheKey, icon);
    return icon;
}

// Load resources
async function loadResources() {
    try {
        const response = await fetch('/data/resources.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allResources = data;
        
        // Process resources and create sidebar
        processResources(data);
        createSidebar(data);
        
        return data;
    } catch (error) {
        console.error('Error loading resources:', error);
        document.getElementById('loading-error').textContent = `Failed to load resources: ${error.message}`;
        document.getElementById('loading-error').style.display = 'block';
    }
}

// Process resources and create markers
function processResources(data) {
    if (!data || !data.options) return;
    
    // Create separate layer groups for each crude oil purity
    const crudeOilLayers = {
        'Crude Oil (Impure)': L.layerGroup(),
        'Crude Oil (Normal)': L.layerGroup(),
        'Crude Oil (Pure)': L.layerGroup()
    };
    
    data.options.forEach(tab => {
        if (!tab || !tab.options) return;
        
        tab.options.forEach(category => {
            if (!category || !category.options) return;
            
            category.options.forEach(resourceType => {
                if (!resourceType || !resourceType.name) return;
                
                const resourceName = resourceType.name;
                
                // Create a layer group for this resource
                const group = L.layerGroup();
                
                // Check if this is crude oil
                const isCrudeOil = resourceName.toUpperCase().includes('CRUDE OIL');
                
                // Process markers if any
                if (resourceType.markers && Array.isArray(resourceType.markers)) {
                    resourceType.markers.forEach(marker => {
                        if (!marker || marker.x === undefined || marker.y === undefined) return;
                        
                        // Get resource type for coloring
                        const resourceTypeKey = resourceName.split(' ')[0].toUpperCase();
                        const resourceInfo = resourceGroups[resourceTypeKey] || 
                            { insideColor: "#CCCCCC", outsideColor: "#888888" };
                        
                        // Create icon
                        const size = 16;
                        const borderSize = 2;
                        
                        let purityStyle = '';
                        const purity = marker.purity || 'NORMAL';
                        if (purity === 'IMPURE') {
                            purityStyle = 'filter: brightness(0.7);';
                        } else if (purity === 'PURE') {
                            purityStyle = 'filter: brightness(1.3);';
                        }
                        
                        const icon = L.divIcon({
                            className: 'resource-marker',
                            html: `<div style="
                                width: ${size}px;
                                height: ${size}px;
                                border-radius: 50%;
                                border: ${borderSize}px solid ${resourceInfo.outsideColor};
                                background-color: ${resourceInfo.insideColor};
                                ${purityStyle}
                            "></div>`,
                            iconSize: [size + borderSize*2, size + borderSize*2],
                            iconAnchor: [(size + borderSize*2)/2, (size + borderSize*2)/2]
                        });
                        
                        // Create marker
                        const resourceMarker = L.marker([marker.y, marker.x], {
                            icon: icon,
                            title: resourceName
                        });
                        
                        // Add popup
                        resourceMarker.bindPopup(`
                            <h3>${resourceName}</h3>
                            <p>Coordinates: ${Math.round(marker.x)}, ${Math.round(marker.y)}</p>
                            <p>Purity: ${purity}</p>
                        `);
                        
                        // Add to group (but not for crude oil - those go in separate groups)
                        if (!isCrudeOil) {
                            group.addLayer(resourceMarker);
                        }
                        
                        // Add to appropriate crude oil group if applicable
                        if (isCrudeOil) {
                            const purityKey = `Crude Oil (${purity.charAt(0).toUpperCase() + purity.slice(1).toLowerCase()})`;
                            if (crudeOilLayers[purityKey]) {
                                crudeOilLayers[purityKey].addLayer(resourceMarker);
                            }
                        }
                    });
                }
                
                // Store group and add to map (but don't store for crude oil)
                if (!isCrudeOil) {
                    layerGroups[resourceName] = group;
                    group.addTo(map);
                }
            });
        });
    });
    
    // Store and add the crude oil layer groups separately
    for (const [purityKey, layerGroup] of Object.entries(crudeOilLayers)) {
        if (layerGroup.getLayers().length > 0) {
            layerGroups[purityKey] = layerGroup;
            layerGroup.addTo(map); // Add to map initially

            // Check URL parameters for initial visibility
            const params = new URLSearchParams(window.location.search);
            const paramKey = `r_${purityKey.replace(/\s+/g, '_')}`;
            if (params.has(paramKey) && params.get(paramKey) === '0') {
                layerGroup.remove();
            }
        }
    }
}

// Organize resources into categories
function categorizeResources(data) {
    const categories = {};
    
    if (!data || !data.options) return categories;
    
    data.options.forEach(tab => {
        if (!tab || !tab.options) return;
        
        tab.options.forEach(category => {
            if (!category || !category.name) return;
            
            const categoryName = category.name;
            
            // Initialize category
            if (!categories[categoryName]) {
                categories[categoryName] = [];
            }
            
            // Add resources to category
            if (category.options && Array.isArray(category.options)) {
                category.options.forEach(resourceType => {
                    if (!resourceType) return;
                    categories[categoryName].push(resourceType);
                });
            }
        });
    });
    
    return categories;
}

// Create sidebar with resource toggles
function createSidebar(data) {
    const categories = categorizeResources(data);
    
    const resourcesTab = document.getElementById('resources-tab');
    const powerSlugsGroup = document.getElementById('power-slugs-group');
    const artifactsGroup = document.getElementById('artifacts-group');
    const specialGroup = document.getElementById('special-group');
    const floraGroup = document.getElementById('flora-group');
    
    // Clear existing content
    if (resourcesTab) resourcesTab.innerHTML = '';
    if (powerSlugsGroup) powerSlugsGroup.innerHTML = '';
    if (artifactsGroup) artifactsGroup.innerHTML = '';
    if (specialGroup) specialGroup.innerHTML = '';
    if (floraGroup) floraGroup.innerHTML = '';
    
    // Track added resources to prevent duplicates
    const addedResources = new Set();
    
    // Create sections for each category
    for (const categoryName in categories) {
        const resources = categories[categoryName];
        
        if (!resources || resources.length === 0) continue;
        
        // Create section
        const section = document.createElement('div');
        section.className = 'resource-section';
        
        const title = document.createElement('div');
        title.className = 'section-title';
        title.textContent = categoryName;
        section.appendChild(title);
        
        const group = document.createElement('div');
        group.className = 'resource-group';
        
        // Add resources
        resources.forEach(resourceType => {
            // Skip if this resource was already added
            const resourceName = resourceType.name;
            if (addedResources.has(resourceName)) return;
            
            const item = createResourceItem(resourceType);
            group.appendChild(item);
            
            // Mark as added to prevent duplicates
            addedResources.add(resourceName);
            
            // Add to special tabs if needed
            const upperName = resourceType.name.toUpperCase();
            
            // Add to Power Slugs tab
            if (powerSlugsGroup && (upperName.includes('SLUG') || upperName.includes('POWER'))) {
                powerSlugsGroup.appendChild(createResourceItem(resourceType));
            } 
            // Add to Artifacts group in Misc tab
            else if (artifactsGroup && (upperName.includes('ARTIFACT') || 
                                      upperName.includes('MERCER') || 
                                      upperName.includes('SOMERS'))) {
                artifactsGroup.appendChild(createResourceItem(resourceType));
            }
            // Add to Special Locations group in Misc tab
            else if (specialGroup && (upperName.includes('SPORE') || 
                                    upperName.includes('GAS') || 
                                    upperName.includes('PILLAR'))) {
                specialGroup.appendChild(createResourceItem(resourceType));
            }
            // Add to Flora group in Misc tab
            else if (floraGroup && (upperName.includes('FLOWER') || 
                                  upperName.includes('PLANT') || 
                                  upperName.includes('BERRY') || 
                                  upperName.includes('MUSHROOM') || 
                                  upperName.includes('NUT'))) {
                floraGroup.appendChild(createResourceItem(resourceType));
            }
        });
        
        if (group.children.length > 0) {
            section.appendChild(group);
            if (resourcesTab) resourcesTab.appendChild(section);
        }
    }
    
    // Add manual entries if certain items aren't in the data
    
    // Add Spore Flowers if not present
    if (specialGroup && !document.querySelector('.resource-item[data-resource*="Spore Flowers"]')) {
        const sporeItem = createManualResourceItem("Spore Flowers", "SPORE");
        specialGroup.appendChild(sporeItem);
    }
    
    // Add Gas Pillars if not present
    if (specialGroup && !document.querySelector('.resource-item[data-resource*="Gas Pillars"]')) {
        const gasItem = createManualResourceItem("Gas Pillars", "GAS");
        specialGroup.appendChild(gasItem);
    }
    
    // Setup UI components
    setupTabs();
    setupSearch();
    setupToggleSidebar();
    setupToggleAllNodes();
    setupShareFilters();
}

// Create a manual resource item when it's not in the data
function createManualResourceItem(displayName, resourceType) {
    const item = document.createElement('div');
    item.className = 'resource-item active';
    item.dataset.resource = displayName;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'resource-checkbox';
    checkbox.checked = true;
    checkbox.dataset.resource = displayName;
    
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const paramKey = `r_${displayName.replace(/\s+/g, '_')}`;
    if (params.has(paramKey) && params.get(paramKey) === '0') {
        checkbox.checked = false;
        item.classList.remove('active');
    }
    
    // Create resource icon
    const resourceInfo = resourceGroups[resourceType] || 
        { insideColor: "#CCCCCC", outsideColor: "#888888" };
    
    const icon = document.createElement('div');
    icon.className = 'resource-icon';
    icon.style.backgroundColor = resourceInfo.insideColor;
    icon.style.border = `2px solid ${resourceInfo.outsideColor}`;
    
    // Create label
    const label = document.createElement('span');
    label.textContent = displayName;
    
    // Add elements to item
    item.appendChild(checkbox);
    item.appendChild(icon);
    item.appendChild(label);
    
    // Add click event
    checkbox.addEventListener('change', function() {
        const resourceName = this.dataset.resource;
        const isChecked = this.checked;
        
        // Update UI
        const parentItem = this.closest('.resource-item');
        if (parentItem) {
            parentItem.classList.toggle('active', isChecked);
        }
        
        // Update visibility
        if (layerGroups[resourceName]) {
            if (isChecked) {
                layerGroups[resourceName].addTo(map);
            } else {
                layerGroups[resourceName].remove();
            }
        }
    });
    
    // Create an empty layer group for this resource if it doesn't exist
    if (!layerGroups[displayName]) {
        layerGroups[displayName] = L.layerGroup().addTo(map);
    }
    
    return item;
}

// Create individual resource item
function createResourceItem(resourceType) {
    if (!resourceType || !resourceType.name) return document.createElement('div');
    
    const resourceName = resourceType.name;
    const item = document.createElement('div');
    item.className = 'resource-item active';
    item.dataset.resource = resourceName;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'resource-checkbox';
    checkbox.checked = true;
    checkbox.dataset.resource = resourceName;
    
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const paramKey = `r_${resourceName.replace(/\s+/g, '_')}`;
    if (params.has(paramKey) && params.get(paramKey) === '0') {
        checkbox.checked = false;
        item.classList.remove('active');
    }
    
    // Create resource icon
    const resourceTypeKey = resourceName.split(' ')[0].toUpperCase();
    const resourceInfo = resourceGroups[resourceTypeKey] || 
        { insideColor: "#CCCCCC", outsideColor: "#888888" };
    
    const icon = document.createElement('div');
    icon.className = 'resource-icon';
    icon.style.backgroundColor = resourceInfo.insideColor;
    icon.style.border = `2px solid ${resourceInfo.outsideColor}`;
    
    // Create label
    const label = document.createElement('span');
    label.textContent = resourceName;
    
    // Add elements to item
    item.appendChild(checkbox);
    item.appendChild(icon);
    item.appendChild(label);
    
    // Add click event
    checkbox.addEventListener('change', function() {
        const resourceName = this.dataset.resource;
        const isChecked = this.checked;
        
        // Update UI
        const parentItem = this.closest('.resource-item');
        if (parentItem) {
            parentItem.classList.toggle('active', isChecked);
        }
        
        // Update visibility
        if (layerGroups[resourceName]) {
            if (isChecked) {
                layerGroups[resourceName].addTo(map);
            } else {
                layerGroups[resourceName].remove();
            }
        }
    });
    
    return item;
}

// Setup tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });
            
            // Add active class
            this.classList.add('active');
            
            // Show content
            const tabName = this.dataset.tab;
            const content = document.getElementById(`${tabName}-tab`);
            if (content) {
                content.classList.add('active');
                content.style.display = 'block';
            }
        });
    });
    
    // Activate first tab
    if (tabs.length > 0 && !document.querySelector('.tab.active')) {
        tabs[0].click();
    }
}

// Setup search
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        // Filter items
        document.querySelectorAll('.resource-item').forEach(item => {
            const resourceName = item.dataset.resource.toLowerCase();
            
            if (resourceName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// Setup sidebar toggle
function setupToggleSidebar() {
    const toggleButton = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (!toggleButton || !sidebar) return;
    
    toggleButton.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        this.classList.toggle('collapsed');
    });
}

// Setup all nodes toggle
function setupToggleAllNodes() {
    const button = document.getElementById('toggle-all-nodes');
    if (!button) return;
    
    button.addEventListener('click', function() {
        allNodesVisible = !allNodesVisible;
        this.textContent = allNodesVisible ? 'Hide All Nodes' : 'Show All Nodes';
        
        // Toggle ALL resource checkboxes including manually added ones
        document.querySelectorAll('.resource-checkbox').forEach(checkbox => {
            const resourceName = checkbox.dataset.resource;
            checkbox.checked = allNodesVisible;
            
            // Update UI
            const parentItem = checkbox.closest('.resource-item');
            if (parentItem) {
                parentItem.classList.toggle('active', allNodesVisible);
            }
            
            // Update visibility
            if (layerGroups[resourceName]) {
                if (allNodesVisible) {
                    layerGroups[resourceName].addTo(map);
                } else {
                    layerGroups[resourceName].remove();
                }
            }
        });
        
        // Handle "CRUDE" and "OIL" resources explicitly to make sure they're included
        for (const key in layerGroups) {
            if (key.toUpperCase().includes('CRUDE') || key.toUpperCase().includes('OIL') || 
                key.toUpperCase().includes('GAS') || key.toUpperCase().includes('SPORE')) {
                if (allNodesVisible) {
                    layerGroups[key].addTo(map);
                } else {
                    layerGroups[key].remove();
                }
            }
        }
    });
}

// Setup share filters
function setupShareFilters() {
    const button = document.getElementById('share-filters');
    if (!button) return;
    
    button.addEventListener('click', function() {
        // Get filters
        const filters = {};
        document.querySelectorAll('.resource-checkbox').forEach(checkbox => {
            const resourceName = checkbox.dataset.resource;
            filters[resourceName] = checkbox.checked;
        });
        
        // Create URL parameters
        const params = new URLSearchParams();
        
        // Only add inactive filters
        for (const resource in filters) {
            if (!filters[resource]) {
                params.append(`r_${resource.replace(/\s+/g, '_')}`, '0');
            }
        }
        
        // Update URL
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        
        // Copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            const originalText = button.textContent;
            button.textContent = 'URL Copied!';
            
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Could not copy URL:', err);
            alert('Failed to copy URL. Please copy it manually from the address bar.');
        });
    });
}

// Update coordinates display
function updateCoordinates(e) {
    const coords = e.latlng;
    const x = Math.round(coords.lng);
    const y = Math.round(coords.lat);
    
    document.getElementById('coordinates').textContent = `X: ${x}, Y: ${y}`;
}

// Set up events
map.on('mousemove', updateCoordinates);

// Add scale
L.control.scale({
    metric: true,
    imperial: false,
    position: 'bottomleft'
}).addTo(map);

// Load resources
loadResources();
