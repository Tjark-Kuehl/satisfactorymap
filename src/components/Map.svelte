<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import L from 'leaflet';
  import ResourceNode from './ResourceNode.svelte';
  import { findIconPosition, getIconBackgroundPosition } from '../lib/iconUtils';
  import '../styles/resourceNodeMapStyles.css';
  
  // Props
  export let visibleResources = {};
  export let iconAtlas;
  export let resourceData;
  
  const dispatch = createEventDispatcher();
  const baseUrl = import.meta.env.BASE_URL;
  
  let mapElement;
  let map;
  let markerClusters = {};
  
  onMount(() => {
    initializeMap();
  });
  
  function initializeMap() {
    map = L.map(mapElement, {
      crs: L.CRS.Simple,
      minZoom: -10,
      maxZoom: -4,
      zoomControl: false,
      attributionControl: false,
      zoomDelta: 0.5,
      zoomSnap: 0.5,
      keyboard: true,
      boxZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      touchZoom: true,
      dragging: true
    });
    
    L.control.zoom({
      position: 'topleft'
    }).addTo(map);

    const mapSize = 400000;
    const bounds = [[-mapSize, -mapSize], [mapSize, mapSize]]; 
    map.setMaxBounds(bounds);
    
    map.setView([0, 0], -8);
    
    map.eachLayer(function(layer) {
      if (layer._url || layer._image) {
        map.removeLayer(layer);
      }
    });

    const imageUrl = baseUrl + 'assets/Map-HQ.avif';
    
    // Create the image overlay with exact bounds to avoid white borders
    const baseLayer = L.imageOverlay(imageUrl, bounds, {
      interactive: true,
      opacity: 1.0,
      crossOrigin: true
    }).addTo(map);
    
    markerClusters = {}; 
    initializeMarkerClusters();
    
    loadResourceMarkers();
    
    console.log('Marker clusters initialized:', Object.keys(markerClusters).length);
    
    console.log('Initial visibleResources state:', Object.entries(visibleResources).filter(([_, v]) => v).length, 'visible resources');
    
    applyInitialVisibility();
    
    map.on('mousemove', updateCoordinates);
    
    window.gameMap = map;
    
    dispatch('mapReady', { map });
  }
  
  function initializeMarkerClusters() {
    resourceData.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.resources.forEach(resource => {
          const cluster = L.layerGroup();
          markerClusters[resource.id] = cluster;
        });
      });
    });
  }
  
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
  
  function applyInitialVisibility() {
    Object.keys(markerClusters).forEach(resourceId => {
      const isVisible = visibleResources[resourceId];
      const cluster = markerClusters[resourceId];
      
      if (isVisible && cluster) {
        console.log(`Initially adding ${resourceId} to map (visible=true)`);
        map.addLayer(cluster);
      }
    });
  }
  
  function addResourceMarkers(resource) {
    const resourceId = resource.id;
    const cluster = markerClusters[resourceId];
    
    if (!cluster) return;
    
    resource.markers.forEach(markerData => {
      const iconHTML = `
        <div class="resource-node-wrapper">
          <div class="resource-marker-inner" style="border-color: ${resource.outsideColor};">
            <div class="icon-container" style="background-image: url('${baseUrl}assets/icon-atlas.png'); background-position: ${getIconBackgroundPosition(findIconPosition(iconAtlas, resource.iconKey), iconAtlas.iconSize)}"></div>
          </div>
        </div>
      `;
      
      const iconOptions = {
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: `resource-marker ${resourceId}`,
        html: iconHTML
      };
      
      const marker = L.marker([-markerData.y, markerData.x], {
        icon: L.divIcon(iconOptions)
      });
      
      const popupContent = `
        <strong>${resource.name}</strong><br>
        ${markerData.purity ? `Purity: ${markerData.purity.charAt(0).toUpperCase() + markerData.purity.slice(1)}<br>` : ''}
        Coordinates: ${Math.round(markerData.x)}, ${Math.round(markerData.y)}
        ${markerData.pathName ? `<br>ID: ${markerData.pathName.split('.').pop()}` : ''}
      `;
      marker.bindPopup(popupContent);
      
      marker.bindTooltip(`${resource.name}${markerData.purity ? ` (${markerData.purity.charAt(0).toUpperCase() + markerData.purity.slice(1)})` : ''}`, {
        permanent: false,
        direction: 'top'
      });
      
      marker.resourceId = resourceId;
      marker.markerData = markerData;
      cluster.addLayer(marker);
    });
  }
  
  function updateCoordinates(e) {
    try {
      const x = Math.floor(e.latlng.lng);
      const y = Math.floor(e.latlng.lat);
      
      const coordsDisplay = document.getElementById('coords');
      if (coordsDisplay) {
        coordsDisplay.textContent = `X: ${x} | Y: ${y}`;
      }
    } catch (error) {
      console.error('Error updating coordinates:', error);
    }
  }
  
  export function updateAllMarkers(visibleResources) {
    console.log('updateAllMarkers called with', Object.entries(visibleResources).filter(([_, v]) => v).length, 'visible resources');
    
    Object.keys(markerClusters).forEach(resourceId => {
      const isVisible = visibleResources[resourceId];
      console.log(`Resource ${resourceId}: visibility=${isVisible}`);
      updateResourceMarkers(resourceId, isVisible);
    });
  }
  
  export function updateResourceMarkers(resourceId, visible) {
    const cluster = markerClusters[resourceId];
    if (cluster) {
      if (visible && !map.hasLayer(cluster)) {
        map.addLayer(cluster);
        console.log(`Added layer for ${resourceId}`);
      } else if (!visible && map.hasLayer(cluster)) {
        map.removeLayer(cluster);
        console.log(`Removed layer for ${resourceId}`);
      } else {
        console.log(`No change needed for ${resourceId} (already in correct state: ${visible ? 'visible' : 'hidden'})`);
      }
    } else {
      console.warn(`No cluster found for ${resourceId}`);
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
