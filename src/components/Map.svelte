<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import L from 'leaflet';
  
  export let resourceData;
  export let iconAtlas;
  
  const dispatch = createEventDispatcher();
  const DEFAULT_DISPLAY_SIZE = 24;
  
  let mapElement;
  let map;
  let markerClusters = {};
  
  onMount(() => {
    if (!mapElement) return;
    
    // Initialize the map
    initializeMap();
    
    // Process resource markers
    setTimeout(() => {
      processResources();
    }, 10);
    
    return () => {
      // Clean up on component destruction
      if (map) {
        map.remove();
      }
    };
  });
  
  /**
   * Initialize the Leaflet map
   */
  function initializeMap() {
    // Create the map with proper bounds for Satisfactory world
    map = L.map(mapElement, {
      crs: L.CRS.Simple,
      minZoom: -10,
      maxZoom: -4,
      zoomControl: true,
      attributionControl: false
    });
    
    // Set map bounds based on the actual Satisfactory world size
    const bounds = [
      [-500000, -500000], // Bottom left (SW) in [lat, lng] format
      [500000, 500000]    // Top right (NE) in [lat, lng] format
    ];
    
    // Add the Satisfactory map image as a layer
    const mapImage = L.imageOverlay(import.meta.env.BASE_URL + 'assets/Map.webp', bounds);
    mapImage.addTo(map);
    
    // Set initial view to center of map
    map.setView([0, 0], -8);
    map.setMaxBounds(bounds);
    
    // Show coordinates on mousemove
    map.on('mousemove', (e) => {
      try {
        // Calculate map coordinates
        const x = Math.floor(e.latlng.lng);
        const y = Math.floor(e.latlng.lat);
        
        // Update coordinates in global event, Svelte will handle it
        const coordsDisplay = document.getElementById('coords');
        if (coordsDisplay) {
          coordsDisplay.textContent = `X: ${x} | Y: ${y}`;
        }
      } catch (error) {
        console.error('Error updating coordinates:', error);
      }
    });
  }
  
  /**
   * Process resources and place markers on map
   */
  function processResources() {
    if (!map || !resourceData || !resourceData.options) return;
    
    // Clear existing marker clusters
    clearMarkerClusters();
    
    try {
      // Process each resource category
      resourceData.options.forEach(category => {
        if (!category.options) return;
        
        category.options.forEach(subCategory => {
          if (!subCategory || !subCategory.options) return;
          
          subCategory.options.forEach(resourceType => {
            // Skip if resource type is invalid
            if (!resourceType || !resourceType.name) return;
            if (!resourceType.markers || !Array.isArray(resourceType.markers) || resourceType.markers.length === 0) return;
            
            // Use the layerId directly if it exists
            const resourceId = resourceType.layerId || resourceType.name.toLowerCase().replace(/\s+/g, '_');
            
            // Create a new marker cluster group for this resource type
            markerClusters[resourceId] = L.layerGroup();
            
            // Process each resource node
            let nodesAdded = 0;
            
            resourceType.markers.forEach(node => {
              if (!node || node.x === undefined || node.y === undefined) return;
              
              try {
                // Convert game coordinates to Leaflet coordinates
                const leafletY = -node.y;
                const leafletX = node.x;
                
                // Use node.type if available, otherwise fall back to resourceType.name
                const iconType = (node.type && typeof node.type === 'string') 
                  ? node.type 
                  : resourceType.name;
                
                // Create icon using the atlas
                const icon = createAtlasIcon(iconType);
                
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
              } catch (error) {
                dispatch('appendDebug', { 
                  text: `Error creating marker for ${resourceType.name}: ${error.message}`,
                  color: 'red'
                });
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
      dispatch('appendDebug', { 
        text: `Error processing resources: ${error.message}`,
        color: 'red'
      });
    }
  }
  
  /**
   * Create a Leaflet icon from the icon atlas
   */
  function createAtlasIcon(resourceType) {
    // Clean up the resource type
    const resourceKey = resourceType.toLowerCase().replace(/\s+\([^)]+\)/g, '');
    
    // Try various methods to find the icon position
    let position = findIconPosition(resourceKey);
    
    // Use the original size from the atlas (64px)
    const atlasIconSize = iconAtlas.iconSize;
    
    // Create an HTML element that shows the correct sprite
    const html = `
      <div class="atlas-icon-container" style="
        width: ${atlasIconSize}px; 
        height: ${atlasIconSize}px; 
        background-image: url('${import.meta.env.BASE_URL}assets/icon-atlas.png');
        background-position: ${-position.x * atlasIconSize}px ${-position.y * atlasIconSize}px;
        background-size: ${iconAtlas.columns * atlasIconSize}px ${iconAtlas.rows * atlasIconSize}px;
      "></div>
    `;
    
    // Use a divIcon with the HTML content
    return L.divIcon({
      className: 'atlas-icon',
      html: html,
      iconSize: [DEFAULT_DISPLAY_SIZE, DEFAULT_DISPLAY_SIZE],
      iconAnchor: [DEFAULT_DISPLAY_SIZE/2, DEFAULT_DISPLAY_SIZE/2],
      popupAnchor: [0, -DEFAULT_DISPLAY_SIZE/2]
    });
  }
  
  /**
   * Find the position of an icon in the atlas
   */
  function findIconPosition(resourceKey) {
    // Try direct match in resourceMapping
    if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[resourceKey]) {
      return iconAtlas.resourceMapping[resourceKey];
    }
    
    // Try matching in iconPositions
    if (iconAtlas.iconPositions) {
      // If the resource has "256" suffix, try without it
      const normalizedKey = resourceKey.replace(/256$/, '');
      
      // First check for exact match
      if (iconAtlas.iconPositions[resourceKey]) {
        return iconAtlas.iconPositions[resourceKey];
      }
      // Then try a normalized match
      else if (iconAtlas.iconPositions[normalizedKey]) {
        return iconAtlas.iconPositions[normalizedKey];
      }
      // Then try a partial match
      else {
        for (const key in iconAtlas.iconPositions) {
          const cleanKey = key.toLowerCase().replace(/256$/, '');
          if (cleanKey.includes(normalizedKey) || normalizedKey.includes(cleanKey)) {
            return iconAtlas.iconPositions[key];
          }
        }
      }
    }
    
    // Fallback to known resource type aliases
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
    
    if (aliases[resourceKey]) {
      const aliasKey = aliases[resourceKey];
      
      // Try both direct icon positions and resource mapping
      if (iconAtlas.iconPositions && iconAtlas.iconPositions[aliasKey]) {
        return iconAtlas.iconPositions[aliasKey];
      }
      else if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[aliasKey]) {
        return iconAtlas.resourceMapping[aliasKey];
      }
      
      // Try with common suffixes
      const aliasWithSuffix = aliasKey + '256';
      if (iconAtlas.iconPositions && iconAtlas.iconPositions[aliasWithSuffix]) {
        return iconAtlas.iconPositions[aliasWithSuffix];
      }
      else if (iconAtlas.resourceMapping && iconAtlas.resourceMapping[aliasWithSuffix]) {
        return iconAtlas.resourceMapping[aliasWithSuffix];
      }
    }
    
    // If all else fails, use a default position
    return iconAtlas.resourceMapping['stone'] || { x: 0, y: 0 };
  }
  
  /**
   * Format purity for display
   */
  function formatPurity(purity) {
    if (!purity) return 'Unknown';
    return purity.charAt(0).toUpperCase() + purity.slice(1);
  }
  
  /**
   * Toggle visibility of resource markers
   */
  export function toggleResourceVisibility(resourceId, visible) {
    const clusterGroup = markerClusters[resourceId];
    if (!clusterGroup) return;
    
    if (visible) {
      // Make sure the layer is added to the map
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
   * Toggle all nodes visibility
   */
  export function toggleAllNodes(visible) {
    Object.keys(markerClusters).forEach(resourceId => {
      toggleResourceVisibility(resourceId, visible);
    });
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
</script>

<div class="map" bind:this={mapElement}></div>

<style>
  .map {
    width: 100%;
    height: 100%;
  }
  
  :global(.atlas-icon) {
    background-color: transparent !important;
  }
  
  :global(.atlas-icon-container) {
    background-repeat: no-repeat !important;
    width: 100%;
    height: 100%;
    transform: scale(0.375); /* Scale down from 64px to 24px */
    transform-origin: 0 0;
  }
</style>
