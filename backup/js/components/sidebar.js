import { resourceGroups } from '../data/resources.js';
import { layerGroups } from './resourceProcessor.js';

// Reference to the map
let map;

// Visibility state
let allNodesVisible = true;

/**
 * Sets the map reference for the sidebar module
 * @param {L.Map} mapInstance - Leaflet map instance 
 */
export function setMap(mapInstance) {
    map = mapInstance;
}

/**
 * Creates the sidebar with resource toggles
 * @param {Object} data - Resource data 
 * @param {Object} categories - Categorized resources
 */
export function createSidebar(data, categories) {
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
    
    // Category display names
    const categoryDisplayNames = {
        "ORE": "Ores",
        "LIQUID": "Liquids",
        "GEYSER": "Geysers",
        "POWER_SLUG": "Power Slugs",
        "ALIEN": "Alien Artifacts",
        "SPECIAL": "Special Locations",
        "FLORA": "Flora",
        "MISC": "Miscellaneous"
    };
    
    // Determine resource tab placement
    const tabMapping = {};
    
    // Create sections for each category but only display certain ones in the main resources tab
    for (const categoryName in categories) {
        const resources = categories[categoryName];
        
        if (!resources || resources.length === 0) continue;
        
        // Skip creating sections in the main tab for categories that belong in specialized tabs
        const belongsInSpecializedTab = (
            categoryName === 'POWER_SLUG' || 
            categoryName === 'ALIEN' || 
            categoryName === 'SPECIAL' || 
            categoryName === 'FLORA'
        );
        
        if (!belongsInSpecializedTab) {
            // Create section for the main Resources tab
            const section = document.createElement('div');
            section.className = 'resource-section';
            
            const title = document.createElement('div');
            title.className = 'section-title';
            title.textContent = categoryDisplayNames[categoryName] || categoryName;
            section.appendChild(title);
            
            const group = document.createElement('div');
            group.className = 'resource-group';
            
            // Add resources to main tab
            resources.forEach(resourceType => {
                // Skip if this resource was already added
                const resourceName = resourceType.name;
                if (addedResources.has(resourceName)) return;
                
                const item = createResourceItem(resourceType);
                group.appendChild(item);
                
                // Mark as added to prevent duplicates
                addedResources.add(resourceName);
                
                // Record which tab each resource belongs to
                tabMapping[resourceName] = 'resources';
            });
            
            if (group.children.length > 0) {
                section.appendChild(group);
                if (resourcesTab) resourcesTab.appendChild(section);
            }
        } else {
            // Just add these resources to the specialized tabs
            resources.forEach(resourceType => {
                const resourceName = resourceType.name;
                if (addedResources.has(resourceName)) return;
                
                const upperName = resourceName.toUpperCase();
                
                // Add to Power Slugs tab
                if (categoryName === 'POWER_SLUG' && powerSlugsGroup) {
                    powerSlugsGroup.appendChild(createResourceItem(resourceType));
                    addedResources.add(resourceName);
                    tabMapping[resourceName] = 'power-slugs';
                } 
                // Add to Alien Artifacts group in Misc tab
                else if (categoryName === 'ALIEN' && artifactsGroup) {
                    artifactsGroup.appendChild(createResourceItem(resourceType));
                    addedResources.add(resourceName);
                    tabMapping[resourceName] = 'artifacts';
                }
                // Add to Special Locations group in Misc tab
                else if (categoryName === 'SPECIAL' && specialGroup) {
                    specialGroup.appendChild(createResourceItem(resourceType));
                    addedResources.add(resourceName);
                    tabMapping[resourceName] = 'special';
                }
                // Add to Flora group in Misc tab
                else if (categoryName === 'FLORA' && floraGroup) {
                    floraGroup.appendChild(createResourceItem(resourceType));
                    addedResources.add(resourceName);
                    tabMapping[resourceName] = 'flora';
                }
            });
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

/**
 * Create a manual resource item when it's not in the data
 * @param {string} displayName - Name to display for the resource
 * @param {string} resourceType - Type of resource (from resource groups)
 * @returns {HTMLElement} - Created resource item element
 */
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

/**
 * Create individual resource item
 * @param {Object} resourceType - Resource data
 * @returns {HTMLElement} - Created resource item element
 */
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

/**
 * Setup tab switching functionality
 */
export function setupTabs() {
    const tabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and its content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

/**
 * Setup search functionality for resources
 */
export function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const resourceItems = document.querySelectorAll('.resource-item');
        
        resourceItems.forEach(item => {
            const resourceName = item.dataset.resource.toLowerCase();
            
            if (resourceName.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

/**
 * Setup sidebar toggle button
 */
export function setupToggleSidebar() {
    const toggleButton = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    
    if (!toggleButton || !sidebar) return;
    
    toggleButton.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
        this.textContent = sidebar.classList.contains('collapsed') ? '>' : '<';
    });
}

/**
 * Setup toggle all nodes button
 */
export function setupToggleAllNodes() {
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

/**
 * Setup share filters button
 */
export function setupShareFilters() {
    const button = document.getElementById('share-filters');
    if (!button) return;
    
    button.addEventListener('click', function() {
        // Create URL with resource visibility parameters
        const params = new URLSearchParams();
        
        document.querySelectorAll('.resource-checkbox').forEach(checkbox => {
            const resourceName = checkbox.dataset.resource;
            const isChecked = checkbox.checked;
            
            if (!isChecked) {
                params.set(`r_${resourceName.replace(/\s+/g, '_')}`, '0');
            }
        });
        
        // Create URL
        const url = window.location.origin + window.location.pathname + '?' + params.toString();
        
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert('URL copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy URL: ', err);
        });
    });
}
