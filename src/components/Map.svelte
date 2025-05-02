<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import L from 'leaflet';
  import ResourceNode from './ResourceNode.svelte';
  import { findIconPosition, getIconBackgroundPosition } from '../lib/iconUtils';
  import '../styles/resourceNodeMapStyles.css';
  
  export let resourceData;
  export let visibleResources;
  export let iconAtlas;
  
  const dispatch = createEventDispatcher();
  const baseUrl = import.meta.env.BASE_URL;
  
  let mapElement;
  let map;
  let markerClusters = {};
  
  onMount(async () => {
    if (!mapElement) return;
    
    // Initialize the map when the component mounts
    initMap();
    
    return () => {
      // Clean up on component destruction
      if (map) {
        map.remove();
      }
    };
  });
  
  // Set up the map
  function initMap() {
    map = L.map(mapElement, {
      crs: L.CRS.Simple,
      minZoom: -10,
      maxZoom: -4,
      zoom: -8,
      zoomControl: false, // We'll add our own zoom control
      attributionControl: false,
      doubleClickZoom: false
    });
    
    // Add custom zoom control at top-left
    L.control.zoom({
      position: 'topleft'
    }).addTo(map);

    // Set map bounds (Satisfactory map is 400k x 400k)
    const mapSize = 400000;
    const bounds = [[-mapSize, -mapSize], [mapSize, mapSize]];
    map.setMaxBounds(bounds);
    
    // Set the initial view to center of map
    map.setView([0, 0], -8);
    
    // Add the map image overlay
    const imageUrl = `${baseUrl}assets/Map.webp`;
    L.imageOverlay(imageUrl, bounds).addTo(map);
    
    // Initialize marker clusters for each resource type
    initializeMarkerClusters();
    
    // Load resource markers
    loadResourceMarkers();
    
    // Set up coordinates update on mouse move
    map.on('mousemove', updateCoordinates);
    
    // Set global map reference
    window.gameMap = map;
    
    // Dispatch event that map is ready
    dispatch('mapready', { map });
  }
  
  // Initialize marker clusters for different resource types
  function initializeMarkerClusters() {
    markerClusters = {};
    
    // Create layer groups for each resource type
    resourceData.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.resources.forEach(resource => {
          markerClusters[resource.id] = L.layerGroup();
          
          // Check if this resource should be visible initially
          if (visibleResources[resource.id]) {
            markerClusters[resource.id].addTo(map);
          }
        });
      });
    });
  }
  
  // Load all resource markers
  function loadResourceMarkers() {
    resourceData.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.resources.forEach(resource => {
          if (resource.markers && resource.markers.length > 0) {
            addResourceMarkers(resource);
          }
        });
      });
    });
  }
  
  // Add markers for a specific resource type
  function addResourceMarkers(resource) {
    const resourceId = resource.id;
    const cluster = markerClusters[resourceId];
    
    if (!cluster) return;
    
    // Add each marker to its cluster
    resource.markers.forEach(markerData => {
      // Create HTML for the marker using the resource node styling
      const iconHTML = `
        <div class="resource-node-wrapper">
          <div class="resource-marker-inner" style="border-color: ${resource.outsideColor};">
            <div class="icon-container" style="background-image: url('${baseUrl}assets/icon-atlas.png'); background-position: ${getIconBackgroundPosition(findIconPosition(iconAtlas, resource.iconKey), iconAtlas.iconSize)}"></div>
          </div>
        </div>
      `;
      
      // Create a marker with a div icon
      const iconOptions = {
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: `resource-marker ${resourceId}`,
        html: iconHTML
      };
      
      const marker = L.marker([markerData.y, markerData.x], {
        icon: L.divIcon(iconOptions)
      });
      
      // Add popup with detailed resource info
      const popupContent = `
        <strong>${resource.name}</strong><br>
        ${markerData.purity ? `Purity: ${markerData.purity.charAt(0).toUpperCase() + markerData.purity.slice(1)}<br>` : ''}
        Coordinates: ${Math.round(markerData.x)}, ${Math.round(markerData.y)}
        ${markerData.pathName ? `<br>ID: ${markerData.pathName.split('.').pop()}` : ''}
      `;
      marker.bindPopup(popupContent);
      
      // Add tooltip with basic resource info
      marker.bindTooltip(`${resource.name}${markerData.purity ? ` (${markerData.purity.charAt(0).toUpperCase() + markerData.purity.slice(1)})` : ''}`, {
        permanent: false,
        direction: 'top'
      });
      
      // Add marker to cluster
      marker.resourceId = resourceId;
      marker.markerData = markerData;
      cluster.addLayer(marker);
    });
  }
  
  // Update all marker visibility
  export function updateAllMarkers(visibleResources) {
    Object.keys(markerClusters).forEach(resourceId => {
      const isVisible = visibleResources[resourceId];
      updateResourceMarkers(resourceId, isVisible);
    });
  }
  
  // Update visibility for specific resource
  export function updateResourceMarkers(resourceId, visible) {
    const cluster = markerClusters[resourceId];
    if (cluster) {
      if (visible && !map.hasLayer(cluster)) {
        map.addLayer(cluster);
      } else if (!visible && map.hasLayer(cluster)) {
        map.removeLayer(cluster);
      }
    }
  }
  
  // Update coordinates on mouse move
  function updateCoordinates(e) {
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
  }
</script>

<div id="map" bind:this={mapElement}></div>

<style>
  #map {
    width: 100%;
    height: 100%;
    z-index: 1;
  }
</style>
